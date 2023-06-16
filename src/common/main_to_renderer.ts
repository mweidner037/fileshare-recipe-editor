import { IpcRendererEvent } from "electron";

/**
 * All return types should be void (or rather, any
 * return values are ignored),)
 * since main->renderer communication is 1-way by default.
 */
export interface IMainToRenderer {
  /**
   * Called when the app is about to close.
   *
   * Triggers a final save (if needed) and then calls
   * IRendererToMain.readyToClose().
   */
  signalClose(): void;
  /** Not called for files we wrote ourselves. */
  onFileChange(savedState: Uint8Array): void;
}

export type OnCallRendererInternalType = (
  callback: <K extends keyof IMainToRenderer & string>(
    event: IpcRendererEvent,
    name: K,
    args: Parameters<IMainToRenderer[K]>
  ) => void
) => void;
