console.log('[SimNum] Módulo EcuacionesDiferenciales cargado correctamente.');

const EcuacionesDiferenciales = (function () {

  /* ══════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════ */
  function init() {
    escenarioReservasCritico();
  }

  /* ══════════════════════════════════════════════
     HELPER
     ══════════════════════════════════════════════ */
  function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  /* ══════════════════════════════════════════════
     SOLVERS 1D
     y: número escalar · f(t, y) → número
     Devuelven { ts: number[], ys: number[] }
     ══════════════════════════════════════════════ */

  /**
   * Euler: y_{n+1} = y_n + h·f(t_n, y_n)
   * Orden de error global: O(h)
   */
  function euler1D(f, t0, y0, tf, h) {
    const ts = [t0], ys = [y0];
    let t = t0, y = y0;
    while (t < tf - 1e-10) {
      const step = Math.min(h, tf - t);
      y = y + step * f(t, y);
      t = SimNum.redondear(t + step, 10);
      ts.push(t);
      ys.push(y);
    }
    return { ts, ys };
  }

  /**
   * Heun (predictor-corrector):
   *   k1 = f(t, y)
   *   ŷ  = y + h·k1
   *   k2 = f(t+h, ŷ)
   *   y_{n+1} = y + (h/2)·(k1 + k2)
   * Orden de error global: O(h²)
   */
  function heun1D(f, t0, y0, tf, h) {
    const ts = [t0], ys = [y0];
    let t = t0, y = y0;
    while (t < tf - 1e-10) {
      const step = Math.min(h, tf - t);
      const k1   = f(t, y);
      const yP   = y + step * k1;
      const k2   = f(t + step, yP);
      y = y + (step / 2) * (k1 + k2);
      t = SimNum.redondear(t + step, 10);
      ts.push(t);
      ys.push(y);
    }
    return { ts, ys };
  }

  /**
   * Runge-Kutta 4° orden:
   *   k1 = f(t,       y)
   *   k2 = f(t + h/2, y + h·k1/2)
   *   k3 = f(t + h/2, y + h·k2/2)
   *   k4 = f(t + h,   y + h·k3)
   *   y_{n+1} = y + (h/6)·(k1 + 2k2 + 2k3 + k4)
   * Orden de error global: O(h⁴)
   */
  function rk4_1D(f, t0, y0, tf, h) {
    const ts = [t0], ys = [y0];
    let t = t0, y = y0;
    while (t < tf - 1e-10) {
      const step = Math.min(h, tf - t);
      const k1 = f(t,            y);
      const k2 = f(t + step / 2, y + step * k1 / 2);
      const k3 = f(t + step / 2, y + step * k2 / 2);
      const k4 = f(t + step,     y + step * k3);
      y = y + (step / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t = SimNum.redondear(t + step, 10);
      ts.push(t);
      ys.push(y);
    }
    return { ts, ys };
  }

  /* ══════════════════════════════════════════════
     SOLVERS 3D  y = [N, M, D]
     F(t, yVec) → [dN/dt, dM/dt, dD/dt]
     Devuelven { ts: number[], ys: Array[] }
     ══════════════════════════════════════════════ */

  function euler3D(F, t0, y0Vec, tf, h) {
    const ts = [t0], ys = [[...y0Vec]];
    let t = t0, y = [...y0Vec];
    while (t < tf - 1e-10) {
      const step = Math.min(h, tf - t);
      const dy = F(t, y);
      y = y.map((v, i) => v + step * dy[i]);
      t = SimNum.redondear(t + step, 10);
      ts.push(t);
      ys.push([...y]);
    }
    return { ts, ys };
  }

  function heun3D(F, t0, y0Vec, tf, h) {
    const ts = [t0], ys = [[...y0Vec]];
    let t = t0, y = [...y0Vec];
    while (t < tf - 1e-10) {
      const step = Math.min(h, tf - t);
      const k1   = F(t, y);
      const yP   = y.map((v, i) => v + step * k1[i]);
      const k2   = F(t + step, yP);
      y = y.map((v, i) => v + (step / 2) * (k1[i] + k2[i]));
      t = SimNum.redondear(t + step, 10);
      ts.push(t);
      ys.push([...y]);
    }
    return { ts, ys };
  }

  function rk4_3D(F, t0, y0Vec, tf, h) {
    const ts = [t0], ys = [[...y0Vec]];
    let t = t0, y = [...y0Vec];
    while (t < tf - 1e-10) {
      const step = Math.min(h, tf - t);
      const k1 = F(t,            y);
      const k2 = F(t + step / 2, y.map((v, i) => v + step * k1[i] / 2));
      const k3 = F(t + step / 2, y.map((v, i) => v + step * k2[i] / 2));
      const k4 = F(t + step,     y.map((v, i) => v + step * k3[i]));
      y = y.map((v, i) => v + (step / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      t = SimNum.redondear(t + step, 10);
      ts.push(t);
      ys.push([...y]);
    }
    return { ts, ys };
  }

  /* ══════════════════════════════════════════════
     MODELO SOCIAL  N–M–D
     N'(t) = −a·N·M + b·D
     M'(t) =  a·N·M − c·M·D
     D'(t) =  k·M   − r·D
     ══════════════════════════════════════════════ */
  function modeloSocial({ a, b, c, kParam, r }) {
    return function (t, y) {
      const [N, M, D] = y;
      return [
        -a * N * M + b * D,
         a * N * M - c * M * D,
         kParam * M - r * D,
      ];
    };
  }

  /* ══════════════════════════════════════════════
     CAMBIAR ESCENARIO (UI)
     ══════════════════════════════════════════════ */
  function cambiarEscenario() {
    const escenario = document.getElementById('edo-escenario')?.value || 'reservas';
    const p1 = document.getElementById('edo-params-1d');
    const p3 = document.getElementById('edo-params-3d');

    if (p1) p1.style.display = escenario === 'social' ? 'none' : '';
    if (p3) p3.style.display = escenario === 'social' ? '' : 'none';

    if (escenario === 'reservas') {
      _set('edo-dy', '-(0.05 + 0.008 * t) * y');
      _set('edo-y0', '1000');
      _set('edo-t0', '0');
      _set('edo-tf', '30');
      _set('edo-h',  '0.5');
      const hint = document.getElementById('edo-hint');
      if (hint) hint.textContent = 'Vaciado acelerado: tasa de extracción crece con el tiempo → reservas críticas en t≈30.';
    } else {
      _set('edo-t0', '0');
      _set('edo-tf', '50');
      _set('edo-h',  '0.25');
      _set('edo-N0', '990');
      _set('edo-M0', '10');
      _set('edo-D0', '0');
      _set('edo-sa', '0.003');
      _set('edo-sb', '0.02');
      _set('edo-sc', '0.01');
      _set('edo-sk', '0.08');
      _set('edo-sr', '0.04');
    }
  }

  /* ══════════════════════════════════════════════
     ESCENARIOS PREFIJADOS
     ══════════════════════════════════════════════ */

  /**
   * Reservas críticas: R'(t) = -(0.05 + 0.008·t)·R
   * Con R₀=1000, la solución analítica es R(t) = 1000·e^(−0.05t−0.004t²).
   * En t=30: R(30) ≈ 6.1 (vaciado casi completo).
   */
  function escenarioReservasCritico() {
    _set('edo-escenario', 'reservas');
    cambiarEscenario();
    _set('edo-method', 'todos');
    simular();
  }

  /**
   * Conflicto social: sistema N–M–D con protesta que crece, alcanza un pico y decae.
   * Parámetros elegidos para que M(t) tenga un pico visible alrededor de t≈12.
   */
  function escenarioConflictoSocial() {
    _set('edo-escenario', 'social');
    cambiarEscenario();
    _set('edo-method', 'todos');
    simular();
  }

  /* ══════════════════════════════════════════════
     CONTROLADOR PRINCIPAL
     ══════════════════════════════════════════════ */
  function simular() {
    const escenario = document.getElementById('edo-escenario')?.value || 'reservas';
    const metodo    = document.getElementById('edo-method')?.value || 'rk4';
    const t0 = parseFloat(document.getElementById('edo-t0')?.value);
    const tf = parseFloat(document.getElementById('edo-tf')?.value);
    const h  = parseFloat(document.getElementById('edo-h')?.value);

    if ([t0, tf, h].some(isNaN)) {
      SimNum.mostrarMensaje('edo-resultado', 'Complete los parámetros t₀, tₙ y h.', 'error');
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

    if (escenario === 'social') {
      _simularSocial(metodo, t0, tf, h);
    } else {
      _simularReservas(metodo, t0, tf, h);
    }
  }

  function _simularReservas(metodo, t0, tf, h) {
    const exprDY = document.getElementById('edo-dy')?.value?.trim();
    const y0     = parseFloat(document.getElementById('edo-y0')?.value);

    if (!exprDY) {
      SimNum.mostrarMensaje('edo-resultado', 'Ingrese la expresión dy/dt = f(t, y).', 'error');
      return;
    }
    if (isNaN(y0)) {
      SimNum.mostrarMensaje('edo-resultado', 'Ingrese la condición inicial R₀.', 'error');
      return;
    }

    let f;
    try {
      f = (t, y) => SimNum.evaluarFuncionDos(exprDY, t, y);
      f(t0, y0);
    } catch (e) {
      SimNum.mostrarMensaje('edo-resultado', `Error en la expresión: ${e.message}`, 'error');
      return;
    }

    const eulerRes = (metodo === 'euler' || metodo === 'todos') ? euler1D(f, t0, y0, tf, h) : null;
    const heunRes  = (metodo === 'heun'  || metodo === 'todos') ? heun1D(f,  t0, y0, tf, h) : null;
    const rk4Res   = (metodo === 'rk4'   || metodo === 'todos') ? rk4_1D(f,  t0, y0, tf, h) : null;

    _mostrarTabla1D({ eulerRes, heunRes, rk4Res });
    _dibujarGrafico1D({ eulerRes, heunRes, rk4Res });
  }

  function _simularSocial(metodo, t0, tf, h) {
    const N0 = parseFloat(document.getElementById('edo-N0')?.value);
    const M0 = parseFloat(document.getElementById('edo-M0')?.value);
    const D0 = parseFloat(document.getElementById('edo-D0')?.value);
    const a  = parseFloat(document.getElementById('edo-sa')?.value);
    const b  = parseFloat(document.getElementById('edo-sb')?.value);
    const c  = parseFloat(document.getElementById('edo-sc')?.value);
    const kParam = parseFloat(document.getElementById('edo-sk')?.value);
    const r  = parseFloat(document.getElementById('edo-sr')?.value);

    if ([N0, M0, D0, a, b, c, kParam, r].some(isNaN)) {
      SimNum.mostrarMensaje('edo-resultado', 'Complete todos los parámetros del modelo social.', 'error');
      return;
    }

    const F     = modeloSocial({ a, b, c, kParam, r });
    const y0Vec = [N0, M0, D0];

    const eulerRes = (metodo === 'euler' || metodo === 'todos') ? euler3D(F, t0, y0Vec, tf, h) : null;
    const heunRes  = (metodo === 'heun'  || metodo === 'todos') ? heun3D(F,  t0, y0Vec, tf, h) : null;
    const rk4Res   = (metodo === 'rk4'   || metodo === 'todos') ? rk4_3D(F,  t0, y0Vec, tf, h) : null;

    _mostrarTabla3D({ eulerRes, heunRes, rk4Res });
    _dibujarGrafico3D({ eulerRes, heunRes, rk4Res }, metodo);
  }

  /* ══════════════════════════════════════════════
     TABLAS
     ══════════════════════════════════════════════ */
  function _mostrarTabla1D({ eulerRes, heunRes, rk4Res }) {
    const el = document.getElementById('edo-resultado');
    if (!el) return;

    const ref = rk4Res || heunRes || eulerRes;
    if (!ref) return;

    const headers = ['t'];
    if (eulerRes) headers.push('R(t) — Euler');
    if (heunRes)  headers.push('R(t) — Heun');
    if (rk4Res)   headers.push('R(t) — RK4');

    const rows = ref.ts.map((t, i) => {
      const fila = [SimNum.redondear(t, 4)];
      if (eulerRes) fila.push(eulerRes.ys[i] !== undefined ? eulerRes.ys[i] : '—');
      if (heunRes)  fila.push(heunRes.ys[i]  !== undefined ? heunRes.ys[i]  : '—');
      if (rk4Res)   fila.push(rk4Res.ys[i]   !== undefined ? rk4Res.ys[i]  : '—');
      return fila;
    });

    el.innerHTML = SimNum.generarTablaHTML(headers, rows, 30);
  }

  function _mostrarTabla3D({ eulerRes, heunRes, rk4Res }) {
    const el = document.getElementById('edo-resultado');
    if (!el) return;

    const ref   = rk4Res || heunRes || eulerRes;
    if (!ref) return;
    const etiq  = rk4Res ? 'RK4' : heunRes ? 'Heun' : 'Euler';
    const headers = ['t', `N(t) — ${etiq}`, `M(t) — ${etiq}`, `D(t) — ${etiq}`];

    const rows = ref.ts.map((t, i) => {
      const [N, M, D] = ref.ys[i];
      return [
        SimNum.redondear(t, 3),
        SimNum.redondear(N, 2),
        SimNum.redondear(M, 2),
        SimNum.redondear(D, 2),
      ];
    });

    el.innerHTML = SimNum.generarTablaHTML(headers, rows, 30);
  }

  /* ══════════════════════════════════════════════
     GRÁFICOS
     ══════════════════════════════════════════════ */
  function _dibujarGrafico1D({ eulerRes, heunRes, rk4Res }) {
    const canvas = SimNum.prepararCanvas('edo-chart');
    if (!canvas) return;

    const datasets = [];
    if (eulerRes) datasets.push({
      label: 'Euler',
      data: eulerRes.ts.map((t, i) => ({ x: t, y: eulerRes.ys[i] })),
      borderColor: '#fd7e14', backgroundColor: 'transparent',
      borderWidth: 1.5, pointRadius: 0, tension: 0.2, parsing: false,
    });
    if (heunRes) datasets.push({
      label: 'Heun',
      data: heunRes.ts.map((t, i) => ({ x: t, y: heunRes.ys[i] })),
      borderColor: '#6f42c1', backgroundColor: 'transparent',
      borderWidth: 1.5, pointRadius: 0, tension: 0.2, parsing: false,
    });
    if (rk4Res) datasets.push({
      label: 'RK4',
      data: rk4Res.ts.map((t, i) => ({ x: t, y: rk4Res.ys[i] })),
      borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,0.07)',
      borderWidth: 2.5, pointRadius: 0, fill: true, tension: 0.2, parsing: false,
    });

    new Chart(canvas, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { type: 'linear', title: { display: true, text: 't (días)' }, ticks: { font: { size: 10 } } },
          y: { title: { display: true, text: 'R(t) toneladas' }, ticks: { font: { size: 10 } } },
        },
      },
    });

    // Segundo gráfico no aplica para 1D
    const c2 = document.getElementById('edo-chart-2');
    if (c2) { c2.style.display = 'none'; SimNum.prepararCanvas('edo-chart-2'); }
  }

  function _dibujarGrafico3D({ eulerRes, heunRes, rk4Res }, metodo) {
    const canvas = SimNum.prepararCanvas('edo-chart');
    if (!canvas) return;

    const ref  = rk4Res || heunRes || eulerRes;
    const etiq = rk4Res ? 'RK4' : heunRes ? 'Heun' : 'Euler';
    const xy   = (res, idx) => res.ts.map((t, i) => ({ x: t, y: res.ys[i][idx] }));

    // Gráfico principal: N, M, D del método de referencia
    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: `N(t) — ${etiq}`,
            data: xy(ref, 0),
            borderColor: '#198754', backgroundColor: 'transparent',
            borderWidth: 2, pointRadius: 0, tension: 0.3, parsing: false,
          },
          {
            label: `M(t) — ${etiq} (manifestantes)`,
            data: xy(ref, 1),
            borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.08)',
            borderWidth: 2, pointRadius: 0, fill: true, tension: 0.3, parsing: false,
          },
          {
            label: `D(t) — ${etiq} (detenidos)`,
            data: xy(ref, 2),
            borderColor: '#fd7e14', backgroundColor: 'transparent',
            borderWidth: 2, pointRadius: 0, tension: 0.3, parsing: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { type: 'linear', title: { display: true, text: 't (días)' }, ticks: { font: { size: 10 } } },
          y: { title: { display: true, text: 'Personas' }, ticks: { font: { size: 10 } } },
        },
      },
    });

    // Gráfico secundario: comparación de M(t) entre métodos (solo si todos seleccionados)
    const c2 = document.getElementById('edo-chart-2');
    if (!c2) return;

    const tieneMultiples = [eulerRes, heunRes, rk4Res].filter(Boolean).length > 1;

    if (metodo === 'todos' && tieneMultiples) {
      c2.style.display = '';
      const canvas2 = SimNum.prepararCanvas('edo-chart-2');
      const ds2 = [];
      if (eulerRes) ds2.push({
        label: 'M(t) — Euler',
        data: xy(eulerRes, 1),
        borderColor: '#fd7e14', borderWidth: 1.5, pointRadius: 0, parsing: false, tension: 0.3,
      });
      if (heunRes) ds2.push({
        label: 'M(t) — Heun',
        data: xy(heunRes, 1),
        borderColor: '#6f42c1', borderWidth: 1.5, pointRadius: 0, parsing: false, tension: 0.3,
      });
      if (rk4Res) ds2.push({
        label: 'M(t) — RK4',
        data: xy(rk4Res, 1),
        borderColor: '#dc3545', borderWidth: 2.5, pointRadius: 0, parsing: false, tension: 0.3,
      });
      new Chart(canvas2, {
        type: 'line',
        data: { datasets: ds2 },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top', labels: { font: { size: 11 } } },
            title: {
              display: true,
              text: 'Comparación de métodos — M(t) manifestantes activos',
              font: { size: 12 },
            },
          },
          scales: {
            x: { type: 'linear', title: { display: true, text: 't' }, ticks: { font: { size: 10 } } },
            y: { title: { display: true, text: 'M(t)' }, ticks: { font: { size: 10 } } },
          },
        },
      });
    } else {
      c2.style.display = 'none';
      SimNum.prepararCanvas('edo-chart-2');
    }
  }

  /* ══════════════════════════════════════════════
     LIMPIAR
     ══════════════════════════════════════════════ */
  function limpiar() {
    SimNum.limpiarContenedor('edo-resultado');
    const c2 = document.getElementById('edo-chart-2');
    if (c2) { c2.style.display = 'none'; SimNum.prepararCanvas('edo-chart-2'); }
    const c1 = SimNum.prepararCanvas('edo-chart');
    if (!c1) return;
    new Chart(c1, {
      type: 'line',
      data: { datasets: [{ label: 'Configure el modelo y presione "Simular"', data: [] }] },
      options: { responsive: true },
    });
  }

  return {
    init,
    simular,
    cambiarEscenario,
    escenarioReservasCritico,
    escenarioConflictoSocial,
    limpiar,
  };
})();
