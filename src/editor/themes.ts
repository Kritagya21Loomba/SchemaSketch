import { EditorView } from '@codemirror/view';

export const schemaSketchDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0e0e11',
    color: '#b0b0b8',
    fontSize: '13px',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    caretColor: '#00e5ff',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#00e5ff',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#1e3a5f !important',
  },
  '.cm-gutters': {
    backgroundColor: '#0e0e11',
    color: '#404048',
    border: 'none',
    borderRight: '1px solid #1a1a1f',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#1a1a1f',
    color: '#606068',
  },
  '.cm-tooltip': {
    backgroundColor: '#1a1a1f',
    border: '1px solid #2a2a32',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
});

export const schemaSketchLightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#f5f5f7',
    color: '#3a3a42',
    fontSize: '13px',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    caretColor: '#0088a3',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#0088a3',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#cce5ff !important',
  },
  '.cm-gutters': {
    backgroundColor: '#f5f5f7',
    color: '#8a8a94',
    border: 'none',
    borderRight: '1px solid #e0e0e4',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#ffffff',
    color: '#8a8a94',
  },
  '.cm-tooltip': {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8dc',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
});
