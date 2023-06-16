import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { setupCloseBehavior } from "./close_behavior";
import { handleCallMain } from "./ipc/receive_ipc";
import { setupCallRenderer } from "./ipc/send_ipc";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  setupCallRenderer(win);
  setupCloseBehavior(win);
  void win.loadFile("build/renderer/index.html");
};

void app.whenReady().then(() => {
  ipcMain.handle("callMain", handleCallMain);
  createWindow();
});
