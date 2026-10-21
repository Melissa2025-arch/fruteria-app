const SUPABASE_URL = "https://kwfqjieynfxxkfycqbom.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_v2RhsMkjIcNdz2FS1SIqug_9OGu3L2k";

// Lista completa de respaldo con todos los productos
const PRODUCTOS_BACKUP = [
  // FRUTAS
  { id: '1', nombre: 'Melón', categoria: 'frutas', unidad: 'Unidad', precio: 2.25, imagen: 'img/melon.jpg', descripcion: 'Melón fresco dulce por unidad.' },
  { id: '2', nombre: 'Naranjas', categoria: 'frutas', unidad: 'Unidad', precio: 0.98, imagen: 'img/naranjas.jpg', descripcion: 'Naranja jugosa por unidad.' },
  { id: '3', nombre: 'Tamarindo', categoria: 'frutas', unidad: 'Libra', precio: 3.85, imagen: 'img/tamarindo.jpg', descripcion: 'Tamarindo natural por libra.' },
  { id: '4', nombre: 'Maracuyá (Libra)', categoria: 'frutas', unidad: 'Libra', precio: 3.85, imagen: 'img/maracuya.jpg', descripcion: 'Maracuyá fresco por libra.' },
  { id: '5', nombre: 'Maracuyá (Unidad)', categoria: 'frutas', unidad: 'Unidad', precio: 0.75, imagen: 'img/maracuya.jpg', descripcion: 'Maracuyá por unidad.' },
  { id: '6', nombre: 'Mandarina', categoria: 'frutas', unidad: 'Unidad', precio: 0.98, imagen: 'img/mandarina.jpg', descripcion: 'Mandarina dulce por unidad.' },
  { id: '7', nombre: 'Manzana', categoria: 'frutas', unidad: 'Unidad', precio: 0.45, imagen: 'img/manzana.jpg', descripcion: 'Manzana fresca por unidad.' },
  { id: '8', nombre: 'Guineo', categoria: 'frutas', unidad: 'Unidad', precio: 0.25, imagen: 'img/guineo.jpg', descripcion: 'Guineo maduro por unidad.' },
  { id: '9', nombre: 'Uva Roja', categoria: 'frutas', unidad: 'Libra', precio: 4.80, imagen: 'img/uva-roja.jpg', descripcion: 'Uva roja seleccionada por libra.' },
  { id: '10', nombre: 'Sandía', categoria: 'frutas', unidad: 'Unidad', precio: 4.00, imagen: 'img/sandia.jpg', descripcion: 'Sandía entera dulce.' },
  
  // VERDURAS
  { id: '20', nombre: 'Cebolla', categoria: 'verduras', unidad: 'Unidad', precio: 0.95, imagen: 'img/cebolla.jpg', descripcion: 'Cebolla fresca por unidad.' },
  { id: '21', nombre: 'Chile Verde', categoria: 'verduras', unidad: 'Unidad', precio: 0.65, imagen: 'img/chile.jpg', descripcion: 'Chile verde dulce por unidad.' },
  { id: '22', nombre: 'Lechuga', categoria: 'verduras', unidad: 'Unidad', precio: 2.25, imagen: 'img/lechuga.jpg', descripcion: 'Lechuga fresca por unidad.' },
  { id: '23', nombre: 'Zanahoria', categoria: 'verduras', unidad: 'Unidad', precio: 0.90, imagen: 'img/zanahoria.jpg', descripcion: 'Zanahoria fresca por unidad.' },
  { id: '24', nombre: 'Tomate', categoria: 'verduras', unidad: 'Bolsa', precio: 1.25, imagen: 'img/tomate.jpg', descripcion: 'Tomate de cocina en bolsa.' },
  { id: '25', nombre: 'Cilantro (Manojo)', categoria: 'verduras', unidad: 'Manojo', precio: 4.00, imagen: 'img/cilantro.jpg', descripcion: 'Manojo de cilantro fresco.' },
  { id: '26', nombre: 'Papa', categoria: 'verduras', unidad: 'Libra', precio: 1.10, imagen: 'img/papa.jpg', descripcion: 'Papa lavada por libra.' },
  { id: '27', nombre: 'Apio', categoria: 'verduras', unidad: 'Manojo', precio: 3.50, imagen: 'img/apio.jpg', descripcion: 'Manojo de apio fresco.' },
  { id: '28', nombre: 'Limones', categoria: 'verduras', unidad: 'Unidad', precio: 0.40, imagen: 'img/limon.jpg', descripcion: 'Limón jugoso por unidad.' },
  { id: '29', nombre: 'Güisquil', categoria: 'verduras', unidad: 'Unidad', precio: 0.85, imagen: 'img/guisquil.jpg', descripcion: 'Güisquil tierno por unidad.' },

  // GRANOS
  { id: '40', nombre: 'Azúcar Blanca', categoria: 'granos', unidad: 'Libra', precio: 0.90, imagen: 'img/azucar-blanca.jpg', descripcion: 'Azúcar refinada blanca por libra.' },
  { id: '41', nombre: 'Frijoles Seda', categoria: 'granos', unidad: 'Libra', precio: 1.95, imagen: 'img/frijol-seda.jpg', descripcion: 'Frijol rojo seda de primera calidad.' },
  { id: '42', nombre: 'Arroz Precocido', categoria: 'granos', unidad: 'Libra', precio: 0.98, imagen: 'img/arroz-precocido.jpg', descripcion: 'Arroz precocido suelto por libra.' },

  // HARINAS Y CEREALES
  { id: '50', nombre: 'Harina Maseca 820g', categoria: 'harinas', unidad: 'Bolsa', precio: 2.50, imagen: 'img/maseca.jpg', descripcion: 'Harina de maíz Maseca 820g.' },
  { id: '51', nombre: 'Avena Molida', categoria: 'harinas', unidad: 'Bolsa', precio: 3.85, imagen: 'img/avena-molida.jpg', descripcion: 'Avena molida fina en bolsa.' },
  { id: '52', nombre: 'Corn Flakes', categoria: 'harinas', unidad: 'Caja', precio: 8.20, imagen: 'img/corn-flakes.jpg', descripcion: 'Cereal hojuelas de maíz en caja.' },

  // LÁCTEOS
  { id: '60', nombre: 'Quesillo', categoria: 'lacteos', unidad: 'Libra', precio: 4.25, imagen: 'img/quesillo.jpg', descripcion: 'Quesillo especial ideal para pupusas.' },
  { id: '61', nombre: 'Crema Lactolac 380g', categoria: 'lacteos', unidad: 'Libra', precio: 4.85, imagen: 'img/crema-lactolac.jpg', descripcion: 'Crema pasteurizada Lactolac.' },
  { id: '62', nombre: 'Queso Fresco', categoria: 'lacteos', unidad: 'Maqueta', precio: 4.95, imagen: 'img/queso-fresco.jpg', descripcion: 'Maqueta de queso fresco artesanal.' },

  // CARNES
  { id: '70', nombre: 'Carne de Res', categoria: 'carnes', unidad: 'Libra', precio: 6.60, imagen: 'img/carne-res.jpg', descripcion: 'Carne de res de primera por libra.' },
  { id: '71', nombre: 'Pollo Pechuga', categoria: 'carnes', unidad: 'Libra', precio: 2.30, imagen: 'img/pechuga-pollo.jpg', descripcion: 'Pechuga de pollo fresca por libra.' },
  { id: '72', nombre: 'Cartón de Huevo', categoria: 'carnes', unidad: 'Cartón', precio: 6.65, imagen: 'img/huevo.jpg', descripcion: 'Cartón de huevos frescos (30 unidades).' },

  // BEBIDAS
  { id: '80', nombre: 'Agua Purificada', categoria: 'bebidas', unidad: 'Fardo', precio: 3.98, imagen: 'img/agua-fardo.jpg', descripcion: 'Fardo de agua purificada.' },

  // EXTRAS
  { id: '90', nombre: 'Aceite Orisol', categoria: 'extras', unidad: 'Bolsa', precio: 3.90, imagen: 'img/aceite-orisol.jpg', descripcion: 'Aceite vegetal Orisol en bolsa.' },
  { id: '91', nombre: 'Mayonesa', categoria: 'extras', unidad: 'Bolsa', precio: 6.50, imagen: 'img/mayonesa.jpg', descripcion: 'Mayonesa en bolsa.' },
  { id: '92', nombre: 'Canela', categoria: 'extras', unidad: 'Bolsa', precio: 1.25, imagen: 'img/canela.jpg', descripcion: 'Canela en rama o molida en bolsa.' }
];

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
async function inicializarPaginaInicio() {
  actualizarBadgeCarrito();
  const productos = await obtenerTodosProductos();
  // Muestra todos los productos inmediatamente al entrar
  renderizarTarjetas(productos, "grid-busqueda");
}

