import { BrowserWindow } from "electron";
import { IMainToRenderer } from "../../common/main_to_renderer";

let mainWindow: BrowserWindow | null = null;

export function setupCallRenderer(win: BrowserWindow) {
  mainWindow = win;
}

export function callRenderer<K extends keyof IMainToRenderer & string>(
  name: K,
  ...args: Parameters<IMainToRenderer[K]>
): void {
  if (mainWindow === null) {
    throw new Error("setupCallRenderer not yet called");
  }
  mainWindow.webContents.send("callRenderer", name, args);
}
