# ROMXNO | Tienda de llaveros

E-commerce de llaveros de tela tejida con diseños manga y streetwear. Es el frontend del proyecto del Módulo 34 del programa Desarrollo Full Stack Python de EBAC.

No hay backend: los productos son datos de ejemplo, las cuentas se guardan en el navegador y los pagos son simulados.

## Tecnologías

- React 19 con Vite
- Styled-Components para los estilos y el tema
- Redux Toolkit para el estado (carrito, sesión y pedido)
- React Router para la navegación
- Vitest y Testing Library para las pruebas unitarias

## Cómo ejecutarlo

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev
```

La tienda queda disponible en `http://localhost:5173`.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo |
| `npm test` | Corre las pruebas unitarias |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run lint` | Revisa el código con Oxlint |

## Secciones

| Ruta | Sección |
|---|---|
| `/` | Home: catálogo con filtro por categoría y la sección "Sobre ROMXNO" |
| `/registro` | Registro de una cuenta nueva |
| `/login` | Ingreso de usuarios registrados |
| `/carrito` | Productos elegidos, cantidades, envío y total |
| `/checkout` | Dirección de envío, método de pago y confirmación de la compra |
| `/confirmacion` | Mensaje de confirmación con los detalles del pedido |

## Cómo probar una compra

1. Crea una cuenta en `/registro`. La sesión se inicia sola.
2. Agrega llaveros desde el Home y abre el carrito.
3. Presiona "Ir a pagar". Si no has iniciado sesión, la tienda te manda al login y después te regresa al checkout.
4. Llena la dirección, elige un método de pago y presiona "Guardar método de pago". Para tarjeta puedes usar `4242 4242 4242 4242`, vencimiento `12/28` y CVV `123`.
5. Presiona "Confirmar compra" para ver la confirmación del pedido.

El envío cuesta $59 y es gratis en compras desde $499.

## Qué es simulado

- **Cuentas:** se guardan en `localStorage`, con la contraseña sin cifrar. Con un backend real la contraseña se cifraría en el servidor.
- **Pago:** no se hace ningún cargo. De la tarjeta solo se conservan los últimos 4 dígitos, y solo en memoria.
- **Carrito y pedido:** viven en memoria, así que se pierden al recargar la página. La sesión sí se conserva.

## Estructura

```
src/
  components/   Header, Footer, ProductCard, formularios y la ruta protegida
  pages/        Home, Login, Register, Cart, Checkout y Confirmation
  redux/        store y slices de carrito, sesión y pedido
  utils/        validaciones, envío, formato de precio, usuarios y pago
  data/         catálogo de productos
  styles/       tema y estilos globales
  test/         configuración y utilidades de las pruebas
```

## Pruebas

Las pruebas están junto al código que verifican (`*.test.js` y `*.test.jsx`). Cubren los componentes (Header, ProductCard), las páginas (Login, Registro, Carrito), el flujo completo de compra desde el checkout hasta la confirmación, el slice del carrito y las utilidades de validación, envío y usuarios.
