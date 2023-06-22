import { CList, CObject, CRichText, CVar, InitToken } from "@collabs/collabs";
import React, { useEffect, useRef, useState } from "react";

import { CollabsQuill } from "../collabs-quill";
import { useCollab } from "../collabs-react";
import { reactKey } from "../util/react_key";
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

  ingredients(): IterableIterator<CIngredient> {
    return this._ingrs.values();
  }

  addIngredient(): CIngredient {
    return this._ingrs.push();
  }

  deleteIngredient(ingr: CIngredient): void {
    // Note: CList.indexOf is as fast as get(index), not a linear time search.
    const index = this._ingrs.indexOf(ingr);
    if (index === -1) return;
    // Use archive so keepIngredient can resurrect in case of concurrent edits.
    this._ingrs.archive(index);
  }

  /**
   * Keeps ingr "alive" (present) in the list. Called each time the
   * ingredient is edited.
   */
  keepIngredient(ingr: CIngredient): void {
    this._ingrs.restore(ingr);
  }

  moveIngredient(ingr: CIngredient, index: number): void {
    // Note: CList.indexOf is as fast as get(index), not a linear time search.
    const startIndex = this._ingrs.indexOf(ingr);
    if (startIndex === -1) return;
    this._ingrs.move(startIndex, index);
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

  // When the local user adds a new ingredient, scroll to it and
  // select its text.
  const [newIngr, setNewIngr] = useState<CIngredient | null>(null);
  const newIngrTextRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (newIngrTextRef.current === null) return;
    newIngrTextRef.current.select();
    newIngrTextRef.current.scrollIntoView();
    // Use newIngr as dependency so this only runs on the first render after adding.
  }, [newIngr]);

  const ingrs = [...recipe.ingredients()];
  return (
    <>
      <input
        type="text"
        maxLength={maxNameLength}
        size={maxNameLength}
        value={nameEditing ?? recipe.recipeName.value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setNameEditing(e.target.value)}
        onBlur={() => {
          if (nameEditing === null) return;
          let parsed = nameEditing.slice(0, maxNameLength).trim();
          if (parsed === "") parsed = "Untitled";
          recipe.recipeName.value = parsed;
          setNameEditing(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <br />
      <h3>Ingredients</h3>
      <ul>
        {ingrs.map((ingr, index) => (
          // Use ingr "itself" as a React key instead of Position, so that
          // React remembers component state even during move ops.
          // TODO: scroll-to-ingredient if the one you're editing is moved.
          <li key={reactKey(ingr)}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <button
                  style={{ alignSelf: "flex-start" }}
                  disabled={index === 0}
                  onClick={() => recipe.moveIngredient(ingr, index - 1)}
                >
                  ↑
                </button>
                <button
                  style={{ alignSelf: "flex-start" }}
                  disabled={index === ingrs.length - 1}
                  // +2 because we have to hop over ourselves as well.
                  onClick={() => recipe.moveIngredient(ingr, index + 2)}
                >
                  ↓
                </button>
              </div>
              <Ingredient
                ingr={ingr}
                textRef={ingr === newIngr ? newIngrTextRef : undefined}
                // TODO: delay keepIngredient slightly, in case of technically
                // sequential but psychologically concurrent delete+edit?
                onChange={() => recipe.keepIngredient(ingr)}
              />
              <button onClick={() => recipe.deleteIngredient(ingr)}>X</button>
            </div>
          </li>
        ))}
      </ul>
      <br />
      <button
        onClick={() => {
          const ingr = recipe.addIngredient();
          setNewIngr(ingr);
        }}
      >
        Add Ingredient
      </button>
      <br />
      <button onClick={() => recipe.scale(2)}>Double the recipe</button>
      <button onClick={() => recipe.scale(0.5)}>Halve the recipe</button>
      <br />
      <CollabsQuill text={recipe.instructions} />
    </>
  );
}
