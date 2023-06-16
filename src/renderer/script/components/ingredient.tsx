import { CObject, CText, CVar, InitToken } from "@collabs/collabs";
import { CScaleNum } from "../util/c_scale_num";

type Units = "g" | "mg" | "L" | "mL";

export class CIngredient extends CObject {
  readonly text: CText;
  readonly amount: CScaleNum;
  readonly units: CVar<Units>;

  constructor(init: InitToken) {
    super(init);

    this.text = super.registerCollab("text", (textInit) => new CText(textInit));
    this.amount = super.registerCollab(
      "amount",
      (amountInit) => new CScaleNum(amountInit)
    );
    this.units = super.registerCollab(
      "units",
      (unitsInit) => new CVar(unitsInit, "g")
    );
  }
}

export function Ingredient({ ingr }: { ingr: CIngredient }) {
  // TODO
}
