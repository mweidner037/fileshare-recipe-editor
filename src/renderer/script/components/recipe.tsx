import { CList, CObject, InitToken } from "@collabs/collabs";

import { CIngredient } from "./ingredient";

export class CRecipe extends CObject {
  private readonly _ingrs: CList<CIngredient, []>;

  constructor(init: InitToken) {
    super(init);

    this._ingrs = super.registerCollab(
      "ingrs",
      (ingrsInit) =>
        new CList(ingrsInit, (valueInit) => new CIngredient(valueInit))
    );
  }

  ingredients(): IterableIterator<CIngredient> {
    return this._ingrs.values();
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
}

export function Recipe({ recipe }: { recipe: CRecipe }) {
  // TODO
}
