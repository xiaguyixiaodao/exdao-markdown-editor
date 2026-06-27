import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxHighlighting, HighlightStyle, indentOnInput, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { searchKeymap, highlightSelectionMatches, openSearchPanel } from "@codemirror/search";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "15px",
    fontFamily: "var(--font-mono)",
    backgroundColor: "var(--bg-primary)",
  },
  ".cm-content": {
    caretColor: "var(--accent)",
    padding: "16px 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--accent)",
    borderLeftWidth: "2px",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-secondary)",
    border: "none",
    borderRight: "1px solid var(--border)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px",
    minWidth: "40px",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(0, 122, 204, 0.25) !important",
  },
  ".cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(0, 122, 204, 0.35) !important",
  },
  ".cm-searchMatch": {
    backgroundColor: "rgba(255, 213, 0, 0.3)",
    outline: "1px solid rgba(255, 213, 0, 0.5)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "rgba(255, 213, 0, 0.5)",
  },
  ".cm-foldGutter span": {
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  ".cm-foldGutter span:hover": {
    color: "var(--text-primary)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
});

const markdownHighlighting = HighlightStyle.define([
  { tag: tags.heading1, color: "var(--text-heading)", fontWeight: "bold", fontSize: "1.6em" },
  { tag: tags.heading2, color: "var(--text-heading)", fontWeight: "bold", fontSize: "1.4em" },
  { tag: tags.heading3, color: "var(--text-heading)", fontWeight: "bold", fontSize: "1.2em" },
  { tag: tags.heading4, color: "var(--text-heading)", fontWeight: "bold" },
  { tag: tags.strong, color: "var(--text-primary)", fontWeight: "bold" },
  { tag: tags.emphasis, color: "var(--text-primary)", fontStyle: "italic" },
  { tag: tags.strikethrough, color: "var(--text-secondary)", textDecoration: "line-through" },
  { tag: tags.link, color: "var(--text-link)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--text-link)" },
  { tag: tags.monospace, color: "var(--text-primary)", backgroundColor: "var(--inline-code-bg)", fontFamily: "var(--font-mono)", padding: "1px 4px", borderRadius: "3px" },
  { tag: tags.quote, color: "var(--blockquote-text)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--text-secondary)" },
  { tag: tags.processingInstruction, color: "var(--accent)" },
  { tag: tags.contentSeparator, color: "var(--border)" },
]);

export interface EditorHandle {
  scrollToLine: (line: number) => void;
}

interface CodeMirrorEditorProps {
  doc: string;
  onChange: (value: string) => void;
  onScroll?: (scrollInfo: { scrollTop: number; scrollHeight: number; clientHeight: number }) => void;
  onSave: () => void;
  onNavigate?: (target: string) => void;
  onCursorChange?: (pos: { line: number; column: number }) => void;
  wordWrap?: boolean;
}

const wordWrapCompartment = new Compartment();

export const CodeMirrorEditor = forwardRef<EditorHandle, CodeMirrorEditorProps>(
  function CodeMirrorEditor({ doc, onChange, onScroll, onSave, onCursorChange, wordWrap }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const onScrollRef = useRef(onScroll);
    const onSaveRef = useRef(onSave);
    const onCursorChangeRef = useRef(onCursorChange);

    onChangeRef.current = onChange;
    onScrollRef.current = onScroll;
    onSaveRef.current = onSave;
    onCursorChangeRef.current = onCursorChange;

    const scrollToLine = useCallback((line: number) => {
      const view = viewRef.current;
      if (!view) return;
      const lineNum = Math.min(line + 1, view.state.doc.lines);
      const lineObj = view.state.doc.line(lineNum);
      view.dispatch({
        selection: { anchor: lineObj.from },
        effects: EditorView.scrollIntoView(lineObj.from, { y: "start" }),
      });
      view.focus();
    }, []);

    useImperativeHandle(ref, () => ({ scrollToLine }), [scrollToLine]);

    useEffect(() => {
      if (!containerRef.current) return;

      const extensions = [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        rectangularSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        foldGutter(),
        history(),
        editorTheme,
        syntaxHighlighting(markdownHighlighting),
        markdown({ base: markdownLanguage }),
        wordWrapCompartment.of(wordWrap ? EditorView.lineWrapping : []),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...closeBracketsKeymap,
          ...searchKeymap,
          {
            key: "Mod-s",
            run: () => {
              onSaveRef.current();
              return true;
            },
          },
          {
            key: "Mod-f",
            run: (view) => {
              openSearchPanel(view);
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            onCursorChangeRef.current?.({
              line: line.number,
              column: pos - line.from + 1,
            });
          }
        }),
        EditorView.domEventHandlers({
          scroll: (_event, view) => {
            const dom = view.scrollDOM;
            onScrollRef.current?.({
              scrollTop: dom.scrollTop,
              scrollHeight: dom.scrollHeight,
              clientHeight: dom.clientHeight,
            });
          },
        }),
      ];

      const state = EditorState.create({ doc, extensions });

      const view = new EditorView({
        state,
        parent: containerRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, []);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: wordWrapCompartment.reconfigure(
          wordWrap ? EditorView.lineWrapping : []
        ),
      });
    }, [wordWrap]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const current = view.state.doc.toString();
      if (current !== doc) {
        view.dispatch({
          changes: { from: 0, to: current.length, insert: doc },
        });
      }
    }, [doc]);

    return (
      <div
        ref={containerRef}
        style={{ height: "100%", overflow: "hidden" }}
      />
    );
  }
);
