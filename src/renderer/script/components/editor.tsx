import React from "react";
import { RecipeDoc } from "../doc/recipe_doc";
import { Recipe } from "./recipe";

export function Editor({ doc }: { doc: RecipeDoc | null }) {
  if (doc === null) {
    return <p>Loading...</p>;
  } else {
    return <Recipe recipe={doc.recipe} />;
  }
}
