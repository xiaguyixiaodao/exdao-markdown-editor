import { useEffect, useRef } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import { markdownToHtml } from "../lib/mdConvert";
import { useStore } from "../lib/store";
import "../styles/tiptap.css";

interface WysiwygEditorProps {
  doc: string;
  onChange: (value: string) => void;
  onSave: () => void;
  editorRef?: React.MutableRefObject<Editor | null>;
  zenMode?: boolean;
  zenModeRange?: number;
}

export function WysiwygEditor({ doc, onChange, onSave, editorRef, zenMode = false, zenModeRange = 5 }: WysiwygEditorProps) {
  const activeFile = useStore((s) => s.activeFile);
  const activeFileRef = useRef(activeFile);
  const editor = editorRef?.current;

  useEffect(() => {
    if (!editor) return;
    if (activeFile !== activeFileRef.current) {
      activeFileRef.current = activeFile;
      editor.commands.setContent(markdownToHtml(doc), { emitUpdate: false });
    }
  }, [activeFile, doc, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.focus("end");
  }, [editor]);

  useEffect(() => {
    if (!editor || !zenMode) return;

    const updateZenMode = () => {
      const { state } = editor;
      const { from } = state.selection;
      const dom = editor.view.dom;
      const proseMirror = dom.querySelector(".ProseMirror") || dom;

      const allNodes = proseMirror.children;
      if (!allNodes) return;

      const cursorCoords = editor.view.coordsAtPos(from);

      for (let i = 0; i < allNodes.length; i++) {
        const el = allNodes[i] as HTMLElement;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - cursorCoords.top);
        if (distance > zenModeRange * 30) {
          el.classList.add("tiptap-zen-dim");
        } else {
          el.classList.remove("tiptap-zen-dim");
        }
      }
    };

    editor.on("selectionUpdate", updateZenMode);
    editor.on("transaction", updateZenMode);
    setTimeout(updateZenMode, 100);

    return () => {
      editor.off("selectionUpdate", updateZenMode);
      editor.off("transaction", updateZenMode);
      const proseMirror = editor.view.dom.querySelector(".ProseMirror") || editor.view.dom;
      if (proseMirror) {
        Array.from(proseMirror.children).forEach((el) => {
          el.classList.remove("tiptap-zen-dim");
        });
      }
    };
  }, [editor, zenMode, zenModeRange]);

  if (!editor) return null;

  return (
    <div className={`wysiwyg-editor ${zenMode ? "wysiwyg-zen-mode" : ""}`}>
      <EditorContent editor={editor} />
    </div>
  );
}
