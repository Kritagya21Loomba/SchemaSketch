export type Column = {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  nullable: boolean;
};

export type ForeignKey = {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
};

export type Table = {
  name: string;
  columns: Column[];
  primaryKeyColumns: string[];
};

export type Schema = {
  tables: Table[];
  foreignKeys: ForeignKey[];
};

export type ParseError = {
  message: string;
  line?: number;
  column?: number;
};

export type ParseResult = {
  schema: Schema | null;
  errors: ParseError[];
};

export type SchemaMode = 'sql' | 'json';
