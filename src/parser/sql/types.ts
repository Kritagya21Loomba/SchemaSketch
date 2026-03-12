export const TokenType = {
  // Keywords
  CREATE: 0, TABLE: 1, IF: 2, NOT: 3, EXISTS: 4, PRIMARY: 5, KEY: 6,
  FOREIGN: 7, REFERENCES: 8, UNIQUE: 9, NULL: 10, DEFAULT: 11,
  CONSTRAINT: 12, ALTER: 13, ADD: 14,
  ON: 15, DELETE: 16, UPDATE: 17, CASCADE: 18, SET: 19, RESTRICT: 20,
  NO: 21, ACTION: 22, CHECK: 23,

  // Symbols
  LPAREN: 24, RPAREN: 25, COMMA: 26, SEMICOLON: 27, DOT: 28,

  // Literals
  IDENTIFIER: 29,
  QUOTED_IDENT: 30,
  NUMBER: 31,
  STRING: 32,

  // Special
  EOF: 33,
  UNKNOWN: 34,
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export type Token = {
  type: TokenType;
  value: string;
  line: number;
  col: number;
};

const KEYWORDS: Record<string, TokenType> = {
  create: TokenType.CREATE,
  table: TokenType.TABLE,
  if: TokenType.IF,
  not: TokenType.NOT,
  exists: TokenType.EXISTS,
  primary: TokenType.PRIMARY,
  key: TokenType.KEY,
  foreign: TokenType.FOREIGN,
  references: TokenType.REFERENCES,
  unique: TokenType.UNIQUE,
  null: TokenType.NULL,
  default: TokenType.DEFAULT,
  constraint: TokenType.CONSTRAINT,
  alter: TokenType.ALTER,
  add: TokenType.ADD,
  on: TokenType.ON,
  delete: TokenType.DELETE,
  update: TokenType.UPDATE,
  cascade: TokenType.CASCADE,
  set: TokenType.SET,
  restrict: TokenType.RESTRICT,
  no: TokenType.NO,
  action: TokenType.ACTION,
  check: TokenType.CHECK,
};

export function lookupKeyword(word: string): TokenType | undefined {
  return KEYWORDS[word.toLowerCase()];
}
