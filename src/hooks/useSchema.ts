import { useState, useEffect, useRef, useCallback } from 'react';
import type { SchemaMode, ParseResult } from '../types/schema';
import { parseJsonToSchema, parseSqlToSchema } from '../parser';
import { PRESETS } from '../presets';

const DEFAULT_PRESET = PRESETS[0];

export function useSchema() {
  const [mode, setMode] = useState<SchemaMode>('json');
  const [rawText, setRawText] = useState<string>(DEFAULT_PRESET.json);
  const [parseResult, setParseResult] = useState<ParseResult>({ schema: null, errors: [] });

  // Keep a ref to avoid stale closures in the debounced effect
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (modeRef.current === 'json') {
        setParseResult(parseJsonToSchema(rawText));
      } else {
        setParseResult(parseSqlToSchema(rawText));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [rawText, mode]);

  const loadPreset = useCallback((presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    setRawText(mode === 'sql' ? preset.sql : preset.json);
  }, [mode]);

  const switchMode = useCallback((newMode: SchemaMode) => {
    setMode(newMode);
    // Try to find matching preset content for the new mode
    const currentPreset = PRESETS.find(
      p => p.sql === rawText || p.json === rawText
    );
    if (currentPreset) {
      setRawText(newMode === 'sql' ? currentPreset.sql : currentPreset.json);
    }
  }, [rawText]);

  return { rawText, setRawText, mode, switchMode, parseResult, loadPreset };
}
