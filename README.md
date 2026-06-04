# Simulación numérica de abastecimiento, precios y conflicto social

Trabajo final de la materia **Métodos Numéricos**.

---

## Descripción

Herramienta web interactiva que modela distintos escenarios de crisis mediante cinco familias de métodos numéricos. El caso de estudio se inspira en dinámicas de abastecimiento, precios y conflicto social observadas en ciudades altiplánicas como La Paz y El Alto (Bolivia); los valores numéricos son enteramente simulados con fines pedagógicos.

- Redes de distribución de bienes (sistemas de ecuaciones lineales)
- Umbrales críticos de precio y equilibrio de mercado (raíces de ecuaciones)
- Reconstrucción de curvas de precios históricos (interpolación)
- Costo acumulado y pérdida de poder adquisitivo (integración numérica)
- Vaciado de reservas y difusión del descontento social (ecuaciones diferenciales ordinarias)

> **Aviso académico:** todos los datos y modelos son ilustrativos. Esta herramienta no representa situaciones reales ni expresa posiciones políticas.

---

## Objetivos

**General:** Aplicar métodos numéricos computacionales para construir simulaciones interactivas que permitan analizar escenarios de abastecimiento, variación de precios y dinámica social, evaluando la precisión, convergencia y utilidad práctica de cada método.

**Específicos:**
1. Resolver sistemas de ecuaciones lineales para modelar flujos en redes de transporte (LU, Jacobi, Gauss-Seidel, SOR, Gradiente Conjugado).
2. Encontrar raíces de ecuaciones para identificar umbrales de precio (Bisección, Newton-Raphson, Secante).
3. Aplicar interpolación para reconstruir curvas de precios (Lagrange, Newton diferencias divididas, Spline cúbico natural).
4. Calcular integrales numéricas para estimar costos acumulados (Trapecio, Simpson 1/3, Simpson 3/8).
5. Resolver EDOs para simular vaciado de reservas y difusión del descontento (Euler, Heun, Runge-Kutta 4°).

---

## Módulos implementados

| Módulo | Métodos numéricos | Estado |
|---|---|---|
| Sistemas de ecuaciones lineales | LU, Jacobi, Gauss-Seidel, SOR, Gradiente Conjugado | ✅ Completo |
| Raíces de ecuaciones | Bisección, Newton-Raphson, Secante | ✅ Completo |
| Interpolación | Lagrange, Newton (Dif. divididas), Spline cúbico natural | ✅ Completo |
| Integración numérica | Trapecio, Simpson 1/3, Simpson 3/8 | ✅ Completo |
| Ecuaciones diferenciales | Euler, Heun (predictor-corrector), RK4 | ✅ Completo |

---

## Tecnologías

| Recurso | Uso |
|---|---|
| HTML5 | Estructura semántica de la página |
| CSS3 + Bootstrap 5.3.3 (CDN) | Diseño responsivo y componentes UI |
| JavaScript ES6+ | Lógica de cálculo y manipulación del DOM |
| Chart.js 4.4.3 (CDN) | Visualización de gráficos y curvas |

Sin backend. Página estática publicable directamente en GitHub Pages, Netlify o Vercel.

---

## Estructura del proyecto

```
simulacion_numerica_de_abastecimiento/
├── index.html                       ← Página principal (única)
├── README.md
├── css/
│   └── styles.css                   ← Estilos globales y responsivos
└── js/
    ├── main.js                      ← Inicialización, scroll-spy y utilidades SimNum
    ├── sistemas_lineales.js         ← LU, Jacobi, Gauss-Seidel, SOR, Gradiente Conjugado
    ├── raices.js                    ← Bisección, Newton-Raphson, Secante
    ├── interpolacion.js             ← Lagrange, Newton dif. divididas, Spline cúbico natural
    ├── integracion.js               ← Trapecio, Simpson 1/3, Simpson 3/8
    └── ecuaciones_diferenciales.js  ← Euler, Heun, RK4 (1D y 3D)
```

Cada archivo JS de módulo expone un IIFE con métodos públicos (`init`, `resolver`/`calcular`/`simular`, `limpiar`) llamados directamente desde los botones del HTML. Las utilidades compartidas están en el objeto `SimNum` definido en `main.js`.

---

## Cómo usar

### Ver en el navegador (desarrollo local)

```bash
# Clonar el repositorio
git clone https://github.com/Gabriel-yujra/simulacion_numerica_de_abastecimiento.git
cd simulacion_numerica_de_abastecimiento
```

Abrir `index.html` directamente en el navegador, o usar un servidor local para evitar restricciones CORS:

```bash
# Con Python 3
python -m http.server 8080
# Luego abrir http://localhost:8080
```

### Publicar en GitHub Pages

1. Ir a **Settings → Pages** del repositorio.
2. En *Branch*, seleccionar `main` y la carpeta raíz `/`.
3. Guardar. La página estará disponible en `https://Gabriel-yujra.github.io/simulacion_numerica_de_abastecimiento/`.

---

## Integrantes

| Nombre completo |
|---|
| Luis Alfredo Quispe Ortiz |
| Amilcar Josias Yujra Chipana |
| Gabriel Yujra Machaca |

---

## Licencia

Uso académico. Materia: Métodos Numéricos.
