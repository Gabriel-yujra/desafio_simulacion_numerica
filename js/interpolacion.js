/**
 * interpolacion.js
 *
 * Módulo: Interpolación de precios de alimentos
 * Contexto (Escenario C): Se dispone de datos históricos dispersos (día, precio en Bs)
 *  y se desea reconstruir una curva continua para estimar precios en días sin registro.
 *
 * Métodos implementados:
 *  - Lagrange     : polinomio de grado n−1 para n puntos; puede oscilar con n grande (Runge).
 *  - Newton       : forma de diferencias divididas; numéricamente equivalente a Lagrange.
 *  - Spline cúbico: piezas cúbicas con continuidad C²; evita el fenómeno de Runge.
 */

console.log('[SimNum] Módulo Interpolacion cargado correctamente.');

const Interpolacion = (function () {

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    // Carga el ejemplo y dibuja la curva al arrancar
    cargarEjemploPrecios();
  }

  /* ══════════════════════════════════════════════
     LECTURA DE DATOS DESDE LA UI
     ══════════════════════════════════════════════ */
  function leerPuntos() {
    const filas  = document.querySelectorAll('#interp-tbody tr');
    const puntos = [];

    filas.forEach(fila => {
      const inputs = fila.querySelectorAll('input[type="number"]');
      if (inputs.length >= 2) {
        const x = parseFloat(inputs[0].value);
        const y = parseFloat(inputs[1].value);
        if (!isNaN(x) && !isNaN(y)) puntos.push({ x, y });
      }
    });

    return puntos.sort((a, b) => a.x - b.x);
  }

  /* ══════════════════════════════════════════════
     INTERPOLACIÓN DE LAGRANGE
     ══════════════════════════════════════════════
     P(x) = Σ_j [ y_j · L_j(x) ]
     L_j(x) = Π_{m≠j} (x − x_m) / (x_j − x_m)
     Orden O(n²) en evaluación.
  */
  function evaluarLagrange(xs, ys, xEval) {
    const n = xs.length;
    let suma = 0;
    for (let j = 0; j < n; j++) {
      let Lj = 1;
      for (let m = 0; m < n; m++) {
        if (m !== j) Lj *= (xEval - xs[m]) / (xs[j] - xs[m]);
      }
      suma += ys[j] * Lj;
    }
    return suma;
  }

  /* ══════════════════════════════════════════════
     DIFERENCIAS DIVIDIDAS DE NEWTON
     ══════════════════════════════════════════════
     Tabla DD (in-place):
       f[x_i]            = y_i
       f[x_i, x_{i+1}]  = (f[x_{i+1}] − f[x_i]) / (x_{i+1} − x_i)
     Polinomio (forma de Horner anidada):
       P(x) = a_0 + (x−x_0)·[a_1 + (x−x_1)·[a_2 + … ]]
     Los coeficientes a_k = f[x_0, x_1, …, x_k] son la diagonal de la tabla.
  */
  function coeficientesNewton(xs, ys) {
    const n     = xs.length;
    const tabla = [...ys];         // copia para no mutar
    const coefs = [tabla[0]];     // a_0 = y_0

    for (let j = 1; j < n; j++) {
      for (let i = n - 1; i >= j; i--) {
        tabla[i] = (tabla[i] - tabla[i - 1]) / (xs[i] - xs[i - j]);
      }
      coefs.push(tabla[j]);       // a_j = f[x_0,...,x_j]
    }
    return coefs;
  }

  function evaluarNewton(xs, coefs, xEval) {
    const n = coefs.length;
    let resultado = coefs[n - 1];
    for (let i = n - 2; i >= 0; i--) {
      resultado = resultado * (xEval - xs[i]) + coefs[i];
    }
    return resultado;
  }

  /* ══════════════════════════════════════════════
     SPLINE CÚBICO NATURAL
     ══════════════════════════════════════════════
     Por cada intervalo [x_i, x_{i+1}]:
       S_i(x) = a_i + b_i·(x−x_i) + c_i·(x−x_i)² + d_i·(x−x_i)³
     Condiciones:
       - Interpolación:  S_i(x_i) = y_i,  S_i(x_{i+1}) = y_{i+1}
       - Continuidad C¹: S_i'(x_{i+1}) = S_{i+1}'(x_{i+1})
       - Continuidad C²: S_i''(x_{i+1}) = S_{i+1}''(x_{i+1})
       - Natural:        S''(x_0) = S''(x_n) = 0
     Resuelve el sistema tridiagonal por el método de Thomas.
  */
  function calcularSpline(xs, ys) {
    const n = xs.length - 1; // número de intervalos
    if (n < 2) return null;  // mínimo 3 puntos para que el sistema sea no trivial

    const h = [];
    for (let i = 0; i < n; i++) {
      h[i] = xs[i + 1] - xs[i];
      if (h[i] <= 0) return null; // xs debe ser estrictamente creciente
    }

    // ── Ensamblar sistema tridiagonal para c[1], …, c[n−1] ──────────────────
    // (c[0] = c[n] = 0 por condición natural)
    const m     = n - 1;                      // número de incógnitas interiores
    const diag  = new Array(m).fill(0);
    const upper = new Array(m).fill(0);
    const lower = new Array(m).fill(0);
    const rhs   = new Array(m).fill(0);

    for (let i = 0; i < m; i++) {
      const ci  = i + 1;                      // índice real en c (1-based)
      diag[i]   = 2 * (h[ci - 1] + h[ci]);
      upper[i]  = (i < m - 1) ? h[ci]       : 0;
      lower[i]  = (i > 0)     ? h[ci - 1]   : 0;
      rhs[i]    = 3 * ((ys[ci + 1] - ys[ci]) / h[ci]
                      - (ys[ci] - ys[ci - 1]) / h[ci - 1]);
    }

    // ── Eliminación de Thomas (barrido hacia adelante) ──────────────────────
    for (let i = 1; i < m; i++) {
      const factor = lower[i] / diag[i - 1];
      diag[i] -= factor * upper[i - 1];
      rhs[i]  -= factor * rhs[i - 1];
    }

    // ── Sustitución hacia atrás ─────────────────────────────────────────────
    const cInner = new Array(m).fill(0);
    cInner[m - 1] = rhs[m - 1] / diag[m - 1];
    for (let i = m - 2; i >= 0; i--) {
      cInner[i] = (rhs[i] - upper[i] * cInner[i + 1]) / diag[i];
    }

    // c completo (incluyendo los extremos naturales = 0)
    const c = [0, ...cInner, 0];

    // ── Calcular b y d a partir de c ────────────────────────────────────────
    const a = ys.slice();
    const b = new Array(n).fill(0);
    const d = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      b[i] = (ys[i + 1] - ys[i]) / h[i] - h[i] * (c[i + 1] + 2 * c[i]) / 3;
      d[i] = (c[i + 1] - c[i]) / (3 * h[i]);
    }

    return { a, b, c, d, xs: xs.slice() };
  }

  function evaluarSplineEn(spline, xEval) {
    if (!spline) return NaN;
    const { a, b, c, d, xs } = spline;
    const n = xs.length - 1;

    // Localizar el intervalo que contiene xEval
    let i = n - 1;
    if (xEval <= xs[0]) {
      i = 0;
    } else {
      for (let j = 0; j < n; j++) {
        if (xEval <= xs[j + 1]) { i = j; break; }
      }
    }

    const dx = xEval - xs[i];
    return a[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function interpolar() {
    const puntos = leerPuntos();
    const xEval  = parseFloat(document.getElementById('interp-xeval')?.value);
    const metodo = document.getElementById('interp-method')?.value || 'lagrange';

    // ── Validaciones ────────────────────────────────────────────────────────
    if (puntos.length < 2) {
      SimNum.mostrarMensaje('interp-resultado', 'Se necesitan al menos 2 puntos.', 'error');
      return;
    }
    if (metodo === 'spline' && puntos.length < 3) {
      SimNum.mostrarMensaje('interp-resultado', 'El spline cúbico requiere mínimo 3 puntos.', 'error');
      return;
    }
    if (isNaN(xEval)) {
      SimNum.mostrarMensaje('interp-resultado', 'Ingrese un valor de x para evaluar.', 'error');
      return;
    }

    const xs = puntos.map(p => p.x);
    const ys = puntos.map(p => p.y);

    // Verificar que no haya x duplicados
    const xSet = new Set(xs.map(String));
    if (xSet.size !== xs.length) {
      SimNum.mostrarMensaje('interp-resultado', 'Hay valores de x repetidos. Cada x debe ser único.', 'error');
      return;
    }

    const xMin      = xs[0];
    const xMax      = xs[xs.length - 1];
    const extrapolando = xEval < xMin || xEval > xMax;

    // ── Construir función de evaluación según el método ─────────────────────
    let curvaFn;
    let coefs  = null;
    let yEval;

    try {
      if (metodo === 'lagrange') {
        curvaFn = (x) => evaluarLagrange(xs, ys, x);

      } else if (metodo === 'newton') {
        coefs   = coeficientesNewton(xs, ys);
        curvaFn = (x) => evaluarNewton(xs, coefs, x);

      } else {
        // spline cúbico natural
        const spline = calcularSpline(xs, ys);
        if (!spline) {
          SimNum.mostrarMensaje('interp-resultado',
            'No se pudo calcular el spline (revise que los datos estén ordenados sin repetición).', 'error');
          return;
        }
        curvaFn = (x) => evaluarSplineEn(spline, x);
      }

      yEval = curvaFn(xEval);

    } catch (e) {
      SimNum.mostrarMensaje('interp-resultado', `Error en el cálculo: ${e.message}`, 'error');
      return;
    }

    mostrarResultados(yEval, coefs, puntos, xs, xEval, metodo, extrapolando);
    dibujarGrafico(puntos, xEval, yEval, curvaFn);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO DE RESULTADOS
     ══════════════════════════════════════════════ */
  function mostrarResultados(yEval, coefs, puntos, xs, xEval, metodo, extrapolando) {
    const contenedor = document.getElementById('interp-resultado');
    if (!contenedor) return;

    const nombres = {
      lagrange: 'Lagrange',
      newton:   'Newton (Diferencias divididas)',
      spline:   'Spline cúbico natural',
    };
    const nombre   = nombres[metodo] || metodo;
    const valorStr = isFinite(yEval) ? SimNum.redondear(yEval, 6) : '—';

    // Advertencia de Runge para Lagrange/Newton con muchos puntos
    const rungeAviso = (metodo !== 'spline' && puntos.length > 8)
      ? `<div class="alert-resultado info mb-2">
           ⚠ Con ${puntos.length} puntos el polinomio puede oscilar notoriamente
           (fenómeno de Runge). Considere usar <strong>Spline cúbico</strong>.
         </div>`
      : '';

    // Advertencia de extrapolación
    const extraAviso = extrapolando
      ? `<div class="alert-resultado info mb-2">
           ⚠ x = ${xEval} está fuera del rango de datos
           [${SimNum.redondear(xs[0], 4)}, ${SimNum.redondear(xs[xs.length - 1], 4)}].
           Está <strong>extrapolando</strong> — el resultado puede no ser confiable.
         </div>`
      : '';

    let html = `
      ${rungeAviso}
      ${extraAviso}
      <div class="alert-resultado success mb-3">
        <strong>${nombre}</strong> — interpolado con ${puntos.length} punto${puntos.length > 1 ? 's' : ''}.
      </div>`;

    // Conclusión automática para Escenario C (Detección por los 6 puntos de Papa)
    if (puntos.length === 6 && 
        puntos[0].x === 1 && puntos[0].y === 8 && 
        puntos[5].x === 30 && puntos[5].y === 22) {
      
      let mensajeConfiabilidad = metodo === 'spline' ? 
        'observándose que los Splines Cúbicos generan una representación más estable y realista del comportamiento del mercado.' : 
        'sin embargo, se recomienda el uso de Splines Cúbicos para evitar oscilaciones (fenómeno de Runge).';

      html += `
        <div class="alert alert-success mb-3 p-3 border-0 shadow-sm" style="background-color: #f8f9fa;">
          <h6 class="fw-bold text-success mb-2">Conclusión Automática (Escenario C)</h6>
          <p class="mb-0 small text-muted">
            El precio de la papa mostró una tendencia ascendente durante el mes, pasando de 8 Bs/kg a 22 Bs/kg. 
            Mediante interpolación fue posible estimar precios en días sin información, ${mensajeConfiabilidad}
          </p>
        </div>
      `;
    }

    html += `
      <div class="row g-2 mb-3">
        <div class="col-6">
          <div class="card border-0 bg-light p-2 text-center">
            <div class="small text-muted mb-1">Día evaluado (x)</div>
            <div class="fw-bold text-primary" style="font-size:1.1rem">${xEval}</div>
          </div>
        </div>
        <div class="col-6">
          <div class="card border-0 bg-light p-2 text-center">
            <div class="small text-muted mb-1">Precio estimado P(x)</div>
            <div class="fw-bold text-success" style="font-size:1.1rem">${valorStr} Bs</div>
          </div>
        </div>
      </div>`;

    // Tabla de coeficientes de Newton (diferencias divididas)
    if (metodo === 'newton' && coefs?.length) {
      const headers = ['Orden k', 'Nodo xₖ', 'Coeficiente f[x₀,…,xₖ]'];
      const rows    = coefs.map((c, k) => [
        k,
        SimNum.redondear(xs[k], 6),
        SimNum.redondear(c, 8),
      ]);
      html += `<h6 class="fw-semibold mt-2 mb-1 small">Tabla de diferencias divididas</h6>`;
      html += SimNum.generarTablaHTML(headers, rows, 20);
    }

    contenedor.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     GRÁFICO
     ══════════════════════════════════════════════ */
  function dibujarGrafico(puntos, xEval, yEval, curvaFn) {
    const canvas = SimNum.prepararCanvas('interpolacion-chart');
    if (!canvas) return;

    const xs     = puntos.map(p => p.x);
    const xMin   = xs[0];
    const xMax   = xs[xs.length - 1];
    const span   = (xMax - xMin) || 1;
    const margen = span * 0.08;
    const plotA  = xMin - margen;
    const plotB  = xMax + margen;
    const nPts   = 300;
    const paso   = (plotB - plotA) / nPts;

    // Curva densa del polinomio / spline
    const curvaData = [];
    for (let i = 0; i <= nPts; i++) {
      const x = plotA + i * paso;
      let y;
      try { y = curvaFn(x); } catch { y = null; }
      curvaData.push({
        x: SimNum.redondear(x, 5),
        y: isFinite(y) ? SimNum.redondear(y, 5) : null,
      });
    }

    const datasets = [
      {
        label: 'Curva interpolada',
        data: curvaData,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.06)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.1,
        parsing: false,
      },
      {
        label: 'Datos originales',
        data: puntos.map(p => ({ x: p.x, y: p.y })),
        borderColor: '#198754',
        backgroundColor: '#198754',
        pointRadius: 6,
        showLine: false,
        parsing: false,
        type: 'scatter',
      },
    ];

    // Punto estimado (triangulo rojo)
    if (isFinite(yEval)) {
      datasets.push({
        label: `P(${xEval}) ≈ ${SimNum.redondear(yEval, 4)} Bs`,
        data: [{ x: xEval, y: yEval }],
        borderColor: '#dc3545',
        backgroundColor: '#dc3545',
        pointRadius: 9,
        pointStyle: 'triangle',
        showLine: false,
        parsing: false,
        type: 'scatter',
      });
    }

    new Chart(canvas, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx =>
                `(${SimNum.redondear(ctx.parsed.x, 4)},  ${SimNum.redondear(ctx.parsed.y, 4)} Bs)`,
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Día' },
            ticks: { maxTicksLimit: 10, font: { size: 10 } },
          },
          y: {
            title: { display: true, text: 'Precio (Bs)' },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  }

  function dibujarGraficoEjemplo() {
    const canvas = SimNum.prepararCanvas('interpolacion-chart');
    if (!canvas) return;
    new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [{ label: 'Ingrese puntos y presione "Interpolar"', data: [] }],
      },
      options: {
        responsive: true,
        scales: { x: { type: 'linear' } },
      },
    });
  }

  /* ══════════════════════════════════════════════
     EJEMPLO CONTEXTUALIZADO — Escenario C
     ══════════════════════════════════════════════
     Precio de un producto básico (arroz, 1 kg) durante
     28 días de crisis de abastecimiento.
     La curva sube de forma creciente y acelerada.
     Fuente: datos sintéticos ilustrativos.
  */
  function cargarEjemploPrecios() {
    const datos = [
      { x: 1,  y: 8 },
      { x: 5,  y: 10 },
      { x: 10, y: 13 },
      { x: 15, y: 16 },
      { x: 20, y: 19 },
      { x: 30, y: 22 },
    ];

    const tbody = document.getElementById('interp-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    datos.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="number" class="form-control form-control-sm" value="${p.x}" step="any" /></td>
        <td><input type="number" class="form-control form-control-sm" value="${p.y}" step="any" /></td>`;
      tbody.appendChild(tr);
    });

    const xEvalEl  = document.getElementById('interp-xeval');
    if (xEvalEl) xEvalEl.value = '12';

    const methodEl = document.getElementById('interp-method');
    if (methodEl) methodEl.value = 'spline';

    // Dibujar curva inmediatamente al cargar el ejemplo
    interpolar();
  }

  /* ══════════════════════════════════════════════
     GESTIÓN DINÁMICA DE LA TABLA
     ══════════════════════════════════════════════ */
  function agregarPunto() {
    const tbody = document.getElementById('interp-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" class="form-control form-control-sm" value="0" step="any" /></td>
      <td><input type="number" class="form-control form-control-sm" value="0" step="any" /></td>`;
    tbody.appendChild(tr);
  }

  function quitarPunto() {
    const tbody = document.getElementById('interp-tbody');
    if (!tbody || tbody.rows.length <= 2) return; // mínimo 2 puntos
    tbody.removeChild(tbody.lastElementChild);
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('interp-resultado');
    dibujarGraficoEjemplo();
  }

  /* ── API pública ─────────────────────────────── */
  return { init, interpolar, agregarPunto, quitarPunto, limpiar, cargarEjemploPrecios };
})();
