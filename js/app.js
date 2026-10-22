
"use strict";

const SUPABASE_URL = "https://kwfqjieynfxxkfycqbom.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_v2RhsMkjIcNdz2FS1SIqug_9OGu3L2k";
const CLAVE_CARRITO = "carrito_exodo";
const TELEFONO_WHATSAPP = "50363114191";

let productosBusquedaCache = [];
let cargandoProductos = null;
let carrito = cargarCarritoGuardado();

/* =====================================================
   CARRITO: CARGAR, GUARDAR Y CONTADOR
===================================================== */

function cargarCarritoGuardado() {
  try {
    const guardado = JSON.parse(
      localStorage.getItem(CLAVE_CARRITO) || "{}"
    );

    if (!guardado || typeof guardado !== "object" || Array.isArray(guardado)) {
      return {};
    }

    const resultado = {};

    Object.entries(guardado).forEach(([id, producto]) => {
      if (!producto || typeof producto !== "object") return;

      resultado[String(id)] = {
        ...producto,
        id: String(producto.id ?? id),
        nombre: String(producto.nombre || "Producto"),
        precio: Math.max(0, Number(producto.precio) || 0),
        unidad: producto.unidad || "Unidad",
        cantidad: Math.max(1, parseInt(producto.cantidad, 10) || 1)
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

function contarUnidadesCarrito() {
  return Object.values(carrito).reduce(
    (suma, producto) =>
      suma + Math.max(0, parseInt(producto.cantidad, 10) || 0),
    0
  );
}

function actualizarBadgeCarrito() {
  const totalItems = contarUnidadesCarrito();

  document.querySelectorAll("#cant-carrito-badge").forEach(badge => {
    badge.textContent = `(${totalItems})`;
  });

  const contadorResumen = document.getElementById("resumen-cantidad");
  if (contadorResumen) {
    contadorResumen.textContent = String(totalItems);
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

/* =====================================================
   PRODUCTOS Y CONEXIÓN CON SUPABASE
===================================================== */

function normalizarProducto(producto) {
  const categoriaOriginal = String(producto.categoria || "")
    .toLowerCase()
    .trim();

  return {
    ...producto,
    id: String(producto.id),
    nombre: String(producto.nombre || "Producto"),
    categoria: categoriaOriginal === "bebidas"
      ? "extras"
      : categoriaOriginal,
    unidad: producto.unidad || "Unidad",
    precio: Number(producto.precio) || 0,
    imagen: producto.imagen || "img/logo.png",
    descripcion: producto.descripcion || ""
  };
}

async function obtenerTodosProductos() {
  if (productosBusquedaCache.length > 0) {
    return productosBusquedaCache;
  }

  if (cargandoProductos) {
    return cargandoProductos;
  }

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
        throw new Error(
          `Supabase respondió ${respuesta.status}: ${await respuesta.text()}`
        );
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

  grid.innerHTML = `
    <div class="estado-vacio">Cargando productos...</div>`;

  const productos = await obtenerTodosProductos();
  renderizarTarjetas(productos, "grid-busqueda");
}

async function cargarCategoriaEspecifica(categoria) {
  actualizarBadgeCarrito();

  const todos = await obtenerTodosProductos();
  const buscada = String(categoria || "").toLowerCase().trim();

  const filtrados = todos.filter(
    producto => producto.categoria === buscada
  );

  renderizarTarjetas(filtrados, "grid-busqueda");
}

function buscarProductosInicio() {
  const input = document.getElementById("input-busqueda");
  if (!input) return;

  const texto = input.value.toLowerCase().trim();

  const filtrados = productosBusquedaCache.filter(producto =>
    producto.nombre.toLowerCase().includes(texto) ||
    producto.categoria.toLowerCase().includes(texto) ||
    producto.descripcion.toLowerCase().includes(texto)
  );

  renderizarTarjetas(filtrados, "grid-busqueda");
}

function buscarProductosCategoria(categoria) {
  const input = document.getElementById("input-busqueda");
  if (!input) return;

  const texto = input.value.toLowerCase().trim();
  const cat = String(categoria || "").toLowerCase().trim();

  const filtrados = productosBusquedaCache.filter(producto =>
    producto.categoria === cat &&
    (
      producto.nombre.toLowerCase().includes(texto) ||
      producto.descripcion.toLowerCase().includes(texto)
    )
  );

  renderizarTarjetas(filtrados, "grid-busqueda");
}

/* =====================================================
   SEGURIDAD: ESCAPAR TEXTO HTML
===================================================== */

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[caracter]));
}

/* =====================================================
   TARJETAS Y CONTROLES DE CANTIDAD
===================================================== */

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

  contenedor.innerHTML = productos.map(producto => {
    const cantidad = Math.max(
      1,
      parseInt(producto.cantidadSeleccionada, 10) || 1
    );

    const imagen = escaparHTML(producto.imagen);
    const nombre = escaparHTML(producto.nombre);
    const descripcion = escaparHTML(producto.descripcion);
    const categoria = escaparHTML(producto.categoria);
    const unidad = escaparHTML(producto.unidad);
    const idSeguro = escaparHTML(producto.id);

    return `
      <article class="producto-card" data-producto-id="${idSeguro}">
        <div>
          <div class="producto-imagen-container">
            <img
              src="${imagen}"
              alt="${nombre}"
              loading="lazy"
              onerror="this.onerror=null;this.src='img/logo.png';"
            >
          </div>

          <span class="categoria-tag">${categoria} • ${unidad}</span>
          <h3>${nombre}</h3>
          <p class="producto-desc-corta">${descripcion}</p>
        </div>

        <div>
          <div class="precio-y-controles">
            <span class="precio">$${Number(producto.precio).toFixed(2)}</span>

            <div class="contador-acciones">
              <button
                type="button"
                class="btn-cantidad-menos"
                aria-label="Disminuir cantidad"
              >−</button>

              <span class="cantidad-seleccionada">${cantidad}</span>

              <button
                type="button"
                class="btn-cantidad-mas"
                aria-label="Aumentar cantidad"
              >+</button>
            </div>
          </div>

          <button
            type="button"
            class="btn-principal btn-agregar-carrito"
          >🛒 Agregar al carrito</button>
        </div>
      </article>`;
  }).join("");

  contenedor.querySelectorAll(".producto-card").forEach(tarjeta => {
    const id = tarjeta.dataset.productoId;
    const botonMenos = tarjeta.querySelector(".btn-cantidad-menos");
    const botonMas = tarjeta.querySelector(".btn-cantidad-mas");
    const botonAgregar = tarjeta.querySelector(".btn-agregar-carrito");

    botonMenos.addEventListener("click", () => {
      cambiarCantCard(tarjeta, -1);
    });

    botonMas.addEventListener("click", () => {
      cambiarCantCard(tarjeta, 1);
    });

    botonAgregar.addEventListener("click", () => {
      agregarAlCarrito(id, tarjeta);
    });
  });
}

function cambiarCantCard(tarjetaOId, delta) {
  let tarjeta = null;

  if (tarjetaOId instanceof Element) {
    tarjeta = tarjetaOId;
  } else {
    tarjeta = [...document.querySelectorAll(".producto-card")].find(
      elemento => elemento.dataset.productoId === String(tarjetaOId)
    );
  }

  if (!tarjeta) {
    console.warn("No se encontró la tarjeta del producto:", tarjetaOId);
    return;
  }

  const contador = tarjeta.querySelector(".cantidad-seleccionada");
  if (!contador) return;

  const cantidadActual = parseInt(contador.textContent, 10) || 1;
  const nuevaCantidad = Math.max(
    1,
    cantidadActual + (Number(delta) || 0)
  );

  contador.textContent = String(nuevaCantidad);
}

function agregarAlCarrito(id, tarjeta) {
  const producto = productosBusquedaCache.find(
    elemento => String(elemento.id) === String(id)
  );

  if (!producto) {
    alert("No se encontró el producto. Recarga la página e inténtalo de nuevo.");
    return;
  }

  const tarjetaProducto = tarjeta ||
    [...document.querySelectorAll(".producto-card")].find(
      elemento => elemento.dataset.productoId === String(id)
    );

  const contador = tarjetaProducto?.querySelector(".cantidad-seleccionada");

  const cantidadSeleccionada = Math.max(
    1,
    parseInt(contador?.textContent || "1", 10) || 1
  );

  const clave = String(producto.id);

  if (carrito[clave]) {
    carrito[clave].cantidad =
      Math.max(1, parseInt(carrito[clave].cantidad, 10) || 1)
      + cantidadSeleccionada;
  } else {
    carrito[clave] = {
      ...producto,
      cantidad: cantidadSeleccionada
    };
  }

  guardarCarrito();
  mostrarCarrito();

  const boton = tarjetaProducto?.querySelector(".btn-agregar-carrito");

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

/* =====================================================
   MOSTRAR Y ADMINISTRAR CARRITO
===================================================== */

function mostrarCarrito() {
  actualizarBadgeCarrito();

  const contenedor = document.getElementById("lista-carrito");
  const totalElemento = document.getElementById("total-carrito-txt");
  const contadorResumen = document.getElementById("resumen-cantidad");

  if (!contenedor) return;

  const items = Object.values(carrito);

  if (items.length === 0) {
    contenedor.innerHTML = `
      <div class="estado-vacio">
        Tu carrito está vacío. Visita las categorías para agregar productos.
      </div>`;

    if (totalElemento) totalElemento.textContent = "0.00";
    if (contadorResumen) contadorResumen.textContent = "0";
    return;
  }

  let total = 0;
  let totalUnidades = 0;

  const filas = items.map(producto => {
    const cantidad = Math.max(
      1,
      parseInt(producto.cantidad, 10) || 1
    );

    const precio = Math.max(0, Number(producto.precio) || 0);
    const subtotal = precio * cantidad;

    total += subtotal;
    totalUnidades += cantidad;

    return `
      <tr>
        <td>
          <strong>${escaparHTML(producto.nombre)}</strong><br>
          <small>${escaparHTML(producto.unidad || "Unidad")}</small>
        </td>
        <td>$${precio.toFixed(2)}</td>
        <td><span class="cantidad-carrito">${cantidad}</span></td>
        <td>$${subtotal.toFixed(2)}</td>
        <td>
          <button
            type="button"
            class="btn-eliminar-producto"
            data-producto-id="${escaparHTML(producto.id)}"
          >Eliminar</button>
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

  contenedor.querySelectorAll(".btn-eliminar-producto").forEach(boton => {
    boton.addEventListener("click", () => {
      eliminarDelCarrito(boton.dataset.productoId);
    });
  });

  if (totalElemento) {
    totalElemento.textContent = total.toFixed(2);
  }

  if (contadorResumen) {
    contadorResumen.textContent = String(totalUnidades);
  }

  actualizarBadgeCarrito();
}

function eliminarDelCarrito(id) {
  delete carrito[String(id)];
  guardarCarrito();
  mostrarCarrito();
}

/* =====================================================
   PEDIDO POR WHATSAPP
===================================================== */

function construirTextoPedido() {
  const items = Object.values(carrito);
  if (items.length === 0) return null;

  let total = 0;

  const lineas = [
    "Hola, Distribuidora Éxodo. Deseo realizar el siguiente pedido:",
    ""
  ];

  items.forEach((producto, indice) => {
    const cantidad = Math.max(
      1,
      parseInt(producto.cantidad, 10) || 1
    );

    const precio = Math.max(0, Number(producto.precio) || 0);
    const subtotal = precio * cantidad;

    total += subtotal;

    lineas.push(
      `${indice + 1}. ${producto.nombre} (${producto.unidad || "Unidad"}) — Cantidad: ${cantidad} × $${precio.toFixed(2)} = $${subtotal.toFixed(2)}`
    );
  });

  lineas.push(
    "",
    `Total estimado: $${total.toFixed(2)}`,
    "",
    "Solicito entrega a domicilio. Quedo a la espera de su confirmación."
  );

  return lineas.join("\n");
}

function enviarPedidoWhatsApp() {
  const mensaje = construirTextoPedido();

  if (!mensaje) {
    alert("Tu carrito está vacío. Agrega productos antes de enviar el pedido.");
    return;
  }

  const url =
    `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank", "noopener");
}

/* =====================================================
   PREPARAR CONTENIDO DEL PDF
===================================================== */

function prepararContenidoPDF() {
  const items = Object.values(carrito);

  if (items.length === 0) {
    alert("Tu carrito está vacío. Agrega productos antes de generar el PDF.");
    return null;
  }

  const plantilla = document.getElementById("plantilla-pdf");

  if (!plantilla) {
    alert("No se encontró la plantilla del PDF en carrito.html.");
    return null;
  }

  const tbody = plantilla.querySelector("#pdf-tabla-body");
  const totalElemento = plantilla.querySelector("#pdf-total");
  const fecha = plantilla.querySelector("#pdf-fecha");

  if (!tbody || !totalElemento) {
    alert("La plantilla del PDF está incompleta. Revisa sus identificadores.");
    return null;
  }

  if (typeof html2pdf === "undefined") {
    alert("No se pudo cargar la biblioteca PDF. Revisa tu conexión a internet.");
    return null;
  }

  if (fecha) {
    fecha.textContent = new Date().toLocaleDateString("es-SV");
  }

  let total = 0;

  tbody.innerHTML = items.map(producto => {
    const cantidad = Math.max(
      1,
      parseInt(producto.cantidad, 10) || 1
    );

    const precio = Math.max(0, Number(producto.precio) || 0);
    const subtotal = precio * cantidad;

    total += subtotal;

    return `
      <tr>
        <td style="padding:8px;border:1px solid #c8e2ce">
          ${escaparHTML(producto.nombre)}
          (${escaparHTML(producto.unidad || "Unidad")})
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

  return plantilla;
}

/* =====================================================
   CREAR PDF COMO BLOB
   Se usa una copia visible para evitar PDFs en blanco.
===================================================== */

async function crearBlobPDF() {
  const plantilla = prepararContenidoPDF();
  if (!plantilla) return null;

  if (typeof html2pdf === "undefined") {
    alert("No se pudo cargar la biblioteca PDF. Revisa tu conexión.");
    return null;
  }

  const copia = plantilla.cloneNode(true);

  copia.removeAttribute("aria-hidden");
  copia.classList.remove("pdf-fuera-pantalla");

  Object.assign(copia.style, {
    display: "block",
    position: "fixed",
    left: "0",
    top: "0",
    width: "800px",
    maxWidth: "none",
    height: "auto",
    margin: "0",
    padding: "30px",
    background: "#ffffff",
    color: "#222222",
    zIndex: "99999",
    overflow: "visible",
    opacity: "1",
    visibility: "visible",
    boxSizing: "border-box"
  });

  document.body.appendChild(copia);

  try {
    // Espera a que el navegador dibuje la copia antes de capturarla.
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const opciones = {
      margin: 10,
      filename: "Pedido-Distribuidora-Exodo.pdf",
      image: {
        type: "jpeg",
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        logging: false
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },
      pagebreak: {
        mode: ["css", "legacy"]
      }
    };

    const blob = await new Promise((resolve, reject) => {
      html2pdf()
        .set(opciones)
        .from(copia)
        .outputPdf("blob")
        .thenExternal(resolve)
        .catchExternal(reject);
    });

    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error("El archivo PDF generado está vacío.");
    }

    return blob;
  } finally {
    copia.remove();
  }
}

/* =====================================================
   DESCARGAR PDF
===================================================== */

function descargarBlobPDF(blob) {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("No hay contenido válido para descargar.");
  }

  const nombreArchivo =
    `Pedido-Distribuidora-Exodo-${new Date().toISOString().slice(0, 10)}.pdf`;

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = "none";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function generarPDFPedido() {
  try {
    const blob = await crearBlobPDF();

    if (!blob) return;

    descargarBlobPDF(blob);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("No se pudo generar el PDF. Inténtalo nuevamente.");
  }
}

/* =====================================================
   COMPARTIR PDF
===================================================== */

async function compartirPDFWhatsApp() {
  try {
    const blob = await crearBlobPDF();

    if (!blob) return;

    const nombreArchivo =
      `Pedido-Distribuidora-Exodo-${new Date().toISOString().slice(0, 10)}.pdf`;

    const archivo = new File(
      [blob],
      nombreArchivo,
      { type: "application/pdf" }
    );

    // Los navegadores compatibles permiten elegir WhatsApp
    // u otra aplicación desde el menú nativo para compartir.
    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [archivo] })
    ) {
      await navigator.share({
        files: [archivo],
        title: "Pedido - Distribuidora Éxodo",
        text: "Te comparto mi hoja de pedido."
      });

      return;
    }

    // Alternativa para navegadores que no permiten compartir archivos.
    descargarBlobPDF(blob);

    alert(
      "Tu PDF se ha descargado. Para enviarlo por WhatsApp, " +
      "abre el chat y adjunta el archivo PDF descargado."
    );
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    console.error("Error al compartir PDF:", error);

    alert(
      "No se pudo compartir el PDF directamente. " +
      "Prueba el botón de descargar PDF."
    );
  }
}

/* =====================================================
   INICIALIZACIÓN
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  actualizarBadgeCarrito();

  const grid = document.getElementById("grid-busqueda");

  if (grid && grid.children.length === 0) {
    grid.innerHTML = `
      <div class="estado-vacio">Cargando productos...</div>`;
  }

  // Solo actualiza la vista si estamos en carrito.html.
  if (document.getElementById("lista-carrito")) {
    mostrarCarrito();
  }
});
