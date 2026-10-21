const SUPABASE_URL = "https://kwfqjieynfxxkfycqbom.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_v2RhsMkjIcNdz2FS1SIqug_9OGu3L2k";

const supabase = (window.supabase && !SUPABASE_URL.includes('TU_PROYECTO')) 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Memoria caché para búsquedas y catálogo
let productosBusquedaCache = [];
let carrito = JSON.parse(localStorage.getItem("carrito_exodo")) || {};

function toggleMenu() {
  const nav = document.getElementById("menu");
  if (nav) nav.classList.toggle("menu-abierto");
}

function actualizarBadgeCarrito() {
  const badge = document.getElementById("cant-carrito-badge");
  if (!badge) return;
  const totalItems = Object.values(carrito).reduce((acc, p) => acc + (p.cantidad || 1), 0);
  badge.innerText = `(${totalItems})`;
}

async function obtenerTodosProductos() {
  if (productosBusquedaCache.length > 0) return productosBusquedaCache;

  try {
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/productos?select=*`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (respuesta.ok) {
      productosBusquedaCache = await respuesta.json();
      return productosBusquedaCache;
    }
  } catch (err) {
    console.warn("Fetch directo falló, intentando SDK Supabase o Respaldo...", err);
  }

  if (supabase) {
    const { data } = await supabase.from('productos').select('*').order('nombre', { ascending: true });
    if (data && data.length > 0) {
      productosBusquedaCache = data;
      return productosBusquedaCache;
    }
  }

  return [];
}

async function inicializarBuscadorInicio() {
  actualizarBadgeCarrito();
  await obtenerTodosProductos();
  const contenedor = document.getElementById("grid-busqueda");
  if (contenedor) contenedor.innerHTML = ""; // Inicio limpio
}

function buscarProductosInicio() {
  const input = document.getElementById("input-busqueda");
  const contenedor = document.getElementById("grid-busqueda");
  if (!input || !contenedor) return;

  const texto = input.value.toLowerCase().trim();

  // Si la barra está vacía, no muestra productos en inicio
  if (texto === "") {
    contenedor.innerHTML = "";
    return;
  }

  const filtrados = productosBusquedaCache.filter(p => 
    p.nombre.toLowerCase().includes(texto) ||
    p.categoria.toLowerCase().includes(texto) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(texto))
  );

  renderizarTarjetas(filtrados, "grid-busqueda");
}

async function cargarCategoriaEspecifica(cat) {
  actualizarBadgeCarrito();
  const todos = await obtenerTodosProductos();
  const filtrados = todos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase());
  renderizarTarjetas(filtrados, "grid-busqueda");
}

function buscarProductosCategoria(cat) {
  const input = document.getElementById("input-busqueda");
  if (!input) return;
  const texto = input.value.toLowerCase().trim();

  const filtrados = productosBusquedaCache.filter(p => 
    p.categoria.toLowerCase() === cat.toLowerCase() &&
    (p.nombre.toLowerCase().includes(texto) || (p.descripcion && p.descripcion.toLowerCase().includes(texto)))
  );

  renderizarTarjetas(filtrados, "grid-busqueda");
}

function renderizarTarjetas(productos, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  if (!productos || productos.length === 0) {
    contenedor.innerHTML = `<p style='grid-column: 1/-1; text-align:center; color:#64748b; padding: 20px; font-weight:700;'>🔍 No se encontraron productos.</p>`;
    return;
  }

  contenedor.innerHTML = productos.map(p => {
    const cant = carrito[p.id]?.cantidad || 1;
    const imgUrl = p.imagen || "img/logo.png";
    const desc = p.descripcion || p.desc || "";

    return `
      <article class="producto-card">
        <div>
          <div class="producto-imagen-container">
            <img src="${imgUrl}" alt="${p.nombre}" onerror="this.src='https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=400&q=80'">
          </div>
          <span class="categoria-tag">${p.categoria} • ${p.unidad || 'Unidad'}</span>
          <h3>${p.nombre}</h3>
          <p class="producto-desc-corta">${desc}</p>
        </div>
        <div>
          <div class="precio-y-controles">
            <span class="precio">$${parseFloat(p.precio).toFixed(2)}</span>
            <div class="contador-acciones">
              <button onclick="cambiarCantCard('${p.id}', -1)">-</button>
              <span id="qty-${p.id}">${cant}</span>
              <button onclick="cambiarCantCard('${p.id}', 1)">+</button>
            </div>
          </div>
          <button class="btn-principal" onclick="agregarAlCarrito('${p.id}')">
            🛒 Agregar
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function cambiarCantCard(id, delta) {
  const span = document.getElementById(`qty-${id}`);
  if (!span) return;
  let valor = parseInt(span.innerText) + delta;
  if (valor < 1) valor = 1;
  span.innerText = valor;
}

function agregarAlCarrito(id) {
  const prod = productosBusquedaCache.find(p => String(p.id) === String(id));
  if (!prod) return;

  const span = document.getElementById(`qty-${id}`);
  const cant = span ? parseInt(span.innerText) : 1;

  if (carrito[id]) {
    carrito[id].cantidad += cant;
  } else {
    carrito[id] = { ...prod, cantidad: cant };
  }

  localStorage.setItem("carrito_exodo", JSON.stringify(carrito));
  actualizarBadgeCarrito();
}

function renderizarPaginaCarrito() {
  actualizarBadgeCarrito();
  const contenedor = document.getElementById("contenedor-items-carrito");
  const totalSpan = document.getElementById("total-precio");
  if (!contenedor) return;

  const items = Object.values(carrito);

  if (items.length === 0) {
    contenedor.innerHTML = `<p style="padding: 20px; background: #fff; border-radius: 12px; font-weight: 700; color: #64748b;">Tu carrito está vacío. Revisa nuestras categorías para agregar productos.</p>`;
    if (totalSpan) totalSpan.innerText = "$0.00";
    return;
  }

  let total = 0;
  contenedor.innerHTML = `
    <table class="tabla-carrito">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Precio</th>
          <th>Cantidad</th>
          <th>Subtotal</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(p => {
          const sub = p.precio * p.cantidad;
          total += sub;
          return `
            <tr>
              <td><strong>${p.nombre}</strong> (${p.unidad || 'Unidad'})</td>
              <td>$${parseFloat(p.precio).toFixed(2)}</td>
              <td>${p.cantidad}</td>
              <td>$${sub.toFixed(2)}</td>
              <td><button style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:6px; cursor:pointer;" onclick="eliminarDelCarrito('${p.id}')">❌</button></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  if (totalSpan) totalSpan.innerText = `$${total.toFixed(2)}`;
}

function eliminarDelCarrito(id) {
  delete carrito[id];
  localStorage.setItem("carrito_exodo", JSON.stringify(carrito));
  renderizarPaginaCarrito();
}

function enviarPedidoWhatsApp() {
  const items = Object.values(carrito);
  if (items.length === 0) return;

  let mensaje = "Hola, Distribuidora Éxodo, deseo realizar el siguiente pedido:%0A%0A";
  let total = 0;

  items.forEach((p, idx) => {
    const sub = p.precio * p.cantidad;
    total += sub;
    mensaje += `${idx + 1}. *${p.nombre}* (${p.unidad || 'Unidad'}) - Cantidad: ${p.cantidad} x $${parseFloat(p.precio).toFixed(2)} = $${sub.toFixed(2)}%0A`;
  });

  mensaje += `%0A*Total Estimado:* $${total.toFixed(2)}`;
  mensaje += `%0A%0ASolicito entrega a domicilio. ¡Quedo a la espera de su confirmación!`;

  window.open(`https://wa.me/50379321963?text=${mensaje}`, '_blank');
}