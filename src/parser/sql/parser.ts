import { TokenType } from './types';
import type { Token } from './types';
import { tokenize } from './tokenizer';
import type { Schema, Table, Column, ForeignKey, ParseResult, ParseError } from '../../types/schema';

const TOKEN_NAMES = Object.fromEntries(
  Object.entries(TokenType).map(([k, v]) => [v, k])
) as Record<number, string>;

function tokenTypeName(type: TokenType): string {
  return TOKEN_NAMES[type] ?? String(type);
}

interface ParserContext {
  tokens: Token[];
  pos: number;
  tables: Map<string, Table>;
  foreignKeys: ForeignKey[];
  errors: ParseError[];
}

function peek(ctx: ParserContext): Token {
  return ctx.tokens[ctx.pos] ?? { type: TokenType.EOF, value: '', line: 0, col: 0 };
}

function advance(ctx: ParserContext): Token {
  const token = ctx.tokens[ctx.pos];
  ctx.pos++;
  return token;
}

function atEnd(ctx: ParserContext): boolean {
  return peek(ctx).type === TokenType.EOF;
}

function expect(ctx: ParserContext, type: TokenType): Token | null {
  const token = peek(ctx);
  if (token.type === type) {
    return advance(ctx);
  }
  ctx.errors.push({
    message: `Expected ${tokenTypeName(type)}, got "${token.value}"`,
    line: token.line,
    column: token.col,
  });
  return null;
}

function consumeOptional(ctx: ParserContext, type: TokenType): boolean {
  if (peek(ctx).type === type) {
    advance(ctx);
    return true;
  }
  return false;
}

function expectIdentifier(ctx: ParserContext): string | null {
  const token = peek(ctx);
  if (token.type === TokenType.IDENTIFIER || token.type === TokenType.QUOTED_IDENT) {
    advance(ctx);
    return token.value;
  }
  // Allow keywords used as identifiers in column/table names
  if (isKeyword(token.type)) {
    advance(ctx);
    return token.value;
  }
  ctx.errors.push({
    message: `Expected identifier, got "${token.value}"`,
    line: token.line,
    column: token.col,
  });
  return null;
}

function isKeyword(type: TokenType): boolean {
  return type >= TokenType.CREATE && type <= TokenType.CHECK;
}

function skipToSemicolon(ctx: ParserContext): void {
  while (!atEnd(ctx) && peek(ctx).type !== TokenType.SEMICOLON) {
    advance(ctx);
  }
  consumeOptional(ctx, TokenType.SEMICOLON);
}

function skipParenthesized(ctx: ParserContext): void {
  if (peek(ctx).type !== TokenType.LPAREN) return;
  advance(ctx); // skip (
  let depth = 1;
  while (!atEnd(ctx) && depth > 0) {
    const t = advance(ctx);
    if (t.type === TokenType.LPAREN) depth++;
    if (t.type === TokenType.RPAREN) depth--;
  }
}

function parseDataType(ctx: ParserContext): string {
  const token = peek(ctx);
  let typeName = '';

  if (token.type === TokenType.IDENTIFIER || token.type === TokenType.QUOTED_IDENT || isKeyword(token.type)) {
    typeName = advance(ctx).value;
  } else {
    return 'unknown';
  }

  // Handle multi-word types
  const nextVal = peek(ctx).value;
  if (typeName === 'double' && nextVal === 'precision') {
    advance(ctx);
    typeName = 'double precision';
  } else if (typeName === 'character' && nextVal === 'varying') {
    advance(ctx);
    typeName = 'varchar';
  } else if ((typeName === 'timestamp' || typeName === 'time') && (nextVal === 'with' || nextVal === 'without')) {
    advance(ctx); // with/without
    if (peek(ctx).value === 'time') advance(ctx); // time
    if (peek(ctx).value === 'zone') advance(ctx); // zone
    typeName = typeName + (nextVal === 'with' ? 'tz' : '');
  }

  // Optional (N) or (N,M)
  if (peek(ctx).type === TokenType.LPAREN) {
    advance(ctx); // (
    let precision = '';
    if (peek(ctx).type === TokenType.NUMBER) {
      precision = advance(ctx).value;
    }
    if (peek(ctx).type === TokenType.COMMA) {
      advance(ctx); // ,
      if (peek(ctx).type === TokenType.NUMBER) {
        precision += ',' + advance(ctx).value;
      }
    }
    expect(ctx, TokenType.RPAREN);
    if (precision) {
      typeName += `(${precision})`;
    }
  }

  // Handle array types []
  if (peek(ctx).value === '[' || (peek(ctx).type === TokenType.IDENTIFIER && peek(ctx).value === '[]')) {
    typeName += '[]';
    advance(ctx);
  }

  return typeName;
}

