import { CallMainInternalType } from "../../../common/renderer_to_main";

declare global {
  interface Window {
    callMainInternal: CallMainInternalType;
  }
}

export const callMain = window.callMainInternal;
