/**
 * raices.js
 *
 * Módulo: Raíces de ecuaciones
 * Contexto: Umbrales críticos de precio y puntos de equilibrio
 *            en el mercado de bienes básicos.
 *
 * Métodos a implementar:
 *  - Bisección
 *  - Newton-Raphson
 *  - Secante
 */

const Raices = (function () {

  let chartInstance = null; // Referencia al gráfico Chart.js activo

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    // Dibujar gráfico vacío al iniciar para que el canvas no se vea en blanco
    dibujarGraficoEjemplo();
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE BISECCIÓN
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * @param {Function} f    Función evaluable f(x)
   * @param {number}   a    Extremo izquierdo
   * @param {number}   b    Extremo derecho
   * @param {number}   tol  Tolerancia
   * @param {number}   maxIter
   * @returns {{ raiz: number, iteraciones: object[], convergio: boolean }}
   */
  function biseccion(f, a, b, tol, maxIter) {
    // TODO: Implementar método de bisección aquí.
    //
    // Condición previa: f(a) * f(b) < 0 (cambio de signo)
    // Algoritmo:
    //   c = (a + b) / 2
    //   Si f(c) * f(a) < 0 → b = c
    //   Si no → a = c
    //   Parar cuando |b - a| < tol o |f(c)| < tol
    //
    return {
      raiz: null,
      iteraciones: [],
      convergio: false,
      mensaje: 'TODO: Bisección pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE NEWTON-RAPHSON
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * Usa diferencia centrada para aproximar f'(x).
   * @param {Function} f
   * @param {number}   x0   Punto inicial (se usará el valor de 'a' del formulario)
   * @param {number}   tol
   * @param {number}   maxIter
   * @returns {{ raiz: number, iteraciones: object[], convergio: boolean }}
   */
  function newtonRaphson(f, x0, tol, maxIter) {
    // TODO: Implementar Newton-Raphson aquí.
    //
    // Algoritmo:
    //   f'(x) ≈ (f(x+h) - f(x-h)) / (2h)   con h = 1e-6
    //   x_{n+1} = x_n - f(x_n) / f'(x_n)
    //
    return {
      raiz: null,
      iteraciones: [],
      convergio: false,
      mensaje: 'TODO: Newton-Raphson pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE LA SECANTE
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * @param {Function} f
   * @param {number}   x0  Primer punto (a)
   * @param {number}   x1  Segundo punto (b)
   * @param {number}   tol
   * @param {number}   maxIter
   * @returns {{ raiz: number, iteraciones: object[], convergio: boolean }}
   */
  function secante(f, x0, x1, tol, maxIter) {
    // TODO: Implementar método de la secante aquí.
    //
    // Algoritmo:
    //   x_{n+1} = x_n - f(x_n) * (x_n - x_{n-1}) / (f(x_n) - f(x_{n-1}))
    //
    return {
      raiz: null,
      iteraciones: [],
      convergio: false,
      mensaje: 'TODO: Secante pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function resolver() {
    const exprF  = document.getElementById('r-funcion')?.value?.trim();
    const a      = parseFloat(document.getElementById('r-a')?.value);
    const b      = parseFloat(document.getElementById('r-b')?.value);
    const tol    = parseFloat(document.getElementById('r-tol')?.value) || 1e-4;
    const metodo = document.getElementById('r-method')?.value || 'biseccion';

    if (!exprF) {
      SimNum.mostrarMensaje('raices-resultado', 'Ingrese una función f(x).', 'error');
      return;
    }
    if (isNaN(a) || isNaN(b)) {
      SimNum.mostrarMensaje('raices-resultado', 'Ingrese los extremos a y b.', 'error');
      return;
    }

    let f;
    try {
      f = (x) => SimNum.evaluarFuncion(exprF, x);
      f(a); // prueba de evaluación
    } catch (e) {
      SimNum.mostrarMensaje('raices-resultado', `Error en la función: ${e.message}`, 'error');
      return;
    }

    const maxIter = 100;
    let resultado;

    if (metodo === 'biseccion') {
      resultado = biseccion(f, a, b, tol, maxIter);
    } else if (metodo === 'newton') {
      resultado = newtonRaphson(f, a, tol, maxIter);
    } else {
      resultado = secante(f, a, b, tol, maxIter);
    }

    mostrarResultados(resultado, f, a, b, metodo);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO
     ══════════════════════════════════════════════ */
  function mostrarResultados(resultado, f, a, b, metodo) {
    const nombres = { biseccion: 'Bisección', newton: 'Newton-Raphson', secante: 'Secante' };
    const nombre = nombres[metodo] || metodo;

    // Tabla de iteraciones
    const contenedor = document.getElementById('raices-resultado');
    if (contenedor) {
      const raizStr = resultado.raiz !== null ? SimNum.redondear(resultado.raiz, 8) : '—';
      contenedor.innerHTML = `
        <div class="alert-resultado ${resultado.convergio ? 'success' : 'info'} mb-2">
          <strong>${nombre}</strong> — ${resultado.mensaje || (resultado.convergio ? 'Convergió.' : 'No convergió.')}
        </div>
        <p class="mb-1"><strong>Raíz encontrada:</strong> x ≈ ${raizStr}</p>`;

      if (resultado.iteraciones?.length) {
        const headers = ['n', 'a / x₀', 'b / x₁', 'c / xₙ₊₁', 'f(c)', 'Error'];
        const rows = resultado.iteraciones.map(it => [
          it.n, it.a ?? '—', it.b ?? '—', it.c ?? '—', it.fc ?? '—', it.error ?? '—',
        ]);
        contenedor.innerHTML += SimNum.generarTablaHTML(headers, rows);
      }
    }

    // Gráfico
    dibujarGrafico(f, a, b, resultado.raiz);
  }

  /* ══════════════════════════════════════════════
     GRÁFICO
     ══════════════════════════════════════════════ */
  function dibujarGrafico(f, a, b, raiz) {
    const canvas = SimNum.prepararCanvas('raices-chart');
    if (!canvas) return;

    const puntos = 200;
    const paso = (b - a) / puntos;
    const labels = [];
    const data   = [];

    for (let i = 0; i <= puntos; i++) {
      const x = a + i * paso;
      labels.push(SimNum.redondear(x, 4));
      try { data.push(SimNum.redondear(f(x), 6)); }
      catch { data.push(null); }
    }

    const datasets = [
      {
        label: 'f(x)',
        data,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
    ];

    // Línea y = 0
    datasets.push({
      label: 'y = 0',
      data: Array(labels.length).fill(0),
      borderColor: '#adb5bd',
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
    });

    // Punto de la raíz encontrada
    if (raiz !== null) {
      datasets.push({
        label: `Raíz ≈ ${SimNum.redondear(raiz, 6)}`,
        data: [{ x: raiz, y: 0 }],
        borderColor: '#dc3545',
        backgroundColor: '#dc3545',
        pointRadius: 7,
        type: 'scatter',
      });
    }

    chartInstance = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 10, font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } },
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
        labels: [],
        datasets: [{ label: 'f(x) — ingrese datos y presione "Encontrar raíz"', data: [] }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
      },
    });
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('raices-resultado');
    dibujarGraficoEjemplo();
  }

  return { init, resolver, limpiar };
})();
