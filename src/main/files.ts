import { Bytes } from "@collabs/collabs";
import * as chokidar from "chokidar";
import { WebContents } from "electron";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { callRenderer } from "./ipc/send_ipc";

const OPEN_WITH =
  "fileshare recipe-editor, https://github.com/mweidner037/fileshare-recipe-editor";
const TYPE = "com.mattweidner.fileshare-recipe-editor.FileContent";

const root = path.join(os.homedir(), "Dropbox/Files/fileshare-recipe-editor");
// TODO: what if os.hostname() is not unique among collaborators?
const deviceID = os.hostname();
const sharedFilePrefix = path.join(root, deviceID);
// "latest" file starts with ".~" so Dropbox doesn't sync it.
const latestFilePrefix = path.join(root, ".~latest");

interface FileContent {
  "open with": string;
  version: string;
  type: typeof TYPE;
  deviceID: string;
  /** Uint8Array encoded with collabs.Bytes. */
  savedState: string;
}

const managers = new WeakMap<WebContents, FileManager>();

export function loadInitial(
  caller: WebContents
): Promise<[savedState: Uint8Array][]> {
  return managers.get(caller)!.loadInitial();
}

export function save(
  caller: WebContents,
  savedState: Uint8Array,
  localChange: boolean
): Promise<void> {
  return managers.get(caller)!.save(savedState, localChange);
}

/**
 * Manages files for a single window.
 *
 * For now, we manage each window like a separate device, with its own files
 * and with windows communicating via file watch.
 * TODO: Something faster and more sequential for real usage (though the
 * current system is better for demoing concurrent behavior).
 */
export class FileManager {
  private readonly sharedFile: string;
  // "latest" file starts with ".~" so Dropbox doesn't sync it.
  private readonly latestFile: string;

  private watcher: chokidar.FSWatcher | null = null;

  /**
   *
   * @param web
   * @param id 1-indexed ID for this manager's window. Used in file names:
   * 1 gets the base file name, others get `${base name}-${id}.json`.
   */
  constructor(private readonly web: WebContents, private readonly id: number) {
    const suffix = id === 1 ? "" : `-${id}`;
    this.sharedFile = sharedFilePrefix + suffix + ".json";
    this.latestFile = latestFilePrefix + suffix + ".json";
    managers.set(web, this);
  }

  async loadInitial(): Promise<[savedState: Uint8Array][]> {
    // Watch for future changes.
    this.setupFileWatch();

    // Read all files in the root dir (including .latest.json, in case the previous
    // save wrote there but not to ourFile); the app will merge their contents.
    try {
      const files = await readdir(root);
      const ans: [savedState: Uint8Array][] = [];
      for (const file of files) {
        const content = await this.readContent(path.join(root, file));
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

  private async readContent(fullPath: string): Promise<FileContent | null> {
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

  /** Notifies renderer if a file changes (besides one we just wrote). */
  private setupFileWatch() {
    this.watcher = chokidar.watch(root, {
      ignoreInitial: true,
      // To reduce the chance of reading a file while it's being written
      // (which readContent skips harmlessly but wastes time reading), wait
      // for its size to stay steady for 200 ms before emitting a change event.
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.watcher.on("add", this.onFileChange);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.watcher.on("change", this.onFileChange);
  }

  async stopFileWatch(): Promise<void> {
    if (this.watcher !== null) await this.watcher.close();
  }

  private onFileChange = async (fullPath: string) => {
    // Skip our sharedFile, which only we write, as well as all "latest" files.
    const normalized = path.normalize(fullPath);
    if (
      normalized === this.sharedFile ||
      normalized.startsWith(latestFilePrefix)
    )
      return;

    const content = await this.readContent(normalized);
    if (content === null) return;

    console.log(`(${this.id}) onFileChange`, normalized);
    callRenderer(this.web, "onFileChange", Bytes.parse(content.savedState));
  };

  private saveInProgress = false;
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
  async save(savedState: Uint8Array, localChange: boolean): Promise<void> {
    if (this.saveInProgress) {
      throw new Error("save() already in progress");
    }

    try {
      this.saveInProgress = true;

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
      console.log(`(${this.id}) Saving to ${this.latestFile}...`);
      await writeFile(this.latestFile, data, { encoding: "utf8" });

      // 2. If localChange, write to ourFile (see function header).
      // If we crash while writing, latestFile will still have a good state.
      if (localChange) {
        console.log(`(${this.id}) Saving to ${this.sharedFile}...`);
        await writeFile(this.sharedFile, data, { encoding: "utf8" });
      }

      console.log("Done.");
    } finally {
      this.saveInProgress = false;
    }
  }
}
