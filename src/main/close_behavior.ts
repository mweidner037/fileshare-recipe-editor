import { app, BrowserWindow } from "electron";
import { stopFileWatch } from "./files";
import { callRenderer } from "./ipc/send_ipc";

export function setupCloseBehavior(win: BrowserWindow): void {
  // On close, inform the window so it can save, and wait
  // for it to finish saving before quitting.
  let sentCloseSignal = false;
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  win.on("close", async (e) => {
    if (!sentCloseSignal) {
      sentCloseSignal = true;
      e.preventDefault();
      await stopFileWatch();
      callRenderer("signalClose");
    }
    // Note: if the user hits "X" a second time before we finish saving,
    // the "close" event will go through and quit the app.
    // This seems okay - will only interrupt saving if that takes a while
    // or failed, in which case the user probably meant to "force quit" anyway,
    // hence failing to save is expected.
  });
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function readyToClose(): Promise<void> {
  app.quit();
}
