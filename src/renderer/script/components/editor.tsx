import React from "react";
import { RichTextDoc } from "../doc/rich_text_doc";
import { CollabsQuill } from "./collabs_quill";

export function Editor({ doc }: { doc: RichTextDoc | null }) {
  if (doc === null) {
    return <p>Loading...</p>;
  } else {
    return (
      <CollabsQuill
        text={doc.text}
        style={{ minHeight: "100%", height: "auto" }}
      />
    );
  }
}
