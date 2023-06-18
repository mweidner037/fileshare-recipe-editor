import { CList, CObject, CVar, InitToken } from "@collabs/collabs";
import React from "react";

import { useCollab } from "../collabs-react";
import { CIngredient, Ingredient } from "./ingredient";

export class CRecipe extends CObject {
  private readonly _ingrs: CList<CIngredient, []>;
  // Controls the ambient scale.
  private readonly _scaleVar: CVar<number>;

  constructor(init: InitToken) {
    super(init);

    this._scaleVar = super.registerCollab(
      "scaleVar",
      (scaleVarInit) => new CVar(scaleVarInit, 1)
    );
    this._ingrs = super.registerCollab(
      "ingrs",
      (ingrsInit) =>
        new CList(
          ingrsInit,
          (valueInit) => new CIngredient(valueInit, this._scaleVar)
        )
    );

    // Lazy ingredient events. We don't need scale events because
    // those trigger rerenders within each ingredient.
    this._ingrs.on("Any", (e) => this.emit("Any", e));
  }

  ingredients(): IterableIterator<
    [index: number, key: string, value: CIngredient]
  > {
    return this._ingrs.entries();
  }

  addIngredient() {
    this._ingrs.push();
  }

  deleteIngredient(ingr: CIngredient): void {
    // Note: CList.indexOf is as fast as get(index), not a linear time search.
    const index = this._ingrs.indexOf(ingr);
    if (index === -1) return;
    // TODO: archive w/ keepalive instead? Needs enable-wins restoring in CList.
    this._ingrs.delete(index);
  }

  // TODO: moveIngredient

  scale(factor: number) {
    if (factor < 0) throw new Error("Invalid factor: less than 0");
    if (factor === 0) throw new Error("Not yet implemented: scale by 0");

    // Note this is an LWW set - concurrent scales don't stack,
    // which is probably what the users expect.
    this._scaleVar.value *= factor;
  }
}

export function Recipe({ recipe }: { recipe: CRecipe }) {
  useCollab(recipe);

  const ingrs = [...recipe.ingredients()];
  return (
    <>
      <ul>
        {/* TODO: is position-as-key appropriate given move ops? */}
        {ingrs.map(([, key, ingr]) => (
          <li key={key}>
            <Ingredient ingr={ingr} />
          </li>
        ))}
      </ul>
      <br />
      <button onClick={() => recipe.addIngredient()}>Add Ingredient</button>
    </>
  );
}
