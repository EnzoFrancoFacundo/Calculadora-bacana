/* ============================================================
   CONVERSOR DE UNIDADES
   Componente React usando htm (sem JSX, sem Babel).
   Funciona em file:// porque não depende de fetch de .jsx.
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

  function Converter() {
    const [catId, setCatId] = useState("comprimento");
    const cat = CONV_CATEGORIES.find((c) => c.id === catId);

    const [from, setFrom] = useState(cat.units[0][0]);
    const [to, setTo] = useState(cat.units[1][0]);
    const [value, setValue] = useState("1");

    /* Troca de categoria: reseta from/to NO MESMO LOTE
       (evita render intermediário com unidades inválidas) */
    const switchCat = (id) => {
      if (id === catId) return;
      const next = CONV_CATEGORIES.find((c) => c.id === id);
      setCatId(id);
      setFrom(next.units[0][0]);
      setTo(next.units[1][0]);
    };

    const result = useMemo(() => {
      const num = parseFloat(String(value).replace(",", "."));
      if (!Number.isFinite(num)) return null;
      if (cat.temp) return convertTemperature(num, from, to);
      const unitFrom = cat.units.find((u) => u[0] === from);
      const unitTo = cat.units.find((u) => u[0] === to);
      if (!unitFrom || !unitTo) return null;   // ← proteção
      return (num * unitFrom[2]) / unitTo[2];
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
              ${cat.units.map(([id, name]) => html`<option key=${id} value=${id}>${name}</option>`)}
            </select>
          </div>
          <button type="button" className="conv-swap" onClick=${swap} aria-label="Inverter unidades">⇄</button>
          <div className="field">
            <label htmlFor="conv-to">Para</label>
            <select id="conv-to" value=${to} onChange=${(e) => setTo(e.target.value)}>
              ${cat.units.map(([id, name]) => html`<option key=${id} value=${id}>${name}</option>`)}
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

  window.Converter = Converter;
})();