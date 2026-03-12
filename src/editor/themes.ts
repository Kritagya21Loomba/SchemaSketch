import { EditorView } from '@codemirror/view';

export const schemaSketchTheme = EditorView.theme({
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
