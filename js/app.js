// ==========================================
// CONEXIÓN CON SUPABASE
// ==========================================

const SUPABASE_URL = "https://kwfqjieynfxxkfycqbom.supabase.co";

// IMPORTANTE:
// Coloca aquí la misma anon key que ya tienes
// actualmente en tu proyecto.
const SUPABASE_ANON_KEY = "TU_ANON_KEY_ACTUAL";


// ==========================================
// CARGAR PRODUCTOS
// ==========================================

async function cargarProductos(categoria, contenedorId) {

    const contenedor = document.getElementById(contenedorId);

    if (!contenedor) {
        return;
    }

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

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los productos.");
        }

        const productos = await respuesta.json();

        contenedor.innerHTML = "";

        if (productos.length === 0) {

            contenedor.innerHTML = `
                <p>
                    No hay productos disponibles en esta categoría.
                </p>
            `;

            return;
        }

        productos.forEach(producto => {

            const tarjeta = document.createElement("div");

            tarjeta.className = "producto-card";

            tarjeta.innerHTML = `

                <div class="producto-icono">
                    ${obtenerIcono(categoria)}
                </div>

                <h3>${producto.nombre}</h3>

                <div class="precio">
                    $${Number(producto.precio).toFixed(2)}
                </div>

                <div class="stock">
                    Stock disponible: ${producto.stock}
                </div>

                <button
                    class="btn"
                    onclick='agregarAlCarrito(${JSON.stringify(producto)})'
                >
                    🛒 Agregar al carrito
                </button>

            `;

            contenedor.appendChild(tarjeta);

        });

    } catch (error) {

        console.error(error);

        contenedor.innerHTML = `
            <p>
                ❌ No fue posible cargar los productos.
            </p>
        `;

    }
}


// ==========================================
// ICONOS
// ==========================================

function obtenerIcono(categoria) {

    const iconos = {

        fruta: "🍎",

        verdura: "🥕",

        grano: "🌽",

        lacteo: "🥛",

        canasta: "🧺"

    };

    return iconos[categoria] || "🛒";
}


// ==========================================
// CARRITO
// ==========================================

function obtenerCarrito() {

    const carrito = localStorage.getItem("carrito");

    return carrito ? JSON.parse(carrito) : [];

}


// ==========================================
// AGREGAR PRODUCTO
// ==========================================

function agregarAlCarrito(producto) {

    let carrito = obtenerCarrito();

    const productoExistente = carrito.find(
        item => item.id === producto.id
    );

    if (productoExistente) {

        productoExistente.cantidad++;

    } else {

        carrito.push({

            id: producto.id,

            nombre: producto.nombre,

            precio: Number(producto.precio),

            cantidad: 1

        });

    }

    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );

    alert(
        `${producto.nombre} fue agregado al carrito 🛒`
    );

}


// ==========================================
// MOSTRAR CARRITO
// ==========================================

function mostrarCarrito() {

    const contenedor =
        document.getElementById("lista-carrito");

    const totalElemento =
        document.getElementById("total-carrito");

    if (!contenedor) {
        return;
    }

    const carrito = obtenerCarrito();

    contenedor.innerHTML = "";

    let total = 0;

    if (carrito.length === 0) {

        contenedor.innerHTML = `
            <p>
                🛒 Tu carrito está vacío.
            </p>
        `;

        if (totalElemento) {
            totalElemento.textContent = "0.00";
        }

        return;
    }

    carrito.forEach((producto, index) => {

        const subtotal =
            producto.precio * producto.cantidad;

        total += subtotal;

        const item =
            document.createElement("div");

        item.className = "carrito-item";

        item.innerHTML = `

            <div>

                <strong>
                    ${producto.nombre}
                </strong>

                <p>
                    $${producto.precio.toFixed(2)}
                    ×
                    ${producto.cantidad}
                </p>

            </div>

            <strong>
                $${subtotal.toFixed(2)}
            </strong>

            <button
                class="btn"
                onclick="eliminarDelCarrito(${index})"
            >
                🗑️
            </button>

        `;

        contenedor.appendChild(item);

    });

    if (totalElemento) {

        totalElemento.textContent =
            total.toFixed(2);

    }

}


// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

function eliminarDelCarrito(index) {

    let carrito = obtenerCarrito();

    carrito.splice(index, 1);

    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );

    mostrarCarrito();

}