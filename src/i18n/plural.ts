/* symbanta-dashboard
 *
 * Copyright © Josep Bigorra <jjbigorra@gmail.com>
 *
 * symbanta-dashboard is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * symbanta-dashboard is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with symbanta-dashboard.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * GNU gettext plural rules.
 *
 * Every `.po` catalog declares:
 *
 *   "Plural-Forms: nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 ? 1 : 2);\n"
 *
 * The second half is a C expression over `n`. Rather than pulling in an
 * expression evaluator (or, worse, `eval`), this module parses the small,
 * well-defined grammar GNU gettext allows and interprets it directly.
 *
 * Grammar, lowest to highest precedence:
 *
 *   expression := ternary
 *   ternary    := or ("?" expression ":" expression)?
 *   or         := and ("||" and)*
 *   and        := equality ("&&" equality)*
 *   equality   := relational (("==" | "!=") relational)*
 *   relational := additive (("<" | ">" | "<=" | ">=") additive)*
 *   additive   := multiplicative (("+" | "-") multiplicative)*
 *   multiplicative := unary ("%" unary)*
 *   unary      := "!" unary | primary
 *   primary    := number | "n" | "(" expression ")"
 */

export interface PluralRule {
  /** Number of plural forms the language uses. */
  nplurals: number;
  /** Index into `msgstr` for a given count, always within [0, nplurals). */
  select(count: number): number;
}

/** English-ish fallback, also used when a header is missing or unparsable. */
export const DEFAULT_PLURAL_RULE: PluralRule = {
  nplurals: 2,
  select: (count: number) => (Math.abs(Math.trunc(count)) === 1 ? 0 : 1),
};

type Token =
  | { kind: "number"; value: number }
  | { kind: "identifier" }
  | { kind: "operator"; value: string }
  | { kind: "eof" };

const OPERATORS = [
  "||",
  "&&",
  "==",
  "!=",
  ">=",
  "<=",
  "?",
  ":",
  ">",
  "<",
  "%",
  "+",
  "-",
  "!",
  "(",
  ")",
];

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const character = expression[index] ?? "";

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (/[0-9]/.test(character)) {
      const start = index;
      while (index < expression.length && /[0-9]/.test(expression[index] ?? "")) {
        index += 1;
      }
      tokens.push({ kind: "number", value: Number.parseInt(expression.slice(start, index), 10) });
      continue;
    }

    if (/[a-zA-Z_]/.test(character)) {
      const start = index;
      while (index < expression.length && /[a-zA-Z0-9_]/.test(expression[index] ?? "")) {
        index += 1;
      }
      const identifier = expression.slice(start, index);
      if (identifier !== "n") {
        throw new Error(`Unsupported identifier in Plural-Forms: ${identifier}`);
      }
      tokens.push({ kind: "identifier" });
      continue;
    }

    const operator = OPERATORS.find((candidate) => expression.startsWith(candidate, index));
    if (!operator) {
      throw new Error(`Unsupported operator in Plural-Forms: ${character}`);
    }

    tokens.push({ kind: "operator", value: operator });
    index += operator.length;
  }

  tokens.push({ kind: "eof" });
  return tokens;
}

class PluralExpressionParser {
  private tokens: Token[];
  private position = 0;

  constructor(expression: string) {
    this.tokens = tokenize(expression);
  }

  public parse(): (count: number) => number {
    const result = this.parseTernary();
    if (this.peek().kind !== "eof") {
      throw new Error("Unexpected trailing input in Plural-Forms");
    }
    return result;
  }

  private peek(): Token {
    return this.tokens[this.position] ?? { kind: "eof" };
  }

  private next(): Token {
    const token = this.peek();
    this.position += 1;
    return token;
  }

  private matchOperator(...candidates: string[]): string | undefined {
    const token = this.peek();
    if (token.kind === "operator" && candidates.includes(token.value)) {
      this.next();
      return token.value;
    }
    return undefined;
  }

  private expectOperator(value: string): void {
    if (this.matchOperator(value) === undefined) {
      throw new Error(`Expected "${value}" in Plural-Forms`);
    }
  }

  /** All grammar rules are strict: any unexpected token throws. */
  private parseTernary(): (count: number) => number {
    const condition = this.parseOr();

    if (!this.matchOperator("?")) {
      return condition;
    }

    const whenTrue = this.parseTernary();
    this.expectOperator(":");
    const whenFalse = this.parseTernary();

    return (count) => (condition(count) !== 0 ? whenTrue(count) : whenFalse(count));
  }

