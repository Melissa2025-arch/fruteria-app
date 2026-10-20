// ==========================================
// CONEXIÓN CON SUPABASE
// ==========================================
const SUPABASE_URL = "https://kwfqjieynfxxkfycqbom.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_v2RhsMkjIcNdz2FS1SIqug_9OGu3L2k";

let productosBusquedaCache = []; // Almacén en memoria para el buscador del inicio

// ==========================================
// CARGAR PRODUCTOS DESDE SUPABASE POR CATEGORÍA
// ==========================================
async function cargarProductos(categoria, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    
    contenedor.innerHTML = "<p>Cargando productos...</p>";
    try {
        const respuesta = await fetch(
            `${SUPABASE_URL}/rest/v1/productos?categoria=eq.${categoria}&select=*`,
            {
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );
        if (!respuesta.ok) throw new Error("Error al conectar con Supabase.");
        
        const productos = await respuesta.json();
        renderizarProductos(productos, contenedorId);
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `<p>❌ No fue posible cargar los productos desde Supabase.</p>`;
    }
}

// ==========================================
// BUSCADOR LIMPIO EN EL INICIO (SIN MOSTRAR NADA AL ENTRAR)
// ==========================================
async function inicializarBuscadorInicio() {
    try {
        const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/productos?select=*`, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (!respuesta.ok) throw new Error("Error al conectar con Supabase.");
        productosBusquedaCache = await respuesta.json();
    } catch (error) {
        console.error(error);
    }
}

function buscarProductosInicio() {
    const input = document.getElementById("input-busqueda");
    const contenedor = document.getElementById("grid-busqueda");
    if (!input || !contenedor) return;

    const texto = input.value.toLowerCase().trim();
    
    // Si la barra de búsqueda está vacía, no mostramos ningún producto abajo
    if (texto === "") {
        contenedor.innerHTML = "";
        return;
    }

    const filtrados = productosBusquedaCache.filter(producto => 
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(texto))
    );

    renderizarProductos(filtrados, "grid-busqueda");
}

// ==========================================
// RENDERIZAR TARJETAS DE PRODUCTOS
// ==========================================
function renderizarProductos(productos, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (productos.length === 0) {
        contenedor.innerHTML = `<p style='text-align:center; width:100%; grid-column: 1/-1; color:#777; padding: 20px;'>🔍 No se encontraron productos.</p>`;
        return;
    }

    productos.forEach(producto => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "producto-card";

        const imgUrl = producto.imagen || "img/logo.png";

        tarjeta.innerHTML = `
            <div>
                <div class="producto-imagen-container">
                    <img src="${imgUrl}" alt="${producto.nombre}">
                </div>
                <div class="categoria-tag">${producto.categoria}</div>
                <h3>${producto.nombre}</h3>
                <div class="producto-desc-corta">${producto.descripcion || ''}</div>
            </div>
            <div>
                <div class="precio-y-controles">
                    <div class="precio">$${Number(producto.precio).toFixed(2)}</div>
                    <div class="contador-acciones">
                        <button onclick="cambiarCantidadInput('qty-${producto.id}', -1)">-</button>
                        <span id="qty-${producto.id}">1</span>
                        <button onclick="cambiarCantidadInput('qty-${producto.id}', 1)">+</button>
                    </div>
                </div>
                <button class="btn-principal" style="width: 100%; margin-top: 12px; padding: 10px;" onclick='agregarAlCarritoConCantidad(${JSON.stringify(producto)}, "qty-${producto.id}")'>
                    🛒 Agregar
                </button>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function cambiarCantidadInput(idElemento, cambio) {
    const span = document.getElementById(idElemento);
    if (!span) return;
    let actual = parseInt(span.textContent) + cambio;
    if (actual < 1) actual = 1;
    span.textContent = actual;
}

// ==========================================
// GESTIÓN DEL CARRITO
// ==========================================
function obtenerCarrito() {
    const carrito = localStorage.getItem("carrito");
    return carrito ? JSON.parse(carrito) : [];
}

function agregarAlCarritoConCantidad(producto, idInputCantidad) {
    const spanQty = document.getElementById(idInputCantidad);
    const cantidadSeleccionada = spanQty ? parseInt(spanQty.textContent) : 1;
    
    let carrito = obtenerCarrito();
    const existente = carrito.find(item => item.id === producto.id);
    
    if (existente) {
        existente.cantidad += cantidadSeleccionada;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            cantidad: cantidadSeleccionada
        });
    }
    
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert(`¡${cantidadSeleccionada}x ${producto.nombre} agregado(s) al carrito 🛒!`);
}

function mostrarCarrito() {
    const contenedor = document.getElementById("lista-carrito");
    const totalElemento = document.getElementById("total-carrito-txt");
    if (!contenedor) return;
    
    const carrito = obtenerCarrito();
    contenedor.innerHTML = "";
    let total = 0;
    
    if (carrito.length === 0) {
        contenedor.innerHTML = `<p>🛒 Tu carrito está vacío.</p>`;
        if (totalElemento) totalElemento.textContent = "0.00";
        return;
    }
    
    carrito.forEach((producto, index) => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;
        
        const item = document.createElement("div");
        item.className = "carrito-item";
        item.innerHTML = `
            <div>
                <strong>${producto.nombre}</strong>
                <p style="color: #666; font-size: 13px;">$${producto.precio.toFixed(2)} × ${producto.cantidad}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <strong>$${subtotal.toFixed(2)}</strong>
                <button style="background: #ffdddd; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer;" onclick="eliminarDelCarrito(${index})">🗑️</button>
            </div>
        `;
        contenedor.appendChild(item);
    });
    
    if (totalElemento) {
        totalElemento.textContent = total.toFixed(2);
    }
}