function parseOptionalFkActions(ctx: ParserContext): void {
  // ON DELETE/UPDATE CASCADE|SET NULL|RESTRICT|NO ACTION
  while (peek(ctx).type === TokenType.ON) {
    advance(ctx); // ON
    const actionType = peek(ctx).type;
    if (actionType === TokenType.DELETE || actionType === TokenType.UPDATE) {
      advance(ctx);
      // CASCADE | SET NULL | SET DEFAULT | RESTRICT | NO ACTION
      if (peek(ctx).type === TokenType.CASCADE) {
        advance(ctx);
      } else if (peek(ctx).type === TokenType.SET) {
        advance(ctx);
        advance(ctx); // NULL or DEFAULT
      } else if (peek(ctx).type === TokenType.RESTRICT) {
        advance(ctx);
      } else if (peek(ctx).type === TokenType.NO) {
        advance(ctx);
        consumeOptional(ctx, TokenType.ACTION);
      }
    } else {
      break;
    }
  }
}

function parseColumnDef(ctx: ParserContext, table: Table): void {
  const colName = expectIdentifier(ctx);
  if (!colName) return;

  const dataType = parseDataType(ctx);

  const column: Column = {
    name: colName,
    type: dataType,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    nullable: true,
  };

  // Parse inline constraints
  while (peek(ctx).type !== TokenType.COMMA && peek(ctx).type !== TokenType.RPAREN && !atEnd(ctx)) {
    const t = peek(ctx);

    if (t.type === TokenType.PRIMARY) {
      advance(ctx);
      expect(ctx, TokenType.KEY);
      column.isPrimaryKey = true;
      column.nullable = false;
      if (!table.primaryKeyColumns.includes(colName)) {
        table.primaryKeyColumns.push(colName);
      }
    } else if (t.type === TokenType.NOT) {
      advance(ctx);
      expect(ctx, TokenType.NULL);
      column.nullable = false;
    } else if (t.type === TokenType.NULL) {
      advance(ctx);
      column.nullable = true;
    } else if (t.type === TokenType.UNIQUE) {
      advance(ctx);
      column.isUnique = true;
    } else if (t.type === TokenType.DEFAULT) {
      advance(ctx);
      // Skip the default value expression
      if (peek(ctx).type === TokenType.LPAREN) {
        skipParenthesized(ctx);
      } else if (peek(ctx).type === TokenType.STRING || peek(ctx).type === TokenType.NUMBER) {
        advance(ctx);
      } else if (peek(ctx).type === TokenType.NULL) {
        advance(ctx);
      } else if (peek(ctx).type === TokenType.IDENTIFIER || isKeyword(peek(ctx).type)) {
        advance(ctx);
        // Handle function calls like now()
        if (peek(ctx).type === TokenType.LPAREN) {
          skipParenthesized(ctx);
        }
      }
    } else if (t.type === TokenType.REFERENCES) {
      advance(ctx);
      const refTable = expectIdentifier(ctx);
      if (refTable && peek(ctx).type === TokenType.LPAREN) {
        advance(ctx); // (
        const refCol = expectIdentifier(ctx);
        expect(ctx, TokenType.RPAREN);
        if (refCol) {
          ctx.foreignKeys.push({
            fromTable: table.name,
            fromColumn: colName,
            toTable: refTable,
            toColumn: refCol,
          });
        }
      }
      parseOptionalFkActions(ctx);
    } else if (t.type === TokenType.CHECK) {
      advance(ctx);
      skipParenthesized(ctx);
    } else if (t.type === TokenType.CONSTRAINT) {
      // Named inline constraint: CONSTRAINT name ...
      advance(ctx);
      advance(ctx); // skip name
    } else {
      break;
    }
  }

  table.columns.push(column);
}

function parseTableConstraint(ctx: ParserContext, table: Table): boolean {
  const t = peek(ctx);

  // CONSTRAINT name ...
  if (t.type === TokenType.CONSTRAINT) {
    advance(ctx);
    advance(ctx); // skip constraint name
    return parseTableConstraint(ctx, table); // recurse to parse the actual constraint
  }

  // PRIMARY KEY (col1, col2, ...)
  if (t.type === TokenType.PRIMARY) {
    advance(ctx);
    expect(ctx, TokenType.KEY);
    expect(ctx, TokenType.LPAREN);
    while (peek(ctx).type !== TokenType.RPAREN && !atEnd(ctx)) {
      const colName = expectIdentifier(ctx);
      if (colName) {
        if (!table.primaryKeyColumns.includes(colName)) {
          table.primaryKeyColumns.push(colName);
        }
        // Mark the column as PK
        const col = table.columns.find(c => c.name === colName);
        if (col) {
          col.isPrimaryKey = true;
          col.nullable = false;
        }
      }
      consumeOptional(ctx, TokenType.COMMA);
    }
    expect(ctx, TokenType.RPAREN);
    return true;
  }

  // UNIQUE (col1, ...)
  if (t.type === TokenType.UNIQUE) {
    advance(ctx);
    if (peek(ctx).type === TokenType.LPAREN) {
      skipParenthesized(ctx);
    }
    return true;
  }

  // FOREIGN KEY (col) REFERENCES table(col)
  if (t.type === TokenType.FOREIGN) {
    advance(ctx);
    expect(ctx, TokenType.KEY);
    expect(ctx, TokenType.LPAREN);
    const fromCol = expectIdentifier(ctx);
    expect(ctx, TokenType.RPAREN);
    expect(ctx, TokenType.REFERENCES);
    const refTable = expectIdentifier(ctx);
    if (refTable && peek(ctx).type === TokenType.LPAREN) {
      advance(ctx); // (
      const refCol = expectIdentifier(ctx);
      expect(ctx, TokenType.RPAREN);
      if (fromCol && refCol) {
        ctx.foreignKeys.push({
          fromTable: table.name,
          fromColumn: fromCol,
          toTable: refTable,
          toColumn: refCol,
        });
      }
    }
    parseOptionalFkActions(ctx);
    return true;
  }

  // CHECK (...)
  if (t.type === TokenType.CHECK) {
    advance(ctx);
    skipParenthesized(ctx);
    return true;
  }

  return false;
}

