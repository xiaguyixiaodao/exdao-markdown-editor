import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { EditorState, Compartment, StateEffect } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, undo as cmUndo, redo as cmRedo } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxHighlighting, HighlightStyle, indentOnInput, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { searchKeymap, highlightSelectionMatches, openSearchPanel } from "@codemirror/search";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { useStore } from "../lib/store";
import { invoke } from "@tauri-apps/api/core";

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "15px",
    fontFamily: "var(--font-mono)",
    backgroundColor: "var(--bg-primary)",
    maxWidth: "100%",
    overflow: "hidden",
  },
  ".cm-content": {
    caretColor: "var(--accent)",
    padding: "16px 16px",
    wordBreak: "break-word",
    overflowWrap: "break-word",
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
    overflowX: "hidden",
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
  undo: () => void;
  redo: () => void;
}

interface CodeMirrorEditorProps {
  doc: string;
  onChange: (value: string) => void;
  onScroll?: (scrollInfo: { scrollTop: number; scrollHeight: number; clientHeight: number }) => void;
  onSave: () => void;
  onNavigate?: (target: string) => void;
  onCursorChange?: (pos: { line: number; column: number }) => void;
  wordWrap?: boolean;
  fontSize?: number;
  typewriterMode?: boolean;
  zenMode?: boolean;
  zenModeRange?: number;
}

const wordWrapCompartment = new Compartment();
const typewriterCompartment = new Compartment();
const zenModeCompartment = new Compartment();

const zenModeTheme = EditorView.theme({
  ".cm-zen-dim": {
    opacity: "0.2",
    transition: "opacity 0.2s",
  },
});

function createZenModePlugin(range: number) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
      buildDecorations(view: EditorView): DecorationSet {
        const cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;
        const decorations: any[] = [];
        for (const { from, to } of view.visibleRanges) {
          const startLine = view.state.doc.lineAt(from).number;
          const endLine = view.state.doc.lineAt(to).number;
          for (let i = startLine; i <= endLine; i++) {
            if (Math.abs(i - cursorLine) > range) {
              const line = view.state.doc.line(i);
              decorations.push(
                Decoration.line({ class: "cm-zen-dim" }).range(line.from, line.from)
              );
            }
          }
        }
        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

export const CodeMirrorEditor = forwardRef<EditorHandle, CodeMirrorEditorProps>(
  function CodeMirrorEditor({ doc, onChange, onScroll, onSave, onCursorChange, wordWrap, fontSize = 15, typewriterMode = false, zenMode = false, zenModeRange = 5 }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const onScrollRef = useRef(onScroll);
    const onSaveRef = useRef(onSave);
    const onCursorChangeRef = useRef(onCursorChange);
    const fontSizeCompartment = useRef(new Compartment());

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

    const undo = useCallback(() => {
      const view = viewRef.current;
      if (!view) return;
      cmUndo({ state: view.state, dispatch: view.dispatch });
      view.focus();
    }, []);

    const redo = useCallback(() => {
      const view = viewRef.current;
      if (!view) return;
      cmRedo({ state: view.state, dispatch: view.dispatch });
      view.focus();
    }, []);

    useImperativeHandle(ref, () => ({ scrollToLine, undo, redo }), [scrollToLine, undo, redo]);

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
        fontSizeCompartment.current.of(EditorView.theme({
          "&": { fontSize: `${fontSize}px` },
        })),
        typewriterCompartment.of(typewriterMode ? [
          EditorView.updateListener.of((update) => {
            if (update.selectionSet) {
              const view = update.view;
              const pos = view.state.selection.main.head;
              const line = view.state.doc.lineAt(pos);
              const lineBlock = view.lineBlockAt(line.from);
              const viewHeight = view.dom.clientHeight;
              const scrollTop = view.scrollDOM.scrollTop;
              const lineCenter = lineBlock.top + lineBlock.height / 2;
              const targetScroll = scrollTop + lineCenter - viewHeight / 2;
              view.scrollDOM.scrollTo({ top: targetScroll, behavior: "smooth" });
            }
          }),
        ] : []),
        zenModeCompartment.of(zenMode ? [
          createZenModePlugin(zenModeRange),
          zenModeTheme,
        ] : []),
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
          paste: (event, view) => {
            const items = event.clipboardData?.items;
            if (!items) return false;
            for (const item of items) {
              if (item.type.startsWith("image/")) {
                event.preventDefault();
                const blob = item.getAsFile();
                if (!blob) continue;
                const ext = blob.type.split("/")[1] || "png";
                const timestamp = Date.now();
                const fileName = `paste-${timestamp}.${ext}`;
                blob.arrayBuffer().then((arrayBuffer) => {
                  const data = Array.from(new Uint8Array(arrayBuffer));
                  const state = useStore.getState();
                  const vaultPath = state.rootPath;
                  const activeFile = state.activeFile;
                  if (vaultPath && activeFile) {
                    const dir = activeFile.substring(0, activeFile.lastIndexOf("/"));
                    const imgPath = `${dir}/${fileName}`;
                    invoke("write_binary_file", { path: imgPath, data }).then(() => {
                      const insertText = `![${fileName}](${fileName})`;
                      const pos = view.state.selection.main.head;
                      view.dispatch({
                        changes: { from: pos, insert: insertText },
                        selection: { anchor: pos + insertText.length },
                      });
                    });
                  } else {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = reader.result as string;
                      const insertText = `![pasted image](${base64})`;
                      const pos = view.state.selection.main.head;
                      view.dispatch({
                        changes: { from: pos, insert: insertText },
                        selection: { anchor: pos + insertText.length },
                      });
                    };
                    reader.readAsDataURL(blob);
                  }
                });
                return true;
              }
            }
            return false;
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
      view.dispatch({
        effects: fontSizeCompartment.current.reconfigure(
          EditorView.theme({ "&": { fontSize: `${fontSize}px` } })
        ),
      });
    }, [fontSize]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const typewriterExtension = typewriterMode ? [
        EditorView.updateListener.of((update) => {
          if (update.selectionSet) {
            const v = update.view;
            const pos = v.state.selection.main.head;
            const line = v.state.doc.lineAt(pos);
            const lineBlock = v.lineBlockAt(line.from);
            const viewHeight = v.dom.clientHeight;
            const scrollTop = v.scrollDOM.scrollTop;
            const lineCenter = lineBlock.top + lineBlock.height / 2;
            const targetScroll = scrollTop + lineCenter - viewHeight / 2;
            v.scrollDOM.scrollTo({ top: targetScroll, behavior: "smooth" });
          }
        }),
      ] : [];
      view.dispatch({
        effects: typewriterCompartment.reconfigure(typewriterExtension),
      });
    }, [typewriterMode]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const zenExtension = zenMode ? [createZenModePlugin(zenModeRange), zenModeTheme] : [];
      view.dispatch({
        effects: zenModeCompartment.reconfigure(zenExtension),
      });
    }, [zenMode, zenModeRange]);

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
