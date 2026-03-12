import { TokenType, lookupKeyword } from './types';
import type { Token } from './types';

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}

function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isAlphaNumeric(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

const SYMBOL_MAP: Record<string, TokenType> = {
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  ',': TokenType.COMMA,
  ';': TokenType.SEMICOLON,
  '.': TokenType.DOT,
};

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  while (pos < input.length) {
    const ch = input[pos];

    // Skip whitespace
    if (isWhitespace(ch)) {
      if (ch === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
      continue;
    }

    // Skip -- line comments
    if (ch === '-' && pos + 1 < input.length && input[pos + 1] === '-') {
      pos += 2;
      col += 2;
      while (pos < input.length && input[pos] !== '\n') {
        pos++;
        col++;
      }
      continue;
    }

    // Skip /* block comments */
    if (ch === '/' && pos + 1 < input.length && input[pos + 1] === '*') {
      pos += 2;
      col += 2;
      while (pos < input.length - 1) {
        if (input[pos] === '*' && input[pos + 1] === '/') {
          pos += 2;
          col += 2;
          break;
        }
        if (input[pos] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        pos++;
      }
      continue;
    }

    const startLine = line;
    const startCol = col;

    // Symbols
    if (SYMBOL_MAP[ch] !== undefined) {
      tokens.push({ type: SYMBOL_MAP[ch], value: ch, line: startLine, col: startCol });
      pos++;
      col++;
      continue;
    }

    // Quoted identifier "..."
    if (ch === '"') {
      pos++;
      col++;
      const start = pos;
      while (pos < input.length && input[pos] !== '"') {
        pos++;
        col++;
      }
      const value = input.slice(start, pos);
      if (pos < input.length) {
        pos++; // skip closing "
        col++;
      }
      tokens.push({ type: TokenType.QUOTED_IDENT, value, line: startLine, col: startCol });
      continue;
    }

    // String literal '...'
    if (ch === "'") {
      pos++;
      col++;
      let value = '';
      while (pos < input.length) {
        if (input[pos] === "'" && pos + 1 < input.length && input[pos + 1] === "'") {
          value += "'";
          pos += 2;
          col += 2;
        } else if (input[pos] === "'") {
          break;
        } else {
          value += input[pos];
          pos++;
          col++;
        }
      }
      if (pos < input.length) {
        pos++; // skip closing '
        col++;
      }
      tokens.push({ type: TokenType.STRING, value, line: startLine, col: startCol });
      continue;
    }

    // Number
    if (isDigit(ch)) {
      const start = pos;
      while (pos < input.length && isDigit(input[pos])) {
        pos++;
        col++;
      }
      if (pos < input.length && input[pos] === '.') {
        pos++;
        col++;
        while (pos < input.length && isDigit(input[pos])) {
          pos++;
          col++;
        }
      }
      tokens.push({ type: TokenType.NUMBER, value: input.slice(start, pos), line: startLine, col: startCol });
      continue;
    }

    // Identifier or keyword
    if (isAlpha(ch)) {
      const start = pos;
      while (pos < input.length && isAlphaNumeric(input[pos])) {
        pos++;
        col++;
      }
      const word = input.slice(start, pos);
      const keywordType = lookupKeyword(word);
      tokens.push({
        type: keywordType ?? TokenType.IDENTIFIER,
        value: word.toLowerCase(),
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Unknown character
    tokens.push({ type: TokenType.UNKNOWN, value: ch, line: startLine, col: startCol });
    pos++;
    col++;
  }

  tokens.push({ type: TokenType.EOF, value: '', line, col });
  return tokens;
}
