/* ============================================================
   CONFIGURAÇÃO DA INTERFACE
   Usamos `var` para que os bindings fiquem no objeto global
   e sejam visíveis aos arquivos .jsx transpilados pelo Babel.
   ============================================================ */

var ARIA_LABELS = {
  "⌫": "Apagar último caractere",
  "C": "Limpar tudo",
  "CE": "Limpar entrada atual",
  "±": "Trocar sinal",
  "√": "Raiz quadrada",
  "x²": "Elevar ao quadrado",
  "1/x": "Inverso",
  "!": "Fatorial",
  "^": "Potência",
  "π": "Pi",
  "e": "Número de Euler",
  "÷": "Dividir",
  "×": "Multiplicar",
  "−": "Subtrair",
  "+": "Somar",
  "%": "Porcentagem",
  "=": "Calcular resultado",
  "MC": "Limpar memória",
  "MR": "Recuperar memória",
  "M+": "Somar à memória",
  "M-": "Subtrair da memória",
  "MS": "Armazenar na memória",
  "ANS": "Inserir último resultado",
  "DEG": "Alternar graus e radianos",
  "sin": "Seno", "cos": "Cosseno", "tan": "Tangente",
  "asin": "Arco-seno", "acos": "Arco-cosseno", "atan": "Arco-tangente",
  "ln": "Logaritmo natural", "log": "Logaritmo base 10",
};

var OP_MAP = { "+": "+", "−": "-", "×": "*", "÷": "/", "^": "^" };
var MEMORY_ROW = ["MC", "MR", "M+", "M-", "MS"];
var MEMORY_SET = new Set(MEMORY_ROW);

var STANDARD_LAYOUT = [
  ["%", "CE", "C", "⌫"],
  ["1/x", "x²", "√", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["±", "0", ".", "="],
];

var SCIENTIFIC_LAYOUT = [
  ["DEG", "(", ")", "⌫", "C"],
  ["sin", "cos", "tan", "ln", "log"],
  ["asin", "acos", "atan", "√", "x²"],
  ["π", "e", "!", "^", "÷"],
  ["7", "8", "9", "×", "%"],
  ["4", "5", "6", "−", "CE"],
  ["1", "2", "3", "+", "="],
  ["±", "0", ".", "ANS"],
];

function variantOf(label) {
  if (["+", "−", "×", "÷", "^"].includes(label)) return "op";
  if (label === "=") return "eq";
  if (["C", "CE", "⌫"].includes(label)) return "danger";
  if (MEMORY_SET.has(label)) return "mem";
  if (/^\d$/.test(label) || label === ".") return "num";
  return "fn";
}

var CONV_CATEGORIES = [
  {
    id: "comprimento", label: "Comprimento",
    units: [
      ["m", "Metro", 1], ["km", "Quilômetro", 1000], ["cm", "Centímetro", 0.01],
      ["mm", "Milímetro", 0.001], ["mi", "Milha", 1609.344],
      ["ft", "Pé", 0.3048], ["in", "Polegada", 0.0254],
    ],
  },
  {
    id: "massa", label: "Massa",
    units: [
      ["kg", "Quilograma", 1], ["g", "Grama", 0.001], ["mg", "Miligrama", 1e-6],
      ["t", "Tonelada", 1000], ["lb", "Libra", 0.45359237], ["oz", "Onça", 0.028349523125],
    ],
  },
  {
    id: "temperatura", label: "Temperatura", temp: true,
    units: [["C", "Celsius", 1], ["F", "Fahrenheit", 1], ["K", "Kelvin", 1]],
  },
  {
    id: "volume", label: "Volume",
    units: [
      ["L", "Litro", 1], ["mL", "Mililitro", 0.001],
      ["m³", "Metro cúbico", 1000], ["gal", "Galão (EUA)", 3.785411784],
    ],
  },
  {
    id: "dados", label: "Dados",
    units: [
      ["B", "Byte", 1], ["KB", "Kilobyte", 1024], ["MB", "Megabyte", 1048576],
      ["GB", "Gigabyte", 1073741824], ["TB", "Terabyte", 1099511627776],
    ],
  },
];