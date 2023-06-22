import { CObject, CText, CVar, InitToken, IVar } from "@collabs/collabs";
import React, { useState } from "react";
import { CollabsTextInput, useCollab } from "../collabs-react";
import { CScaleNum } from "../util/c_scale_num";

type Unit = "g" | "mg" | "L" | "mL";
const AllUnits: Unit[] = ["g", "mg", "L", "mL"];
const defaultUnit: Unit = "g";

export class CIngredient extends CObject {
  readonly text: CText;
  readonly amount: CScaleNum;
  readonly units: CVar<Unit>;

  constructor(init: InitToken, scaleVar: IVar<number>) {
    super(init);

    this.text = super.registerCollab("text", (textInit) => new CText(textInit));
    this.amount = super.registerCollab(
      "amount",
      (amountInit) => new CScaleNum(amountInit, scaleVar)
    );
    this.units = super.registerCollab(
      "units",
      (unitsInit) => new CVar(unitsInit, defaultUnit)
    );
  }
}

export function Ingredient({ ingr }: { ingr: CIngredient }) {
  // CIngredient does not emit its own events, only its children do.
  // So we must listen on the children that we render here instead of in
  // their own components.
  useCollab(ingr.amount);
  useCollab(ingr.units);

  const [amountEditing, setAmountEditing] = useState<string | null>(null);

  return (
    <>
      <CollabsTextInput text={ingr.text} />
      <input
        type="number"
        min={0}
        step={0.1}
        value={amountEditing ?? ingr.amount.value}
        onChange={(e) => setAmountEditing(e.target.value)}
        onBlur={() => {
          if (amountEditing === null) return;
          const parsed = Number.parseInt(amountEditing);
          if (
            !isNaN(parsed) &&
            0 <= parsed &&
            // Soft limit of 4 digits; not enforced with max tag in case
            // scaling overflows it.
            parsed <= 9999.9 &&
            Number.isInteger(10 * parsed)
          ) {
            ingr.amount.value = parsed;
          }
          setAmountEditing(null);
          // TODO: use original scale if the scale changed while you were typing?
          // Kick you out if the scale changes?
        }}
      />
      <select
        value={ingr.units.value}
        onChange={(e) => (ingr.units.value = e.target.value as Unit)}
      >
        {AllUnits.map((unit) => (
          <option value={unit} key={unit}>
            {unit}
          </option>
        ))}
      </select>
    </>
  );
}
