/**
 * sistemas_lineales.js
 *
 * Módulo: Sistemas de ecuaciones lineales
 * Contexto: Modelado de flujos en redes de transporte y distribución.
 *
 * Métodos a implementar:
 *  - Jacobi
 *  - Gauss-Seidel
 */

const SistemasLineales = (function () {

  /* ── Estado interno del módulo ─────────────────── */
  let matrizA = [];   // Matriz de coeficientes n×n
  let vectorB = [];   // Vector de términos independientes

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    // Escuchar cambio de tamaño para regenerar la matriz de entrada
    const selectSize = document.getElementById('sl-size');
    if (selectSize) {
      selectSize.addEventListener('change', () => generarMatrizUI());
      generarMatrizUI(); // Generar con valor inicial
    }
  }

  /**
   * Genera la interfaz de inputs para la matriz A y el vector b
   * según el tamaño seleccionado por el usuario.
   */
  function generarMatrizUI() {
    const n = parseInt(document.getElementById('sl-size')?.value || '3');
    const container = document.getElementById('sl-matrix-container');
    if (!container) return;

    // Datos de ejemplo para cada tamaño (sistema diagonalmente dominante)
    const ejemplos = {
      2: { A: [[4, 1], [2, 3]], b: [9, 8] },
      3: { A: [[10, 2, 1], [1, 5, 1], [2, 3, 10]], b: [7, -8, 6] },
      4: { A: [[10, 1, 1, 1], [1, 10, 1, 1], [1, 1, 10, 1], [1, 1, 1, 10]], b: [13, 13, 13, 13] },
    };

    const ej = ejemplos[n] || ejemplos[3];

    // Construir tabla de inputs
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
                   data-row="${i}" data-col="${j}"
                   value="${ej.A[i][j]}" step="any" /></td>`;
      }
      html += `<td><input type="number" class="form-control form-control-sm sl-b"
                   data-row="${i}" value="${ej.b[i]}" step="any" /></td>`;
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
    container.classList.remove('py-3'); // Quitar padding placeholder
  }

  /**
   * Lee la matriz A y vector b desde la UI.
   * @returns {{ A: number[][], b: number[], n: number } | null}
   */
  function leerDatosUI() {
    const n = parseInt(document.getElementById('sl-size')?.value || '3');
    const inputsA = document.querySelectorAll('.sl-a');
    const inputsB = document.querySelectorAll('.sl-b');

    if (inputsA.length !== n * n) {
      SimNum.mostrarMensaje('sl-resultado', 'Error: regenere la matriz antes de resolver.', 'error');
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
     MÉTODO DE JACOBI
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * Resuelve Ax = b mediante el método de Jacobi.
   * @param {number[][]} A
   * @param {number[]}   b
   * @param {number}     tol         Tolerancia de convergencia
   * @param {number}     maxIter     Iteraciones máximas
   * @returns {{ x: number[], iteraciones: object[], convergio: boolean }}
   */
  function resolverJacobi(A, b, tol, maxIter) {
    // TODO: Implementar método de Jacobi aquí.
    //
    // Algoritmo:
    //   x_i^(k+1) = (b_i - Σ_{j≠i} A_ij * x_j^(k)) / A_ii
    //
    // Criterio de parada: norma infinita del error < tol
    //
    // Por ahora devuelve resultado ficticio para probar la UI:
    const n = b.length;
    const x = Array(n).fill(0);
    return {
      x,
      iteraciones: [{ iter: 1, valores: x.slice(), error: '—' }],
      convergio: false,
      mensaje: 'TODO: Jacobi pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE GAUSS-SEIDEL
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * Resuelve Ax = b mediante el método de Gauss-Seidel.
   * @param {number[][]} A
   * @param {number[]}   b
   * @param {number}     tol
   * @param {number}     maxIter
   * @returns {{ x: number[], iteraciones: object[], convergio: boolean }}
   */
  function resolverGaussSeidel(A, b, tol, maxIter) {
    // TODO: Implementar método de Gauss-Seidel aquí.
    //
    // Algoritmo:
    //   x_i^(k+1) = (b_i - Σ_{j<i} A_ij * x_j^(k+1) - Σ_{j>i} A_ij * x_j^(k)) / A_ii
    //
    // Usa los valores ya actualizados de la iteración actual (diferencia con Jacobi).
    //
    const n = b.length;
    const x = Array(n).fill(0);
    return {
      x,
      iteraciones: [{ iter: 1, valores: x.slice(), error: '—' }],
      convergio: false,
      mensaje: 'TODO: Gauss-Seidel pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL (llamado desde el botón)
     ══════════════════════════════════════════════ */
  function resolver() {
    const datos = leerDatosUI();
    if (!datos) return;

    const { A, b, n } = datos;
    const tol     = parseFloat(document.getElementById('sl-tol')?.value)     || 1e-4;
    const maxIter = parseInt(document.getElementById('sl-maxiter')?.value)    || 100;
    const metodo  = document.querySelector('input[name="sl-method"]:checked')?.value || 'jacobi';

    // Verificar que la diagonal no tenga ceros
    for (let i = 0; i < n; i++) {
      if (A[i][i] === 0) {
        SimNum.mostrarMensaje(
          'sl-resultado',
          `Error: el elemento diagonal A[${i + 1}][${i + 1}] es cero. Reordene las ecuaciones.`,
          'error'
        );
        return;
      }
    }

    let resultado;
    if (metodo === 'jacobi') {
      resultado = resolverJacobi(A, b, tol, maxIter);
    } else {
      resultado = resolverGaussSeidel(A, b, tol, maxIter);
    }

    mostrarResultados(resultado, n, metodo);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO DE RESULTADOS
     ══════════════════════════════════════════════ */
  function mostrarResultados(resultado, n, metodo) {
    const contenedor = document.getElementById('sl-resultado');
    const tablaContenedor = document.getElementById('sl-tabla-iteraciones');
    if (!contenedor) return;

    const nombre = metodo === 'jacobi' ? 'Jacobi' : 'Gauss-Seidel';

    // Panel de solución
    const xStr = resultado.x.map((v, i) =>
      `<strong>x<sub>${i + 1}</sub></strong> = ${SimNum.redondear(v, 6)}`
    ).join(' &nbsp;|&nbsp; ');

    contenedor.innerHTML = `
      <div class="alert-resultado ${resultado.convergio ? 'success' : 'info'} mb-2">
        <strong>Método ${nombre}</strong> — ${resultado.mensaje || (resultado.convergio ? 'Convergió.' : 'No convergió.')}
      </div>
      <p class="mt-2 mb-1"><strong>Solución:</strong> ${xStr}</p>`;

    // Tabla de iteraciones
    if (!tablaContenedor) return;
    if (!resultado.iteraciones?.length) {
      tablaContenedor.innerHTML = '';
      return;
    }

    const headers = ['Iteración', ...Array.from({ length: n }, (_, i) => `x${i + 1}`), 'Error'];
    const rows = resultado.iteraciones.map(it => [
      it.iter,
      ...it.valores.map(v => SimNum.redondear(v, 6)),
      it.error,
    ]);

    tablaContenedor.innerHTML = `<h6 class="mt-3 mb-2 fw-semibold">Tabla de iteraciones</h6>` +
      SimNum.generarTablaHTML(headers, rows);
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('sl-resultado');
    const tabla = document.getElementById('sl-tabla-iteraciones');
    if (tabla) tabla.innerHTML = '';
  }

  /* ── API pública ───────────────────────────────── */
  return { init, resolver, limpiar };
})();
