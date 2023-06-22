import { app, BrowserWindow, WebContents } from "electron";
import { FileManager } from "./files";
import { callRenderer } from "./ipc/send_ipc";

const openWindows = new Set<WebContents>();

export function setupCloseBehavior(
  win: BrowserWindow,
  fileManager: FileManager
): void {
  // On close, inform the window so it can save, and wait
  // for it to finish saving before quitting.
  let sentCloseSignal = false;
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  win.on("close", async (e) => {
    if (!sentCloseSignal) {
      sentCloseSignal = true;
      await fileManager.stopFileWatch();
      callRenderer(win.webContents, "signalClose");
    }
    // TODO: only preventDefault on first try, in case renderer is frozen?
    e.preventDefault();
  });

  // Record that this window needs to close before quitting.
  openWindows.add(win.webContents);
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function readyToClose(caller: WebContents): Promise<void> {
  openWindows.delete(caller);
  BrowserWindow.fromWebContents(caller)!.destroy();
  if (openWindows.size === 0) app.quit();
}
