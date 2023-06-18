import { CObject, CText, CVar, InitToken, IVar } from "@collabs/collabs";
import React from "react";
import { useCollab } from "../collabs-react";
import { CScaleNum } from "../util/c_scale_num";

type Units = "g" | "mg" | "L" | "mL";

export class CIngredient extends CObject {
  readonly text: CText;
  readonly amount: CScaleNum;
  readonly units: CVar<Units>;

  constructor(init: InitToken, scaleVar: IVar<number>) {
    super(init);

    this.text = super.registerCollab("text", (textInit) => new CText(textInit));
    this.amount = super.registerCollab(
      "amount",
      (amountInit) => new CScaleNum(amountInit, scaleVar)
    );
    this.units = super.registerCollab(
      "units",
      (unitsInit) => new CVar(unitsInit, "g")
    );
  }
}

export function Ingredient({ ingr }: { ingr: CIngredient }) {
  // CIngredient does not emit its own events, only its children do.
  // So we must listen on the children that we render here instead of in
  // their own components.
  useCollab(ingr.amount);
  useCollab(ingr.units);

  return <>Test Ingredient</>;
}
