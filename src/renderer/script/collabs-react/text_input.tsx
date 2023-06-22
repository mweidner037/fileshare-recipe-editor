import { CText, Cursor, Cursors } from "@collabs/collabs";
import React, { useEffect, useRef, useState } from "react";
import { useCollab } from "./hooks";

export type CollabsTextInputProps = { text: CText } & Omit<
  React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
  "value" | "type" | "ref" | "defaultValue"
>;

// TODO: ability to control selection, e.g. select all onFocus, or reset selection
// to begin/end on focus.

export function CollabsTextInput(props: CollabsTextInputProps) {
  const { text, ...other } = props;
  useCollab(text);

  const inputRef = useRef<HTMLInputElement>(null);
  const [startCursor, setStartCursor] = useState<Cursor>(
    Cursors.fromIndex(0, text)
  );
  const [endCursor, setEndCursor] = useState<Cursor>(
    Cursors.fromIndex(0, text)
  );
  useEffect(() => {
    // Update the selection to match startCursor and endCursor.
    // We do this on every render (no deps) since it is almost as much
    // work to check if it is necessary (= indices changed).
    if (inputRef.current === null) return;
    inputRef.current.selectionStart = Cursors.toIndex(startCursor, text);
    inputRef.current.selectionEnd = Cursors.toIndex(endCursor, text);
  });

  // Updates startCursor and endCursor to match the current selection.
  function updateCursors() {
    if (inputRef.current === null) return;
    setStartCursor(
      Cursors.fromIndex(inputRef.current.selectionStart ?? 0, text)
    );
    setEndCursor(Cursors.fromIndex(inputRef.current.selectionEnd ?? 0, text));
  }

  // Whether we should type e.key.
  function shouldType(e: React.KeyboardEvent<HTMLInputElement>): boolean {
    return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
  }

  // Types str with the given selection.
  function type(str: string, startIndex: number, endIndex: number) {
    if (startIndex < endIndex) {
      // Delete current selection
      text.delete(startIndex, endIndex - startIndex);
    }
    text.insert(startIndex, str);
    setStartCursor(Cursors.fromIndex(startIndex + str.length, text));
    setEndCursor(Cursors.fromIndex(startIndex + str.length, text));
  }

  // TODO: other updateCursors triggers if needed, possibly in setTimeout.
  return (
    <input
      {...other}
      type="text"
      ref={inputRef}
      value={text.toString()}
      onSelect={updateCursors}
      onKeyDown={(e) => {
        const startIndex = Cursors.toIndex(startCursor, text);
        const endIndex = Cursors.toIndex(endCursor, text);
        if (e.key === "Backspace") {
          if (endIndex > startIndex) {
            text.delete(startIndex, endIndex - startIndex);
            setEndCursor(Cursors.fromIndex(startIndex, text));
          } else if (endIndex === startIndex && startIndex > 0) {
            text.delete(startIndex - 1);
            setStartCursor(Cursors.fromIndex(startIndex - 1, text));
          }
        } else if (e.key === "Delete") {
          if (endIndex > startIndex) {
            text.delete(startIndex, endIndex - startIndex);
            setEndCursor(Cursors.fromIndex(startIndex, text));
          } else if (endIndex === startIndex && startIndex < text.length) {
            text.delete(startIndex);
          }
        } else if (shouldType(e)) {
          type(e.key, startIndex, endIndex);
        } else {
          // Other events we let happen normally (don't preventDefault).
          // These include selection changes (handled by onSelect), enter/tab
          // (which just change focus, don't add text), and cut/paste
          // (handled in their own listeners), and copy (default behavior
          // is fine).
          return;
        }

        // Don't let the browser type the key, we do it for them.
        e.preventDefault();
      }}
      onPaste={(e) => {
        if (e.clipboardData) {
          const startIndex = Cursors.toIndex(startCursor, text);
          const endIndex = Cursors.toIndex(endCursor, text);
          const pasted = e.clipboardData.getData("text");
          type(pasted, startIndex, endIndex);
        }
        e.preventDefault();
      }}
      onCut={() => {
        const startIndex = Cursors.toIndex(startCursor, text);
        const endIndex = Cursors.toIndex(endCursor, text);
        if (startIndex < endIndex) {
          const selected = text.toString().slice(startIndex, endIndex);
          void navigator.clipboard.writeText(selected);
          text.delete(startIndex, endIndex - startIndex);
        }
        // TODO: prevent default?
      }}
      /* Disable drag & drop. TODO: handle? */
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    />
  );
}
