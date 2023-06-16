import {
  CRDTMessageMeta,
  CRDTSavedStateMeta,
  IVar,
  PrimitiveCRDT,
  UpdateMeta,
} from "@collabs/collabs";

export class CScaleNum extends PrimitiveCRDT implements IVar<number> {
  set(value: number): number {
    this.value = value;
    return value;
  }

  set value(_value: number) {
    throw new Error("Method not implemented.");
  }

  get value(): number {
    throw new Error("Method not implemented.");
  }

  protected receiveCRDT(
    message: string | Uint8Array,
    meta: UpdateMeta,
    crdtMeta: CRDTMessageMeta
  ): void {
    throw new Error("Method not implemented.");
  }

  protected saveCRDT(): Uint8Array {
    throw new Error("Method not implemented.");
  }

  protected loadCRDT(
    savedState: Uint8Array | null,
    meta: UpdateMeta,
    crdtMeta: CRDTSavedStateMeta
  ): void {
    throw new Error("Method not implemented.");
  }
}