  private parseOr(): (count: number) => number {
    let left = this.parseAnd();

    while (this.matchOperator("||")) {
      const right = this.parseAnd();
      const previous = left;
      left = (count) => (previous(count) !== 0 || right(count) !== 0 ? 1 : 0);
    }

    return left;
  }

  private parseAnd(): (count: number) => number {
    let left = this.parseEquality();

    while (this.matchOperator("&&")) {
      const right = this.parseEquality();
      const previous = left;
      left = (count) => (previous(count) !== 0 && right(count) !== 0 ? 1 : 0);
    }

    return left;
  }

  private parseEquality(): (count: number) => number {
    let left = this.parseRelational();

    for (
      let operator = this.matchOperator("==", "!=");
      operator;
      operator = this.matchOperator("==", "!=")
    ) {
      const right = this.parseRelational();
      const previous = left;

      left =
        operator === "=="
          ? (count) => (previous(count) === right(count) ? 1 : 0)
          : (count) => (previous(count) !== right(count) ? 1 : 0);
    }

    return left;
  }

  private parseRelational(): (count: number) => number {
    let left = this.parseAdditive();

    for (
      let operator = this.matchOperator("<", ">", "<=", ">=");
      operator;
      operator = this.matchOperator("<", ">", "<=", ">=")
    ) {
      const right = this.parseAdditive();
      const previous = left;

      left = (count) => {
        const a = previous(count);
        const b = right(count);
        switch (operator) {
          case "<":
            return a < b ? 1 : 0;
          case ">":
            return a > b ? 1 : 0;
          case "<=":
            return a <= b ? 1 : 0;
          default:
            return a >= b ? 1 : 0;
        }
      };
    }

    return left;
  }

  private parseAdditive(): (count: number) => number {
    let left = this.parseMultiplicative();

    for (
      let operator = this.matchOperator("+", "-");
      operator;
      operator = this.matchOperator("+", "-")
    ) {
      const right = this.parseMultiplicative();
      const previous = left;

      left =
        operator === "+"
          ? (count) => previous(count) + right(count)
          : (count) => previous(count) - right(count);
    }

    return left;
  }

  private parseMultiplicative(): (count: number) => number {
    let left = this.parseUnary();

    while (this.matchOperator("%")) {
      const right = this.parseUnary();
      const previous = left;
      left = (count) => {
        const divisor = right(count);
        return divisor === 0 ? 0 : previous(count) % divisor;
      };
    }

    return left;
  }

  private parseUnary(): (count: number) => number {
    if (this.matchOperator("!")) {
      const operand = this.parseUnary();
      return (count) => (operand(count) === 0 ? 1 : 0);
    }

    return this.parsePrimary();
  }

  private parsePrimary(): (count: number) => number {
    const token = this.next();

    if (token.kind === "number") {
      const value = token.value;
      return () => value;
    }

    if (token.kind === "identifier") {
      return (count) => count;
    }

    if (token.kind === "operator" && token.value === "(") {
      const inner = this.parseTernary();
      this.expectOperator(")");
      return inner;
    }

    throw new Error("Unexpected token in Plural-Forms");
  }
}

/** Read `nplurals=…` out of a `Plural-Forms` header. */
function parseNPlurals(header: string): number | undefined {
  const match = /nplurals\s*=\s*(\d+)/i.exec(header);
  const nplurals = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;

  return Number.isFinite(nplurals) && nplurals >= 1 ? nplurals : undefined;
}

/** Read the expression part of a `Plural-Forms` header. */
function parseExpression(header: string): string | undefined {
  const match = /plural\s*=\s*([^;]+)/i.exec(header);
  return match?.[1]?.trim();
}

/**
 * Compile a `Plural-Forms` header into a rule. Anything malformed falls back
 * to English rather than crashing the UI: a broken translation must never take
 * the dashboard down.
 */
export function parsePluralForms(header: string | undefined): PluralRule {
  if (!header) return DEFAULT_PLURAL_RULE;

  const nplurals = parseNPlurals(header);
  const expression = parseExpression(header);

  if (nplurals === undefined || expression === undefined) {
    return DEFAULT_PLURAL_RULE;
  }

  let evaluate: (count: number) => number;

  try {
    evaluate = new PluralExpressionParser(expression).parse();
  } catch {
    return DEFAULT_PLURAL_RULE;
  }

  return {
    nplurals,
    select: (rawCount: number) => {
      const count = Math.abs(Math.trunc(rawCount));
      let index = 0;

      try {
        index = Math.trunc(evaluate(count));
      } catch {
        return DEFAULT_PLURAL_RULE.select(count);
      }

      if (!Number.isFinite(index) || index < 0) return 0;
      return Math.min(index, nplurals - 1);
    },
  };
}
