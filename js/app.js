
"use strict";

const SUPABASE_URL = "https://kwfqjieynfxxkfycqbom.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_v2RhsMkjIcNdz2FS1SIqug_9OGu3L2k";
const CLAVE_CARRITO = "carrito_exodo";

let productosBusquedaCache = [];
let cargandoProductos = null;
let carrito = cargarCarritoGuardado();

function cargarCarritoGuardado() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || "{}");

    if (!guardado || typeof guardado !== "object" || Array.isArray(guardado)) {
      return {};
    }

    const resultado = {};

    Object.entries(guardado).forEach(([id, p]) => {
      if (!p || typeof p !== "object") return;

      const cantidad = Math.max(1, parseInt(p.cantidad, 10) || 1);

      resultado[String(id)] = {
        ...p,
        id: String(p.id ?? id),
        nombre: String(p.nombre || "Producto"),
        precio: Math.max(0, Number(p.precio) || 0),
        unidad: p.unidad || "Unidad",
        cantidad
      };
    });

    return resultado;
  } catch (error) {
    console.warn("No se pudo leer el carrito guardado.", error);
    return {};
  }
}

function guardarCarrito() {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    actualizarBadgeCarrito();
  } catch (error) {
    console.error("No se pudo guardar el carrito.", error);
    alert("No se pudo guardar el carrito en este navegador.");
  }
}

function toggleMenu() {
  const nav = document.getElementById("menu");
  const boton = document.querySelector(".menu-btn");

  if (!nav) return;

  const abierto = nav.classList.toggle("menu-abierto");

  if (boton) {
    boton.setAttribute("aria-expanded", String(abierto));
  }
}

function actualizarBadgeCarrito() {
  const totalItems = Object.values(carrito).reduce(
    (suma, p) => suma + (parseInt(p.cantidad, 10) || 0),
    0
  );

  document.querySelectorAll("#cant-carrito-badge").forEach(badge => {
    badge.textContent = `(${totalItems})`;
  });
}

function normalizarProducto(p) {
  const categoriaOriginal = String(p.categoria || "").toLowerCase().trim();
  const categoria = categoriaOriginal === "bebidas" ? "extras" : categoriaOriginal;

  return {
    ...p,
    id: String(p.id),
    nombre: String(p.nombre || "Producto"),
    categoria,
    unidad: p.unidad || "Unidad",
    precio: Number(p.precio) || 0,
    imagen: p.imagen || "img/logo.png",
    descripcion: p.descripcion || ""
  };
}

