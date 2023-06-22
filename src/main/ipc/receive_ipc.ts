import { IpcMainInvokeEvent } from "electron";
import {
  IRendererToMain,
  ParametersOmitFirst,
  RendererToMainSignature,
} from "../../common/renderer_to_main";
import { readyToClose } from "../close_behavior";
import { loadInitial, save } from "../files";

export function handleCallMain<K extends keyof IRendererToMain & string>(
  event: IpcMainInvokeEvent,
  name: K,
  args: ParametersOmitFirst<IRendererToMain[K]>
): ReturnType<IRendererToMain[K]> {
  const method = rendererToMain[name];
  if (method === undefined) {
    throw new Error("Not an IRendererToMain method name: " + name);
  }
  // @ts-expect-error TypeScript gets confused by this, see https://github.com/microsoft/TypeScript/issues/47615
  return method(event.sender, ...args);
}

const rendererToMain: IRendererToMain & RendererToMainSignature = {
  loadInitial,
  save,
  readyToClose,
};
