/**
 * main.js — Lógica global de SimNum
 *
 * Responsabilidades:
 *  - Tema claro/oscuro (localStorage, clase en <body>, toggle en navbar).
 *  - Activación del enlace activo del navbar por URL.
 *  - Cerrar el menú móvil al hacer clic en un enlace.
 *  - Utilidades compartidas por todos los módulos (SimNum.*).
 */


/* ══════════════════════════════════════════════
   1. TEMA CLARO / OSCURO
   ══════════════════════════════════════════════ */
(function initTheme() {
  const STORAGE_KEY = 'simnum-theme';
  const savedTheme = localStorage.getItem(STORAGE_KEY) || 'dark';

  function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add('theme-' + theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
  }

  // Aplica el tema inmediatamente (body ya existe al estar el script al fondo del body)
  applyTheme(savedTheme);

  // Conecta el botón una vez que el DOM está completamente cargado
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      applyTheme(document.body.classList.contains('theme-dark') ? 'light' : 'dark');
    });
  });
})();


/* ══════════════════════════════════════════════
   2. ACTIVACIÓN DE ENLACE DE NAVBAR POR URL
   ══════════════════════════════════════════════ */
(function initActiveNavLink() {
  const navLinks = document.querySelectorAll('#navbarMain .nav-link');
  const path = window.location.pathname;
  let pageName = path.split('/').pop() || 'index.html';

  if (pageName === '') {
    pageName = 'index.html';
  }

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === pageName);
  });
})();


/* ══════════════════════════════════════════════
   3. CERRAR MENÚ MÓVIL AL NAVEGAR
   ══════════════════════════════════════════════ */
(function initMobileMenuClose() {
  const navLinks  = document.querySelectorAll('#navMenu .nav-link');
  const navCollapse = document.getElementById('navMenu');
  if (!navCollapse) return;

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Bootstrap expone Collapse a través de la instancia adjunta al elemento
      const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
      if (bsCollapse) bsCollapse.hide();
    });
  });
})();


/* ══════════════════════════════════════════════
   4. UTILIDADES GLOBALES
   Disponibles en todos los módulos vía SimNum.*
   ══════════════════════════════════════════════ */
const SimNum = (function () {

  /**
   * Muestra un mensaje de estado dentro de un contenedor.
   * @param {string}  containerId  ID del elemento DOM destino
   * @param {string}  mensaje      Texto del mensaje
   * @param {'success'|'error'|'info'} tipo  Clase visual
   */
  function mostrarMensaje(containerId, mensaje, tipo = 'info') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="alert-resultado ${tipo}">${mensaje}</div>`;
  }

  /**
   * Limpia el contenido de un contenedor DOM.
   * @param {string} containerId
   */
  function limpiarContenedor(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '<p class="text-muted small">Los resultados se mostrarán aquí.</p>';
  }

  /**
   * Genera el HTML de una tabla a partir de encabezados y filas.
   * @param {string[]}   headers  Array de textos de encabezado
   * @param {Array[]}    rows     Array de arrays con valores por fila
   * @param {number}     [maxRows=50]  Límite de filas renderizadas
   * @returns {string}   HTML de la tabla
   */
  function generarTablaHTML(headers, rows, maxRows = 50) {
    const ths = headers.map(h => `<th>${h}</th>`).join('');
    const filas = rows.slice(0, maxRows).map(row => {
      const tds = row.map(v => `<td>${typeof v === 'number' ? redondear(v, 8) : v}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    const nota = rows.length > maxRows
      ? `<tr><td colspan="${headers.length}" class="text-muted text-center small">
           … mostrando ${maxRows} de ${rows.length} filas
         </td></tr>`
      : '';

    return `
      <div class="table-responsive">
        <table class="table table-sm table-bordered table-hover mb-0">
          <thead class="table-primary"><tr>${ths}</tr></thead>
          <tbody>${filas}${nota}</tbody>
        </table>
      </div>`;
  }

  /**
   * Evalúa una función f(x) ingresada como string por el usuario.
   * Usa Function() con contexto restringido para evitar acceso global.
   * @param {string} expr  Expresión JS, ej: "Math.pow(x,2) - 4"
   * @param {number} x
   * @returns {number}
   */
  function evaluarFuncion(expr, x) {
    // eslint-disable-next-line no-new-func
    return new Function('x', `'use strict'; return (${expr});`)(x);
  }

  /**
   * Evalúa una función f(t, y) para EDOs.
   * @param {string} expr
   * @param {number} t
   * @param {number} y
   * @returns {number}
   */
  function evaluarFuncionDos(expr, t, y) {
    // eslint-disable-next-line no-new-func
    return new Function('t', 'y', `'use strict'; return (${expr});`)(t, y);
  }

  /**
   * Redondea un número a n decimales (evita 1e-16 en pantalla).
   * @param {number} val
   * @param {number} [decimales=6]
   * @returns {number}
   */
  function redondear(val, decimales = 6) {
    return parseFloat(val.toFixed(decimales));
  }

  /**
   * Destruye un gráfico Chart.js previo si existe, para redibujar.
   * @param {string} canvasId
   * @returns {CanvasRenderingContext2D|null}
   */
  function prepararCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    // Destruir instancia Chart.js previa si existe
    const prev = Chart.getChart(canvas);
    if (prev) prev.destroy();
    return canvas;
  }

  // API pública
  return {
    mostrarMensaje,
    limpiarContenedor,
    generarTablaHTML,
    evaluarFuncion,
    evaluarFuncionDos,
    redondear,
    prepararCanvas,
  };
})();


/* ══════════════════════════════════════════════
   5. INICIALIZACIÓN GLOBAL AL CARGAR DOM
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  console.info('[SimNum] Página cargada correctamente.');
  console.info('[SimNum] Módulos disponibles: SistemasLineales, Raices, Interpolacion, Integracion, EDO');

  // Llamar a inicializaciones individuales de cada módulo si están cargados
  if (typeof SistemasLineales !== 'undefined' && typeof SistemasLineales.init === 'function') SistemasLineales.init();
  if (typeof Raices !== 'undefined' && typeof Raices.init === 'function')            Raices.init();
  if (typeof Interpolacion !== 'undefined' && typeof Interpolacion.init === 'function')     Interpolacion.init();
  if (typeof Integracion !== 'undefined' && typeof Integracion.init === 'function')       Integracion.init();
  if (typeof EcuacionesDiferenciales !== 'undefined' && typeof EcuacionesDiferenciales.init === 'function') EcuacionesDiferenciales.init();
});
