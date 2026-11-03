/* ============================================================
   NÚCLEO MATEMÁTICO
   ============================================================ */

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error("Fatorial inválido");
  if (n > 170) throw new Error("Fatorial muito grande");
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

const toRad = (v, mode) => (mode === "DEG" ? (v * Math.PI) / 180 : v);
const fromRad = (v, mode) => (mode === "DEG" ? (v * 180) / Math.PI : v);

function applyFn(name, arg, angleMode) {
  switch (name) {
    case "sin": return Math.sin(toRad(arg, angleMode));
    case "cos": return Math.cos(toRad(arg, angleMode));
    case "tan": {
      const r = toRad(arg, angleMode);
      if (Math.abs(Math.cos(r)) < 1e-12) throw new Error("Tangente indefinida nesse ângulo");
      return Math.tan(r);
    }
    case "asin": {
      if (arg < -1 || arg > 1) throw new Error("Domínio inválido para asin (−1 a 1)");
      return fromRad(Math.asin(arg), angleMode);
    }
    case "acos": {
      if (arg < -1 || arg > 1) throw new Error("Domínio inválido para acos (−1 a 1)");
      return fromRad(Math.acos(arg), angleMode);
    }
    case "atan": return fromRad(Math.atan(arg), angleMode);
    case "ln": {
      if (arg <= 0) throw new Error("Logaritmo de número não positivo");
      return Math.log(arg);
    }
    case "log": {
      if (arg <= 0) throw new Error("Logaritmo de número não positivo");
      return Math.log10(arg);
    }
    case "sqrt": {
      if (arg < 0) throw new Error("Raiz quadrada de número negativo");
      return Math.sqrt(arg);
    }
    case "abs": return Math.abs(arg);
    case "exp": return Math.exp(arg);
    default: throw new Error("Função desconhecida: " + name);
  }
}

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " ") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let num = "";
      while (i < src.length && /[0-9.]/.test(src[i])) { num += src[i]; i++; }
      if ((num.match(/\./g) || []).length > 1) throw new Error("Número com múltiplos pontos decimais");
      if (i < src.length && (src[i] === "e" || src[i] === "E") && /^[+-]?\d/.test(src.slice(i + 1))) {
        num += src[i]; i++;
        if (src[i] === "+" || src[i] === "-") { num += src[i]; i++; }
        while (i < src.length && /[0-9]/.test(src[i])) { num += src[i]; i++; }
      }
      tokens.push({ t: "num", v: parseFloat(num) });
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let name = "";
      while (i < src.length && /[a-zA-Z]/.test(src[i])) { name += src[i]; i++; }
      tokens.push({ t: "name", v: name.toLowerCase() });
      continue;
    }
    if ("+-*/^%!()".includes(c)) { tokens.push({ t: "op", v: c }); i++; continue; }
    throw new Error("Caractere inválido: " + c);
  }
  return tokens;
}

function evaluateExpression(src, angleMode) {
  const tokens = tokenize(src);
  if (tokens.length === 0) throw new Error("Expressão vazia");
  let pos = 0;
  const peek = () => tokens[pos];
  const atEnd = () => pos >= tokens.length;
  const isOp = (v) => !atEnd() && peek().t === "op" && peek().v === v;

  function parseExpr() {
    let left = parseTerm();
    while (!atEnd() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) {
      const op = tokens[pos++].v;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }
  function parseTerm() {
    let left = parseUnary();
    while (!atEnd() && peek().t === "op" && (peek().v === "*" || peek().v === "/")) {
      const op = tokens[pos++].v;
      const right = parseUnary();
      if (op === "/") {
        if (right === 0) throw new Error("Divisão por zero");
        left = left / right;
      } else {
        left = left * right;
      }
    }
    return left;
  }
  function parseUnary() {
    if (!atEnd() && peek().t === "op" && (peek().v === "-" || peek().v === "+")) {
      const op = tokens[pos++].v;
      const v = parseUnary();
      return op === "-" ? -v : v;
    }
    return parsePower();
  }
  function parsePower() {
    const base = parsePostfix();
    if (isOp("^")) {
      pos++;
      const exp = parseUnary();
      const r = Math.pow(base, exp);
      if (Number.isNaN(r)) throw new Error("Potência inválida");
      return r;
    }
    return base;
  }
  function parsePostfix() {
    let v = parsePrimary();
    while (!atEnd() && peek().t === "op" && (peek().v === "!" || peek().v === "%")) {
      const op = tokens[pos++].v;
      v = op === "!" ? factorial(v) : v / 100;
    }
    return v;
  }
  function parsePrimary() {
    if (atEnd()) throw new Error("Expressão incompleta");
    const t = peek();
    if (t.t === "num") { pos++; return t.v; }
    if (t.t === "op" && t.v === "(") {
      pos++;
      const v = parseExpr();
      if (!isOp(")")) throw new Error("Parêntese não fechado");
      pos++;
      return v;
    }
    if (t.t === "name") {
      pos++;
      if (t.v === "pi") return Math.PI;
      if (t.v === "e") return Math.E;
      if (!isOp("(")) throw new Error("Função desconhecida: " + t.v);
      pos++;
      const arg = parseExpr();
      if (!isOp(")")) throw new Error("Parêntese não fechado");
      pos++;
      return applyFn(t.v, arg, angleMode);
    }
    throw new Error("Expressão inválida");
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error("Expressão inválida");
  return result;
}

function cleanNumber(n) {
  if (Number.isNaN(n)) throw new Error("Operação inválida");
  if (!Number.isFinite(n)) throw new Error("Resultado fora dos limites numéricos");
  if (Object.is(n, -0)) return 0;
  return parseFloat(n.toPrecision(12));
}

function balanceParens(s) {
  let open = 0;
  for (const ch of s) {
    if (ch === "(") open++;
    else if (ch === ")") open = Math.max(0, open - 1);
  }
  return s + ")".repeat(open);
}

function previewEval(expr, angleMode) {
  if (!expr || !expr.trim()) return null;
  let e = expr.replace(/[+\-*/^]+$/, "");
  if (!e) return null;
  e = balanceParens(e).replace(/\(\s*\)/g, "");
  if (!e) return null;
  try {
    return cleanNumber(evaluateExpression(e, angleMode));
  } catch {
    return null;
  }
}

/* ============================================================
   FORMATAÇÃO — versão à prova de falhas
   ============================================================ */
function formatNumber(n) {
  try {
    if (n === null || n === undefined) return "0";
    if (typeof n === "number" && Number.isNaN(n)) return "0";
    if (typeof n === "number" && !Number.isFinite(n)) return "Erro";
    if (typeof n !== "number") return String(n);
    if (Object.is(n, -0)) return "0";
    const abs = Math.abs(n);
    if (abs !== 0 && (abs < 1e-9 || abs >= 1e12)) {
      return n.toExponential(6).replace(".", ",");
    }
    return n.toLocaleString("pt-BR", { maximumFractionDigits: 10 });
  } catch (err) {
    console.error("[formatNumber] falhou para", n, err);
    return "Erro";
  }
}

function formatExpr(expr) {
  if (typeof expr !== "string") return "";
  return expr
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/sqrt/g, "√")
    .replace(/\bpi\b/g, "π")
    .replace(/-/g, "−");
}