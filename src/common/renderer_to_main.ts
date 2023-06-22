import type { WebContents } from "electron";

export interface RendererToMainSignature {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: (caller: WebContents, ...args: any[]) => Promise<any>;
}

/**
 * All methods must take the calling WebContents as their first
 * argument and return a Promise.
 * This is enforced in main/ipc/recieve_ipc.ts
 * by using the type `IRendererToMain & RendererToMainSignature`. */
export interface IRendererToMain {
  /** Reads the initial state and watches for future changes. */
  loadInitial(caller: WebContents): Promise<[savedState: Uint8Array][]>;
  /**
   *
   * @param savedState
   * @param localChange Whether the state has changed due to local operations
   * (else it has just changed by merging files).
   * If false, only latestFile is written, to prevent back-and-forth saves
   * when multiple users are online.
   */
  save(
    caller: WebContents,
    savedState: Uint8Array,
    localChange: boolean
  ): Promise<void>;
  readyToClose(caller: WebContents): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParametersOmitFirst<T extends (arg1: any, ...args: any[]) => any> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (arg1: any, ...args: infer P) => any ? P : never;

export type CallMainInternalType = <K extends keyof IRendererToMain & string>(
  name: K,
  // Renderer does not provide the first argument (the calling WebContents).
  ...args: ParametersOmitFirst<IRendererToMain[K]>
) => ReturnType<IRendererToMain[K]>;
