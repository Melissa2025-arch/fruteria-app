

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
    alert("Faltan elementos de la tabla del PDF. Revisa sus identificadores.");
    return null;
  }

  if (typeof html2pdf === "undefined") {
    alert("No se cargó la biblioteca PDF. Revisa tu conexión a internet.");
    return null;
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
        <td style="padding:8px;border:1px solid #c8e2ce;color:#222">
          ${escaparHTML(producto.nombre)}
          (${escaparHTML(producto.unidad || "Unidad")})
        </td>
        <td style="padding:8px;border:1px solid #c8e2ce;text-align:center;color:#222">
          ${cantidad}
        </td>
        <td style="padding:8px;border:1px solid #c8e2ce;text-align:right;color:#222">
          $${precio.toFixed(2)}
        </td>
        <td style="padding:8px;border:1px solid #c8e2ce;text-align:right;color:#222">
          $${subtotal.toFixed(2)}
        </td>
      </tr>`;
  }).join("");

  totalElemento.textContent = total.toFixed(2);

  if (fecha) {
    fecha.textContent = new Date().toLocaleDateString("es-SV");
  }

  return plantilla;
}

async function crearBlobPDF() {
  const plantilla = prepararContenidoPDF();

  if (!plantilla) return null;

  // Crear una copia independiente de la plantilla.
  const copia = plantilla.cloneNode(true);

  copia.removeAttribute("aria-hidden");
  copia.classList.remove("pdf-fuera-pantalla");

  Object.assign(copia.style, {
    display: "block",
    position: "absolute",
    left: "0",
    top: "0",
    width: "800px",
    height: "auto",
    margin: "0",
    padding: "30px",
    background: "#ffffff",
    color: "#222222",
    opacity: "1",
    visibility: "visible",
    zIndex: "9999",
    overflow: "visible",
    boxSizing: "border-box"
  });

  // Mantener el contenido dentro del documento mientras se captura.
  document.body.appendChild(copia);

  try {
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const opciones = {
      margin: 10,
      image: {
        type: "jpeg",
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: true
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

    // Obtener el documento PDF terminado y convertirlo a Blob.
    const blob = await html2pdf()
      .set(opciones)
      .from(copia)
      .toPdf()
      .get("pdf")
      .then(pdf => pdf.output("blob"));

    if (!(blob instanceof Blob) || blob.size < 100) {
      throw new Error("El PDF generado no contiene datos suficientes.");
    }

    console.log("PDF generado. Tamaño:", blob.size, "bytes");

    return blob;
  } finally {
    copia.remove();
  }
}

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
    console.error("Error al generar el PDF:", error);
    alert(
      "No se pudo generar el PDF. Abre la consola del navegador " +
      "(F12) y revisa el error."
    );
  }
}

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
      "El PDF se descargó. Abre WhatsApp y adjunta el archivo " +
      "descargado para enviarlo."
    );
  } catch (error) {
    if (error.name === "AbortError") return;

    console.error("Error al compartir el PDF:", error);
    alert("No se pudo compartir el PDF. Prueba primero la descarga.");
  }
}
