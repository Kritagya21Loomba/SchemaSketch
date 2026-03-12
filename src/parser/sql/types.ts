export enum TokenType {
  // Keywords
  CREATE, TABLE, IF, NOT, EXISTS, PRIMARY, KEY, FOREIGN, REFERENCES,
  UNIQUE, NULL, DEFAULT, CONSTRAINT, ALTER, ADD,
  ON, DELETE, UPDATE, CASCADE, SET, RESTRICT, NO, ACTION, CHECK,

  // Symbols
  LPAREN, RPAREN, COMMA, SEMICOLON, DOT,

  // Literals
  IDENTIFIER,
  QUOTED_IDENT,
  NUMBER,
  STRING,

  // Special
  EOF,
  UNKNOWN,
}

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
