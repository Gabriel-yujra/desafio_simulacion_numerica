/**
 * integracion.js
 *
 * Módulo: Integración numérica
 * Contexto: Cálculo del costo acumulado de una canasta básica
 *            y estimación de la pérdida de poder adquisitivo
 *            durante períodos de inflación.
 *
 * Métodos a implementar:
 *  - Regla del Trapecio compuesta
 *  - Regla de Simpson 1/3 compuesta
 *  - Regla de Simpson 3/8 compuesta
 */

console.log('[SimNum] Módulo Integracion cargado correctamente.');

const Integracion = (function () {

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    dibujarGraficoEjemplo();
  }

  /* ══════════════════════════════════════════════
     REGLA DEL TRAPECIO COMPUESTA
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * @param {Function} f   Función a integrar
   * @param {number}   a   Límite inferior
   * @param {number}   b   Límite superior
   * @param {number}   n   Número de subintervalos (n par recomendado)
   * @returns {{ valor: number, error: string }}
   */
  function trapecio(f, a, b, n) {
    // TODO: Implementar regla del trapecio compuesta aquí.
    //
    // Algoritmo:
    //   h = (b - a) / n
    //   I ≈ (h/2) * [f(a) + 2*Σ_{i=1}^{n-1} f(a + i*h) + f(b)]
    //
    // Error estimado: -((b-a)^3 / (12*n^2)) * f''(ξ)
    //
    return {
      valor: null,
      error: '—',
      mensaje: 'TODO: Trapecio pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     REGLA DE SIMPSON 1/3 COMPUESTA
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * @param {Function} f
   * @param {number}   a
   * @param {number}   b
   * @param {number}   n  Debe ser número par
   * @returns {{ valor: number, error: string }}
   */
  function simpson13(f, a, b, n) {
    // TODO: Implementar Simpson 1/3 compuesto aquí.
    //
    // Algoritmo:
    //   h = (b - a) / n  (n debe ser par)
    //   I ≈ (h/3) * [f(a) + 4*Σ impares + 2*Σ pares + f(b)]
    //
    // Error estimado: -((b-a)^5 / (180*n^4)) * f^(4)(ξ)
    //
    return {
      valor: null,
      error: '—',
      mensaje: 'TODO: Simpson 1/3 pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     REGLA DE SIMPSON 3/8 COMPUESTA
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * @param {Function} f
   * @param {number}   a
   * @param {number}   b
   * @param {number}   n  Debe ser múltiplo de 3
   * @returns {{ valor: number, error: string }}
   */
  function simpson38(f, a, b, n) {
    // TODO: Implementar Simpson 3/8 compuesto aquí.
    //
    // Algoritmo:
    //   h = (b - a) / n  (n múltiplo de 3)
    //   I ≈ (3h/8) * [f(x_0) + 3*Σ_{j≠múltiplo3} f(x_j) + 2*Σ_{múltiplo3} f(x_j) + f(x_n)]
    //
    return {
      valor: null,
      error: '—',
      mensaje: 'TODO: Simpson 3/8 pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function calcular() {
    const exprF = document.getElementById('int-funcion')?.value?.trim();
    const a     = parseFloat(document.getElementById('int-a')?.value);
    const b     = parseFloat(document.getElementById('int-b')?.value);
    let   n     = parseInt(document.getElementById('int-n')?.value) || 100;

    const usaTrapecio  = document.getElementById('int-trapecio')?.checked;
    const usaSimpson13 = document.getElementById('int-simpson13')?.checked;
    const usaSimpson38 = document.getElementById('int-simpson38')?.checked;

    if (!exprF) {
      SimNum.mostrarMensaje('int-resultado', 'Ingrese una función f(x).', 'error');
      return;
    }
    if (isNaN(a) || isNaN(b) || a >= b) {
      SimNum.mostrarMensaje('int-resultado', 'Los límites a y b deben ser válidos y a < b.', 'error');
      return;
    }
    if (!usaTrapecio && !usaSimpson13 && !usaSimpson38) {
      SimNum.mostrarMensaje('int-resultado', 'Seleccione al menos un método.', 'error');
      return;
    }

    let f;
    try {
      f = (x) => SimNum.evaluarFuncion(exprF, x);
      f(a);
    } catch (e) {
      SimNum.mostrarMensaje('int-resultado', `Error en la función: ${e.message}`, 'error');
      return;
    }

    // Asegurar n par para Simpson 1/3
    if (usaSimpson13 && n % 2 !== 0) n += 1;
    // Asegurar n múltiplo de 3 para Simpson 3/8
    // (si sólo se usa 3/8, ajustar)
    if (usaSimpson38 && !usaSimpson13 && n % 3 !== 0) n = Math.ceil(n / 3) * 3;

    const resultados = [];
    if (usaTrapecio)  resultados.push({ nombre: 'Trapecio',     ...trapecio(f, a, b, n) });
    if (usaSimpson13) resultados.push({ nombre: 'Simpson 1/3',  ...simpson13(f, a, b, n) });
    if (usaSimpson38) resultados.push({ nombre: 'Simpson 3/8',  ...simpson38(f, a, b, n) });

    mostrarResultados(resultados, f, a, b, n);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO
     ══════════════════════════════════════════════ */
  function mostrarResultados(resultados, f, a, b, n) {
    const contenedor = document.getElementById('int-resultado');
    if (!contenedor) return;

    const headers = ['Método', 'Valor de la integral', 'Error estimado', 'Estado'];
    const rows = resultados.map(r => [
      r.nombre,
      r.valor !== null ? SimNum.redondear(r.valor, 8) : '—',
      r.error,
      r.mensaje || (r.valor !== null ? '✓' : 'Pendiente'),
    ]);

    contenedor.innerHTML =
      `<div class="alert-resultado info mb-2">
         n = ${n} subintervalos · intervalo [${a}, ${b}]
       </div>` +
      SimNum.generarTablaHTML(headers, rows);

    dibujarGrafico(f, a, b);
  }

  /* ══════════════════════════════════════════════
     GRÁFICO
     ══════════════════════════════════════════════ */
  function dibujarGrafico(f, a, b) {
    const canvas = SimNum.prepararCanvas('integracion-chart');
    if (!canvas) return;

    const puntos = 150;
    const paso   = (b - a) / puntos;
    const labels = [];
    const data   = [];

    for (let i = 0; i <= puntos; i++) {
      const x = a + i * paso;
      labels.push(SimNum.redondear(x, 3));
      try { data.push(SimNum.redondear(f(x), 6)); }
      catch { data.push(null); }
    }

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'f(x)',
            data,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.15)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `f(${ctx.label}) = ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'x (tiempo)' },
            ticks: { maxTicksLimit: 10, font: { size: 10 } },
          },
          y: {
            title: { display: true, text: 'f(x) (precio)' },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  }

  function dibujarGraficoEjemplo() {
    const canvas = SimNum.prepararCanvas('integracion-chart');
    if (!canvas) return;
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Configure la función y presione "Calcular integral"', data: [] }],
      },
      options: { responsive: true },
    });
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('int-resultado');
    dibujarGraficoEjemplo();
  }

  return { init, calcular, limpiar };
})();
