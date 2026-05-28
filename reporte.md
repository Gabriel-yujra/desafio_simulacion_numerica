# Reporte del Proyecto — Simulación Numérica de Abastecimiento

**Fecha:** 28 de mayo de 2026  
**Rama activa:** `feat/module_roots_of_equations`  
**Tecnologías:** HTML + CSS (Bootstrap 5.3.3) + JavaScript vanilla + Chart.js 4.4.3

---

## Estado general de la página

La aplicación es una SPA (Single Page Application) estática, sin framework ni proceso de compilación. Se abre directamente en el navegador o con un servidor local (ej. `python -m http.server 8080`). El navbar tiene scroll-spy manual y cierre automático en móvil.

| Módulo | Estado |
|---|---|
| Sistemas de ecuaciones lineales | **Completamente implementado** |
| Raíces de ecuaciones | **Completamente implementado** |
| Interpolación | **UI lista — algoritmos pendientes (stubs)** |
| Integración numérica | **UI lista — algoritmos pendientes (stubs)** |
| Ecuaciones diferenciales (EDO) | **UI lista — algoritmos pendientes (stubs)** |

---

## Módulo 1 — Sistemas de ecuaciones lineales

**Archivo:** `js/sistemas_lineales.js`  
**Contexto del problema:** Optimización del abastecimiento y red de transporte (flujos planta → zona).

### Métodos implementados

#### LU — Factorización directa
- Factoriza la matriz A en dos matrices triangulares: L (inferior) y U (superior).
- Resuelve Ly = b por sustitución hacia adelante, luego Ux = y por sustitución hacia atrás.
- Ventaja: solución exacta en una sola pasada, sin iteraciones.
- Limitación: sin pivoteo; falla si hay un cero en la diagonal durante la factorización.
- El gráfico de resultado es un diagrama de barras con los valores de x₁, x₂, ..., xₙ.

#### Jacobi — Iterativo clásico
- Fórmula: `xᵢ^(k+1) = (bᵢ − Σⱼ≠ᵢ aᵢⱼ·xⱼ^(k)) / aᵢᵢ`
- Usa todos los valores del paso anterior para calcular la nueva iteración (paralelizable).
- Converge si la matriz es diagonalmente dominante estricta por filas.
- Criterio de parada: norma euclídea del residuo `||Ax − b|| < tol`.

#### Gauss-Seidel — Iterativo mejorado
- Igual que Jacobi pero reutiliza los valores ya actualizados dentro de la misma iteración (j < i).
- Converge aprox. el doble de rápido que Jacobi en la mayoría de los casos.
- Mismo criterio de convergencia: `||Ax − b|| < tol`.

#### SOR — Sobre-relajación sucesiva
- Extiende Gauss-Seidel con un factor de relajación ω: `xᵢ^(k+1) = (1−ω)·xᵢ^(k) + ω·xᵢ^(GS)`
- ω = 1 → equivale a Gauss-Seidel exacto.
- ω ∈ (1, 2) → sobre-relajación, acelera la convergencia cuando se conoce ω óptimo.
- ω ∈ (0, 1) → sub-relajación, estabiliza sistemas problemáticos.
- El campo ω solo aparece en la UI cuando se selecciona este método.

#### Gradiente Conjugado
- Para matrices simétricas definidas positivas.
- Converge en ≤ n iteraciones en aritmética exacta.
- Algoritmo: calcula direcciones de descenso conjugadas; actualiza x, el residuo r y la dirección p cada paso.
- Muy eficiente para sistemas grandes y dispersos.

### Lo que puede hacer ahora
- Seleccionar tamaño de matriz: 2×2, 3×3, 4×4 o 5×5.
- Editar cada celda de la matriz A y el vector b directamente en la tabla.
- Cargar dos ejemplos precargados: "Red de abastecimiento" (3×3 bien condicionado) y "Sistema mal condicionado" (matriz de Hilbert 3×3).
- Resolver con cualquiera de los 5 métodos.
- Ver la solución x, la norma del residuo `||Ax − b||` y un indicador heurístico de condicionamiento.
- Ver tabla de iteraciones con residuo por paso (métodos iterativos) o la solución directa (LU).
- Ver gráfico de convergencia (log₁₀ del residuo vs iteración) o barras de solución (LU).
- Advertencia automática si la matriz no es diagonalmente dominante al usar métodos iterativos.

---

## Módulo 2 — Raíces de ecuaciones

**Archivo:** `js/raices.js`  
**Contexto del problema:** Umbrales críticos de precio y puntos de equilibrio en el mercado de bienes básicos.

### Métodos implementados

