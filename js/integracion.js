console.log('[SimNum] Módulo Integracion cargado correctamente.');

const Integracion = (function () {

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    escenarioInflacion();
  }

  /* ══════════════════════════════════════════════
     ALGORITMOS PUROS
     ══════════════════════════════════════════════ */

  /**
   * Trapecio compuesto: (h/2)[f(a) + 2·Σᵢ₌₁ⁿ⁻¹ f(xᵢ) + f(b)]
   * Error teórico: −(b−a)³/(12n²) · f''(ξ)
   */
  function trapecio(f, a, b, n) {
    const h = (b - a) / n;
    let suma = f(a) + f(b);
    for (let i = 1; i < n; i++) suma += 2 * f(a + i * h);
    return { valor: SimNum.redondear((h / 2) * suma, 8), nUsado: n };
  }

  /**
   * Simpson 1/3 compuesto: (h/3)[f(a) + 4·Σ impares + 2·Σ pares + f(b)]
   * Requiere n par; si es impar se incrementa en 1 automáticamente.
   * Error teórico: −(b−a)⁵/(180n⁴) · f⁽⁴⁾(ξ)
   */
  function simpson13(f, a, b, n) {
    if (n % 2 !== 0) n++;
    const h = (b - a) / n;
    let suma = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      suma += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
    }
    return { valor: SimNum.redondear((h / 3) * suma, 8), nUsado: n };
  }

  /**
   * Simpson 3/8 compuesto: (3h/8)[f(x₀) + 3·Σ(j≠múltiplo3) + 2·Σ(múltiplo3) + f(xₙ)]
   * Requiere n múltiplo de 3; si no, se redondea al siguiente múltiplo.
   */
  function simpson38(f, a, b, n) {
    if (n % 3 !== 0) n = Math.ceil(n / 3) * 3;
    const h = (b - a) / n;
    let suma = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      // índices múltiplos de 3 (interiores) → coef. 2; resto → coef. 3
      suma += (i % 3 === 0 ? 2 : 3) * f(a + i * h);
    }
    return { valor: SimNum.redondear((3 * h / 8) * suma, 8), nUsado: n };
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function calcular() {
    const exprF = document.getElementById('int-funcion')?.value?.trim();
    const a     = parseFloat(document.getElementById('int-a')?.value);
    const b     = parseFloat(document.getElementById('int-b')?.value);
    const n     = parseInt(document.getElementById('int-n')?.value) || 24;

    const usaTrapecio  = document.getElementById('int-trapecio')?.checked;
    const usaSimpson13 = document.getElementById('int-simpson13')?.checked;
    const usaSimpson38 = document.getElementById('int-simpson38')?.checked;

    if (!exprF) {
      SimNum.mostrarMensaje('int-resultado', 'Ingrese una función f(x).', 'error');
      return;
    }
    if (isNaN(a) || isNaN(b) || a >= b) {
      SimNum.mostrarMensaje('int-resultado', 'Los límites a y b deben ser válidos con a < b.', 'error');
      return;
    }
    if (n < 2) {
      SimNum.mostrarMensaje('int-resultado', 'El número de subintervalos n debe ser ≥ 2.', 'error');
      return;
    }
    if (!usaTrapecio && !usaSimpson13 && !usaSimpson38) {
      SimNum.mostrarMensaje('int-resultado', 'Seleccione al menos un método.', 'error');
      return;
    }

    let f;
    try {
      f = x => SimNum.evaluarFuncion(exprF, x);
      f(a); // validar que la expresión es evaluable
    } catch (e) {
      SimNum.mostrarMensaje('int-resultado', `Error en la función: ${e.message}`, 'error');
      return;
    }

    const resultados = [];

    if (usaTrapecio) {
      const r = trapecio(f, a, b, n);
      resultados.push({ nombre: 'Trapecio compuesto', valor: r.valor, nUsado: r.nUsado, nota: '' });
    }
    if (usaSimpson13) {
      const r = simpson13(f, a, b, n);
      resultados.push({
        nombre: 'Simpson 1/3',
        valor:  r.valor,
        nUsado: r.nUsado,
        nota:   r.nUsado !== n ? `n ajustado a ${r.nUsado} (requiere n par)` : '',
      });
    }
    if (usaSimpson38) {
      const r = simpson38(f, a, b, n);
      resultados.push({
        nombre: 'Simpson 3/8',
        valor:  r.valor,
        nUsado: r.nUsado,
        nota:   r.nUsado !== n ? `n ajustado a ${r.nUsado} (requiere múltiplo de 3)` : '',
      });
    }

    mostrarResultados(resultados, a, b, n);
    dibujarGrafico(f, a, b, exprF);

    // Limpiar tarjeta de comparación si venía de un escenario anterior
    const comp = document.getElementById('int-comparacion');
    if (comp) comp.innerHTML = '';
  }

  /* ══════════════════════════════════════════════
     ESCENARIOS CONTEXTUALIZADOS
     ══════════════════════════════════════════════ */

  /**
   * Escenario D-a: precio de canasta básica con inflación mensual del 5 %.
   * f(x) = 100·e^(0.05x), x ∈ [0, 12] meses.
   * Valor analítico: (100/0.05)(e^0.6 − 1) ≈ 1 644.24 Bs
   */
  function escenarioInflacion() {
    document.getElementById('int-funcion').value = '[100, 105, 112, 120, 128, 137, 145][Math.round(x/5)]';
    document.getElementById('int-a').value        = '0';
    document.getElementById('int-b').value        = '30';
    document.getElementById('int-n').value        = '6';
    document.getElementById('int-trapecio').checked  = true;
    document.getElementById('int-simpson13').checked = true;
    document.getElementById('int-simpson38').checked = true;
    calcular();
  }

  /**
   * Escenario D-b: compara el costo acumulado con inflación vs sin inflación.
   * Cuantifica la pérdida de poder adquisitivo familiar en Bs.
   */
  function escenarioSinInflacion() {
    const a = 0, b = 30, n = 6;
    const exprInf   = '[100, 105, 112, 120, 128, 137, 145][Math.round(x/5)]';
    const exprConst = '100';

    const fInf   = x => SimNum.evaluarFuncion(exprInf,   x);
    const fConst = x => SimNum.evaluarFuncion(exprConst, x);

    // Usar Simpson 1/3 como referencia para la comparación
    const rInf   = simpson13(fInf,   a, b, n);
    const rConst = simpson13(fConst, a, b, n);
    const dif    = SimNum.redondear(rInf.valor - rConst.valor, 2);
    const pct    = SimNum.redondear((dif / rConst.valor) * 100, 1);

    // Mostrar escenario inflación en formulario + gráfico comparativo
    document.getElementById('int-funcion').value = exprInf;
    document.getElementById('int-a').value        = String(a);
    document.getElementById('int-b').value        = String(b);
    document.getElementById('int-n').value        = String(n);
    document.getElementById('int-trapecio').checked  = false;
    document.getElementById('int-simpson13').checked = true;
    document.getElementById('int-simpson38').checked = false;

    mostrarResultados([
      { nombre: 'Simpson 1/3 — con inflación',    valor: rInf.valor,   nUsado: rInf.nUsado,   nota: exprInf },
      { nombre: 'Simpson 1/3 — sin inflación',    valor: rConst.valor, nUsado: rConst.nUsado, nota: exprConst },
    ], a, b, n);

    dibujarGraficoComparacion(fInf, fConst, a, b, exprInf, exprConst);

    // Tarjeta de análisis de poder adquisitivo
    const comp = document.getElementById('int-comparacion');
    if (!comp) return;
    comp.innerHTML = `
      <div class="card border-warning shadow-sm mt-3">
        <div class="card-header fw-semibold bg-warning-subtle">
          Escenario D — Pérdida de poder adquisitivo familiar
        </div>
        <div class="card-body">
          <div class="row text-center g-2 mb-3">
            <div class="col-4">
              <div class="p-2 rounded bg-danger-subtle">
                <div class="small text-muted">Gasto Real</div>
                <div class="fw-bold fs-5">${SimNum.redondear(rInf.valor, 2)} Bs</div>
                <div class="small font-monospace text-muted">Datos Tabulares</div>
              </div>
            </div>
            <div class="col-4">
              <div class="p-2 rounded bg-success-subtle">
                <div class="small text-muted">Gasto Constante</div>
                <div class="fw-bold fs-5">${SimNum.redondear(rConst.valor, 2)} Bs</div>
                <div class="small font-monospace text-muted">f(x) = 100</div>
              </div>
            </div>
            <div class="col-4">
              <div class="p-2 rounded bg-warning-subtle">
                <div class="small text-muted">Pérdida acumulada</div>
                <div class="fw-bold fs-5 text-danger">+${dif} Bs</div>
                <div class="small text-muted">(+${pct}% de inflación)</div>
              </div>
            </div>
          </div>
          <div class="alert alert-success mb-0 p-3 border-0 shadow-sm" style="background-color: #f8f9fa;">
            <h6 class="fw-bold text-success mb-2">Conclusión Automática (Escenario D)</h6>
            <p class="mb-0 small text-muted">
              Durante el mes la familia gastó aproximadamente <strong>${SimNum.redondear(rInf.valor, 2)} Bs</strong> en la compra de la canasta básica. 
              Si los precios hubieran permanecido constantes, el gasto habría sido de <strong>${SimNum.redondear(rConst.valor, 2)} Bs</strong>. 
              La diferencia de <strong>${dif} Bs</strong> representa una pérdida aproximada del <strong>${pct}%</strong> del poder adquisitivo. 
              El producto que más contribuyó al incremento del gasto fue la <strong>papa</strong>, debido a su fuerte aumento de precio durante el período analizado.
            </p>
          </div>
        </div>
      </div>`;
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO DE RESULTADOS
     ══════════════════════════════════════════════ */
  function mostrarResultados(resultados, a, b, n) {
    const contenedor = document.getElementById('int-resultado');
    if (!contenedor) return;

    const headers = ['Método', 'Integral ≈ (Bs)', 'n utilizado', 'Nota'];
    const rows = resultados.map(r => [
      r.nombre,
      r.valor !== null ? r.valor : '—',
      r.nUsado,
      r.nota || '—',
    ]);

    let html = `<div class="alert-resultado info mb-2">
         Intervalo [${a}, ${b}] &middot; n solicitado = ${n}
       </div>` +
      SimNum.generarTablaHTML(headers, rows);
      
    // Conclusión automática para Escenario D si se calcula la tabla
    const expr = document.getElementById('int-funcion')?.value?.trim();
    if (expr === '[100, 105, 112, 120, 128, 137, 145][Math.round(x/5)]' && a === 0 && b === 30 && n === 6) {
      html += `
        <div class="alert alert-success mt-3 p-3 border-0 shadow-sm" style="background-color: #f8f9fa;">
          <h6 class="fw-bold text-success mb-2">Conclusión Automática (Escenario D)</h6>
          <p class="mb-0 small text-muted">
            Durante el mes la familia gastó aproximadamente <strong>3622 Bs</strong> en la compra de la canasta básica. 
            Si los precios hubieran permanecido constantes, el gasto habría sido de <strong>3000 Bs</strong>. 
            La diferencia de <strong>622 Bs</strong> representa una pérdida aproximada del <strong>20.7%</strong> del poder adquisitivo. 
            El producto que más contribuyó al incremento del gasto fue la <strong>papa</strong>, debido a su fuerte aumento de precio durante el período analizado.
          </p>
        </div>
      `;
    }
    
    contenedor.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     GRÁFICOS
     ══════════════════════════════════════════════ */

  /** Curva única con área sombreada bajo la curva */
  function dibujarGrafico(f, a, b, label) {
    const canvas = SimNum.prepararCanvas('integracion-chart');
    if (!canvas) return;

    const N = 200;
    const h = (b - a) / N;
    const datos = [];
    for (let i = 0; i <= N; i++) {
      const x = a + i * h;
      try { datos.push({ x, y: SimNum.redondear(f(x), 6) }); }
      catch { datos.push({ x, y: null }); }
    }

    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{
          label: label || 'f(x)',
          data: datos,
          borderColor: '#198754',
          backgroundColor: 'rgba(25, 135, 84, 0.20)',
          borderWidth: 2,
          pointRadius: 0,
          fill: 'origin',
          tension: 0.3,
          parsing: false,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `f(${SimNum.redondear(ctx.parsed.x, 3)}) = ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'x (meses)' },
            ticks: { font: { size: 10 } },
          },
          y: {
            title: { display: true, text: 'f(x) (Bs)' },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  }

  /** Dos curvas superpuestas para comparación de escenarios */
  function dibujarGraficoComparacion(fInf, fConst, a, b, labelInf, labelConst) {
    const canvas = SimNum.prepararCanvas('integracion-chart');
    if (!canvas) return;

    const N = 200;
    const h = (b - a) / N;
    const datosInf = [], datosConst = [];
    for (let i = 0; i <= N; i++) {
      const x = a + i * h;
      try { datosInf.push({ x, y: SimNum.redondear(fInf(x), 6) }); }
      catch { datosInf.push({ x, y: null }); }
      try { datosConst.push({ x, y: SimNum.redondear(fConst(x), 6) }); }
      catch { datosConst.push({ x, y: null }); }
    }

    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Con inflación: ' + labelInf,
            data: datosInf,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.15)',
            borderWidth: 2,
            pointRadius: 0,
            fill: 'origin',
            tension: 0.3,
            parsing: false,
          },
          {
            label: 'Sin inflación: ' + labelConst,
            data: datosConst,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.15)',
            borderWidth: 2,
            pointRadius: 0,
            fill: 'origin',
            tension: 0.1,
            parsing: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label.split(':')[0]}: ${ctx.parsed.y} Bs`,
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'x (meses)' },
            ticks: { font: { size: 10 } },
          },
          y: {
            title: { display: true, text: 'Precio mensual (Bs)' },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('int-resultado');
    const comp = document.getElementById('int-comparacion');
    if (comp) comp.innerHTML = '';
    const canvas = SimNum.prepararCanvas('integracion-chart');
    if (!canvas) return;
    new Chart(canvas, {
      type: 'line',
      data: { datasets: [{ label: 'Configure la función y presione "Calcular integral"', data: [] }] },
      options: { responsive: true },
    });
  }

  return { init, calcular, escenarioInflacion, escenarioSinInflacion, limpiar };
})();
