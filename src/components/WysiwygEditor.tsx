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
}

export function WysiwygEditor({ doc, onChange, onSave, editorRef }: WysiwygEditorProps) {
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

  if (!editor) return null;

  return (
    <div className="wysiwyg-editor">
      <EditorContent editor={editor} />
    </div>
  );
}
