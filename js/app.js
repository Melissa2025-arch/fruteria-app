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
    actualizarBurbujaCarrito();
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
   BURBUJA FLOTANTE DEL CARRITO
===================================================== */

const CLAVE_POSICION_BURBUJA = "exodo_posicion_burbuja";

function actualizarBurbujaCarrito() {
  const burbuja = document.getElementById("burbuja-carrito");
  if (!burbuja) return;

  const total = Object.values(carrito).reduce(
    (suma, producto) =>
      suma + (parseInt(producto.cantidad, 10) || 0),
    0
  );

  const contador = burbuja.querySelector(".burbuja-contador");

  if (contador) {
    contador.textContent = total > 99 ? "99+" : String(total);
  }
}

function limitarPosicionBurbuja(x, y, burbuja) {
  const margen = 8;

  return {
    x: Math.max(
      margen,
      Math.min(x, window.innerWidth - burbuja.offsetWidth - margen)
    ),
    y: Math.max(
      margen,
      Math.min(y, window.innerHeight - burbuja.offsetHeight - margen)
    )
  };
}

function guardarPosicionBurbuja(x, y) {
  try {
    localStorage.setItem(
      CLAVE_POSICION_BURBUJA,
      JSON.stringify({ x, y })
    );
  } catch (error) {
    console.warn("No se pudo guardar la posición de la burbuja.", error);
  }
}