function buscarProductosInicio() {
  const input = document.getElementById("input-busqueda");
  const contenedor = document.getElementById("grid-busqueda");
  if (!input || !contenedor) return;

  const texto = input.value.toLowerCase().trim();

  if (texto === "") {
    renderizarTarjetas(productosBusquedaCache, "grid-busqueda");
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
  
  const categoriaBuscada = cat.toLowerCase().trim();
  const filtrados = todos.filter(p => {
    if (!p.categoria) return false;
    const catProd = p.categoria.toLowerCase().trim();
    return catProd === categoriaBuscada || catProd.includes(categoriaBuscada);
  });

  renderizarTarjetas(filtrados, "grid-busqueda");
}

function buscarProductosInicio() {
  const input = document.getElementById("input-busqueda");
  const contenedor = document.getElementById("grid-busqueda");
  if (!input || !contenedor) return;

  const texto = input.value.toLowerCase().trim();

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

function buscarProductosCategoria(cat) {
  const input = document.getElementById("input-busqueda");
  if (!input) return;
  const texto = input.value.toLowerCase().trim();

  const filtrados = productosBusquedaCache.filter(p => 
    p.categoria.toLowerCase().includes(cat.toLowerCase()) &&
    (p.nombre.toLowerCase().includes(texto) || (p.descripcion && p.descripcion.toLowerCase().includes(texto)))
  );

  renderizarTarjetas(filtrados, "grid-busqueda");
}

function renderizarTarjetas(productos, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  if (!productos || productos.length === 0) {
    contenedor.innerHTML = `<div style='grid-column: 1/-1; text-align:center; color:#64748b; padding: 30px; font-weight:700; background:#fff; border-radius:12px; border:1px solid #e2e8f0;'>🔍 No se encontraron productos disponibles en esta sección.</div>`;
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