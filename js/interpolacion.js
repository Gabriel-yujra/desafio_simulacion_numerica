/**
 * interpolacion.js
 *
 * Módulo: Interpolación
 * Contexto: Reconstrucción de curvas de precios de alimentos
 *            a partir de datos históricos discretos.
 *
 * Métodos a implementar:
 *  - Interpolación de Lagrange
 *  - Diferencias divididas de Newton (forma de Newton hacia adelante/general)
 */

console.log('[SimNum] Módulo Interpolacion cargado correctamente.');

const Interpolacion = (function () {

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    dibujarGraficoEjemplo();
  }

  /* ══════════════════════════════════════════════
     LEER PUNTOS DESDE LA UI
     ══════════════════════════════════════════════ */
  function leerPuntos() {
    const filas = document.querySelectorAll('#interp-tbody tr');
    const puntos = [];

    filas.forEach(fila => {
      const inputs = fila.querySelectorAll('input[type="number"]');
      if (inputs.length >= 2) {
        const x = parseFloat(inputs[0].value);
        const y = parseFloat(inputs[1].value);
        if (!isNaN(x) && !isNaN(y)) {
          puntos.push({ x, y });
        }
      }
    });

    // Ordenar por x ascendente (requisito para diferencias divididas)
    return puntos.sort((a, b) => a.x - b.x);
  }

  /* ══════════════════════════════════════════════
     INTERPOLACIÓN DE LAGRANGE
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * Evalúa el polinomio de Lagrange en el punto xEval.
   * @param {Array<{x:number, y:number}>} puntos  Puntos conocidos
   * @param {number} xEval  Punto de evaluación
   * @returns {{ valor: number, pasos: string[] }}
   */
  function lagrange(puntos, xEval) {
    // TODO: Implementar interpolación de Lagrange aquí.
    //
    // Algoritmo:
    //   P(x) = Σ_i [ y_i * L_i(x) ]
    //   L_i(x) = Π_{j≠i} (x - x_j) / (x_i - x_j)
    //
    return {
      valor: null,
      pasos: ['TODO: Lagrange pendiente de implementación.'],
    };
  }

  /* ══════════════════════════════════════════════
     DIFERENCIAS DIVIDIDAS DE NEWTON
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * Construye la tabla de diferencias divididas y evalúa en xEval.
   * @param {Array<{x:number, y:number}>} puntos
   * @param {number} xEval
   * @returns {{ valor: number, tablaDD: number[][], coeficientes: number[] }}
   */
  function newtonDivididads(puntos, xEval) {
    // TODO: Implementar diferencias divididas de Newton aquí.
    //
    // Algoritmo:
    //   Tabla DD:
    //     f[x_i]         = y_i
    //     f[x_i, x_{i+1}] = (f[x_{i+1}] - f[x_i]) / (x_{i+1} - x_i)
    //   Polinomio de Newton:
    //     P(x) = f[x_0] + f[x_0,x_1](x-x_0) + f[x_0,x_1,x_2](x-x_0)(x-x_1) + …
    //
    return {
      valor: null,
      tablaDD: [],
      coeficientes: [],
      mensaje: 'TODO: Newton diferencias divididas pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function interpolar() {
    const puntos = leerPuntos();
    const xEval  = parseFloat(document.getElementById('interp-xeval')?.value);
    const metodo = document.getElementById('interp-method')?.value || 'lagrange';

    if (puntos.length < 2) {
      SimNum.mostrarMensaje('interp-resultado', 'Se necesitan al menos 2 puntos.', 'error');
      return;
    }
    if (isNaN(xEval)) {
      SimNum.mostrarMensaje('interp-resultado', 'Ingrese un valor de x para evaluar.', 'error');
      return;
    }

    // Verificar xEval dentro del rango de interpolación (advertir si extrapola)
    const xMin = puntos[0].x;
    const xMax = puntos[puntos.length - 1].x;
    const extrapolando = xEval < xMin || xEval > xMax;

    let resultado;
    if (metodo === 'lagrange') {
      resultado = lagrange(puntos, xEval);
    } else {
      resultado = newtonDivididads(puntos, xEval);
    }

    mostrarResultados(resultado, puntos, xEval, metodo, extrapolando);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO
     ══════════════════════════════════════════════ */
  function mostrarResultados(resultado, puntos, xEval, metodo, extrapolando) {
    const contenedor = document.getElementById('interp-resultado');
    if (!contenedor) return;

    const nombre = metodo === 'lagrange' ? 'Lagrange' : 'Newton (Dif. Divididas)';
    const valorStr = resultado.valor !== null ? SimNum.redondear(resultado.valor, 6) : '—';

    let html = `
      <div class="alert-resultado info mb-2">
        <strong>Método ${nombre}</strong>${extrapolando ? ' — ⚠ Extrapolando fuera del rango' : ''}
      </div>
      <p class="mb-1">
        <strong>P(${xEval})</strong> ≈ <span class="text-primary fw-bold">${valorStr}</span>
      </p>`;

    if (resultado.pasos?.length) {
      html += `<small class="text-muted">${resultado.pasos.join('<br>')}</small>`;
    }
    if (resultado.mensaje) {
      html += `<p class="text-muted small mt-1">${resultado.mensaje}</p>`;
    }

    contenedor.innerHTML = html;

    // Intentar dibujar con datos de ejemplo mientras TODO no está implementado
    dibujarGrafico(puntos, resultado.valor, xEval, metodo);
  }

  /* ══════════════════════════════════════════════
     GRÁFICO
     ══════════════════════════════════════════════ */
  function dibujarGrafico(puntos, valorEval, xEval, metodo) {
    const canvas = SimNum.prepararCanvas('interpolacion-chart');
    if (!canvas) return;

    // Puntos originales
    const puntosDataset = {
      label: 'Datos originales',
      data: puntos.map(p => ({ x: p.x, y: p.y })),
      borderColor: '#0d6efd',
      backgroundColor: '#0d6efd',
      pointRadius: 6,
      showLine: false,
      type: 'scatter',
    };

    const datasets = [puntosDataset];

    // Punto interpolado (si hay valor)
    if (valorEval !== null) {
      datasets.push({
        label: `P(${xEval}) ≈ ${SimNum.redondear(valorEval, 4)}`,
        data: [{ x: xEval, y: valorEval }],
        borderColor: '#dc3545',
        backgroundColor: '#dc3545',
        pointRadius: 8,
        pointStyle: 'triangle',
        type: 'scatter',
      });
    }

    // TODO: Cuando los métodos estén implementados, agregar aquí la curva continua P(x)

    new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => `(${ctx.parsed.x}, ${ctx.parsed.y})` } },
        },
        scales: {
          x: { title: { display: true, text: 'x (semana)' } },
          y: { title: { display: true, text: 'y (precio)' } },
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
        datasets: [{
          label: 'Ingrese puntos y presione "Interpolar"',
          data: [],
        }],
      },
      options: { responsive: true },
    });
  }

  /* ══════════════════════════════════════════════
     GESTIÓN DINÁMICA DE PUNTOS EN LA TABLA
     ══════════════════════════════════════════════ */
  function agregarPunto() {
    const tbody = document.getElementById('interp-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" class="form-control form-control-sm" value="0" /></td>
      <td><input type="number" class="form-control form-control-sm" value="0" /></td>`;
    tbody.appendChild(tr);
  }

  function quitarPunto() {
    const tbody = document.getElementById('interp-tbody');
    if (!tbody || tbody.rows.length <= 2) return; // Mínimo 2 puntos
    tbody.removeChild(tbody.lastElementChild);
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('interp-resultado');
    dibujarGraficoEjemplo();
  }

  return { init, interpolar, agregarPunto, quitarPunto, limpiar };
})();