function iniciarBurbujaCarrito() {
  // La burbuja solo aparecerá en páginas que muestran productos.
  if (!document.getElementById("grid-busqueda")) return;
  if (document.getElementById("burbuja-carrito")) return;

  const burbuja = document.createElement("button");

  burbuja.type = "button";
  burbuja.id = "burbuja-carrito";
  burbuja.className = "burbuja-carrito";
  burbuja.setAttribute("aria-label", "Abrir carrito de compras");
  burbuja.title = "Arrastra para mover o pulsa para abrir el carrito";

  burbuja.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
    <span class="burbuja-contador">0</span>
  `;

  document.body.appendChild(burbuja);

  let posicion = null;

  try {
    posicion = JSON.parse(
      localStorage.getItem(CLAVE_POSICION_BURBUJA) || "null"
    );
  } catch (error) {
    posicion = null;
  }

  let x = posicion && Number.isFinite(posicion.x)
    ? posicion.x
    : window.innerWidth - burbuja.offsetWidth - 22;

  let y = posicion && Number.isFinite(posicion.y)
    ? posicion.y
    : window.innerHeight - burbuja.offsetHeight - 24;

  function aplicarPosicion(nuevoX, nuevoY, guardar = false) {
    const limitada = limitarPosicionBurbuja(
      nuevoX,
      nuevoY,
      burbuja
    );

    x = limitada.x;
    y = limitada.y;

    burbuja.style.left = `${x}px`;
    burbuja.style.top = `${y}px`;
    burbuja.style.right = "auto";
    burbuja.style.bottom = "auto";

    if (guardar) {
      guardarPosicionBurbuja(x, y);
    }
  }

  aplicarPosicion(x, y);
  actualizarBurbujaCarrito();

  let arrastrando = false;
  let seMovio = false;
  let inicioX = 0;
  let inicioY = 0;
  let posicionInicialX = 0;
  let posicionInicialY = 0;
  let punteroActivo = null;

  burbuja.addEventListener("pointerdown", event => {
    if (event.button !== 0 && event.pointerType === "mouse") return;

    arrastrando = true;
    seMovio = false;
    punteroActivo = event.pointerId;

    inicioX = event.clientX;
    inicioY = event.clientY;
    posicionInicialX = x;
    posicionInicialY = y;

    burbuja.setPointerCapture(event.pointerId);
    burbuja.style.cursor = "grabbing";

    event.preventDefault();
  });

  burbuja.addEventListener("pointermove", event => {
    if (!arrastrando || event.pointerId !== punteroActivo) return;

    const deltaX = event.clientX - inicioX;
    const deltaY = event.clientY - inicioY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      seMovio = true;
    }

    if (seMovio) {
      aplicarPosicion(
        posicionInicialX + deltaX,
        posicionInicialY + deltaY
      );
    }
  });

  function terminarArrastre(event) {
    if (!arrastrando || event.pointerId !== punteroActivo) return;

    arrastrando = false;
    punteroActivo = null;
    burbuja.style.cursor = "grab";

    if (seMovio) {
      guardarPosicionBurbuja(x, y);
    }
  }

  burbuja.addEventListener("pointerup", terminarArrastre);
  burbuja.addEventListener("pointercancel", terminarArrastre);

  burbuja.addEventListener("click", event => {
    if (seMovio) {
      event.preventDefault();
      event.stopPropagation();
      seMovio = false;
      return;
    }

    window.location.href = "carrito.html";
  });

  window.addEventListener("resize", () => {
    aplicarPosicion(x, y, true);
  });
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

    const fecha = new Date().toLocaleDateString("es-SV");

    const lineas = [
        "DISTRIBUIDORA ÉXODO",
        "RESUMEN DEL PEDIDO",
        `Fecha: ${fecha}`,
        "",
        "Hola, deseo realizar el siguiente pedido:",
        ""
    ];

    items.forEach((producto, indice) => {
        const cantidad = Math.max(
            1,
            parseInt(producto.cantidad, 10) || 1
        );

        const precio = Math.max(
            0,
            Number(producto.precio) || 0
        );

        const subtotal = precio * cantidad;
        total += subtotal;

        lineas.push(
            `${indice + 1}. ${producto.nombre} (${producto.unidad || "Unidad"})`,
            `   Cantidad: ${cantidad}`,
            `   Precio unitario: $${precio.toFixed(2)}`,
            `   Subtotal: $${subtotal.toFixed(2)}`,
            ""
        );
    });

    lineas.push(
        "--------------------------------",
        `TOTAL DE PRODUCTOS: $${total.toFixed(2)}`,
        "",
        "El costo de entrega está pendiente de confirmación.",
        "Quedo a la espera de la confirmación del pedido."
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
   WORD: GENERAR Y COMPARTIR HOJA DE PEDIDO
===================================================== */

async function crearBlobWord() {
  const items = Object.values(carrito);

  if (items.length === 0) {
    alert("Tu carrito está vacío. Agrega productos antes de preparar el pedido.");
    return null;
  }

  if (!window.docx || !window.docx.Packer) {
    alert("No se pudo cargar el generador de Word. Revisa tu conexión a internet e inténtalo de nuevo.");
    return null;
  }

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, ShadingType
  } = window.docx;

  const fechaTexto = new Date().toLocaleDateString("es-SV");
  const bordes = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "D8E2D5" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "D8E2D5" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "D8E2D5" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "D8E2D5" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D8E2D5" },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D8E2D5" }
  };

  const parrafo = (texto, opciones = {}) => new Paragraph({
    alignment: opciones.alignment,
    spacing: { before: 0, after: opciones.after ?? 30, line: 220 },
    children: [new TextRun({
      text: String(texto),
      bold: Boolean(opciones.bold),
      size: opciones.size ?? 18,
      color: opciones.color ?? "26372B",
      font: "Arial"
    })]
  });

  const celda = (texto, opciones = {}) => new TableCell({
    width: { size: opciones.width ?? 2726, type: WidthType.DXA },
    margins: { top: 45, bottom: 45, left: 65, right: 65 },
    borders: bordes,
    ...(opciones.encabezado ? { shading: { fill: "3F8F25", type: ShadingType.CLEAR } } : {}),
    children: [new Paragraph({
      alignment: opciones.alignment ?? AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: 200 },
      children: [new TextRun({
        text: String(texto),
        bold: Boolean(opciones.encabezado || opciones.bold),
        size: opciones.encabezado ? 16 : 16,
        color: opciones.encabezado ? "FFFFFF" : "26372B",
        font: "Arial"
      })]
    })]
  });

  const filas = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        celda("Producto", { encabezado: true, width: 4700 }),
        celda("Precio", { encabezado: true, width: 1800, alignment: AlignmentType.RIGHT }),
        celda("Cant.", { encabezado: true, width: 1400, alignment: AlignmentType.CENTER }),
        celda("Subtotal", { encabezado: true, width: 3006, alignment: AlignmentType.RIGHT })
      ]
    })
  ];

  let total = 0;
  items.forEach(producto => {
    const cantidad = Math.max(1, parseInt(producto.cantidad, 10) || 1);
    const precio = Math.max(0, Number(producto.precio) || 0);
    const subtotal = precio * cantidad;
    total += subtotal;
    filas.push(new TableRow({
      cantSplit: true,
      children: [
        celda(`${producto.nombre || "Producto"} (${producto.unidad || "Unidad"})`, { width: 4700 }),
        celda(`$${precio.toFixed(2)}`, { width: 1800, alignment: AlignmentType.RIGHT }),
        celda(String(cantidad), { width: 1400, alignment: AlignmentType.CENTER }),
        celda(`$${subtotal.toFixed(2)}`, { width: 3006, alignment: AlignmentType.RIGHT })
      ]
    }));
  });

  const tabla = new Table({
    width: { size: 10906, type: WidthType.DXA },
    columnWidths: [4700, 1800, 1400, 3006],
    borders: bordes,
    rows: filas
  });

  const documento = new Document({
    creator: "Distribuidora Éxodo",
    title: "Hoja de pedido - Distribuidora Éxodo",
    description: "Detalle de los productos del pedido",
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 500, right: 500, bottom: 500, left: 500 }
        }
      },
      children: [
        parrafo("DISTRIBUIDORA ÉXODO", { bold: true, size: 28, color: "3F8F25", after: 45 }),
        parrafo("HOJA DE PEDIDO", { bold: true, size: 24, after: 35 }),
        parrafo("Fecha del pedido: " + fechaTexto, { size: 18, after: 100 }),
        tabla,
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 100, after: 40 },
          children: [new TextRun({ text: `TOTAL DEL PEDIDO: $${total.toFixed(2)}`, bold: true, size: 22, color: "32751E", font: "Arial" })]
        }),
        parrafo("Gracias por preferir Distribuidora Éxodo. Calidad y frescura para tu hogar.", { size: 16, color: "64748B", after: 0 })
      ]
    }]
  });

  return Packer.toBlob(documento);
}

function descargarBlobWord(blob) {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("El archivo Word está vacío.");
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `Pedido-Distribuidora-Exodo-${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function compartirWordWhatsApp() {
  try {
    const blob = await crearBlobWord();
    if (!blob) return;

    const nombreArchivo = `Pedido-Distribuidora-Exodo-${new Date().toISOString().slice(0, 10)}.docx`;
    const archivo = new File([blob], nombreArchivo, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    if (typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [archivo] })) {
      await navigator.share({
        files: [archivo],
        title: "Pedido - Distribuidora Éxodo",
        text: "Te comparto mi hoja de pedido en Word."
      });
      return;
    }

    descargarBlobWord(blob);
    alert("El documento Word se descargó. Abre WhatsApp y adjunta el archivo .docx descargado.");
  } catch (error) {
    if (error && error.name === "AbortError") return;
    console.error("Error al crear o compartir el Word:", error);
    alert("No se pudo compartir el Word. Inténtalo de nuevo; si el problema continúa, revisa tu conexión a internet.");
  }
}

/* OPCIÓN 1: ENVIAR DOCUMENTO WORD POR WHATSAPP */
// Conserva la función compartirWordWhatsApp() que ya tienes.
// Esta función genera el archivo y permite compartirlo como adjunto.

/* OPCIÓN 2: DESCARGAR DOCUMENTO WORD */
async function descargarPedidoWord() {
    try {
        const blob = await crearBlobWord();

        if (!blob) return;

        descargarBlobWord(blob);

        const estado = document.getElementById("mensaje-carrito");
        if (estado) {
            estado.textContent = "Tu documento Word se está descargando.";
        }
    } catch (error) {
        console.error("Error al descargar el pedido Word:", error);
        alert("No se pudo descargar el documento Word. Inténtalo de nuevo.");
    }
}

/* OPCIÓN 3: COPIAR RESUMEN Y PEGARLO EN WHATSAPP */
async function copiarPedido() {
    const mensaje = construirTextoPedido();

    if (!mensaje) {
        alert("Tu carrito está vacío. Agrega productos antes de copiar el pedido.");
        return;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(mensaje);
        } else {
            const area = document.createElement("textarea");
            area.value = mensaje;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.left = "-9999px";

            document.body.appendChild(area);
            area.select();

            const copiado = document.execCommand("copy");
            area.remove();

            if (!copiado) {
                throw new Error("No se pudo copiar el pedido.");
            }
        }

        const estado = document.getElementById("mensaje-carrito");

        if (estado) {
            estado.textContent =
                "¡Pedido copiado! Abre WhatsApp y pega el texto en el chat.";
        } else {
            alert("¡Pedido copiado! Ya puedes pegarlo en WhatsApp.");
        }
    } catch (error) {
        console.error("Error al copiar el pedido:", error);
        alert("No se pudo copiar automáticamente. Inténtalo de nuevo.");
    }
}

/* =====================================================
   INICIALIZACIÓN AUTOMÁTICA DE PÁGINAS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  actualizarBadgeCarrito();

  iniciarBurbujaCarrito();

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


