import { onFileChange, onSignalClose } from "../ipc/receive_ipc";
import { callMain } from "../ipc/send_ipc";
import { RecipeDoc } from "./recipe_doc";

// TODO: debounce (don't save if the user's still working).
const SAVE_INTERVAL = 1000;

// TODO: nicer way to express this (class?)
// If not for the connected button, loadDoc() could just
// return the doc. But we should have a nice pattern regardless
// to help debug general apps.
export interface LoadDocReturn {
  doc: RecipeDoc;
  onConnectedChange: (newValue: boolean) => void;
}

/**
 * Sets up the RichTextDoc, including loading its initial state
 * (before returning) and scheduling future loads & saves.
 *
 * Since the returned doc has some state already, you need to
 * explicitly sync that state to your GUI (can't rely on events
 * like for future changes).
 */
export async function loadDoc(): Promise<LoadDocReturn> {
  const doc = new RecipeDoc();

  // Load the initial state.
  const initialContents = await callMain("loadInitial");
  for (const [savedState] of initialContents) {
    doc.load(savedState);
  }

  // Store connected status (copy of React state).
  let connected = true;

  // Save function.
  let savePending = true;
  let localChange = false;
  let saveInProgress = false;
  async function save() {
    if (!connected) return;
    if (saveInProgress) {
      // Don't start saving when a save is already in progress.
      // Instead, wait SAVE_INTERVAL and try again.
      // Due to savePending and localChange, if this ends up
      // queuing a bunch of saves, only the non-redundant ones will
      // proceed, and localChange will be true iff some pending
      // change was local.
      console.log("save already in progress, queuing for later");
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(save, SAVE_INTERVAL);
      return;
    }
    if (savePending) {
      const localChangeCopy = localChange;
      try {
        saveInProgress = true;
        // Reset savePending and localChange now, in case there are more
        // changes while we're saving.
        savePending = false;
        localChange = false;
        console.log(`Saving...`);
        await callMain("save", doc.save(), localChangeCopy);
        console.log("Saved.");
      } catch (err) {
        // Restore savePending and localChange since we didn't save successfully.
        savePending = true;
        localChange = localChangeCopy;
        throw err;
      } finally {
        saveInProgress = false;
      }
    }
  }

  // Save the merged state now, after changes
  // (delayed by SAVE_INTERVAL), and on close.
  void save();
  doc.on("Transaction", (e) => {
    if (e.meta.isLocalOp) localChange = true;
    if (!savePending) {
      savePending = true;
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(save, SAVE_INTERVAL);
    }
  });
  onSignalClose(save);

  // Load files that change (presumably due to collaborators).
  let pendingLoads: Uint8Array[] = [];
  onFileChange((savedState) => {
    if (connected) doc.load(savedState);
    else pendingLoads.push(savedState);
  });

  function onConnectedChange(newValue: boolean) {
    connected = newValue;
    if (connected) {
      // Process pending loads and saves.
      pendingLoads.forEach((savedState) => doc.load(savedState));
      pendingLoads = [];
      void save();
    }
  }

  return { doc, onConnectedChange };
}
