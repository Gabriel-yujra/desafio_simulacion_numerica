/**
 * sistemas_lineales.js
 *
 * Módulo: Sistemas de ecuaciones lineales
 * Contexto: Escenario A — Optimización del abastecimiento y red de transporte.
 *           Escenario F (opcional) — Sensibilidad a perturbaciones (sistema de Hilbert).
 *
 * Métodos implementados:
 *  - LU           Factorización directa (sin pivoteo)
 *  - Jacobi       Iterativo clásico; útil para sistemas diagonalmente dominantes
 *  - Gauss-Seidel Iterativo; converge más rápido que Jacobi al reutilizar valores
 *  - SOR          Sobre-relajación sucesiva; ω > 1 acelera Gauss-Seidel
 *  - Gradiente Conjugado  Para matrices simétricas definidas positivas
 */

console.log('[SimNum] Módulo SistemasLineales cargado correctamente.');

const SistemasLineales = (function () {

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    const selectSize   = document.getElementById('sl-size');
    const selectMethod = document.getElementById('sl-method');

    if (selectSize)   { selectSize.addEventListener('change', generarMatrizUI); generarMatrizUI(); }
    if (selectMethod) { selectMethod.addEventListener('change', toggleOmega);   toggleOmega(); }
  }

  /* ──────────────────────────────────────────────
     UI — mostrar/ocultar campo ω (solo para SOR)
     ────────────────────────────────────────────── */
  function toggleOmega() {
    const metodo = document.getElementById('sl-method')?.value;
    const div    = document.getElementById('sl-omega-container');
    if (div) div.style.display = (metodo === 'sor') ? '' : 'none';
  }

  /* ══════════════════════════════════════════════
     GENERACIÓN DINÁMICA DE LA MATRIZ
     ══════════════════════════════════════════════ */
  function generarMatrizUI() {
    const n         = parseInt(document.getElementById('sl-size')?.value || '3');
    const container = document.getElementById('sl-matrix-container');
    if (!container) return;

    const ejemplos = {
      2: { A: [[4,1],[2,3]],                                                   b: [9,8] },
      3: { A: [[10,2,1],[1,5,1],[2,3,10]],                                     b: [7,-8,6] },
      4: { A: [[10,1,1,1],[1,10,1,1],[1,1,10,1],[1,1,1,10]],                  b: [13,13,13,13] },
      5: { A: [[12,1,0,0,1],[1,10,2,0,0],[0,2,8,1,0],[0,0,1,9,2],[1,0,0,2,11]], b: [14,13,11,12,14] },
    };
    const ej = ejemplos[n] || ejemplos[3];

    let html = `
      <div class="table-responsive">
        <table class="table table-sm table-bordered mb-0" id="sl-tabla-matriz">
          <thead class="table-primary">
            <tr>
              ${Array.from({ length: n }, (_, j) => `<th class="text-center">x<sub>${j + 1}</sub></th>`).join('')}
              <th class="text-center text-warning">b</th>
            </tr>
          </thead>
          <tbody>`;

    for (let i = 0; i < n; i++) {
      html += '<tr>';
      for (let j = 0; j < n; j++) {
        html += `<td><input type="number" class="form-control form-control-sm sl-a"
                   data-row="${i}" data-col="${j}" value="${ej.A[i][j]}" step="any" /></td>`;
      }
      html += `<td><input type="number" class="form-control form-control-sm sl-b"
                   data-row="${i}" value="${ej.b[i]}" step="any" /></td>`;
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     CARGAR EJEMPLOS
     ══════════════════════════════════════════════ */
  function cargarEjemploAbastecimiento() {
    // 3×3 diagonalmente dominante — modela sistema reducido del Escenario A
    const A = [
      [10, 2,  1],
      [ 1, 12, 2],
      [ 2, 1, 15]
    ];
    const b = [7000, 11000, 12000];
    _cambiarTamanoYCargar(3, A, b);
  }

  function cargarEjemploMalCondicionado() {
    // Matriz de Hilbert 3×3 — clásico ejemplo mal condicionado (Escenario F)
    // H_ij = 1/(i+j-1); pequeños cambios en b producen cambios enormes en x
    const A = [
      [1,     1/2,  1/3],
      [1/2,   1/3,  1/4],
      [1/3,   1/4,  1/5],
    ];
    const b = [1, 1, 1];
    _cambiarTamanoYCargar(3, A, b);
  }

  function _cambiarTamanoYCargar(n, A, b) {
    const sizeEl = document.getElementById('sl-size');
    if (sizeEl) { sizeEl.value = String(n); generarMatrizUI(); }
    // Pequeño delay para que el DOM termine de regenerarse antes de escribir valores
    setTimeout(() => {
      document.querySelectorAll('.sl-a').forEach(inp => {
        inp.value = A[parseInt(inp.dataset.row)][parseInt(inp.dataset.col)];
      });
      document.querySelectorAll('.sl-b').forEach(inp => {
        inp.value = b[parseInt(inp.dataset.row)];
      });
    }, 20);
  }

  /* ══════════════════════════════════════════════
     LEER DATOS DESDE EL DOM
     ══════════════════════════════════════════════ */
  function leerDatosUI() {
    const n       = parseInt(document.getElementById('sl-size')?.value || '3');
    const inputsA = document.querySelectorAll('.sl-a');
    const inputsB = document.querySelectorAll('.sl-b');

    if (inputsA.length !== n * n) {
      SimNum.mostrarMensaje('sl-resultado', 'Regenere la matriz antes de resolver.', 'error');
      return null;
    }

    const A = Array.from({ length: n }, () => Array(n).fill(0));
    const b = Array(n).fill(0);

    inputsA.forEach(inp => {
      A[parseInt(inp.dataset.row)][parseInt(inp.dataset.col)] = parseFloat(inp.value) || 0;
    });
    inputsB.forEach(inp => {
      b[parseInt(inp.dataset.row)] = parseFloat(inp.value) || 0;
    });

    return { A, b, n };
  }

  /* ══════════════════════════════════════════════
     UTILIDADES NUMÉRICAS
     ══════════════════════════════════════════════ */

  /** Norma euclídea (norma 2) del residuo Ax − b */
  function computeResidual(A, x, b) {
    let sum = 0;
    for (let i = 0; i < b.length; i++) {
      let ax = 0;
      for (let j = 0; j < b.length; j++) ax += A[i][j] * x[j];
      const r = ax - b[i];
      sum += r * r;
    }
    return Math.sqrt(sum);
  }

  /** Dominancia diagonal estricta por filas: |a_ii| > Σ_{j≠i} |a_ij| */
  function isDiagonallyDominant(A) {
    for (let i = 0; i < A.length; i++) {
      let suma = 0;
      for (let j = 0; j < A.length; j++) if (j !== i) suma += Math.abs(A[i][j]);
      if (Math.abs(A[i][i]) <= suma) return false;
    }
    return true;
  }

  /** Producto matriz × vector */
  function matvec(A, x) {
    return A.map(fila => fila.reduce((s, a, j) => s + a * x[j], 0));
  }

  /** Producto punto de dos vectores */
  function dot(u, v) {
    return u.reduce((s, ui, i) => s + ui * v[i], 0);
  }

  /* ══════════════════════════════════════════════
     MÉTODO LU — FACTORIZACIÓN DIRECTA
     Ventaja : solución exacta en una sola pasada.
     Limitación: sin pivoteo puede fallar si hay ceros en la diagonal.
     ══════════════════════════════════════════════ */
  function descomponerLU(A) {
    const n = A.length;
    const U = A.map(f => [...f]);
    const L = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );

    for (let k = 0; k < n; k++) {
      if (Math.abs(U[k][k]) < 1e-15)
        throw new Error(`Pivote nulo en fila ${k + 1}. El sistema puede ser singular.`);

      for (let i = k + 1; i < n; i++) {
        L[i][k] = U[i][k] / U[k][k];
        for (let j = k; j < n; j++) U[i][j] -= L[i][k] * U[k][j];
      }
    }
    return { L, U };
  }

  /** Sustitución hacia adelante: Ly = b */
  function sustitucionAdelante(L, b) {
    const n = b.length;
    const y = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < i; j++) sum += L[i][j] * y[j];
      y[i] = (b[i] - sum) / L[i][i];
    }
    return y;
  }

  /** Sustitución hacia atrás: Ux = y */
  function sustitucionAtras(U, y) {
    const n = y.length;
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) sum += U[i][j] * x[j];
      x[i] = (y[i] - sum) / U[i][i];
    }
    return x;
  }

  function resolverLU(A, b) {
    const { L, U } = descomponerLU(A);
    const y = sustitucionAdelante(L, b);
    const x = sustitucionAtras(U, y);
    const residual = computeResidual(A, x, b);
    return {
      x,
      convergio: true,
      iteraciones: 0,
      residualFinal: residual,
      history: [],
      mensaje: `Factorización LU completada. ||Ax − b|| = ${SimNum.redondear(residual, 10)}`,
    };
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE JACOBI
     Cuándo usar : sistemas diagonalmente dominantes.
     x_i^(k+1) = (b_i − Σ_{j≠i} a_ij·x_j^(k)) / a_ii
     Todos los x^(k) se usan del paso anterior (paralelizable).
     ══════════════════════════════════════════════ */
  function resolverJacobi(A, b, tol, maxIter) {
    const n = b.length;
    let x = Array(n).fill(0);
    const history = [];

    for (let k = 0; k < maxIter; k++) {
      const xNuevo = Array(n).fill(0);

      for (let i = 0; i < n; i++) {
        let suma = 0;
        for (let j = 0; j < n; j++) if (j !== i) suma += A[i][j] * x[j];
        xNuevo[i] = (b[i] - suma) / A[i][i];
      }

      const residual = computeResidual(A, xNuevo, b);
      history.push({ iter: k + 1, valores: xNuevo.map(v => SimNum.redondear(v, 6)), residual: SimNum.redondear(residual, 8) });
      x = xNuevo;

      if (residual < tol) {
        return { x, convergio: true, iteraciones: k + 1, residualFinal: residual, history,
          mensaje: `Jacobi convergió en ${k + 1} iteraciones (tol = ${tol}).` };
      }
    }

    return { x, convergio: false, iteraciones: maxIter, residualFinal: computeResidual(A, x, b), history,
      mensaje: `Jacobi no convergió en ${maxIter} iteraciones.` };
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE GAUSS-SEIDEL
     Cuándo usar : sistemas diagonalmente dominantes.
     Diferencia con Jacobi: usa los x_j ya actualizados
     en la misma iteración (j < i), lo que suele duplicar
     la velocidad de convergencia.
     ══════════════════════════════════════════════ */
  function resolverGaussSeidel(A, b, tol, maxIter) {
    const n = b.length;
    const x = Array(n).fill(0);
    const history = [];

    for (let k = 0; k < maxIter; k++) {
      for (let i = 0; i < n; i++) {
        let suma = 0;
        for (let j = 0; j < n; j++) if (j !== i) suma += A[i][j] * x[j]; // x ya actualizado para j<i
        x[i] = (b[i] - suma) / A[i][i];
      }

      const residual = computeResidual(A, x, b);
      history.push({ iter: k + 1, valores: x.map(v => SimNum.redondear(v, 6)), residual: SimNum.redondear(residual, 8) });

      if (residual < tol) {
        return { x: [...x], convergio: true, iteraciones: k + 1, residualFinal: residual, history,
          mensaje: `Gauss-Seidel convergió en ${k + 1} iteraciones (tol = ${tol}).` };
      }
    }

    return { x: [...x], convergio: false, iteraciones: maxIter, residualFinal: computeResidual(A, x, b), history,
      mensaje: `Gauss-Seidel no convergió en ${maxIter} iteraciones.` };
  }

  /* ══════════════════════════════════════════════
     MÉTODO SOR (Successive Over-Relaxation)
     Cuándo usar : cuando se conoce un ω óptimo.
     ω = 1  → equivale a Gauss-Seidel.
     ω ∈ (1,2) → sobre-relajación, acelera convergencia.
     ω ∈ (0,1) → sub-relajación, estabiliza sistemas difíciles.
     x_i^(k+1) = (1−ω)·x_i^(k) + ω·x_i^(GS)
     ══════════════════════════════════════════════ */
  function resolverSOR(A, b, omega, tol, maxIter) {
    const n = b.length;
    const x = Array(n).fill(0);
    const history = [];

    for (let k = 0; k < maxIter; k++) {
      for (let i = 0; i < n; i++) {
        let suma = 0;
        for (let j = 0; j < n; j++) if (j !== i) suma += A[i][j] * x[j];
        const xGS = (b[i] - suma) / A[i][i];
        x[i] = (1 - omega) * x[i] + omega * xGS;
      }

      const residual = computeResidual(A, x, b);
      history.push({ iter: k + 1, valores: x.map(v => SimNum.redondear(v, 6)), residual: SimNum.redondear(residual, 8) });

      if (residual < tol) {
        return { x: [...x], convergio: true, iteraciones: k + 1, residualFinal: residual, history,
          mensaje: `SOR (ω = ${omega}) convergió en ${k + 1} iteraciones (tol = ${tol}).` };
      }
    }

    return { x: [...x], convergio: false, iteraciones: maxIter, residualFinal: computeResidual(A, x, b), history,
      mensaje: `SOR (ω = ${omega}) no convergió en ${maxIter} iteraciones.` };
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE GRADIENTE CONJUGADO
     Cuándo usar : matrices simétricas definidas positivas.
     Converge en ≤ n iteraciones en aritmética exacta.
     Muy eficiente para sistemas grandes y dispersos.
     ══════════════════════════════════════════════ */
  function resolverGradienteConjugado(A, b, tol, maxIter) {
    const n  = b.length;
    const x  = Array(n).fill(0);
    let r    = b.map((bi, i) => bi - dot(A[i], x)); // r0 = b − A·x0 = b
    let p    = [...r];
    let rDotR = dot(r, r);
    const history = [];

    for (let k = 0; k < maxIter; k++) {
      const Ap  = matvec(A, p);
      const pAp = dot(p, Ap);
      if (Math.abs(pAp) < 1e-15) break;             // dirección colapsa → parar

      const alpha = rDotR / pAp;

      // x_{k+1} = x_k + α·p_k
      for (let i = 0; i < n; i++) x[i] += alpha * p[i];

      // r_{k+1} = r_k − α·A·p_k
      for (let i = 0; i < n; i++) r[i] -= alpha * Ap[i];

      const rDotRNuevo = dot(r, r);
      const residual   = Math.sqrt(rDotRNuevo);

      history.push({ iter: k + 1, valores: x.map(v => SimNum.redondear(v, 6)), residual: SimNum.redondear(residual, 8) });

      if (residual < tol) {
        return { x: [...x], convergio: true, iteraciones: k + 1, residualFinal: residual, history,
          mensaje: `Gradiente Conjugado convergió en ${k + 1} iteraciones (tol = ${tol}).` };
      }

      const beta = rDotRNuevo / rDotR;
      for (let i = 0; i < n; i++) p[i] = r[i] + beta * p[i]; // p_{k+1} = r_{k+1} + β·p_k
      rDotR = rDotRNuevo;
    }

    const residualFinal = computeResidual(A, x, b);
    return { x: [...x], convergio: false, iteraciones: maxIter, residualFinal, history,
      mensaje: `Gradiente Conjugado no convergió en ${maxIter} iteraciones.` };
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function resolver() {
    const datos = leerDatosUI();
    if (!datos) return;

    const { A, b, n } = datos;
    const tol     = parseFloat(document.getElementById('sl-tol')?.value)    || 1e-6;
    const maxIter = parseInt(document.getElementById('sl-maxiter')?.value)   || 100;
    const metodo  = document.getElementById('sl-method')?.value             || 'jacobi';
    const omega   = parseFloat(document.getElementById('sl-omega')?.value)   || 1.2;

    for (let i = 0; i < n; i++) {
      if (A[i][i] === 0) {
        SimNum.mostrarMensaje('sl-resultado',
          `Error: elemento diagonal A[${i+1}][${i+1}] = 0. Reordene las ecuaciones.`, 'error');
        return;
      }
    }

    const esDD = isDiagonallyDominant(A);

    let resultado;
    try {
      switch (metodo) {
        case 'lu':                   resultado = resolverLU(A, b);                               break;
        case 'jacobi':               resultado = resolverJacobi(A, b, tol, maxIter);            break;
        case 'gauss-seidel':         resultado = resolverGaussSeidel(A, b, tol, maxIter);       break;
        case 'sor':                  resultado = resolverSOR(A, b, omega, tol, maxIter);        break;
        case 'gradiente-conjugado':  resultado = resolverGradienteConjugado(A, b, tol, maxIter); break;
        default:                     resultado = resolverJacobi(A, b, tol, maxIter);
      }
    } catch (err) {
      SimNum.mostrarMensaje('sl-resultado', `Error: ${err.message}`, 'error');
      return;
    }

    mostrarResultados(resultado, A, n, metodo, esDD);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO
     ══════════════════════════════════════════════ */
  function mostrarResultados(resultado, A, n, metodo, esDD) {
    const contenedor       = document.getElementById('sl-resultado');
    const tablaContenedor  = document.getElementById('sl-tabla-iteraciones');
    if (!contenedor) return;

    const nombres = {
      'lu':                  'LU (Factorización directa)',
      'jacobi':              'Jacobi',
      'gauss-seidel':        'Gauss-Seidel',
      'sor':                 'SOR',
      'gradiente-conjugado': 'Gradiente Conjugado',
    };
    const nombre = nombres[metodo] || metodo;
    const tipo   = resultado.convergio ? 'success' : 'info';

    const getContextoVar = (i, dim) => {
      const contexto = {
        2: ['Flujo Planta → Zona A', 'Flujo Planta → Zona B'],
        3: ['Flujo a Zona A', 'Flujo a Zona B', 'Flujo a Zona C'],
        4: ['Planta → Nodo 1', 'Planta → Nodo 2', 'Nodo 1 → Zona A', 'Nodo 2 → Zona B'],
        5: ['Planta 1 → Nodo A', 'Planta 2 → Nodo B', 'Nodo A → Sur', 'Nodo B → Norte', 'Reserva → Centro']
      };
      return (contexto[dim] && contexto[dim][i]) ? ` <span class="text-muted small">(${contexto[dim][i]})</span>` : '';
    };

    const xStr = resultado.x.map((v, i) =>
      `<strong>x<sub>${i + 1}</sub></strong> = ${SimNum.redondear(v, 6)}${getContextoVar(i, n)}`
    ).join('<br/>');

    let advertencia = '';
    if (!esDD && ['jacobi', 'gauss-seidel', 'sor'].includes(metodo)) {
      advertencia = `<div class="alert-resultado info mb-2">
        ⚠ La matriz no es diagonalmente dominante. Los métodos iterativos
        pueden divergir. Verifique el reordenamiento de ecuaciones.
      </div>`;
    }

    contenedor.innerHTML = `
      ${advertencia}
      <div class="alert-resultado ${tipo} mb-2">
        <strong>${nombre}</strong> — ${resultado.mensaje}
      </div>
      <p class="mb-1"><strong>Solución:</strong> ${xStr}</p>
      <p class="mb-1 small text-muted">
        ||Ax − b|| = ${SimNum.redondear(resultado.residualFinal, 10)}
        &nbsp;·&nbsp; ${_condInfo(A)}
      </p>`;

    if (tablaContenedor) {
      if (!resultado.history?.length) {
        tablaContenedor.innerHTML = '';
      } else {
        const headers = ['Iter.', ...Array.from({ length: n }, (_, i) => `x${i + 1}`), '||Residuo||'];
        const rows = resultado.history.map(it => [it.iter, ...it.valores, it.residual]);
        tablaContenedor.innerHTML =
          `<h6 class="mt-3 mb-2 fw-semibold">Tabla de iteraciones</h6>` +
          SimNum.generarTablaHTML(headers, rows, 50);
      }
    }

    dibujarGrafico(resultado.history, resultado.x, n);
  }

  /** Indicador heurístico de condicionamiento (informativo, no es número de condición exacto) */
  function _condInfo(A) {
    const n = A.length;
    let diag = 0, offDiag = 0;
    for (let i = 0; i < n; i++) {
      diag    += Math.abs(A[i][i]);
      for (let j = 0; j < n; j++) if (j !== i) offDiag += Math.abs(A[i][j]);
    }
    const r = offDiag / diag;
    if (r < 0.3) return 'Sistema <strong class="text-success">bien condicionado</strong>.';
    if (r < 0.8) return 'Condicionamiento <strong class="text-warning">moderado</strong>.';
    return 'Sistema posiblemente <strong class="text-danger">mal condicionado</strong> — resultados sensibles a perturbaciones.';
  }

  /* ══════════════════════════════════════════════
     GRÁFICO
     Métodos iterativos → residuo vs iteración (log₁₀)
     LU directo         → barras con la solución x
     ══════════════════════════════════════════════ */
  function dibujarGrafico(history, xSol, n) {
    const canvas = SimNum.prepararCanvas('sl-chart');
    if (!canvas) return;

    if (!history || history.length === 0) {
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: xSol.map((_, i) => `x${i + 1}`),
          datasets: [{
            label: 'Solución x (LU)',
            data: xSol.map(v => SimNum.redondear(v, 6)),
            backgroundColor: 'rgba(13,110,253,0.6)',
            borderColor: '#0d6efd',
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
          scales: {
            x: { title: { display: true, text: 'Variable' } },
            y: { title: { display: true, text: 'Valor' } },
          },
        },
      });
      return;
    }

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: history.map(h => h.iter),
        datasets: [{
          label: 'log₁₀(||Residuo||)',
          data: history.map(h => h.residual > 0 ? SimNum.redondear(Math.log10(h.residual), 4) : null),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220,53,69,0.08)',
          borderWidth: 2,
          pointRadius: history.length > 50 ? 0 : 3,
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const logVal = ctx.parsed.y;
                const real   = Math.pow(10, logVal);
                return `log₁₀(||r||) = ${logVal?.toFixed(4)}  →  ||r|| ≈ ${real?.toExponential(2)}`;
              },
            },
          },
        },
        scales: {
          x: { title: { display: true, text: 'Iteración' },           ticks: { font: { size: 10 } } },
          y: { title: { display: true, text: 'log₁₀(||Residuo||)' },  ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('sl-resultado');
    const tabla = document.getElementById('sl-tabla-iteraciones');
    if (tabla) tabla.innerHTML = '';
    const canvas = SimNum.prepararCanvas('sl-chart');
    if (canvas) {
      new Chart(canvas, {
        type: 'line',
        data: { datasets: [{ label: 'Residuo — resuelva el sistema para ver la convergencia', data: [] }] },
        options: { responsive: true },
      });
    }
  }

  /* ── API pública ─────────────────────────────── */
  return { init, resolver, limpiar, cargarEjemploAbastecimiento, cargarEjemploMalCondicionado };
})();
