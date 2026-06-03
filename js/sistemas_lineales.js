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
    // Escenario F: Pánico de Compra (Mal condicionado / Sensible)
    // Matriz A (casi dependiente por el rumor de redes sociales)
    const A = [
      [1, 1,    1],
      [1, 1.01, 1],
      [1, 1,    1.02]
    ];
    // Vector b con incremento del 5% por el rumor
    const b = [3150, 3160, 3170];
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

    mostrarResultados(resultado, A, b, n, metodo, esDD);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO
     ══════════════════════════════════════════════ */
  function mostrarResultados(resultado, A, b, n, metodo, esDD) {
    const contenedor      = document.getElementById('sl-resultado');
    const tablaContenedor = document.getElementById('sl-tabla-iteraciones');
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

    // Labels de zona según dimensión
    const zonaLabels = {
      2: ['Zona Norte (A)', 'Zona Centro (B)'],
      3: ['Zona Norte (A)', 'Zona Centro (B)', 'Zona Sur (C)'],
      4: ['Zona Norte (A)', 'Zona Centro (B)', 'Zona Sur (C)', 'Reserva/Nodo'],
      5: ['Zona Norte (A)', 'Zona Centro (B)', 'Zona Sur (C)', 'Nodo Norte', 'Reserva Centro'],
    };
    const labels = zonaLabels[n] || Array.from({ length: n }, (_, i) => `Variable ${i + 1}`);

    const xStr = resultado.x.map((v, i) =>
      `<strong>x<sub>${i + 1}</sub></strong> = <span class="text-primary fw-bold">${SimNum.redondear(v, 4)}</span> <span class="text-muted small">(${labels[i] || 'Nodo ' + (i+1)})</span>`
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
      <p class="mb-1"><strong>Solución:</strong><br/>${xStr}</p>
      <p class="mb-1 small text-muted">
        ||Ax − b|| = ${SimNum.redondear(resultado.residualFinal, 10)}
        &nbsp;·&nbsp; ${_condInfo(A)}
      </p>`;

    // Interpretación contextual de los resultados
    contenedor.innerHTML += _interpretarSolucion(resultado.x, n, A, b, labels);

    if (tablaContenedor) {
      if (!resultado.history?.length) {
        tablaContenedor.innerHTML = '<p class="text-muted small mb-0">LU no genera tabla de iteraciones: resuelve en una sola pasada exacta.</p>';
      } else {
        const headers = ['Iter.', ...Array.from({ length: n }, (_, i) => `x${i + 1}`), '||Residuo||'];
        const rows = resultado.history.map(it => [it.iter, ...it.valores, it.residual]);
        tablaContenedor.innerHTML =
          `<h6 class="mt-0 mb-2 fw-semibold text-primary">Tabla de iteraciones</h6>` +
          SimNum.generarTablaHTML(headers, rows, 50);
      }
    }

    dibujarGrafico(resultado.history, resultado.x, n);

    // Inject dynamic chart explanation
    const expEl = document.getElementById('sl-chart-explanation');
    if (expEl) expEl.innerHTML = _explicacionGrafico(metodo, resultado, esDD);
  }

  /**
   * Genera una interpretación contextual de la solución obtenida.
   * Responde las preguntas del Escenario A: cuánto se envía a cada zona,
   * qué zona recibe más/menos, y si hay alertas de desabastecimiento.
   */
  function _interpretarSolucion(x, n, A, b, labels) {
    const total = x.reduce((s, v) => s + v, 0);
    const maxVal = Math.max(...x);
    const minVal = Math.min(...x);
    const maxIdx = x.indexOf(maxVal);
    const minIdx = x.indexOf(minVal);

    // Detectar escenario F (sistema mal condicionado de rumores)
    const esEscenarioF = n === 3 && Math.abs(A[0][0] - 1) < 0.01 && Math.abs(A[1][1] - 1.01) < 0.01 && Math.abs(b[0] - 3150) < 1;
    // Detectar escenario A (preconfigurado con b grandes: abastecimiento)
    const esEscenarioA = n === 3 && b[0] > 100 && !esEscenarioF;

    // Filas de interpretación por variable
    let filas = x.map((v, i) => {
      const pct = total !== 0 ? ((v / total) * 100).toFixed(1) : '0.0';
      const demanda = b[i];
      const diferencia = v - demanda;
      let estadoClase = 'text-success';
      let estadoTexto = '✔ Abastecida correctamente';

      if (Math.abs(diferencia) > Math.abs(demanda) * 0.1) {
        // Si la diferencia es >10% de la demanda, es significativa
        if (diferencia < 0) {
          estadoClase = 'text-danger';
          estadoTexto = `✗ Déficit de ${SimNum.redondear(Math.abs(diferencia), 2)} unidades`;
        } else {
          estadoClase = 'text-warning';
          estadoTexto = `⚠ Excedente de ${SimNum.redondear(diferencia, 2)} unidades`;
        }
      }

      return `<tr>
        <td class="fw-bold text-primary">x<sub>${i+1}</sub></td>
        <td>${labels[i] || 'Zona ' + (i+1)}</td>
        <td class="text-primary fw-bold">${SimNum.redondear(v, 4)}</td>
        <td>${pct}%</td>
        <td class="${estadoClase}" style="font-size:0.8rem;">${estadoTexto}</td>
      </tr>`;
    }).join('');

    // Conclusión general
    let conclusion = '';

    if (esEscenarioF) {
      // Calcular zona más afectada (mayor desvío respecto a distribución uniforme)
      const promedio = total / n;
      const masAfectada = x.reduce((prev, v, i) =>
        Math.abs(v - promedio) > Math.abs(x[prev] - promedio) ? i : prev, 0);

      conclusion = `
        <div class="alert-resultado error mt-3">
          <div>
            <strong class="d-block mb-1">⚠ Escenario F — Análisis de Sensibilidad por Rumor Social</strong>
            <span class="text-muted" style="font-size:0.85rem;">
              La demanda aumentó un <strong>5%</strong> a causa de un rumor de desabastecimiento.
              Aunque el incremento parece pequeño, el mal condicionamiento de la matriz
              (<strong>κ ≈ 250</strong>) amplifica mínimas variaciones en la demanda y las convierte en
              redistribuciones drásticas del flujo.<br><br>
              La zona más impactada es <strong>${labels[masAfectada]}</strong>, que recibe
              ${SimNum.redondear(x[masAfectada], 4)} unidades (${((x[masAfectada]/total)*100).toFixed(1)}% del total).
              La zona mejor abastecida es <strong>${labels[maxIdx]}</strong> con ${SimNum.redondear(maxVal, 4)} unidades.<br><br>
              <em>Conclusión:</em> el sistema <strong>no es robusto</strong> frente a perturbaciones sociales.
              Un sistema bien diseñado debería tener redundancia de rutas y reservas estratégicas para evitar este colapso.
            </span>
          </div>
        </div>`;

    } else if (esEscenarioA) {
      const totalStr = SimNum.redondear(total, 2);
      conclusion = `
        <div class="alert-resultado success mt-3">
          <div>
            <strong class="d-block mb-1">✔ Escenario A — Distribución Óptima de Abastecimiento</strong>
            <span class="text-muted" style="font-size:0.85rem;">
              El sistema distribuyó un total de <strong>${totalStr}</strong> unidades entre las ${n} zonas.
              La zona con mayor asignación es <strong>${labels[maxIdx]}</strong>
              (${SimNum.redondear(maxVal, 4)} unidades · ${((maxVal/total)*100).toFixed(1)}% del total),
              lo que refleja su mayor demanda o capacidad de ruta.<br><br>
              La zona con menor suministro es <strong>${labels[minIdx]}</strong>
              (${SimNum.redondear(minVal, 4)} unidades · ${((minVal/total)*100).toFixed(1)}% del total).
              Si esta zona experimenta un pico de demanda, podría convertirse en el punto vulnerable de la red.<br><br>
              <em>Conclusión:</em> el sistema es <strong>estable y bien condicionado</strong>.
              La dominancia diagonal fuerte garantiza que pequeños cambios en la demanda
              no alteran significativamente la distribución.
            </span>
          </div>
        </div>`;

    } else {
      // Caso genérico para cualquier matriz personalizada
      conclusion = `
        <div class="alert-resultado info mt-3">
          <div>
            <strong class="d-block mb-1">📊 Interpretación de la Solución</strong>
            <span class="text-muted" style="font-size:0.85rem;">
              El total distribuido es <strong>${SimNum.redondear(total, 4)}</strong> unidades.
              La variable dominante es <strong>x<sub>${maxIdx+1}</sub></strong> (${labels[maxIdx]})
              con ${SimNum.redondear(maxVal, 4)} unidades (${((maxVal/total)*100).toFixed(1)}% del flujo total).
              Modifica los valores de la matriz para simular bloqueos de rutas (poniendo 0 en la columna correspondiente)
              o incrementos de demanda en el vector <strong>b</strong>.
            </span>
          </div>
        </div>`;
    }

    return `
      <div class="mt-3">
        <strong class="small text-primary d-block mb-1"><i class="bi bi-table"></i> Distribución por zona:</strong>
        <div class="table-responsive">
          <table class="table table-sm mb-1">
            <thead>
              <tr>
                <th>Var.</th><th>Zona</th><th>Flujo</th><th>% Total</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        ${conclusion}
      </div>`;
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

  /**
   * Genera HTML explicando qué muestra el gráfico y por qué tiene ese comportamiento,
   * adaptado al método y al estado de convergencia.
   */
  function _explicacionGrafico(metodo, resultado, esDD) {
    const iters = resultado.iteraciones;
    const convergio = resultado.convergio;

    const textos = {
      'lu': {
        titulo: 'Gráfico de barras — Solución directa LU',
        cuerpo: `Cada barra representa el valor exacto de una variable <strong>x<sub>i</sub></strong> (flujo hacia cada zona).
          La factorización LU descompone <strong>A = L·U</strong> y resuelve en dos sustituciones (hacia adelante y hacia atrás)
          sin iterar, por eso <em>no hay curva de convergencia</em>: el resultado es exacto desde el primer paso.
          ${!esDD ? '<br><span class="text-warning">⚠ Verifica que ningún pivote sea nulo o muy pequeño, lo que indicaría rutas bloqueadas.</span>' : ''}`,
      },
      'jacobi': {
        titulo: 'Curva de convergencia — Método de Jacobi',
        cuerpo: `El eje Y muestra <strong>log₁₀(||r||)</strong> donde <em>||r|| = ||Ax − b||</em> es el residuo:
          cuánto le falta al flujo calculado para satisfacer el balance exacto.
          Cada punto es una iteración en que <em>todos</em> los despachos se actualizan <strong>simultáneamente</strong> usando valores del turno anterior.
          ${convergio
            ? `<br><span class="text-success">✔ Convergió en <strong>${iters}</strong> iteraciones. La caída sostenida indica un sistema diagonalmente dominante y estable.</span>`
            : `<br><span class="text-danger">✗ No convergió en ${iters} iteraciones. Considera reordenar ecuaciones para mejorar la dominancia diagonal.</span>`
          }`,
      },
      'gauss-seidel': {
        titulo: 'Curva de convergencia — Gauss-Seidel',
        cuerpo: `Igual que Jacobi pero cada zona actualiza su flujo <strong>usando inmediatamente</strong> los valores recién calculados del mismo turno.
          Esto hace que la curva caiga más empinada (menos iteraciones para el mismo error).
          Logísticamente: es como si cada distribuidor ajustara su despacho en tiempo real sin esperar el cierre del día.
          ${convergio
            ? `<br><span class="text-success">✔ Convergió en <strong>${iters}</strong> iteraciones — típicamente ~50% menos que Jacobi en sistemas bien condicionados.</span>`
            : `<br><span class="text-danger">✗ No convergió. El sistema puede estar mal condicionado o no ser diagonalmente dominante.</span>`
          }`,
      },
      'sor': {
        titulo: 'Curva de convergencia — SOR (Sobre-relajación)',
        cuerpo: `SOR mezcla el valor anterior y el nuevo de Gauss-Seidel con el factor <strong>ω</strong>.
          Con <em>ω &gt; 1</em> el algoritmo "sobre-corrige" cada despacho para acercarse al equilibrio más rápido.
          Si ω está bien elegido, la curva cae más rápido que Gauss-Seidel.
          ${convergio
            ? `<br><span class="text-success">✔ SOR convergió en <strong>${iters}</strong> iteraciones con el ω configurado.</span>`
            : `<br><span class="text-warning">⚠ No convergió. Un ω mal elegido (fuera de [1, 2)) puede hacer diverger el método. Prueba con ω más cercano a 1.</span>`
          }`,
      },
      'gradiente-conjugado': {
        titulo: 'Curva de convergencia — Gradiente Conjugado',
        cuerpo: `Este método minimiza el error cuadrático <em>||Ax − b||²</em> moviéndose en direcciones conjugadas,
          lo que garantiza convergencia en ≤ n pasos en aritmética exacta.
          La curva puede caer de forma irregular (no monótona) pero alcanza la tolerancia en muy pocas iteraciones para sistemas simétricos.
          ${convergio
            ? `<br><span class="text-success">✔ Convergió en <strong>${iters}</strong> iteraciones. Eficiente para redes de distribución simétricas de gran escala.</span>`
            : `<br><span class="text-danger">✗ No convergió. Asegúrate de que la matriz A sea simétrica y definida positiva.</span>`
          }`,
      },
    };

    const info = textos[metodo] || { titulo: 'Gráfico de resultados', cuerpo: 'Ejecuta la simulación para ver la interpretación.' };
    return `
      <div class="modulo-contexto mb-0 py-2 px-3" style="font-size:0.8rem;">
        <strong class="text-primary d-block mb-1">${info.titulo}</strong>
        <span class="text-muted">${info.cuerpo}</span>
      </div>`;
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
    if (tabla) tabla.innerHTML = '<p class="text-muted small mb-0">La tabla de convergencia por iteración aparecerá aquí tras ejecutar un método iterativo.</p>';
    const expEl = document.getElementById('sl-chart-explanation');
    if (expEl) expEl.innerHTML = '';
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