#### Bisección
- Requiere que f(a)·f(b) < 0 (cambio de signo en el intervalo).
- Divide el intervalo [a, b] por la mitad en cada paso.
- El nuevo subintervalo es el que contiene el cambio de signo.
- Convergencia: lineal en número de bits; garantizada si se cumple la condición inicial.
- Criterio de parada: `(b − a)/2 < tol` o `|f(xₘ)| < tol`.
- Historia guardada por iteración: `{n, a, b, xₘ, f(xₘ), error}`.

#### Newton-Raphson
- Fórmula: `xₙ₊₁ = xₙ − f(xₙ) / f'(xₙ)`
- Convergencia cuadrática cerca de la raíz; muy rápido si x₀ está bien elegido.
- f'(x) puede ser analítica (el usuario la escribe) o numérica automática via diferencias centradas: `f'(x) ≈ (f(x+h) − f(x−h)) / (2h)` con h = 1e-5.
- Aborta si `|f'(xₙ)| < 1e-14` para evitar división por cero.
- Historia guardada por iteración: `{n, xₙ, f(xₙ), f'(xₙ), error}`.

#### Secante
- Fórmula: `xₙ₊₁ = xₙ − f(xₙ)·(xₙ − xₙ₋₁) / (f(xₙ) − f(xₙ₋₁))`
- Orden de convergencia ≈ 1.618 (razón áurea); no requiere derivada analítica.
- Usa dos puntos iniciales x₀ y x₁.
- Aborta si el denominador `f(xₙ) − f(xₙ₋₁) ≈ 0`.
- Historia guardada por iteración: `{n, xₙ₋₁, xₙ, f(xₙ), error}`.

### Comportamiento dinámico del formulario
- Al cambiar el método, el formulario se adapta automáticamente:
  - **Bisección:** muestra a y b; oculta derivada.
  - **Newton:** muestra solo x₀; muestra campo de f'(x) opcional.
  - **Secante:** muestra x₀ y x₁; oculta derivada.
- Los labels de los campos cambian de texto según el método activo.

### Lo que puede hacer ahora
- Ingresar cualquier función f(x) como expresión JavaScript (ej. `Math.pow(x,2) - 4`).
- Seleccionar método, parámetros (a/b/x₀/x₁), tolerancia y máximo de iteraciones.
- Cargar dos ejemplos contextualizados:
  - **Umbral costo/ingreso:** `f(x) = 1200 − 80x − 200·e^(0.1x)` → raíz ≈ 8.95 (mes en que el gasto supera al ingreso).
  - **Umbral de reposición:** `f(x) = 500·e^(−0.2x) − 50·(x+1)` → raíz ≈ 3.82 (equilibrio demanda/oferta).
- Ver resumen: raíz aproximada x*, f(x*) de verificación, mensaje de convergencia.
- Ver tabla de iteraciones adaptada al método seleccionado.
- Ver gráfico con la curva f(x), línea y = 0, hasta 20 puntos de iteración (naranja) y la raíz marcada con una × roja.

---

## Módulo 3 — Interpolación

**Archivo:** `js/interpolacion.js`  
**Contexto del problema:** Reconstrucción de curvas de precios de alimentos a partir de datos históricos discretos.

### Estado actual
Los **algoritmos numéricos están pendientes de implementación** (stubs con TODO). La estructura de la UI, la lectura de datos y el renderizado están completos.

### Métodos definidos (pendientes)

#### Lagrange
- Fórmula pendiente: `P(x) = Σᵢ [ yᵢ · Lᵢ(x) ]` donde `Lᵢ(x) = Πⱼ≠ᵢ (x − xⱼ) / (xᵢ − xⱼ)`
- Actualmente retorna `{ valor: null }`.

#### Newton — Diferencias Divididas
- Tabla de diferencias divididas pendiente: `f[xᵢ, xᵢ₊₁] = (f[xᵢ₊₁] − f[xᵢ]) / (xᵢ₊₁ − xᵢ)`
- Actualmente retorna `{ valor: null, tablaDD: [], coeficientes: [] }`.
- Nota: el nombre interno de la función tiene un typo (`newtonDivididads`) que debe corregirse al implementar.

### Lo que puede hacer ahora
- Agregar y quitar filas de puntos (x, y) en la tabla interactiva.
- Los puntos se ordenan automáticamente por x antes de interpolar.
- Seleccionar el método (Lagrange o Newton).
- Ingresar el valor x a evaluar.
- Detectar y advertir si se está extrapolando fuera del rango de los datos.
- El gráfico muestra los puntos originales como scatter; cuando los algoritmos estén implementados mostrará también la curva continua P(x).

---

## Módulo 4 — Integración numérica

**Archivo:** `js/integracion.js`  
**Contexto del problema:** Cálculo del costo acumulado de una canasta básica y estimación de la pérdida de poder adquisitivo durante períodos de inflación.

