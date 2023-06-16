import { Bytes } from "@collabs/collabs";
import * as chokidar from "chokidar";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { callRenderer } from "./ipc/send_ipc";

const OPEN_WITH =
  "fileshare rich-text-demo, https://github.com/mweidner037/fileshare-rich-text-demo";
const TYPE = "com.mattweidner.fileshare-rich-text-demo.FileContent";

const root = path.join(os.homedir(), "Dropbox/Files/filestore-rich-text-demo");
// TODO: what if deviceID is not unique among collaborators?
const deviceID = os.hostname();
const ourFile = path.join(root, deviceID + ".json");
// "latest" file starts with ".~" so Dropbox doesn't sync it.
const latestFile = path.join(root, ".~latest.json");

interface FileContent {
  "open with": string;
  version: string;
  type: typeof TYPE;
  deviceID: string;
  /** Uint8Array encoded with collabs.Bytes. */
  savedState: string;
}

export async function loadInitial(): Promise<[savedState: Uint8Array][]> {
  // Watch for future changes.
  setupFileWatch();

  // Read all files in the root dir (including .latest.json, in case the previous
  // save wrote there but not to ourFile); the app will merge their contents.
  try {
    const files = await readdir(root);
    const ans: [savedState: Uint8Array][] = [];
    for (const file of files) {
      const content = await readContent(path.join(root, file));
      if (content === null) continue;
      ans.push([Bytes.parse(content.savedState)]);
    }
    return ans;
  } catch (err) {
    // Assume it was because the folder does not yet exist (e.g., the app
    // was launched for the first time).
    console.error(
      "Failed to readdir",
      root,
      "; treating as if it does not yet exist"
    );
    console.error(err);
    return [];
  }
}

async function readContent(fullPath: string): Promise<FileContent | null> {
  if (!fullPath.endsWith(".json")) return null;

  try {
    const content = await readFile(fullPath, {
      encoding: "utf8",
    });
    if (!content.endsWith("\n}")) {
      console.error("Invalid JSON (no trailing '\n}'");
    }
    const parsed = JSON.parse(content) as FileContent;
    if (parsed.type !== TYPE) {
      throw new Error("Not of type FileContents");
    }
    return parsed;
  } catch (err) {
    // File read error or not valid JSON; skip.
    // It might be incomplete (still being written).
    console.error(
      "Skipping inaccessible, invalid, or incomplete file",
      fullPath,
      ":"
    );
    console.error(err);
    return null;
  }
}

let watcher: chokidar.FSWatcher | null = null;

/** Notifies renderer if a file changes (besides one we just wrote). */
function setupFileWatch() {
  watcher = chokidar.watch(root, {
    ignoreInitial: true,
    // To reduce the change of reading a file while it's being written
    // (which readOne skips harmlessly but wastes time reading), wait
    // for its size to stay steady for 200 ms before emitting a change event.
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
  });
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  watcher.on("add", onFileChange);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  watcher.on("change", onFileChange);
}

export async function stopFileWatch(): Promise<void> {
  if (watcher !== null) await watcher.close();
}

async function onFileChange(fullPath: string): Promise<void> {
  // Skip the files that (only) we write.
  const normalized = path.normalize(fullPath);
  if (normalized === ourFile || normalized === latestFile) return;

  const content = await readContent(normalized);
  if (content === null) return;

  console.log("onFileChange", normalized);
  callRenderer("onFileChange", Bytes.parse(content.savedState));
}

let saveInProgress = false;
/**
 *
 * @param savedState
 * @param localChange Whether the state has changed due to local operations
 * (else it has just changed by merging files).
 * If false, only latestFile is written, to prevent back-and-forth saves
 * when multiple users are online.
 * @throws If called when another save() is already in progress.
 * Currently, the renderer's load_doc.ts ensures that it does not call this twice, but
 * we will have to refactor that if we end up calling this elsewhere.
 */
export async function save(
  savedState: Uint8Array,
  localChange: boolean
): Promise<void> {
  if (saveInProgress) {
    throw new Error("save() already in progress");
  }

  try {
    saveInProgress = true;

    // Mkdir if needed.
    await mkdir(root, { recursive: true });

    const content: FileContent = {
      "open with": OPEN_WITH,
      version: "0.0.0",
      type: TYPE,
      deviceID,
      savedState: Bytes.stringify(savedState),
    };
    const data = JSON.stringify(content, undefined, 2);

    // 1. Write to latestFile, a hidden, non-synced file.
    // That way, if we crash while writing, ourFile preserves its last
    // good state.
    // latestFile also lets us keep our own most recent state even if the user
    // overwrites ourFile (e.g., saving a file from an email back-and-forth
    // that never got renamed).
    console.log(`Saving to ${latestFile}...`);
    await writeFile(latestFile, data, { encoding: "utf8" });

    // 2. If localChange, write to ourFile (see function header).
    // If we crash while writing, latestFile will still have a good state.
    if (localChange) {
      console.log(`Saving to ${ourFile}...`);
      await writeFile(ourFile, data, { encoding: "utf8" });
    }

    console.log("Done.");
  } finally {
    saveInProgress = false;
  }
}
