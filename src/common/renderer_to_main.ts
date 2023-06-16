export interface AllPromises {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: (...args: any[]) => Promise<any>;
}

/** All return types must be Promises (enforced in main/ipc/recieve_ipc.ts
 * by using the type `IRendererToMain & AllPromises`). */
export interface IRendererToMain {
  /** Reads the initial state and watches for future changes. */
  loadInitial(): Promise<[savedState: Uint8Array][]>;
  /**
   *
   * @param savedState
   * @param localChange Whether the state has changed due to local operations
   * (else it has just changed by merging files).
   * If false, only latestFile is written, to prevent back-and-forth saves
   * when multiple users are online.
   */
  save(savedState: Uint8Array, localChange: boolean): Promise<void>;
  readyToClose(): Promise<void>;
}

export type CallMainInternalType = <K extends keyof IRendererToMain & string>(
  name: K,
  ...args: Parameters<IRendererToMain[K]>
) => ReturnType<IRendererToMain[K]>;
