import { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import { schemaSketchTheme } from './themes';
import type { SchemaMode } from '../types/schema';

const languageCompartment = new Compartment();

function getLanguageExtension(mode: SchemaMode) {
  return mode === 'sql' ? sql({ dialect: PostgreSQL }) : json();
}

export function useCodeMirror(
  containerRef: React.RefObject<HTMLDivElement | null>,
  value: string,
  onChange: (value: string) => void,
  mode: SchemaMode,
) {
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track whether we're programmatically updating the editor
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdatingRef.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        languageCompartment.of(getLanguageExtension(mode)),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        syntaxHighlighting(oneDarkHighlightStyle),
        schemaSketchTheme,
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync mode changes
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtension(mode)),
    });
  }, [mode]);

  // Sync external value changes (e.g. preset loading)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      isUpdatingRef.current = true;
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
      isUpdatingRef.current = false;
    }
  }, [value]);

  return viewRef;
}
