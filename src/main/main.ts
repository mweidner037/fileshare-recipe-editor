import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { setupCloseBehavior } from "./close_behavior";
import { handleCallMain } from "./ipc/receive_ipc";

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
    setupCloseBehavior(win);
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