function eliminarDelCarrito(index) {
    let carrito = obtenerCarrito();
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    mostrarCarrito();
}

// ==========================================
// ENVÍO DE PEDIDO A CRÉDITO POR WHATSAPP
// ==========================================
function enviarPedidoWhatsApp() {
    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }
    
    let mensaje = "🛒 *NUEVO PEDIDO A CRÉDITO - DISTRIBUIDORA ÉXODO* 🛒\n\n";
    let total = 0;
    
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `• ${item.cantidad}x ${item.nombre} - $${subtotal.toFixed(2)}\n`;
    });
    
    mensaje += `\n💰 *Total del pedido:* $${total.toFixed(2)}`;
    mensaje += `\n📄 *Condición de Pago:* Crédito a 30 días`;
    mensaje += `\n\nPor favor confirmar hora y lugar de entrega. ¡Gracias!`;
    
    const numeroWhatsApp = "50363114191"; // Reemplaza con tu número real
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(urlWhatsApp, '_blank');
}

// ==========================================
// GENERAR HOJA DE PEDIDO EN PDF
// ==========================================
function generarPDFPedido() {
    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
        alert("Tu carrito está vacío. Agrega productos para generar la hoja de pedido.");
        return;
    }

    const tablaBody = document.getElementById("pdf-tabla-body");
    const totalPdf = document.getElementById("pdf-total");
    const fechaPdf = document.getElementById("pdf-fecha");

    const hoy = new Date();
    fechaPdf.textContent = `Fecha: ${hoy.toLocaleDateString('es-ES')} ${hoy.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}`;

    tablaBody.innerHTML = "";
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td style="padding: 8px; border: 1px solid #eee;">${item.nombre}</td>
            <td style="padding: 8px; border: 1px solid #eee; text-align: center;">${item.cantidad}</td>
            <td style="padding: 8px; border: 1px solid #eee; text-align: right;">$${item.precio.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #eee; text-align: right;">$${subtotal.toFixed(2)}</td>
        `;
        tablaBody.appendChild(fila);
    });

    totalPdf.textContent = total.toFixed(2);

    const elemento = document.getElementById("plantilla-pdf");
    elemento.style.display = "block";

    const opciones = {
        margin:       10,
        filename:     `Pedido_Exodo_${hoy.toISOString().slice(0,10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opciones).from(elemento).save().then(() => {
        elemento.style.display = "none";
    });
}

function toggleMenu() {
    const menu = document.getElementById("menu");
    menu.classList.toggle("menu-abierto");
}