async function obtenerTodosProductos() {
  if (productosBusquedaCache.length) return productosBusquedaCache;
  if (cargandoProductos) return cargandoProductos;

  cargandoProductos = (async () => {
    try {
      const respuesta = await fetch(
        `${SUPABASE_URL}/rest/v1/productos?select=id,nombre,categoria,unidad,precio,imagen,descripcion&order=nombre.asc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Accept: "application/json"
          }
        }
      );

      if (!respuesta.ok) {
        throw new Error(`Supabase respondió ${respuesta.status}: ${await respuesta.text()}`);
      }

      const datos = await respuesta.json();

      productosBusquedaCache = Array.isArray(datos)
        ? datos.map(normalizarProducto)
        : [];

      return productosBusquedaCache;
    } catch (error) {
      console.error("Error cargando productos desde Supabase:", error);
      mostrarErrorCarga();
      productosBusquedaCache = [];
      return [];
    } finally {
      cargandoProductos = null;
    }
  })();

  return cargandoProductos;
}

function mostrarErrorCarga() {
  const contenedor = document.getElementById("grid-busqueda");

  if (contenedor) {
    contenedor.innerHTML = `
      <div class="estado-vacio">
        No se pudieron cargar los productos. Revisa la conexión con Supabase
        y los permisos de lectura.
      </div>`;
  }
}

async function inicializarPaginaInicio() {
  actualizarBadgeCarrito();

  const grid = document.getElementById("grid-busqueda");
  if (!grid) return;

  const productos = await obtenerTodosProductos();
  renderizarTarjetas(productos, "grid-busqueda");
}

async function cargarCategoriaEspecifica(categoria) {
  actualizarBadgeCarrito();

  const todos = await obtenerTodosProductos();
  const buscada = String(categoria || "").toLowerCase().trim();
  const filtrados = todos.filter(p => p.categoria === buscada);

  renderizarTarjetas(filtrados, "grid-busqueda");
}

function buscarProductosInicio() {
  const input = document.getElementById("input-busqueda");
  if (!input) return;

  const texto = input.value.toLowerCase().trim();

  const filtrados = productosBusquedaCache.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.categoria.toLowerCase().includes(texto) ||
    p.descripcion.toLowerCase().includes(texto)
  );

  renderizarTarjetas(filtrados, "grid-busqueda");
}

function buscarProductosCategoria(categoria) {
  const input = document.getElementById("input-busqueda");
  if (!input) return;

  const texto = input.value.toLowerCase().trim();
  const cat = String(categoria || "").toLowerCase().trim();

  const filtrados = productosBusquedaCache.filter(p =>
    p.categoria === cat &&
    (
      p.nombre.toLowerCase().includes(texto) ||
      p.descripcion.toLowerCase().includes(texto)
    )
  );

  renderizarTarjetas(filtrados, "grid-busqueda");
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[caracter]));
}

function renderizarTarjetas(productos, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  if (!Array.isArray(productos) || productos.length === 0) {
    contenedor.innerHTML = `
      <div class="estado-vacio">
        No se encontraron productos disponibles en esta sección.
      </div>`;
    return;
  }

  contenedor.innerHTML = productos.map(p => {
    const cantidad = Math.max(1, parseInt(carrito[p.id]?.cantidad, 10) || 1);
    const imagen = escaparHTML(p.imagen);
    const nombre = escaparHTML(p.nombre);
    const descripcion = escaparHTML(p.descripcion);
    const categoria = escaparHTML(p.categoria);
    const unidad = escaparHTML(p.unidad);
    const idSeguro = escaparHTML(p.id);

    return `
      <article class="producto-card">
        <div>
          <div class="producto-imagen-container">
            <img src="${imagen}" alt="${nombre}" loading="lazy"
              onerror="this.onerror=null;this.src='img/logo.png';">
          </div>

          <span class="categoria-tag">${categoria} • ${unidad}</span>
          <h3>${nombre}</h3>
          <p class="producto-desc-corta">${descripcion}</p>
        </div>

        <div>
          <div class="precio-y-controles">
            <span class="precio">$${Number(p.precio).toFixed(2)}</span>

            <div class="contador-acciones">
              <button type="button" aria-label="Disminuir cantidad"
                onclick="cambiarCantCard('${idSeguro}',-1)">−</button>

              <span id="qty-${idSeguro}">${cantidad}</span>

              <button type="button" aria-label="Aumentar cantidad"
                onclick="cambiarCantCard('${idSeguro}',1)">+</button>
            </div>
          </div>

          <button type="button" class="btn-principal"
            onclick="agregarAlCarrito('${idSeguro}')">
            🛒 Agregar
          </button>
        </div>
      </article>`;
  }).join("");
}

function cambiarCantCard(id, delta) {
  const span = document.getElementById(`qty-${CSS.escape(String(id))}`);
  if (!span) return;

  const actual = parseInt(span.textContent, 10) || 1;
  span.textContent = String(Math.max(1, actual + delta));
}

function agregarAlCarrito(id) {
  const producto = productosBusquedaCache.find(p => String(p.id) === String(id));

  if (!producto) {
    alert("No se encontró el producto. Recarga la página e inténtalo de nuevo.");
    return;
  }

  const span = document.getElementById(`qty-${CSS.escape(String(id))}`);
  const cantidad = Math.max(1, parseInt(span?.textContent || "1", 10) || 1);
  const clave = String(producto.id);

  if (carrito[clave]) {
    carrito[clave].cantidad = (parseInt(carrito[clave].cantidad, 10) || 0) + cantidad;
  } else {
    carrito[clave] = { ...producto, cantidad };
  }

  guardarCarrito();

  const boton = span?.closest(".producto-card")?.querySelector(".btn-principal");

  if (boton) {
    const textoOriginal = boton.textContent;
    boton.textContent = "✓ Agregado";
    boton.disabled = true;

    setTimeout(() => {
      if (boton.isConnected) {
        boton.textContent = textoOriginal;
        boton.disabled = false;
      }
    }, 900);
  }
}

function mostrarCarrito() {
  actualizarBadgeCarrito();

  const contenedor = document.getElementById("lista-carrito");
  const totalElemento = document.getElementById("total-carrito-txt");

  if (!contenedor) return;

  const items = Object.values(carrito);

  if (!items.length) {
    contenedor.innerHTML = `
      <div class="estado-vacio">
        Tu carrito está vacío. Visita las categorías para agregar productos.
      </div>`;

    if (totalElemento) totalElemento.textContent = "0.00";
    return;
  }

  let total = 0;

  const filas = items.map(p => {
    const cantidad = Math.max(1, parseInt(p.cantidad, 10) || 1);
    const precio = Math.max(0, Number(p.precio) || 0);
    const subtotal = precio * cantidad;

    total += subtotal;

    const idSeguro = escaparHTML(p.id);
    const nombre = escaparHTML(p.nombre);

    return `
      <tr>
        <td>
          <strong>${nombre}</strong><br>
          <small>${escaparHTML(p.unidad || "Unidad")}</small>
        </td>

        <td>$${precio.toFixed(2)}</td>

        <td>
          <div class="contador-acciones">
            <button type="button"
              onclick="cambiarCantidadCarrito('${idSeguro}', -1)"
              aria-label="Disminuir cantidad">−</button>

            <span>${cantidad}</span>

            <button type="button"
              onclick="cambiarCantidadCarrito('${idSeguro}', 1)"
              aria-label="Aumentar cantidad">+</button>
          </div>
        </td>

        <td>$${subtotal.toFixed(2)}</td>

        <td>
          <button type="button"
            onclick="eliminarDelCarrito('${idSeguro}')"
            aria-label="Eliminar ${nombre}">Eliminar</button>
        </td>
      </tr>`;
  }).join("");

  contenedor.innerHTML = `
    <div class="carrito-tabla-wrap">
      <table class="tabla-carrito">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;

  if (totalElemento) totalElemento.textContent = total.toFixed(2);
}

function cambiarCantidadCarrito(id, cambio) {
  const clave = String(id);
  const producto = carrito[clave];

  if (!producto) return;

  const actual = parseInt(producto.cantidad, 10) || 1;
  producto.cantidad = Math.max(1, actual + cambio);

  guardarCarrito();
  mostrarCarrito();
}

function eliminarDelCarrito(id) {
  delete carrito[String(id)];
  guardarCarrito();
  mostrarCarrito();
}

function enviarPedidoWhatsApp() {
  const items = Object.values(carrito);

  if (!items.length) {
    alert("Tu carrito está vacío. Agrega productos antes de enviar el pedido.");
    return;
  }

  let total = 0;
  const lineas = [
    "Hola, Distribuidora Éxodo. Deseo realizar el siguiente pedido:",
    ""
  ];

  items.forEach((p, indice) => {
    const cantidad = Math.max(1, parseInt(p.cantidad, 10) || 1);
    const precio = Math.max(0, Number(p.precio) || 0);
    const subtotal = precio * cantidad;

    total += subtotal;

    lineas.push(
      `${indice + 1}. ${p.nombre} (${p.unidad || "Unidad"}) — Cantidad: ${cantidad} × $${precio.toFixed(2)} = $${subtotal.toFixed(2)}`
    );
  });

  lineas.push(
    "",
    `Total estimado: $${total.toFixed(2)}`,
    "",
    "Solicito entrega a domicilio. Quedo a la espera de su confirmación."
  );

  // Verifica que este sea el número comercial correcto.
  const telefono = "50363114191";

  window.open(
    `https://wa.me/${telefono}?text=${encodeURIComponent(lineas.join("\n"))}`,
    "_blank",
    "noopener"
  );
}

async function generarPDFPedido() {
  const items = Object.values(carrito);

  if (!items.length) {
    alert("Tu carrito está vacío. Agrega productos antes de generar el PDF.");
    return;
  }

  if (typeof html2pdf === "undefined") {
    alert("No se pudo cargar la herramienta para generar PDF. Revisa tu conexión.");
    return;
  }

  const plantilla = document.getElementById("plantilla-pdf");

  if (!plantilla) {
    alert("No se encontró la plantilla del PDF en carrito.html.");
    return;
  }

  const fecha = document.getElementById("pdf-fecha");
  const tbody = document.getElementById("pdf-tabla-body");
  const totalElemento = document.getElementById("pdf-total");

  if (!tbody || !totalElemento) {
    alert("La plantilla del PDF no tiene todos los elementos requeridos.");
    return;
  }

  if (fecha) fecha.textContent = new Date().toLocaleDateString("es-SV");

  let total = 0;

  tbody.innerHTML = items.map(p => {
    const cantidad = Math.max(1, parseInt(p.cantidad, 10) || 1);
    const precio = Math.max(0, Number(p.precio) || 0);
    const subtotal = precio * cantidad;

    total += subtotal;

    return `
      <tr>
        <td style="padding:8px;border:1px solid #c8e2ce">
          ${escaparHTML(p.nombre)} (${escaparHTML(p.unidad || "Unidad")})
        </td>
        <td style="padding:8px;border:1px solid #c8e2ce;text-align:center">
          ${cantidad}
        </td>
        <td style="padding:8px;border:1px solid #c8e2ce;text-align:right">
          $${precio.toFixed(2)}
        </td>
        <td style="padding:8px;border:1px solid #c8e2ce;text-align:right">
          $${subtotal.toFixed(2)}
        </td>
      </tr>`;
  }).join("");

  totalElemento.textContent = total.toFixed(2);

  plantilla.classList.add("pdf-fuera-pantalla");
  plantilla.style.display = "block";

  try {
    await html2pdf().set({
      margin: 10,
      filename: `Pedido-Distribuidora-Exodo-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(plantilla).save();
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Ocurrió un error al generar el PDF. Inténtalo nuevamente.");
  } finally {
    plantilla.style.display = "block";
    plantilla.classList.add("pdf-fuera-pantalla");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  actualizarBadgeCarrito();

  const grid = document.getElementById("grid-busqueda");

  if (grid && grid.children.length === 0) {
    grid.innerHTML = `<div class="estado-vacio">Cargando productos…</div>`;
  }
});

