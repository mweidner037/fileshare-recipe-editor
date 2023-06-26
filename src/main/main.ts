import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { setupCloseBehavior } from "./close_behavior";
import { FileManager } from "./files";
import { handleCallMain } from "./ipc/receive_ipc";

// Source of 1-indexed window IDs, used in naming files.
let nextWindowID = 1;

// To prevent concurrent local writes to our save files
// (ourFile and latestFile), we force all running instances of
// the app to share a single main process.
// See https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelockadditionaldata
if (!app.requestSingleInstanceLock()) app.quit();
else {
  const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });
    // Open clicked links from Quill in the system browser instead of a new
    // Electron window.
    // From https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
    win.webContents.setWindowOpenHandler(({ url }) => {
      setImmediate(() => {
        void shell.openExternal(url);
      });
      return { action: "deny" };
    });
    const manager = new FileManager(win.webContents, nextWindowID++);
    setupCloseBehavior(win, manager);
    void win.loadFile("build/renderer/index.html");
  };

  app.on("second-instance", () => {
    // Create a new window in this process instead of letting a
    // new instance start.
    if (app.isReady()) createWindow();
  });

  void app.whenReady().then(() => {
    ipcMain.handle("callMain", handleCallMain);
    createWindow();
  });
}
