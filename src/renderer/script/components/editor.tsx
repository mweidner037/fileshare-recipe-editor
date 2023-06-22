import React from "react";
import { RecipeDoc } from "../doc/recipe_doc";
import { Recipe } from "./recipe";

export function Editor({
  doc,
  connected,
  onConnectedChange,
}: {
  doc: RecipeDoc | null;
  connected: boolean;
  onConnectedChange: (newValue: boolean) => void;
}) {
  if (doc === null) {
    return <p>Loading...</p>;
  } else {
    return (
      <>
        <input
          id="connected"
          type="checkbox"
          checked={connected}
          onChange={(e) => onConnectedChange(e.target.checked)}
        />
        <label htmlFor="connected">Connected</label>
        <hr />
        <Recipe recipe={doc.recipe} />
      </>
    );
  }
}
