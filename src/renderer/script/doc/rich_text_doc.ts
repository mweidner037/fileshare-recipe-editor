import { AbstractDoc, CRichText, RuntimeOptions } from "@collabs/collabs";

const noGrowAtEnd = [
  // Links (Peritext Example 9)
  "link",
  // Paragraph-level (\n) formatting: should only apply to the \n, not
  // extend to surrounding chars.
  "header",
  "blockquote",
  "code-block",
  "list",
  "indent",
];

export class RichTextDoc extends AbstractDoc {
  readonly text: CRichText;

  private constructor(options?: RuntimeOptions) {
    super(options);

    this.text = this.runtime.registerCollab(
      "text",
      (init) => new CRichText(init, { noGrowAtEnd })
    );
  }

  static new(): RichTextDoc {
    const doc = new RichTextDoc();
    // "Set the initial state"
    // (a single "\n", required by Quill) by
    // loading it from a separate doc.
    doc.load(this.makeInitialSave());
    return doc;
  }

  private static makeInitialSave(): Uint8Array {
    const doc = new RichTextDoc({ debugReplicaID: "INIT" });
    doc.transact(() => doc.text.insert(0, "\n", {}));
    return doc.save();
  }
}
