/**
 * raices.js
 *
 * Módulo: Raíces de ecuaciones
 * Contexto: Umbrales críticos de precio y puntos de equilibrio
 *            en el mercado de bienes básicos.
 *
 * Métodos implementados:
 *  - Bisección       : garantiza convergencia si f(a)·f(b) < 0; lento (lineal en bits).
 *  - Newton-Raphson  : convergencia cuadrática; requiere buena x₀ y f'(x) ≠ 0.
 *  - Secante         : orden ≈ 1.618; no requiere derivada analítica; usa dos puntos.
 */

console.log('[SimNum] Módulo Raices cargado correctamente.');

const Raices = (function () {

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    const sel = document.getElementById('r-method');
    if (sel) {
      sel.addEventListener('change', _actualizarParametros);
      _actualizarParametros(); // estado inicial correcto
    }
    dibujarGraficoEjemplo();
  }

  /**
   * Muestra u oculta campos del formulario según el método seleccionado.
   * Bisección  → a y b visibles; derivada oculta.
   * Newton     → solo x₀; campo de derivada visible (opcional).
   * Secante    → x₀ y x₁; derivada oculta.
   */
  function _actualizarParametros() {
    const metodo    = document.getElementById('r-method')?.value;
    const bCont     = document.getElementById('r-b-container');
    const derivCont = document.getElementById('r-derivada-container');
    const labelA    = document.getElementById('r-label-a');
    const labelB    = document.getElementById('r-label-b');
    if (!metodo) return;

    if (metodo === 'biseccion') {
      if (bCont)     bCont.style.display     = '';
      if (derivCont) derivCont.style.display = 'none';
      if (labelA)    labelA.textContent      = 'Extremo a';
      if (labelB)    labelB.textContent      = 'Extremo b';
    } else if (metodo === 'newton') {
      if (bCont)     bCont.style.display     = 'none';
      if (derivCont) derivCont.style.display = '';
      if (labelA)    labelA.textContent      = 'Punto inicial x₀';
    } else { // secante
      if (bCont)     bCont.style.display     = '';
      if (derivCont) derivCont.style.display = 'none';
      if (labelA)    labelA.textContent      = 'Primer punto x₀';
      if (labelB)    labelB.textContent      = 'Segundo punto x₁';
    }
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE BISECCIÓN
     ══════════════════════════════════════════════
     Divide el intervalo [a,b] por la mitad en cada paso.
     El nuevo subintervalo es el que contiene el cambio de signo.
     Parada: ancho del intervalo o |f(xₘ)| < tol.
  */
  function biseccion(f, a, b, tol, maxIter) {
    const fa = f(a), fb = f(b);

    if (fa * fb > 0) {
      return {
        raiz: null, convergio: false, iteraciones: 0, history: [],
        mensaje: `f(a) = ${SimNum.redondear(fa, 6)} y f(b) = ${SimNum.redondear(fb, 6)} tienen el mismo signo. No se garantiza raíz en [${a}, ${b}].`,
      };
    }

    if (Math.abs(fa) < tol) return { raiz: a, convergio: true, iteraciones: 0, history: [], mensaje: `f(a) ≈ 0. Raíz = ${a}` };
    if (Math.abs(fb) < tol) return { raiz: b, convergio: true, iteraciones: 0, history: [], mensaje: `f(b) ≈ 0. Raíz = ${b}` };

    let lo = a, hi = b;
    const history = [];

    for (let k = 1; k <= maxIter; k++) {
      const xm    = (lo + hi) / 2;
      const fxm   = f(xm);
      const error = (hi - lo) / 2;

      history.push({
        n:     k,
        a:     SimNum.redondear(lo,    8),
        b:     SimNum.redondear(hi,    8),
        xm:    SimNum.redondear(xm,    8),
        fxm:   SimNum.redondear(fxm,   8),
        error: SimNum.redondear(error, 8),
      });

      if (Math.abs(fxm) < tol || error < tol) {
        return { raiz: xm, convergio: true, iteraciones: k, history,
          mensaje: `Convergió en ${k} iteración${k > 1 ? 'es' : ''}.` };
      }

      if (f(lo) * fxm < 0) hi = xm; else lo = xm;
    }

    const xm = (lo + hi) / 2;
    return { raiz: xm, convergio: false, iteraciones: maxIter, history,
      mensaje: `Máximo de ${maxIter} iteraciones alcanzado. Error ≈ ${SimNum.redondear((hi - lo) / 2, 8)}.` };
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE NEWTON-RAPHSON
     ══════════════════════════════════════════════
     xₙ₊₁ = xₙ − f(xₙ) / f'(xₙ)
     f'(x) puede ser analítica (string) o numérica (diferencia centrada).
     Se aborta si |f'(xₙ)| < 1e-14 para evitar división por cero.
  */
  function newtonRaphson(f, fprime, x0, tol, maxIter) {
    let x = x0;
    const history = [];

    for (let k = 1; k <= maxIter; k++) {
      const fx  = f(x);
      const dfx = fprime(x);

      if (Math.abs(dfx) < 1e-14) {
        return { raiz: x, convergio: false, iteraciones: k, history,
          mensaje: `f'(x) ≈ 0 en x = ${SimNum.redondear(x, 8)}. Método detenido (división por cero).` };
      }

      const xNew  = x - fx / dfx;
      const error = Math.abs(xNew - x);

      history.push({
        n:     k,
        x:     SimNum.redondear(x,     8),
        fx:    SimNum.redondear(fx,    8),
        dfx:   SimNum.redondear(dfx,   8),
        error: SimNum.redondear(error, 8),
      });

      x = xNew;

      if (error < tol && Math.abs(f(x)) < tol) {
        return { raiz: x, convergio: true, iteraciones: k, history,
          mensaje: `Convergió en ${k} iteración${k > 1 ? 'es' : ''}.` };
      }
    }

    return { raiz: x, convergio: false, iteraciones: maxIter, history,
      mensaje: `Máximo de ${maxIter} iteraciones alcanzado.` };
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE LA SECANTE
     ══════════════════════════════════════════════
     xₙ₊₁ = xₙ − f(xₙ)·(xₙ − xₙ₋₁) / (f(xₙ) − f(xₙ₋₁))
     Orden de convergencia ≈ 1.618. No requiere derivada analítica.
  */
  function secante(f, x0, x1, tol, maxIter) {
    let xPrev = x0, xCurr = x1;
    const history = [];

    for (let k = 1; k <= maxIter; k++) {
      const fPrev = f(xPrev);
      const fCurr = f(xCurr);
      const denom = fCurr - fPrev;

      if (Math.abs(denom) < 1e-14) {
        return { raiz: xCurr, convergio: false, iteraciones: k, history,
          mensaje: `f(xₙ) − f(xₙ₋₁) ≈ 0. División por cero evitada.` };
      }

      const xNext = xCurr - fCurr * (xCurr - xPrev) / denom;
      const error = Math.abs(xNext - xCurr);

      history.push({
        n:      k,
        xPrev:  SimNum.redondear(xPrev,  8),
        xCurr:  SimNum.redondear(xCurr,  8),
        fxCurr: SimNum.redondear(fCurr,  8),
        error:  SimNum.redondear(error,  8),
      });

      xPrev = xCurr;
      xCurr = xNext;

      if (error < tol && Math.abs(f(xCurr)) < tol) {
        return { raiz: xCurr, convergio: true, iteraciones: k, history,
          mensaje: `Convergió en ${k} iteración${k > 1 ? 'es' : ''}.` };
      }
    }

    return { raiz: xCurr, convergio: false, iteraciones: maxIter, history,
      mensaje: `Máximo de ${maxIter} iteraciones alcanzado.` };
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function resolver() {
    const exprF   = document.getElementById('r-funcion')?.value?.trim();
    const exprDf  = document.getElementById('r-derivada')?.value?.trim();
    const a       = parseFloat(document.getElementById('r-a')?.value);
    const b       = parseFloat(document.getElementById('r-b')?.value);
    const tol     = parseFloat(document.getElementById('r-tol')?.value)   || 1e-6;
    const maxIter = parseInt(document.getElementById('r-maxiter')?.value) || 100;
    const metodo  = document.getElementById('r-method')?.value            || 'biseccion';

    if (!exprF) {
      SimNum.mostrarMensaje('raices-resultado', 'Ingrese una función f(x).', 'error');
      return;
    }
    if (isNaN(a)) {
      SimNum.mostrarMensaje('raices-resultado', 'El parámetro a / x₀ no es válido.', 'error');
      return;
    }
    if ((metodo === 'biseccion' || metodo === 'secante') && isNaN(b)) {
      SimNum.mostrarMensaje('raices-resultado', 'El parámetro b / x₁ no es válido.', 'error');
      return;
    }

    let f;
    try {
      f = (x) => SimNum.evaluarFuncion(exprF, x);
      f(a);
    } catch (e) {
      SimNum.mostrarMensaje('raices-resultado', `Error en f(x): ${e.message}`, 'error');
      return;
    }

    // Derivada analítica si se proporcionó; diferencias centradas si no.
    // f'(x) ≈ (f(x+h) − f(x−h)) / (2h), h = 1e-5
    let fprime;
    if (exprDf) {
      try {
        fprime = (x) => SimNum.evaluarFuncion(exprDf, x);
        fprime(a);
      } catch (e) {
        SimNum.mostrarMensaje('raices-resultado', `Error en f'(x): ${e.message}`, 'error');
        return;
      }
    } else {
      const h = 1e-5;
      fprime = (x) => (f(x + h) - f(x - h)) / (2 * h);
    }

    let resultado;
    switch (metodo) {
      case 'biseccion': resultado = biseccion(f, a, b, tol, maxIter);          break;
      case 'newton':    resultado = newtonRaphson(f, fprime, a, tol, maxIter); break;
      default:          resultado = secante(f, a, b, tol, maxIter);
    }

    // Rango del gráfico: para Newton, centrar en x₀ e incluir la raíz si se encontró
    let plotA = a, plotB = b;
    if (metodo === 'newton') {
      const root = resultado.raiz ?? a;
      const span = Math.max(5, Math.abs(root - a) * 1.5 + 2);
      plotA = Math.min(a, root) - span * 0.4;
      plotB = Math.max(a, root) + span * 0.4;
    }

    mostrarResultados(resultado, f, plotA, plotB, metodo);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO DE RESULTADOS
     ══════════════════════════════════════════════ */
  function mostrarResultados(resultado, f, a, b, metodo) {
    const nombres = { biseccion: 'Bisección', newton: 'Newton-Raphson', secante: 'Secante' };
    const nombre  = nombres[metodo] || metodo;

    const contenedor = document.getElementById('raices-resultado');
    if (!contenedor) return;

    const raizStr  = resultado.raiz !== null ? SimNum.redondear(resultado.raiz, 8) : '—';
    const fRaizStr = resultado.raiz !== null
      ? (() => { try { return SimNum.redondear(f(resultado.raiz), 8); } catch { return '—'; } })()
      : '—';
    const cls = resultado.convergio ? 'success' : (resultado.raiz === null ? 'error' : 'info');

    let html = `
      <div class="alert-resultado ${cls} mb-3">
        <strong>${nombre}</strong> — ${resultado.mensaje}
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6">
          <div class="card border-0 bg-light p-2 text-center">
            <div class="small text-muted mb-1">Raíz aproximada x*</div>
            <div class="fw-bold text-primary" style="font-size:1.1rem">${raizStr}</div>
          </div>
        </div>
        <div class="col-6">
          <div class="card border-0 bg-light p-2 text-center">
            <div class="small text-muted mb-1">f(x*) — verificación</div>
            <div class="fw-bold text-success" style="font-size:1.1rem">${fRaizStr}</div>
          </div>
        </div>
      </div>`;

    if (resultado.history?.length > 0) {
      let headers, rows;
      if (metodo === 'biseccion') {
        headers = ['n', 'a', 'b', 'xₘ = (a+b)/2', 'f(xₘ)', 'Error (b−a)/2'];
        rows    = resultado.history.map(it => [it.n, it.a, it.b, it.xm, it.fxm, it.error]);
      } else if (metodo === 'newton') {
        headers = ['n', 'xₙ', 'f(xₙ)', "f'(xₙ)", '|xₙ₊₁ − xₙ|'];
        rows    = resultado.history.map(it => [it.n, it.x, it.fx, it.dfx, it.error]);
      } else {
        headers = ['n', 'xₙ₋₁', 'xₙ', 'f(xₙ)', '|xₙ₊₁ − xₙ|'];
        rows    = resultado.history.map(it => [it.n, it.xPrev, it.xCurr, it.fxCurr, it.error]);
      }
      html += SimNum.generarTablaHTML(headers, rows, 60);
    }

    contenedor.innerHTML = html;
    dibujarGrafico(f, a, b, resultado.raiz, resultado.history, metodo);
  }

  /* ══════════════════════════════════════════════
     GRÁFICO
     ══════════════════════════════════════════════ */
  function dibujarGrafico(f, a, b, raiz, history, metodo) {
    const canvas = SimNum.prepararCanvas('raices-chart');
    if (!canvas) return;

    const margen = Math.max((b - a) * 0.12, 0.3);
    const x0 = a - margen, x1 = b + margen;
    const pasos = 250;
    const paso  = (x1 - x0) / pasos;

    // Curva continua f(x)
    const curvaData = [];
    for (let i = 0; i <= pasos; i++) {
      const x = x0 + i * paso;
      let y;
      try { y = f(x); } catch { y = null; }
      curvaData.push({ x: SimNum.redondear(x, 6), y: (isFinite(y) ? SimNum.redondear(y, 6) : null) });
    }

    const datasets = [
      {
        label: 'f(x)',
        data: curvaData,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.07)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.2,
        parsing: false,
      },
      {
        label: 'y = 0',
        data: [{ x: x0, y: 0 }, { x: x1, y: 0 }],
        borderColor: '#6c757d',
        borderWidth: 1,
        borderDash: [5, 4],
        pointRadius: 0,
        parsing: false,
      },
    ];

    // Puntos de iteración (máx. 20)
    if (history?.length > 0) {
      const iterPts = history.slice(0, 20).map(it => {
        const xi = metodo === 'biseccion' ? parseFloat(it.xm)
                 : metodo === 'newton'    ? parseFloat(it.x)
                 : parseFloat(it.xCurr);
        let yi;
        try { yi = SimNum.redondear(f(xi), 6); } catch { yi = 0; }
        return { x: xi, y: yi };
      });
      datasets.push({
        label: 'Iteraciones',
        data: iterPts,
        borderColor: '#fd7e14',
        backgroundColor: 'rgba(253,126,20,0.7)',
        pointRadius: 4,
        showLine: false,
        parsing: false,
        type: 'scatter',
      });
    }

    // Raíz marcada con una cruz
    if (raiz !== null) {
      datasets.push({
        label: `Raíz ≈ ${SimNum.redondear(raiz, 6)}`,
        data: [{ x: raiz, y: 0 }],
        borderColor: '#dc3545',
        backgroundColor: '#dc3545',
        pointRadius: 9,
        pointStyle: 'crossRot',
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
                `(${SimNum.redondear(ctx.parsed.x, 5)},  ${SimNum.redondear(ctx.parsed.y, 5)})`,
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'x' },
            ticks: { maxTicksLimit: 10, font: { size: 10 } },
          },
          y: {
            title: { display: true, text: 'f(x)' },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  }

  function dibujarGraficoEjemplo() {
    const canvas = SimNum.prepararCanvas('raices-chart');
    if (!canvas) return;
    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{ label: 'f(x) — configure los parámetros y presione "Encontrar raíz"', data: [] }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: { x: { type: 'linear' } },
      },
    });
  }

  /* ══════════════════════════════════════════════
     EJEMPLOS CONTEXTUALIZADOS
     ══════════════════════════════════════════════ */

  /**
   * Umbral costo/ingreso:
   *   f(x) = 1200 − 80x − 200·exp(0.1x)
   *   Excedente mensual: ingreso fijo menos gasto base y gasto con inflación exponencial.
   *   La raíz (x ≈ 8.95) es el mes en que el gasto supera el ingreso familiar.
   */
  function cargarEjemploUmbral() {
    _setVal('r-funcion',  '1200 - 80*x - 200*Math.exp(0.1*x)');
    _setVal('r-derivada', '-80 - 20*Math.exp(0.1*x)');
    _setVal('r-a',        '0');
    _setVal('r-b',        '15');
    _setVal('r-tol',      '0.000001');
    _setVal('r-maxiter',  '100');
    const sel = document.getElementById('r-method');
    if (sel) { sel.value = 'biseccion'; _actualizarParametros(); }
  }

  /**
   * Umbral de reposición crítica:
   *   f(x) = 500·exp(−0.2x) − 50·(x+1)
   *   Diferencia demanda−oferta: la demanda cae exponencialmente y la oferta crece
   *   linealmente. La raíz (x ≈ 3.82) es el punto de equilibrio del mercado.
   */
  function cargarEjemploReposicion() {
    _setVal('r-funcion',  '500*Math.exp(-0.2*x) - 50*(x+1)');
    _setVal('r-derivada', '-100*Math.exp(-0.2*x) - 50');
    _setVal('r-a',        '0');
    _setVal('r-b',        '10');
    _setVal('r-tol',      '0.000001');
    _setVal('r-maxiter',  '100');
    const sel = document.getElementById('r-method');
    if (sel) { sel.value = 'biseccion'; _actualizarParametros(); }
  }

  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('raices-resultado');
    dibujarGraficoEjemplo();
  }

  return { init, resolver, limpiar, cargarEjemploUmbral, cargarEjemploReposicion };
})();
