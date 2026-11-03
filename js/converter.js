/* ============================================================
   CONVERSOR DE UNIDADES — versão robusta
   ============================================================ */
(function () {
  const { useState, useMemo } = React;
  const html = window.html;

  function convertTemperature(v, from, to) {
    let c;
    if (from === "C") c = v;
    else if (from === "F") c = ((v - 32) * 5) / 9;
    else c = v - 273.15;

    if (to === "C") return c;
    if (to === "F") return (c * 9) / 5 + 32;
    return c + 273.15;
  }

  /* ErrorBoundary local — se o conversor quebrar, o resto do app continua */
  class ConverterErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error, info) {
      console.error("[ConverterErrorBoundary] erro:", error);
      console.error("[ConverterErrorBoundary] stack:", info && info.componentStack);
    }
    render() {
      if (this.state.error) {
        const e = this.state.error;
        return html`<div style=${{
          padding: 20, margin: 16, background: "#fee2e2", color: "#7f1d1d",
          borderRadius: 12, fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word",
          border: "2px solid #dc2626",
        }}>
          <div style=${{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
            ⚠️ Erro no conversor — copie e me envie:
          </div>
          ${String(e && (e.stack || e.message) || e)}
        </div>`;
      }
      return this.props.children;
    }
  }

  function ConverterInner() {
    const [catId, setCatId] = useState("comprimento");
    const cat = CONV_CATEGORIES.find((c) => c.id === catId);

    const safeUnits = (cat && Array.isArray(cat.units)) ? cat.units : [];
    const initialFrom = safeUnits[0] ? safeUnits[0][0] : "";
    const initialTo   = safeUnits[1] ? safeUnits[1][0] : initialFrom;

    const [from, setFrom] = useState(initialFrom);
    const [to, setTo]     = useState(initialTo);
    const [value, setValue] = useState("1");

    const switchCat = (id) => {
      if (id === catId) return;
      try {
        const next = CONV_CATEGORIES.find((c) => c.id === id);
        if (!next || !Array.isArray(next.units) || next.units.length < 2) return;
        setCatId(id);
        setFrom(next.units[0][0]);
        setTo(next.units[1][0]);
      } catch (err) {
        console.error("[switchCat]", err);
      }
    };

    const result = useMemo(() => {
      try {
        if (!cat || !Array.isArray(cat.units)) return null;
        const num = parseFloat(String(value).replace(",", "."));
        if (!Number.isFinite(num)) return null;
        if (cat.temp) {
          const r = convertTemperature(num, from, to);
          return Number.isFinite(r) ? r : null;
        }
        const unitFrom = cat.units.find((u) => u[0] === from);
        const unitTo   = cat.units.find((u) => u[0] === to);
        if (!unitFrom || !unitTo) return null;
        const r = (num * unitFrom[2]) / unitTo[2];
        return Number.isFinite(r) ? r : null;
      } catch (err) {
        console.error("[Converter result]", err);
        return null;
      }
    }, [value, from, to, cat]);

    const swap = () => { setFrom(to); setTo(from); };

    return html`
      <section className="panel converter" aria-label="Conversor de unidades">
        <div className="conv-cats" role="group" aria-label="Categoria de conversão">
          ${CONV_CATEGORIES.map((c) =>
            html`<button
              key=${c.id}
              type="button"
              className="chip"
              aria-pressed=${c.id === catId}
              onClick=${() => switchCat(c.id)}
            >${c.label}</button>`
          )}
        </div>

        <div className="field" style=${{ marginBottom: 12 }}>
          <label htmlFor="conv-value">Valor</label>
          <input
            id="conv-value"
            type="text"
            inputMode="decimal"
            value=${value}
            onChange=${(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <div className="conv-row">
          <div className="field">
            <label htmlFor="conv-from">De</label>
            <select id="conv-from" value=${from} onChange=${(e) => setFrom(e.target.value)}>
              ${safeUnits.map(([id, name]) => html`<option key=${id} value=${id}>${name}</option>`)}
            </select>
          </div>
          <button type="button" className="conv-swap" onClick=${swap} aria-label="Inverter unidades">⇄</button>
          <div className="field">
            <label htmlFor="conv-to">Para</label>
            <select id="conv-to" value=${to} onChange=${(e) => setTo(e.target.value)}>
              ${safeUnits.map(([id, name]) => html`<option key=${id} value=${id}>${name}</option>`)}
            </select>
          </div>
        </div>

        <div className="conv-result" aria-live="polite">
          <small>Resultado</small>
          <strong>${result === null ? "—" : formatNumber(result)}</strong>
        </div>
      </section>
    `;
  }

  function Converter() {
    return html`<${ConverterErrorBoundary}><${ConverterInner} /></${ConverterErrorBoundary}>`;
  }

  window.Converter = Converter;
})();