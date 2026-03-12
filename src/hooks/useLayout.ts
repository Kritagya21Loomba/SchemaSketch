import { useMemo } from 'react';
import type { Schema } from '../types/schema';
import type { LayoutResult } from '../layout/types';
import { computeLayout } from '../layout';

export function useLayout(schema: Schema | null): LayoutResult | null {
  return useMemo(() => {
    if (!schema || schema.tables.length === 0) return null;
    return computeLayout(schema);
  }, [schema]);
}
