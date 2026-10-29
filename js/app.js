/* ============================================================
   APP PRINCIPAL
   Componente React usando htm (sem JSX, sem Babel).
   ============================================================ */
(function () {
  const { useState, useMemo, useCallback, useEffect, useRef } = React;
  const html = window.html;
  const Converter = window.Converter;

  const MODE_TABS = [
    ["standard", "Padrão"],
    ["scientific", "Científica"],
    ["converter", "Conversor"],
  ];

  function App() {
    const [S, setS] = useState({
      expr: "",
      history: [],
      memory: 0,
      justEvaluated: false,
      lastResult: null,
      error: null,
      angleMode: "DEG",
    });

    const [theme, setTheme] = useState(() => {
      try { return localStorage.getItem("calc-theme") || "dark"; } catch { return "dark"; }
    });
    const [mode, setMode] = useState("standard");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      document.documentElement.setAttribute("data-theme", theme);
      try { localStorage.setItem("calc-theme", theme); } catch {}
    }, [theme]);

    /* Prévia em tempo real */
    const preview = useMemo(() => previewEval(S.expr, S.angleMode), [S.expr, S.angleMode]);
    const lastGood = useRef(null);
    useEffect(() => { if (preview !== null) lastGood.current = preview; }, [preview]);

    const displayValue = preview !== null ? preview : lastGood.current;
    const resultText = S.error ? "Erro" : formatNumber(displayValue);

    /* ---------- Handlers ---------- */
    const pressDigit = useCallback((d) => {
      setS((s) => {
        const base = s.justEvaluated ? "" : s.expr;
        let next = base + d;
        if (/^0\d/.test(next)) next = next.slice(1);
        return { ...s, expr: next, justEvaluated: false, error: null };
      });
    }, []);

    const pressDot = useCallback(() => {
      setS((s) => {
        let base = s.justEvaluated ? "" : s.expr;
        const m = base.match(/(\d*\.?\d*)$/);
        const trailing = m ? m[1] : "";
        if (trailing.includes(".")) {
          return { ...s, error: "Já existe um ponto decimal neste número" };
        }
        if (!trailing) base += "0";
        return { ...s, expr: base + ".", justEvaluated: false, error: null };
      });
    }, []);

    const pressOperator = useCallback((op) => {
      setS((s) => {
        let base = s.justEvaluated
          ? (s.lastResult !== null ? String(s.lastResult) : "")
          : s.expr;
        if (!base) {
          if (op === "-") return { ...s, expr: "-", justEvaluated: false, error: null };
          return { ...s, justEvaluated: false, error: null };
        }
        const last = base.slice(-1);
        if ("+-*/^".includes(last)) {
          if (op === "-" && last !== "-") base += "-";
          else base = base.replace(/[+\-*/^]+$/, "") + op;
        } else if (last === "(") {
          if (op === "-") base += "-";
          else return { ...s, justEvaluated: false, error: null };
        } else {
          base += op;
        }
        return { ...s, expr: base, justEvaluated: false, error: null };
      });
    }, []);

    const pressEquals = useCallback(() => {
      setS((s) => {
        if (!s.expr.trim()) return s;
        try {
          const value = cleanNumber(evaluateExpression(s.expr, s.angleMode));
          const entry = { id: Date.now() + Math.random(), expr: s.expr, result: value };
          return {
            ...s, justEvaluated: true, lastResult: value, error: null,
            history: [entry, ...s.history].slice(0, 60),
          };
        } catch (e) {
          return { ...s, error: e.message, justEvaluated: false };
        }
      });
    }, []);

    const pressClear = useCallback(() => {
      setS((s) => ({ ...s, expr: "", justEvaluated: false, error: null, lastResult: s.lastResult }));
    }, []);

    const pressCE = useCallback(() => {
      setS((s) => {
        let base = s.justEvaluated ? "" : s.expr;
        const before = base;
        base = base.replace(/(\d+\.?\d*)$/, "");
        if (base === before) base = base.replace(/[+\-*/^(]+$/, "");
        return { ...s, expr: base, justEvaluated: false, error: null };
      });
    }, []);

    const pressBackspace = useCallback(() => {
      setS((s) => {
        if (s.justEvaluated) return { ...s, expr: "", justEvaluated: false, error: null };
        return { ...s, expr: s.expr.slice(0, -1), error: null };
      });
    }, []);

    const pressPercent = useCallback(() => {
      setS((s) => {
        let base = s.justEvaluated ? (s.lastResult !== null ? String(s.lastResult) : "") : s.expr;
        if (!base) return { ...s, error: "Nada para aplicar porcentagem" };
        return { ...s, expr: base + "%", justEvaluated: false, error: null };
      });
    }, []);

    const pressFunction = useCallback((name) => {
      setS((s) => {
        let base = s.justEvaluated ? "" : s.expr;
        if (/[\d)]$/.test(base)) base += "*";
        return { ...s, expr: base + name + "(", justEvaluated: false, error: null };
      });
    }, []);

    const pressConstant = useCallback((name) => {
      setS((s) => {
        let base = s.justEvaluated ? "" : s.expr;
        if (/[\d)]$/.test(base)) base += "*";
        return { ...s, expr: base + name, justEvaluated: false, error: null };
      });
    }, []);

    const pressParen = useCallback((p) => {
      setS((s) => {
        let base = s.justEvaluated ? "" : s.expr;
        if (p === "(") {
          if (/[\d)]$/.test(base)) base += "*";
          return { ...s, expr: base + "(", justEvaluated: false, error: null };
        }
        const open = (base.match(/\(/g) || []).length;
        const close = (base.match(/\)/g) || []).length;
        if (open <= close) return { ...s, error: "Parêntese sem abertura correspondente" };
        if (/[+\-*/^(]$/.test(base)) return { ...s, error: "Expressão incompleta antes do parêntese" };
        return { ...s, expr: base + ")", justEvaluated: false, error: null };
      });
    }, []);

    const pressSquare = useCallback(() => {
      setS((s) => {
        let base = s.justEvaluated ? (s.lastResult !== null ? String(s.lastResult) : "") : s.expr;
        if (!base) return { ...s, error: "Nada para elevar ao quadrado" };
        return { ...s, expr: base + "^2", justEvaluated: false, error: null };
      });
    }, []);

    const pressInverse = useCallback(() => {
      setS((s) => {
        const base = s.justEvaluated ? (s.lastResult !== null ? String(s.lastResult) : "") : s.expr;
        if (!base) return { ...s, error: "Nada para inverter" };
        return { ...s, expr: base + "^-1", justEvaluated: false, error: null };
      });
    }, []);

    const pressFactorial = useCallback(() => {
      setS((s) => {
        const base = s.justEvaluated ? (s.lastResult !== null ? String(s.lastResult) : "") : s.expr;
        if (!base) return { ...s, error: "Nada para fatorar" };
        return { ...s, expr: base + "!", justEvaluated: false, error: null };
      });
    }, []);

    const pressSign = useCallback(() => {
      setS((s) => {
        let base = s.justEvaluated ? (s.lastResult !== null ? String(s.lastResult) : "") : s.expr;
        if (!base) return { ...s, expr: "-", justEvaluated: false, error: null };
        const m = base.match(/(\d+\.?\d*)$/);
        if (!m) {
          base = base.startsWith("-") ? base.slice(1) : "-" + base;
          return { ...s, expr: base, justEvaluated: false, error: null };
        }
        const i = m.index;
        const pre = base.slice(0, i);
        const isUnaryMinus = pre.endsWith("-") && (pre.length === 1 || /[+\-*/^(]$/.test(pre.slice(0, -1)));
        const next = isUnaryMinus ? pre.slice(0, -1) + m[1] : pre + "-" + m[1];
        return { ...s, expr: next, justEvaluated: false, error: null };
      });
    }, []);

    const pressAns = useCallback(() => {
      setS((s) => {
        if (s.lastResult === null) return { ...s, error: "Nenhum resultado anterior" };
        let base = s.justEvaluated ? "" : s.expr;
        if (/[\d)]$/.test(base)) base += "*";
        return { ...s, expr: base + String(s.lastResult), justEvaluated: false, error: null };
      });
    }, []);

    const toggleAngle = useCallback(() => {
      setS((s) => ({ ...s, angleMode: s.angleMode === "DEG" ? "RAD" : "DEG", error: null }));
    }, []);

    const pressMemory = useCallback((action) => {
      setS((s) => {
        const current = () => {
          if (s.justEvaluated && s.lastResult !== null) return s.lastResult;
          try { return cleanNumber(evaluateExpression(s.expr, s.angleMode)); }
          catch { return null; }
        };
        switch (action) {
          case "MC": return { ...s, memory: 0, error: null };
          case "MR": {
            let base = s.justEvaluated ? "" : s.expr;
            if (/[\d)]$/.test(base)) base += "*";
            return { ...s, expr: base + String(s.memory), justEvaluated: false, error: null };
          }
          case "M+": {
            const v = current();
            if (v === null) return { ...s, error: "Nada para somar à memória" };
            return { ...s, memory: cleanNumber(s.memory + v), error: null };
          }
          case "M-": {
            const v = current();
            if (v === null) return { ...s, error: "Nada para subtrair da memória" };
            return { ...s, memory: cleanNumber(s.memory - v), error: null };
          }
          case "MS": {
            const v = current();
            if (v === null) return { ...s, error: "Nada para armazenar" };
            return { ...s, memory: v, error: null };
          }
          default: return s;
        }
      });
    }, []);

    const clearHistory = useCallback(() => setS((s) => ({ ...s, history: [] })), []);
    const reuseHistory = useCallback((h) => {
      setS((s) => ({ ...s, expr: h.expr, justEvaluated: false, error: null }));
    }, []);

    /* Roteador de cliques */
    const handlePress = useCallback((raw) => {
      if (/^\d$/.test(raw)) return pressDigit(raw);
      switch (raw) {
        case ".": return pressDot();
        case "+": case "−": case "×": case "÷": case "^":
          return pressOperator(OP_MAP[raw]);
        case "=": return pressEquals();
        case "C": return pressClear();
        case "CE": return pressCE();
        case "⌫": return pressBackspace();
        case "%": return pressPercent();
        case "±": return pressSign();
        case "(": case ")": return pressParen(raw);
        case "√": return pressFunction("sqrt");
        case "x²": return pressSquare();
        case "1/x": return pressInverse();
        case "!": return pressFactorial();
        case "π": return pressConstant("pi");
        case "e": return pressConstant("e");
        case "sin": case "cos": case "tan":
        case "asin": case "acos": case "atan":
        case "ln": case "log":
          return pressFunction(raw);
        case "DEG": return toggleAngle();
        case "ANS": return pressAns();
        case "MC": case "MR": case "M+": case "M-": case "MS":
          return pressMemory(raw);
        default: return;
      }
    }, [pressDigit, pressDot, pressOperator, pressEquals, pressClear, pressCE,
        pressBackspace, pressPercent, pressSign, pressParen, pressFunction,
        pressSquare, pressInverse, pressFactorial, pressConstant, toggleAngle,
        pressAns, pressMemory]);

    /* Teclado físico */
    useEffect(() => {
      const onKeyDown = (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // Não sequestrar teclas quando o usuário está digitando em um campo
  const el = e.target;
  const tag = el && el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el && el.isContentEditable)) {
    return;
  }

  const k = e.key;
        if (/^[0-9]$/.test(k)) { e.preventDefault(); pressDigit(k); return; }
        if (k === "." || k === ",") { e.preventDefault(); pressDot(); return; }
        if (k === "+") { e.preventDefault(); pressOperator("+"); return; }
        if (k === "-") { e.preventDefault(); pressOperator("-"); return; }
        if (k === "*") { e.preventDefault(); pressOperator("*"); return; }
        if (k === "/") { e.preventDefault(); pressOperator("/"); return; }
        if (k === "^") { e.preventDefault(); pressOperator("^"); return; }
        if (k === "(" || k === ")") { e.preventDefault(); pressParen(k); return; }
        if (k === "%") { e.preventDefault(); pressPercent(); return; }
        if (k === "Enter" || k === "=") { e.preventDefault(); pressEquals(); return; }
        if (k === "Backspace") { e.preventDefault(); pressBackspace(); return; }
        if (k === "Escape") { e.preventDefault(); pressClear(); return; }
        if (k === "Delete") { e.preventDefault(); pressCE(); return; }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [pressDigit, pressDot, pressOperator, pressParen, pressPercent,
        pressEquals, pressBackspace, pressClear, pressCE]);

    /* Copiar resultado */
    const copyResult = async () => {
      const text = preview !== null ? String(preview) : (displayValue !== null ? String(displayValue) : "");
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); setCopied(true); } catch {}
        document.body.removeChild(ta);
      }
      setTimeout(() => setCopied(false), 1600);
    };

    const layout = mode === "scientific" ? SCIENTIFIC_LAYOUT : STANDARD_LAYOUT;
    const padClass = mode === "scientific" ? "pad pad-sci" : "pad pad-std";

    /* ---------- Render ---------- */
    const displayBlock = html`
      <div className="display">
        <div className="display-meta">
          <span className="badge">${S.angleMode}</span>
          ${S.memory !== 0 && html`<span className="badge mem" title="Valor na memória">M = ${formatNumber(S.memory)}</span>`}
          <div className="display-actions">
            <button
              type="button"
              className=${"mini-btn" + (copied ? " copied" : "")}
              onClick=${copyResult}
              aria-label="Copiar resultado para a área de transferência"
            >${copied ? "✓ Copiado" : "Copiar"}</button>
          </div>
        </div>
        <div className="expr" aria-hidden="true">${S.expr ? formatExpr(S.expr) : "0"}</div>
        <div
          className=${"result" + (S.error ? " is-error" : "")}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >${S.error ? "Erro" : resultText}</div>
        ${S.error && html`<div className="error-msg" role="alert">${S.error}</div>`}
      </div>
    `;

    const memoryRow = html`
      <div className="pad pad-mem" aria-label="Funções de memória">
        ${MEMORY_ROW.map((k) =>
          html`<button
            key=${k}
            type="button"
            className="key key-mem"
            onClick=${() => handlePress(k)}
            aria-label=${ARIA_LABELS[k]}
            title=${ARIA_LABELS[k]}
          >${k}</button>`
        )}
      </div>
    `;

    const keyboard = html`
      <div className=${padClass} aria-label="Teclado da calculadora">
        ${layout.flat().map((raw, i) => {
          const label = raw === "DEG" ? S.angleMode : raw;
          const cls = ["key", "key-" + variantOf(raw)];
          if (mode === "scientific" && raw === "=") cls.push("span-rows");
          return html`<button
            key=${i + "-" + raw}
            type="button"
            className=${cls.join(" ")}
            onClick=${() => handlePress(raw)}
            aria-label=${ARIA_LABELS[raw] || label}
          >${label}</button>`;
        })}
      </div>
    `;

    const calculatorView = html`
      <main id="calculadora" className="panel calc">
        ${displayBlock}
        ${memoryRow}
        ${keyboard}
      </main>
    `;

    const historyView = html`
      <aside className="panel history" aria-label="Histórico de operações">
        <div className="history-head">
          <h2>Histórico</h2>
          ${S.history.length > 0 && html`<button type="button" className="link-btn" onClick=${clearHistory}>Limpar</button>`}
        </div>
        <div className="history-list">
          ${S.history.length === 0
            ? html`<p className="empty">Nenhum cálculo ainda.<br />Seus resultados aparecerão aqui.</p>`
            : S.history.map((h) =>
                html`<button
                  key=${h.id}
                  type="button"
                  className="history-item"
                  onClick=${() => reuseHistory(h)}
                  title="Clique para reutilizar esta expressão"
                >
                  <span className="h-expr">${formatExpr(h.expr)}</span>
                  <span className="h-res">= ${formatNumber(h.result)}</span>
                </button>`
              )}
        </div>
      </aside>
    `;

    return html`
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <div className="brand-logo" aria-hidden="true">∑</div>
            <div>
              <h1>Calculadora Pro</h1>
              <p>Padrão · Científica · Conversor</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick=${() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label=${theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            title=${theme === "dark" ? "Modo claro" : "Modo escuro"}
          >${theme === "dark" ? "☀️" : "🌙"}</button>
        </header>

        <div className="tabs" role="tablist" aria-label="Modo da calculadora">
          ${MODE_TABS.map(([id, label]) =>
            html`<button
              key=${id}
              type="button"
              role="tab"
              aria-selected=${mode === id}
              className="tab"
              onClick=${() => setMode(id)}
            >${label}</button>`
          )}
        </div>

        <div className="layout" style=${{ marginTop: 16 }}>
          ${mode === "converter" ? html`<${Converter} />` : calculatorView}
          ${historyView}
        </div>

        <footer className="footer">Atalhos: <strong>0–9</strong> · <strong>+ − * /</strong> · <strong>Enter</strong> resultado · <strong>Backspace</strong> apagar · <strong>Esc</strong> limpar tudo · <strong>Del</strong> limpar entrada.<br />Precisão corrigida para ponto flutuante · Funciona offline após a primeira visita (PWA).</footer>
      </div>
    `;
  }

  /* Render */
  ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);

  /* PWA — só tenta registrar em http(s); em file:// é no-op silencioso */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();