function parseCreateTable(ctx: ParserContext): void {
  expect(ctx, TokenType.CREATE);
  expect(ctx, TokenType.TABLE);

  // Optional IF NOT EXISTS
  if (peek(ctx).type === TokenType.IF) {
    advance(ctx);
    expect(ctx, TokenType.NOT);
    expect(ctx, TokenType.EXISTS);
  }

  const tableName = expectIdentifier(ctx);
  if (!tableName) {
    skipToSemicolon(ctx);
    return;
  }

  const table: Table = { name: tableName, columns: [], primaryKeyColumns: [] };

  if (!expect(ctx, TokenType.LPAREN)) {
    skipToSemicolon(ctx);
    ctx.tables.set(tableName, table);
    return;
  }

  // Parse comma-separated list of columns and constraints
  while (peek(ctx).type !== TokenType.RPAREN && !atEnd(ctx)) {
    const beforePos = ctx.pos;

    // Try table-level constraint first
    if (!parseTableConstraint(ctx, table)) {
      // Not a constraint, parse as column definition
      parseColumnDef(ctx, table);
    }

    // Consume comma separator
    consumeOptional(ctx, TokenType.COMMA);

    // Safety: ensure we're making progress
    if (ctx.pos === beforePos) {
      advance(ctx);
    }
  }

  expect(ctx, TokenType.RPAREN);
  consumeOptional(ctx, TokenType.SEMICOLON);

  ctx.tables.set(tableName, table);
}

function parseAlterTable(ctx: ParserContext): void {
  expect(ctx, TokenType.ALTER);
  expect(ctx, TokenType.TABLE);

  const tableName = expectIdentifier(ctx);
  if (!tableName) {
    skipToSemicolon(ctx);
    return;
  }

  expect(ctx, TokenType.ADD);

  // Optional CONSTRAINT name
  if (peek(ctx).type === TokenType.CONSTRAINT) {
    advance(ctx);
    advance(ctx); // skip constraint name
  }

  // FOREIGN KEY (col) REFERENCES table(col)
  if (peek(ctx).type === TokenType.FOREIGN) {
    advance(ctx);
    expect(ctx, TokenType.KEY);
    expect(ctx, TokenType.LPAREN);
    const fromCol = expectIdentifier(ctx);
    expect(ctx, TokenType.RPAREN);
    expect(ctx, TokenType.REFERENCES);
    const refTable = expectIdentifier(ctx);
    if (refTable && peek(ctx).type === TokenType.LPAREN) {
      advance(ctx); // (
      const refCol = expectIdentifier(ctx);
      expect(ctx, TokenType.RPAREN);
      if (fromCol && refCol) {
        ctx.foreignKeys.push({
          fromTable: tableName,
          fromColumn: fromCol,
          toTable: refTable,
          toColumn: refCol,
        });
      }
    }
    parseOptionalFkActions(ctx);
  }

  consumeOptional(ctx, TokenType.SEMICOLON);
}

export function parseSqlToSchema(input: string): ParseResult {
  const tokens = tokenize(input);
  const ctx: ParserContext = {
    tokens,
    pos: 0,
    tables: new Map(),
    foreignKeys: [],
    errors: [],
  };

  while (!atEnd(ctx)) {
    const t = peek(ctx);

    if (t.type === TokenType.CREATE && ctx.tokens[ctx.pos + 1]?.type === TokenType.TABLE) {
      parseCreateTable(ctx);
    } else if (t.type === TokenType.ALTER) {
      parseAlterTable(ctx);
    } else {
      // Skip unrecognized statements (CREATE INDEX, etc.)
      skipToSemicolon(ctx);
    }
  }

  // Post-process: mark FK columns
  for (const fk of ctx.foreignKeys) {
    const table = ctx.tables.get(fk.fromTable);
    if (table) {
      const col = table.columns.find(c => c.name === fk.fromColumn);
      if (col) col.isForeignKey = true;
    }
  }

  const schema: Schema = {
    tables: Array.from(ctx.tables.values()),
    foreignKeys: ctx.foreignKeys,
  };

  return { schema, errors: ctx.errors };
}