### Estado actual
Los **algoritmos numéricos están pendientes de implementación** (stubs con TODO). La UI, validaciones y renderizado están completos.

### Métodos definidos (pendientes)

#### Trapecio compuesto
- Fórmula pendiente: `I ≈ (h/2) · [f(a) + 2·Σᵢ₌₁ⁿ⁻¹ f(a + i·h) + f(b)]`
- Error teórico: `−((b−a)³ / (12n²)) · f''(ξ)`

#### Simpson 1/3 compuesto
- Fórmula pendiente: `I ≈ (h/3) · [f(a) + 4·Σ impares + 2·Σ pares + f(b)]`
- Requiere n par; el controlador lo ajusta automáticamente.
- Error teórico: `−((b−a)⁵ / (180n⁴)) · f⁽⁴⁾(ξ)`

#### Simpson 3/8 compuesto
- Fórmula pendiente: `I ≈ (3h/8) · [f(x₀) + 3·Σⱼ≠múltiplo3 f(xⱼ) + 2·Σ múltiplos3 f(xⱼ) + f(xₙ)]`
- Requiere n múltiplo de 3; el controlador lo ajusta automáticamente.

### Lo que puede hacer ahora
- Ingresar cualquier función f(x) como expresión JavaScript.
- Configurar límites a, b y número de subintervalos n.
- Seleccionar uno o más métodos simultáneamente (checkboxes independientes).
- El controlador ajusta n automáticamente para cumplir los requisitos de cada método.
- Ver la curva f(x) en el gráfico de área al calcular.
- La tabla de resultados ya está wired; mostrará los valores reales cuando los algoritmos estén implementados.

---

## Módulo 5 — Ecuaciones Diferenciales (EDO)

**Archivo:** `js/ecuaciones_diferenciales.js`  
**Contexto del problema:** Modelado de sistemas dinámicos de abastecimiento.

### Estado actual
Los **algoritmos numéricos están pendientes de implementación** (stubs con TODO). La UI, los escenarios precargados y el renderizado están completos.

### Métodos definidos (pendientes)

#### Euler (primer orden)
- Fórmula pendiente: `yₙ₊₁ = yₙ + h · f(tₙ, yₙ)`
- El más simple; error local O(h²), error global O(h).

#### Runge-Kutta 4° orden (RK4)
- Fórmula pendiente con 4 pendientes intermedias: k1, k2, k3, k4.
- `yₙ₊₁ = yₙ + (h/6)·(k1 + 2k2 + 2k3 + k4)`
- Error global O(h⁴); mucho más preciso que Euler con el mismo paso h.

### Escenarios precargados

| Escenario | Ecuación | Condición inicial | Intervalo | Paso h |
|---|---|---|---|---|
| Vaciado de reservas | `dy/dt = −0.1·y` | y(0) = 1000 | [0, 30] | 1 |
| Descontento social | `dy/dt = 0.3·y·(1 − y/500)` | y(0) = 5 | [0, 40] | 0.5 |

- El primer escenario modela decay exponencial (tasa de consumo proporcional al nivel de reservas).
- El segundo modela crecimiento logístico (el descontento crece hasta una capacidad máxima K = 500).

### Lo que puede hacer ahora
- Cambiar entre los dos escenarios precargados; el formulario se llena automáticamente.
- Ingresar dy/dt como expresión f(t, y) arbitraria.
- Configurar condición inicial y₀, intervalo [t₀, tf] y paso h.
- Seleccionar Euler, RK4, o ambos simultáneamente para comparar.
- La UI de tabla y gráfico están completamente wired; mostrarán los datos reales cuando los algoritmos estén implementados.

---

## Arquitectura y utilidades compartidas

Todos los módulos siguen el patrón IIFE: `const Modulo = (function(){ ... return { init, ... }; })();`

El objeto `SimNum` (definido en `main.js`) provee utilidades compartidas:

| Utilidad | Uso |
|---|---|
| `SimNum.mostrarMensaje(id, msg, tipo)` | Renderiza un alert de éxito/error/info |
| `SimNum.limpiarContenedor(id)` | Resetea un contenedor a texto placeholder |
| `SimNum.generarTablaHTML(headers, rows, maxRows)` | Genera tablas Bootstrap responsivas |
| `SimNum.evaluarFuncion(expr, x)` | Evalúa f(x) escrita por el usuario como JS |
| `SimNum.evaluarFuncionDos(expr, t, y)` | Evalúa f(t,y) para EDOs |
| `SimNum.redondear(val, decimales)` | Redondea evitando ruido flotante (1e-16) |
| `SimNum.prepararCanvas(canvasId)` | Destruye el Chart.js anterior antes de redibujar |
