# Simulación numérica de abastecimiento, precios y conflicto social

Trabajo final de la materia **Métodos Numéricos**.

---

## Descripción

Herramienta web interactiva que modela distintos escenarios de crisis mediante cinco familias de métodos numéricos:

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
1. Resolver sistemas de ecuaciones lineales para modelar flujos en redes de transporte (Jacobi, Gauss-Seidel).
2. Encontrar raíces de ecuaciones para identificar umbrales de precio (Bisección, Newton-Raphson, Secante).
3. Aplicar interpolación para reconstruir curvas de precios (Lagrange, Newton diferencias divididas).
4. Calcular integrales numéricas para estimar costos acumulados (Trapecio, Simpson 1/3, Simpson 3/8).
5. Resolver EDOs para simular vaciado de reservas y difusión del descontento (Euler, Runge-Kutta 4°).

---

## Tecnologías

| Recurso | Uso |
|---|---|
| HTML5 | Estructura semántica de la página |
| CSS3 + Bootstrap 5 (CDN) | Diseño responsivo y componentes UI |
| JavaScript (ES6+) | Lógica de cálculo y manipulación del DOM |
| Chart.js 4 (CDN) | Visualización de gráficos y curvas |

Sin backend. Página estática publicable directamente en GitHub Pages, Netlify o Vercel.

---

## Estructura del proyecto

```
simulacion_numerica_de_abastecimiento/
├── index.html                    ← Página principal (única)
├── README.md
├── css/
│   └── styles.css                ← Estilos globales y responsivos
└── js/
    ├── main.js                   ← Inicialización, scroll-spy y utilidades globales
    ├── sistemas_lineales.js      ← Módulo: Jacobi y Gauss-Seidel
    ├── raices.js                 ← Módulo: Bisección, Newton-Raphson, Secante
    ├── interpolacion.js          ← Módulo: Lagrange y Newton dif. divididas
    ├── integracion.js            ← Módulo: Trapecio, Simpson 1/3, Simpson 3/8
    └── ecuaciones_diferenciales.js ← Módulo: Euler y Runge-Kutta 4°
```

Cada archivo JS de módulo expone un objeto con métodos públicos (`resolver`, `calcular`, `limpiar`, etc.) que son llamados directamente desde los botones del HTML. La comunicación entre módulos pasa por el objeto de utilidades `SimNum` definido en `main.js`.

---

## Cómo usar

### Ver en el navegador (desarrollo local)

```bash
# Clonar el repositorio
git clone https://github.com/<usuario>/simulacion_numerica_de_abastecimiento.git

# Entrar a la carpeta
cd simulacion_numerica_de_abastecimiento

# Abrir directamente en el navegador
# (doble clic en index.html, o con un servidor local)
```

> Para evitar restricciones de CORS al usar módulos JS locales, se recomienda un servidor local simple:
> ```bash
> # Con Python 3
> python -m http.server 8080
> # Luego abrir http://localhost:8080
> ```

### Publicar en GitHub Pages

1. Ir a **Settings → Pages** del repositorio.
2. En *Branch*, seleccionar `main` y la carpeta raíz `/`.
3. Guardar. La página estará disponible en `https://<usuario>.github.io/<repo>/`.

---

## Estado de implementación

| Módulo | Estructura | Métodos numéricos |
|---|---|---|
| Sistemas lineales | ✅ | ⏳ Pendiente |
| Raíces | ✅ | ⏳ Pendiente |
| Interpolación | ✅ | ⏳ Pendiente |
| Integración | ✅ | ⏳ Pendiente |
| Ecuaciones diferenciales | ✅ | ⏳ Pendiente |

Los métodos numéricos se implementarán módulo a módulo en las siguientes etapas del proyecto.

---

## Trabajo en equipo

| Rol | Responsabilidad |
|---|---|
| **Implementación** | Desarrollo de la página web, codificación de los algoritmos numéricos y pruebas de la herramienta. |
| **Exposición y análisis** | Uso de la herramienta durante la presentación, interpretación de los resultados y análisis de los escenarios modelados. |

El resto del equipo utilizará la herramienta interactiva para guiar la exposición y responder preguntas sobre los resultados obtenidos en cada módulo.

---

## Licencia

Uso académico. Materia: Métodos Numéricos.
