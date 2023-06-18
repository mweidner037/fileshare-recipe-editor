import {
  CRDTMessageMeta,
  CRDTSavedStateMeta,
  IVar,
  InitToken,
  PrimitiveCRDT,
  StringSerializer,
  UpdateMeta,
  VarEventsRecord,
} from "@collabs/collabs";

export class CScaleNum
  extends PrimitiveCRDT<VarEventsRecord<number>>
  implements IVar<number>
{
  private valueWhenSet = 0;
  private scaleWhenSet = 1;
  private lamport = -1;
  private lamportSender = "";

  constructor(init: InitToken, readonly scaleVar: IVar<number>) {
    super(init);

    scaleVar.on("Set", (e) =>
      this.emit("Set", {
        previousValue:
          this.valueWhenSet * (e.previousValue / this.scaleWhenSet),
        value: this.value,
        meta: e.meta,
      })
    );
  }

  set(value: number): number {
    this.value = value;
    return value;
  }

  set value(_value: number) {
    // TODO: efficient binary encoding, for demonstation purposes.
    const message = { valueWhenSet: _value, scaleWhenSet: this.scaleVar.value };
    super.sendPrimitive(JSON.stringify(message));
  }

  get value(): number {
    return this.valueWhenSet * (this.scaleVar.value / this.scaleWhenSet);
  }

  protected receiveCRDT(
    message: string | Uint8Array,
    meta: UpdateMeta,
    crdtMeta: CRDTMessageMeta
  ): void {
    const decoded = JSON.parse(<string>message) as {
      valueWhenSet: number;
      scaleWhenSet: number;
    };
    this.processUpdate(
      decoded.valueWhenSet,
      decoded.scaleWhenSet,
      crdtMeta.lamportTimestamp!,
      crdtMeta.senderID,
      meta
    );
  }

  private processUpdate(
    valueWhenSet: number,
    scaleWhenSet: number,
    lamport: number,
    lamportSender: string,
    meta: UpdateMeta
  ) {
    if (
      lamport > this.lamport ||
      (lamport == this.lamport && lamportSender > this.lamportSender)
    ) {
      const previousValue = this.value;
      this.valueWhenSet = valueWhenSet;
      this.scaleWhenSet = scaleWhenSet;
      this.lamport = lamport;
      this.lamportSender = lamportSender;
      this.emit("Set", { value: this.value, previousValue, meta });
    }
  }

  protected saveCRDT(): Uint8Array {
    // TODO: efficient binary encoding, for demonstation purposes.
    const message = {
      valueWhenSet: this.valueWhenSet,
      scaleWhenSet: this.scaleWhenSet,
      lamport: this.lamport,
      lamportSender: this.lamportSender,
    };
    return StringSerializer.instance.serialize(JSON.stringify(message));
  }

  protected loadCRDT(
    savedState: Uint8Array | null,
    meta: UpdateMeta,
    _crdtMeta: CRDTSavedStateMeta
  ): void {
    if (savedState === null) return;

    const decoded = JSON.parse(
      StringSerializer.instance.deserialize(savedState)
    ) as {
      valueWhenSet: number;
      scaleWhenSet: number;
      lamport: number;
      lamportSender: string;
    };
    this.processUpdate(
      decoded.valueWhenSet,
      decoded.scaleWhenSet,
      decoded.lamport,
      decoded.lamportSender,
      meta
    );
  }
}
