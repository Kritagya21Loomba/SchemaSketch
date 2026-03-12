import type { Schema, Table, Column, ForeignKey, ParseResult, ParseError } from '../types/schema';

interface JsonTable {
  name?: string;
  columns?: JsonColumn[];
  foreignKeys?: JsonForeignKey[];
}

interface JsonColumn {
  name?: string;
  type?: string;
  primaryKey?: boolean;
  unique?: boolean;
  nullable?: boolean;
}

interface JsonForeignKey {
  column?: string;
  from?: string;
  to?: string;
  references?: {
    table?: string;
    column?: string;
  };
  fromTable?: string;
  fromColumn?: string;
  toTable?: string;
  toColumn?: string;
}

export function parseJsonToSchema(input: string): ParseResult {
  const errors: ParseError[] = [];

  let raw: unknown;
  try {
    raw = JSON.parse(input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON';
    // Try to extract line number from JSON parse error
    const lineMatch = msg.match(/line (\d+)/i) || msg.match(/position (\d+)/i);
    return {
      schema: null,
      errors: [{ message: `JSON parse error: ${msg}`, line: lineMatch ? parseInt(lineMatch[1]) : undefined }],
    };
  }

  if (!raw || typeof raw !== 'object') {
    return { schema: null, errors: [{ message: 'Expected a JSON object at the root level' }] };
  }

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.tables)) {
    return { schema: null, errors: [{ message: 'Missing required "tables" array' }] };
  }

  const tables: Table[] = [];
  const foreignKeys: ForeignKey[] = [];

  for (let i = 0; i < obj.tables.length; i++) {
    const rawTable = obj.tables[i] as JsonTable;

    if (!rawTable || typeof rawTable !== 'object') {
      errors.push({ message: `tables[${i}]: expected an object` });
      continue;
    }

    if (!rawTable.name || typeof rawTable.name !== 'string') {
      errors.push({ message: `tables[${i}]: missing required "name" field` });
      continue;
    }

    const tableName = rawTable.name;
    const columns: Column[] = [];
    const primaryKeyColumns: string[] = [];

    if (Array.isArray(rawTable.columns)) {
      for (let j = 0; j < rawTable.columns.length; j++) {
        const rawCol = rawTable.columns[j] as JsonColumn;

        if (!rawCol || typeof rawCol !== 'object') {
          errors.push({ message: `${tableName}.columns[${j}]: expected an object` });
          continue;
        }

        if (!rawCol.name || typeof rawCol.name !== 'string') {
          errors.push({ message: `${tableName}.columns[${j}]: missing "name"` });
          continue;
        }

        const isPk = rawCol.primaryKey === true;
        if (isPk) primaryKeyColumns.push(rawCol.name);

        columns.push({
          name: rawCol.name,
          type: typeof rawCol.type === 'string' ? rawCol.type : 'text',
          isPrimaryKey: isPk,
          isForeignKey: false, // Marked later during FK resolution
          isUnique: rawCol.unique === true,
          nullable: rawCol.nullable !== false, // Default true
        });
      }
    }

    // Table-level foreign keys
    if (Array.isArray(rawTable.foreignKeys)) {
      for (const rawFk of rawTable.foreignKeys) {
        const fk = parseForeignKey(tableName, rawFk as JsonForeignKey, errors);
        if (fk) foreignKeys.push(fk);
      }
    }

    tables.push({ name: tableName, columns, primaryKeyColumns });
  }

  // Top-level foreign keys (alternative format)
  if (Array.isArray(obj.foreignKeys)) {
    for (const rawFk of obj.foreignKeys) {
      const fk = parseForeignKey('', rawFk as JsonForeignKey, errors);
      if (fk) foreignKeys.push(fk);
    }
  }

  // Mark FK columns
  for (const fk of foreignKeys) {
    const table = tables.find(t => t.name === fk.fromTable);
    if (table) {
      const col = table.columns.find(c => c.name === fk.fromColumn);
      if (col) col.isForeignKey = true;
    }
  }

  return { schema: { tables, foreignKeys }, errors };
}

function parseForeignKey(
  defaultTable: string,
  raw: JsonForeignKey,
  errors: ParseError[]
): ForeignKey | null {
  if (!raw || typeof raw !== 'object') {
    errors.push({ message: 'Foreign key: expected an object' });
    return null;
  }

  // Format 1: dot-notation shorthand { from: "orders.user_id", to: "users.id" }
  if (typeof raw.from === 'string' && typeof raw.to === 'string') {
    const fromParts = raw.from.split('.');
    const toParts = raw.to.split('.');
    if (fromParts.length === 2 && toParts.length === 2) {
      return {
        fromTable: fromParts[0],
        fromColumn: fromParts[1],
        toTable: toParts[0],
        toColumn: toParts[1],
      };
    }
    errors.push({ message: `Foreign key: dot-notation must be "table.column", got "${raw.from}" → "${raw.to}"` });
    return null;
  }

  // Format 2: explicit fields { fromTable, fromColumn, toTable, toColumn }
  if (typeof raw.fromTable === 'string' && typeof raw.fromColumn === 'string' &&
      typeof raw.toTable === 'string' && typeof raw.toColumn === 'string') {
    return {
      fromTable: raw.fromTable,
      fromColumn: raw.fromColumn,
      toTable: raw.toTable,
      toColumn: raw.toColumn,
    };
  }

  // Format 3: table-level { column, references: { table, column } }
  if (typeof raw.column === 'string' && raw.references && typeof raw.references === 'object') {
    const ref = raw.references;
    if (typeof ref.table === 'string' && typeof ref.column === 'string') {
      return {
        fromTable: defaultTable,
        fromColumn: raw.column,
        toTable: ref.table,
        toColumn: ref.column,
      };
    }
  }

  errors.push({ message: 'Foreign key: unrecognized format' });
  return null;
}
