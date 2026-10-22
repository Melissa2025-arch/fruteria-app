
"use strict";

/* =====================================================
   CONFIGURACIÓN
===================================================== */

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

function actualizarBadgeCarrito() {
  const totalItems = Object.values(carrito).reduce(
    (suma, producto) =>
      suma + (parseInt(producto.cantidad, 10) || 0),
    0
  );

  document.querySelectorAll("#cant-carrito-badge").forEach(badge => {
    badge.textContent = `(${totalItems})`;
  });
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
   PRODUCTOS Y SUPABASE
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
  if (productosBusquedaCache.length) {
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

  const grid = document.getElementById("grid-busqueda");

  if (grid) {
    grid.innerHTML = `
      <div class="estado-vacio">Cargando productos...</div>`;
  }

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
   SEGURIDAD HTML
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
   TARJETAS DE PRODUCTOS
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

    return `
      <article class="producto-card"
        data-producto-id="${escaparHTML(producto.id)}">

        <div>
          <div class="producto-imagen-container">
            <img
              src="${escaparHTML(producto.imagen)}"
              alt="${escaparHTML(producto.nombre)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='img/logo.png';">
          </div>

          <span class="categoria-tag">
            ${escaparHTML(producto.categoria)} •
            ${escaparHTML(producto.unidad)}
          </span>

          <h3>${escaparHTML(producto.nombre)}</h3>

          <p class="producto-desc-corta">
            ${escaparHTML(producto.descripcion)}
          </p>
        </div>

        <div>
          <div class="precio-y-controles">
            <span class="precio">
              $${Number(producto.precio).toFixed(2)}
            </span>

            <div class="contador-acciones">
              <button type="button"
                class="btn-cantidad-menos"
                aria-label="Disminuir cantidad">−</button>

              <span class="cantidad-seleccionada">${cantidad}</span>

              <button type="button"
                class="btn-cantidad-mas"
                aria-label="Aumentar cantidad">+</button>
            </div>
          </div>

          <button type="button"
            class="btn-principal btn-agregar-carrito">
            🛒 Agregar al carrito
          </button>
        </div>
      </article>`;
  }).join("");

  contenedor.querySelectorAll(".producto-card").forEach(tarjeta => {
    const id = tarjeta.dataset.productoId;

    tarjeta.querySelector(".btn-cantidad-menos")
      .addEventListener("click", () => cambiarCantCard(tarjeta, -1));

    tarjeta.querySelector(".btn-cantidad-mas")
      .addEventListener("click", () => cambiarCantCard(tarjeta, 1));

    tarjeta.querySelector(".btn-agregar-carrito")
      .addEventListener("click", () => agregarAlCarrito(id, tarjeta));
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

  if (!tarjeta) return;

  const contador = tarjeta.querySelector(".cantidad-seleccionada");
  if (!contador) return;

  const actual = parseInt(contador.textContent, 10) || 1;
  contador.textContent = String(Math.max(1, actual + Number(delta || 0)));
}

function agregarAlCarrito(id, tarjeta) {
  const producto = productosBusquedaCache.find(
    elemento => String(elemento.id) === String(id)
  );

  if (!producto) {
    alert("No se encontró el producto. Recarga la página e inténtalo de nuevo.");
    return;
  }

  const contador = tarjeta?.querySelector(".cantidad-seleccionada");
  const cantidad = Math.max(
    1,
    parseInt(contador?.textContent || "1", 10) || 1
  );

  const clave = String(producto.id);

  if (carrito[clave]) {
    carrito[clave].cantidad =
      Math.max(1, parseInt(carrito[clave].cantidad, 10) || 1) + cantidad;
  } else {
    carrito[clave] = { ...producto, cantidad };
  }

  guardarCarrito();

  const boton = tarjeta?.querySelector(".btn-agregar-carrito");

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
  const cantidadElemento = document.getElementById("resumen-cantidad");

  if (!contenedor) return;

  const items = Object.values(carrito);

  if (cantidadElemento) {
    cantidadElemento.textContent = String(
      items.reduce((suma, producto) =>
        suma + (parseInt(producto.cantidad, 10) || 0), 0)
    );
  }

  if (items.length === 0) {
    contenedor.innerHTML = `
      <tr>
        <td colspan="5">
          Tu carrito está vacío. Visita las categorías para agregar productos.
        </td>
      </tr>`;

    if (totalElemento) totalElemento.textContent = "$0.00";
    return;
  }

  let total = 0;

  contenedor.innerHTML = items.map(producto => {
    const cantidad = Math.max(
      1,
      parseInt(producto.cantidad, 10) || 1
    );

    const precio = Math.max(0, Number(producto.precio) || 0);
    const subtotal = precio * cantidad;
    total += subtotal;

    return `
      <tr>
        <td>
          <strong>${escaparHTML(producto.nombre)}</strong><br>
          <small>${escaparHTML(producto.unidad || "Unidad")}</small>
        </td>
        <td>$${precio.toFixed(2)}</td>
        <td>${cantidad}</td>
        <td>$${subtotal.toFixed(2)}</td>
        <td>
          <button type="button"
            class="btn-eliminar-producto"
            data-producto-id="${escaparHTML(producto.id)}">
            Eliminar
          </button>
        </td>
      </tr>`;
  }).join("");

  contenedor.querySelectorAll(".btn-eliminar-producto").forEach(boton => {
    boton.addEventListener("click", () => {
      eliminarDelCarrito(boton.dataset.productoId);
    });
  });

  if (totalElemento) {
    totalElemento.textContent = `$${total.toFixed(2)}`;
  }
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
   PDF: PREPARAR CONTENIDO
===================================================== */

function prepararContenidoPDF() {
  const items = Object.values(carrito);

  if (items.length === 0) {
    alert("Tu carrito está vacío. Agrega productos antes de generar el PDF.");
    return null;
  }

  const plantilla = document.getElementById("plantilla-pdf");
  const tbody = document.getElementById("pdf-tabla-body");
  const totalElemento = document.getElementById("pdf-total");
  const fecha = document.getElementById("pdf-fecha");

  if (!plantilla || !tbody || !totalElemento) {
    alert("Falta la plantilla del PDF o alguno de sus identificadores.");
    return null;
  }

  if (typeof html2pdf === "undefined") {
    alert("No se cargó html2pdf. Comprueba tu conexión a internet.");
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
    const subtotal = cantidad * precio;
    total += subtotal;

    return `
      <tr>
        <td style="padding:8px;border:1px solid #ccc;color:#222">
          ${escaparHTML(producto.nombre)}
          (${escaparHTML(producto.unidad || "Unidad")})
        </td>
        <td style="padding:8px;border:1px solid #ccc;text-align:right;color:#222">
          $${precio.toFixed(2)}
        </td>
        <td style="padding:8px;border:1px solid #ccc;text-align:center;color:#222">
          ${cantidad}
        </td>
        <td style="padding:8px;border:1px solid #ccc;text-align:right;color:#222">
          $${subtotal.toFixed(2)}
        </td>
      </tr>`;
  }).join("");

  totalElemento.textContent = `$${total.toFixed(2)}`;

  return plantilla;
}

/* =====================================================
   PDF: CREAR ARCHIVO
   Ajuste: capturar el documento completo y permitir
   que la tabla y el contenido ocupen varias páginas.
===================================================== */

async function crearBlobPDF() {
  const plantilla = prepararContenidoPDF();
  if (!plantilla) return null;

  const copia = plantilla.cloneNode(true);

  copia.removeAttribute("aria-hidden");
  copia.classList.remove("pdf-fuera-pantalla");

  const documentoPDF =
    copia.querySelector(".pdf-documento") || copia;

  // Evita que los estilos de la plantilla oculta recorten el contenido.
  Object.assign(copia.style, {
    display: "block",
    position: "absolute",
    left: "0",
    top: "0",
    width: "794px",
    height: "auto",
    minHeight: "0",
    maxWidth: "none",
    margin: "0",
    padding: "0",
    opacity: "1",
    visibility: "visible",
    overflow: "visible",
    zIndex: "-1",
    background: "#ffffff",
    boxSizing: "border-box"
  });

  Object.assign(documentoPDF.style, {
    display: "block",
    position: "static",
    width: "100%",
    height: "auto",
    minHeight: "0",
    maxHeight: "none",
    maxWidth: "none",
    margin: "0",
    padding: "24px",
    overflow: "visible",
    boxSizing: "border-box",
    color: "#222222",
    background: "#ffffff",
    opacity: "1",
    visibility: "visible",
    transform: "none"
  });

  // Asegura que la tabla pueda crecer y que sus columnas sean visibles.
  const tabla = documentoPDF.querySelector(".pdf-tabla");

  if (tabla) {
    Object.assign(tabla.style, {
      display: "table",
      width: "100%",
      maxWidth: "100%",
      tableLayout: "fixed",
      borderCollapse: "collapse",
      overflow: "visible",
      boxSizing: "border-box"
    });
  }

  documentoPDF.querySelectorAll("th, td").forEach(celda => {
    Object.assign(celda.style, {
      overflowWrap: "anywhere",
      wordBreak: "normal",
      whiteSpace: "normal",
      boxSizing: "border-box"
    });
  });

  documentoPDF.querySelectorAll("tr").forEach(fila => {
    fila.style.breakInside = "avoid";
    fila.style.pageBreakInside = "avoid";
  });

  document.body.appendChild(copia);

  try {
    // Esperar al renderizado y al cálculo del tamaño real.
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const anchoReal = Math.ceil(
      Math.max(
        documentoPDF.scrollWidth,
        documentoPDF.offsetWidth,
        794
      )
    );

    const altoReal = Math.ceil(
      Math.max(
        documentoPDF.scrollHeight,
        documentoPDF.offsetHeight,
        500
      )
    );

    const opciones = {
      margin: [10, 10, 10, 10],
      filename: "Pedido-Distribuidora-Exodo.pdf",
      image: {
        type: "jpeg",
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: anchoReal,
        height: altoReal,
        windowWidth: Math.max(anchoReal, document.documentElement.clientWidth),
        windowHeight: Math.max(altoReal, window.innerHeight),
        onclone: documentoClonado => {
          const elementoClonado =
            documentoClonado.querySelector("#plantilla-pdf");

          if (elementoClonado) {
            elementoClonado.style.display = "block";
            elementoClonado.style.position = "static";
            elementoClonado.style.left = "auto";
            elementoClonado.style.top = "auto";
            elementoClonado.style.width = `${anchoReal}px`;
            elementoClonado.style.height = "auto";
            elementoClonado.style.overflow = "visible";
            elementoClonado.style.opacity = "1";
            elementoClonado.style.visibility = "visible";
          }
        }
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: ["tr", ".pdf-encabezado", ".pdf-datos", ".pdf-total", ".pdf-pie"]
      }
    };

    const blob = await html2pdf()
      .set(opciones)
      .from(documentoPDF)
      .toPdf()
      .get("pdf")
      .then(pdf => pdf.output("blob"));

    if (!(blob instanceof Blob) || blob.size < 500) {
      throw new Error(
        `El PDF generado parece vacío. Tamaño: ${blob?.size ?? 0} bytes.`
      );
    }

    console.log("PDF generado correctamente:", blob.size, "bytes");
    return blob;

  } finally {
    copia.remove();
  }
}

/* =====================================================
   PDF: DESCARGAR
===================================================== */

function descargarBlobPDF(blob) {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("El archivo PDF está vacío.");
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download =
    `Pedido-Distribuidora-Exodo-${new Date().toISOString().slice(0, 10)}.pdf`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function generarPDFPedido() {
  try {
    const blob = await crearBlobPDF();

    if (blob) {
      descargarBlobPDF(blob);
    }
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("No se pudo generar el PDF. Abre F12 → Console para revisar el error.");
  }
}

/* =====================================================
   PDF: COMPARTIR
===================================================== */

async function compartirPDFWhatsApp() {
  try {
    const blob = await crearBlobPDF();
    if (!blob) return;

    const archivo = new File(
      [blob],
      `Pedido-Distribuidora-Exodo-${new Date().toISOString().slice(0, 10)}.pdf`,
      { type: "application/pdf" }
    );

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

    descargarBlobPDF(blob);

    alert(
      "El PDF se descargó. Abre WhatsApp y adjunta el archivo descargado."
    );
  } catch (error) {
    if (error.name === "AbortError") return;

    console.error("Error al compartir PDF:", error);
    alert("No se pudo compartir el PDF. Prueba primero la descarga.");
  }
}

/* =====================================================
   INICIALIZACIÓN AUTOMÁTICA DE PÁGINAS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  actualizarBadgeCarrito();

  // Página del carrito
  if (document.getElementById("lista-carrito")) {
    mostrarCarrito();
    return;
  }

  // Páginas de productos
  if (document.getElementById("grid-busqueda")) {
    const archivo = location.pathname
      .split("/")
      .pop()
      .toLowerCase();

    const categoriasPorPagina = {
      "frutas.html": "frutas",
      "verduras.html": "verduras",
      "granos.html": "granos",
      "harinas.html": "harinas",
      "lacteos.html": "lacteos",
      "carnes.html": "carnes",
      "extras.html": "extras"
    };

    const categoria = categoriasPorPagina[archivo];

    if (categoria) {
      cargarCategoriaEspecifica(categoria);
    } else {
      inicializarPaginaInicio();
    }
  }
});
