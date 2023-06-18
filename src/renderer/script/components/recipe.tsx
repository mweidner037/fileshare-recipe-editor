import { CList, CObject, CRichText, CVar, InitToken } from "@collabs/collabs";
import React, { useState } from "react";

import { useCollab } from "../collabs-react";
import { CIngredient, Ingredient } from "./ingredient";

export class CRecipe extends CObject {
  readonly recipeName: CVar<string>;
  private readonly _ingrs: CList<CIngredient, []>;
  // Controls the ambient scale.
  private readonly _scaleVar: CVar<number>;
  readonly instructions: CRichText;

  constructor(init: InitToken) {
    super(init);

    this.recipeName = super.registerCollab(
      "name",
      (nameInit) => new CVar(nameInit, "Untitled")
    );
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
    this.instructions = super.registerCollab(
      "instructions",
      (instInit) => new CRichText(instInit)
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

const maxNameLength = 30;

export function Recipe({ recipe }: { recipe: CRecipe }) {
  useCollab(recipe);

  const [nameEditing, setNameEditing] = useState<string | null>(null);

  const ingrs = [...recipe.ingredients()];
  return (
    <>
      <input
        type="text"
        maxLength={maxNameLength}
        size={maxNameLength}
        value={nameEditing ?? recipe.recipeName.value}
        onChange={(e) => setNameEditing(e.target.value)}
        onBlur={() => {
          if (nameEditing === null) return;
          let parsed = nameEditing.slice(0, maxNameLength).trim();
          if (parsed === "") parsed = "Untitled";
          recipe.recipeName.value = parsed;
          setNameEditing(null);
        }}
      />
      <br />
      <h3>Ingredients</h3>
      <ul>
        {/* TODO: is position-as-key appropriate given move ops? Will reset React states being edited. */}
        {ingrs.map(([, key, ingr]) => (
          <li key={key}>
            <Ingredient ingr={ingr} />
          </li>
        ))}
      </ul>
      <br />
      <button onClick={() => recipe.addIngredient()}>Add Ingredient</button>
      <br />
      <CollabsQuill text={recipe.instructions} />
    </>
  );
}
