// ==========================================
// CONEXIÓN CON SUPABASE
// ==========================================
const SUPABASE_URL = "https://kwfqjieynfxxkfycqbom.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_v2RhsMkjIcNdz2FS1SIqug_9OGu3L2k";

// ==========================================
// CARGAR PRODUCTOS DESDE SUPABASE
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
        contenedor.innerHTML = "";
        
        if (productos.length === 0) {
            contenedor.innerHTML = `<p>No hay productos disponibles en esta categoría.</p>`;
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
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `<p>❌ No fue posible cargar los productos desde Supabase.</p>`;
    }
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
// ENVÍO DE PEDIDO A CRÉDITO POR ENLACE WHATSAPP
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
    
    // REEMPLAZA ESTE NÚMERO POR TU NÚMERO REAL DE WHATSAPP CON CÓDIGO DE PAÍS (ej: 50370000000)
    const numeroWhatsApp = "50363114191"; 
    
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    // Abre el enlace directo hacia la API de WhatsApp
    window.open(urlWhatsApp, '_blank');
}

function toggleMenu() {
    const menu = document.getElementById("menu");
    menu.classList.toggle("menu-abierto");
}