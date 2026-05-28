# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Pure static frontend — no build step, no package manager, no bundler. Open `index.html` directly in a browser or serve it with any static file server.

```bash
# Quickest local server (Python 3)
python -m http.server 8080
# then open http://localhost:8080
```

No linting, testing framework, or CI pipeline is configured. Correctness is verified by opening the page in a browser and exercising each module's UI.

## Architecture

**Single-page application** structured as one HTML file + independent JS modules, all communicating through a shared utility object.

### Script load order (index.html bottom of `<body>`)
```
sistemas_lineales.js → raices.js → interpolacion.js →
integracion.js → ecuaciones_diferenciales.js → main.js
```
`main.js` must load last; it calls `ModuleName.init()` on each module after the DOM is ready.

### Module pattern
Every JS file exposes a single IIFE assigned to a global `const`:

```js
const SistemasLineales = (function () {
  // private state
  return { init, resolver, limpiar }; // public API
})();
```

The public surface that `main.js` expects from every module: `init()`, and optionally `resolver()`/`calcular()`, `limpiar()`.

### Shared utility object — `SimNum` (defined in `main.js`)
All modules call these helpers instead of duplicating DOM/chart logic:

| Method | Purpose |
|---|---|
| `SimNum.mostrarMensaje(id, msg, tipo)` | Renders a styled alert inside a container |
| `SimNum.limpiarContenedor(id)` | Resets a result container to placeholder text |
| `SimNum.generarTablaHTML(headers, rows, maxRows)` | Returns a Bootstrap table HTML string |
| `SimNum.evaluarFuncion(expr, x)` | Evaluates a user-typed JS expression as f(x) |
| `SimNum.evaluarFuncionDos(expr, t, y)` | Evaluates f(t, y) for ODEs |
| `SimNum.redondear(val, decimales)` | Rounds and strips floating-point noise |
| `SimNum.prepararCanvas(canvasId)` | Destroys any existing Chart.js instance on the canvas and returns it |

### Chart.js usage
Every module that draws a chart follows this pattern:

```js
const canvas = SimNum.prepararCanvas('my-canvas-id'); // destroys old chart
new Chart(canvas, { type: 'line', data: {...}, options: {...} });
```

Chart instances are **not** stored globally; `prepararCanvas` uses `Chart.getChart()` to clean up before redrawing.

### DOM id conventions
Each module owns a namespace prefix to avoid collisions:

| Module | Prefix | Key container ids |
|---|---|---|
| Sistemas lineales | `sl-` | `sl-size`, `sl-matrix-container`, `sl-resultado`, `sl-tabla-iteraciones` |
| Raíces | `r-` | `r-funcion`, `r-a`, `r-b`, `r-tol`, `raices-resultado`, `raices-chart` |
| Interpolación | `interp-` | `interp-method`, `interp-tbody`, `interp-xeval`, `interp-resultado`, `interpolacion-chart` |
| Integración | `int-` | `int-funcion`, `int-a`, `int-b`, `int-n`, `int-resultado`, `integracion-chart` |
| EDO | `edo-` | `edo-escenario`, `edo-dy`, `edo-y0`, `edo-t0`, `edo-tf`, `edo-h`, `edo-resultado`, `edo-chart` |

### Section anchor ids (navbar targets)
`#inicio` · `#sistemas-lineales` · `#raices` · `#interpolacion` · `#integracion` · `#edo` · `#conclusiones`

## Implementing a numerical method

Each module file contains `// TODO:` stubs with the algorithm spelled out in comments. The pattern to follow when filling a stub:

1. Implement the core algorithm as a **pure function** (takes arrays/numbers, returns a result object).
2. Return `{ valor/x/ts/ys, iteraciones/history, convergio, mensaje }` — the renderer reads these fields.
3. The **controller function** (`resolver()`, `calcular()`, etc.) reads the DOM, calls the pure function, then calls the render/chart helpers.
4. Never read from or write to the DOM inside the pure algorithm functions.

## External dependencies (CDN only)

- Bootstrap 5.3.3 — layout and components
- Chart.js 4.4.3 — all charts

No other libraries. Do not introduce npm packages or local dependencies.
