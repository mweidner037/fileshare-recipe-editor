import React, { useRef, useState } from "react";
import { loadDoc } from "../doc/load_doc";
import { RichTextDoc } from "../doc/rich_text_doc";
import { Editor } from "./editor";

export function App() {
  const [doc, setDoc] = useState<RichTextDoc | null>(null);

  // On first render, start loadDoc.
  const firstRender = useRef<boolean>(true);
  if (firstRender.current) {
    firstRender.current = false;
    void loadDoc().then(setDoc);
  }

  return <Editor doc={doc} />;
}
