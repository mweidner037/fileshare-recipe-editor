import { contextBridge, ipcRenderer } from "electron";
import type { OnCallRendererInternalType } from "../common/main_to_renderer";
import type {
  CallMainInternalType,
  IRendererToMain,
} from "../common/renderer_to_main";

// It would be nicer to use a common const for the event name,
// but Electron won't allow us to require() relative imports without
// setting up a bundler:
// https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
// This is also why we use `import type` above, to be sure we don't emit any
// require()'s in the JS code.

const callMainInternal: CallMainInternalType = (name, ...args) => {
  return <ReturnType<IRendererToMain[typeof name]>>(
    ipcRenderer.invoke("callMain", name, args)
  );
};
contextBridge.exposeInMainWorld("callMainInternal", callMainInternal);

const onCallRendererInternal: OnCallRendererInternalType = (callback) =>
  ipcRenderer.on("callRenderer", callback);
contextBridge.exposeInMainWorld(
  "onCallRendererInternal",
  onCallRendererInternal
);
