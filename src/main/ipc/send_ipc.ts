import { WebContents } from "electron";
import { IMainToRenderer } from "../../common/main_to_renderer";

export function callRenderer<K extends keyof IMainToRenderer & string>(
  win: WebContents,
  name: K,
  ...args: Parameters<IMainToRenderer[K]>
): void {
  win.send("callRenderer", name, args);
}
