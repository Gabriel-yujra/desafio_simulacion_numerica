/**
 * ecuaciones_diferenciales.js
 *
 * Módulo: Ecuaciones Diferenciales Ordinarias (EDO)
 * Contexto:
 *  - Escenario A: Vaciado de reservas de carburante (decay exponencial o con consumo variable).
 *  - Escenario B: Difusión del descontento social (modelo logístico / tipo SIR simplificado).
 *
 * Métodos a implementar:
 *  - Método de Euler (primer orden)
 *  - Runge-Kutta de 4° orden (RK4)
 */

const EDO = (function () {

  /* ── Configuraciones precargadas por escenario ─── */
  const ESCENARIOS = {
    reservas: {
      dy:   '-0.1 * y',
      y0:   1000,
      t0:   0,
      tf:   30,
      h:    1,
      hint: 'Vaciado exponencial: tasa de consumo proporcional al nivel actual de reservas (y).',
    },
    descontento: {
      dy:   '0.3 * y * (1 - y / 500)',
      y0:   5,
      t0:   0,
      tf:   40,
      h:    0.5,
      hint: 'Crecimiento logístico: el descontento crece hasta una capacidad máxima (K = 500).',
    },
  };

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    dibujarGraficoEjemplo();
  }

  /**
   * Actualiza los campos del formulario al cambiar el escenario.
   */
  function cambiarEscenario() {
    const escenario = document.getElementById('edo-escenario')?.value || 'reservas';
    const cfg = ESCENARIOS[escenario];
    if (!cfg) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('edo-dy', cfg.dy);
    set('edo-y0', cfg.y0);
    set('edo-t0', cfg.t0);
    set('edo-tf', cfg.tf);
    set('edo-h',  cfg.h);

    const hint = document.getElementById('edo-hint');
    if (hint) hint.textContent = cfg.hint;
  }

  /* ══════════════════════════════════════════════
     MÉTODO DE EULER
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * Resuelve dy/dt = f(t,y) con condición inicial y(t0) = y0.
   * @param {Function} f       Función f(t, y)
   * @param {number}   t0      Tiempo inicial
   * @param {number}   y0      Condición inicial
   * @param {number}   tf      Tiempo final
   * @param {number}   h       Tamaño del paso
   * @returns {{ ts: number[], ys: number[] }}
   */
  function euler(f, t0, y0, tf, h) {
    // TODO: Implementar método de Euler aquí.
    //
    // Algoritmo:
    //   y_{n+1} = y_n + h * f(t_n, y_n)
    //   t_{n+1} = t_n + h
    //
    // Devolver arrays ts[] y ys[] con todos los puntos.
    //
    return {
      ts: [t0],
      ys: [y0],
      mensaje: 'TODO: Euler pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     RUNGE-KUTTA 4° ORDEN (RK4)
     TODO: Implementar aquí el método completo.
     ══════════════════════════════════════════════ */
  /**
   * @param {Function} f
   * @param {number}   t0
   * @param {number}   y0
   * @param {number}   tf
   * @param {number}   h
   * @returns {{ ts: number[], ys: number[] }}
   */
  function rk4(f, t0, y0, tf, h) {
    // TODO: Implementar Runge-Kutta 4° orden aquí.
    //
    // Algoritmo:
    //   k1 = f(t_n,         y_n)
    //   k2 = f(t_n + h/2,   y_n + h*k1/2)
    //   k3 = f(t_n + h/2,   y_n + h*k2/2)
    //   k4 = f(t_n + h,     y_n + h*k3)
    //   y_{n+1} = y_n + (h/6)*(k1 + 2k2 + 2k3 + k4)
    //
    return {
      ts: [t0],
      ys: [y0],
      mensaje: 'TODO: RK4 pendiente de implementación.',
    };
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function resolver() {
    const exprDY = document.getElementById('edo-dy')?.value?.trim();
    const y0     = parseFloat(document.getElementById('edo-y0')?.value);
    const t0     = parseFloat(document.getElementById('edo-t0')?.value);
    const tf     = parseFloat(document.getElementById('edo-tf')?.value);
    const h      = parseFloat(document.getElementById('edo-h')?.value);
    const metodo = document.getElementById('edo-method')?.value || 'rk4';

    if (!exprDY) {
      SimNum.mostrarMensaje('edo-resultado', 'Ingrese la expresión dy/dt = f(t, y).', 'error');
      return;
    }
    if ([y0, t0, tf, h].some(isNaN)) {
      SimNum.mostrarMensaje('edo-resultado', 'Complete todos los parámetros numéricos.', 'error');
      return;
    }
    if (tf <= t0) {
      SimNum.mostrarMensaje('edo-resultado', 'El tiempo final debe ser mayor que el inicial.', 'error');
      return;
    }
    if (h <= 0) {
      SimNum.mostrarMensaje('edo-resultado', 'El paso h debe ser positivo.', 'error');
      return;
    }

    let f;
    try {
      f = (t, y) => SimNum.evaluarFuncionDos(exprDY, t, y);
      f(t0, y0); // prueba
    } catch (e) {
      SimNum.mostrarMensaje('edo-resultado', `Error en la expresión: ${e.message}`, 'error');
      return;
    }

    let eulerRes  = null;
    let rk4Res    = null;

    if (metodo === 'euler' || metodo === 'ambos') {
      eulerRes = euler(f, t0, y0, tf, h);
    }
    if (metodo === 'rk4' || metodo === 'ambos') {
      rk4Res = rk4(f, t0, y0, tf, h);
    }

    mostrarResultados(eulerRes, rk4Res, metodo);
  }

  /* ══════════════════════════════════════════════
     RENDERIZADO
     ══════════════════════════════════════════════ */
  function mostrarResultados(eulerRes, rk4Res, metodo) {
    const contenedor = document.getElementById('edo-resultado');
    if (!contenedor) return;

    // Mensajes de estado
    let mensajes = '';
    if (eulerRes?.mensaje) mensajes += `<div class="alert-resultado info mb-1">Euler: ${eulerRes.mensaje}</div>`;
    if (rk4Res?.mensaje)   mensajes += `<div class="alert-resultado info mb-1">RK4: ${rk4Res.mensaje}</div>`;

    // Tabla con datos de ejemplo (los puntos iniciales disponibles)
    const ref = rk4Res || eulerRes;
    if (!ref) { contenedor.innerHTML = mensajes; return; }

    const headers = ['t'];
    if (eulerRes) headers.push('y (Euler)');
    if (rk4Res)   headers.push('y (RK4)');

    const maxPuntos = Math.max(eulerRes?.ts.length || 0, rk4Res?.ts.length || 0);
    const rows = [];
    for (let i = 0; i < maxPuntos; i++) {
      const fila = [SimNum.redondear(ref.ts[i] ?? 0, 4)];
      if (eulerRes) fila.push(eulerRes.ys[i] !== undefined ? SimNum.redondear(eulerRes.ys[i], 6) : '—');
      if (rk4Res)   fila.push(rk4Res.ys[i]   !== undefined ? SimNum.redondear(rk4Res.ys[i], 6) : '—');
      rows.push(fila);
    }

    contenedor.innerHTML = mensajes + SimNum.generarTablaHTML(headers, rows, 30);

    dibujarGrafico(eulerRes, rk4Res, metodo);
  }

  /* ══════════════════════════════════════════════
     GRÁFICO
     ══════════════════════════════════════════════ */
  function dibujarGrafico(eulerRes, rk4Res, metodo) {
    const canvas = SimNum.prepararCanvas('edo-chart');
    if (!canvas) return;

    const datasets = [];

    if (eulerRes?.ts.length > 1) {
      datasets.push({
        label: 'Euler',
        data: eulerRes.ts.map((t, i) => ({ x: t, y: eulerRes.ys[i] })),
        borderColor: '#fd7e14',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
      });
    }

    if (rk4Res?.ts.length > 1) {
      datasets.push({
        label: 'RK4',
        data: rk4Res.ts.map((t, i) => ({ x: t, y: rk4Res.ys[i] })),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.07)',
        borderWidth: 2.5,
        pointRadius: 0,
        fill: true,
        tension: 0.2,
      });
    }

    if (!datasets.length) {
      dibujarGraficoEjemplo(); return;
    }

    new Chart(canvas, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        parsing: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { type: 'linear', title: { display: true, text: 't (tiempo)' }, ticks: { font: { size: 10 } } },
          y: { title: { display: true, text: 'y(t)' }, ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  function dibujarGraficoEjemplo() {
    const canvas = SimNum.prepararCanvas('edo-chart');
    if (!canvas) return;
    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{ label: 'Configure el modelo y presione "Simular"', data: [] }],
      },
      options: { responsive: true },
    });
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('edo-resultado');
    dibujarGraficoEjemplo();
  }

  return { init, cambiarEscenario, resolver, limpiar };
})();
