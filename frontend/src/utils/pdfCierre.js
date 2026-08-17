import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "../assets/login/logo.png";

// Helper to load image as a Promise
const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // Fallback if image fails to load
    img.src = src;
  });
};

export const exportCierrePDF = async (cierre) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Load the logo image
  const img = await loadImage(logoImg);

  // Deduce or fallback rate
  let tasa = cierre.tasa_cambio;
  if (!tasa) {
    const totalBs = Number(cierre.monto_efectivo_bs || 0) + Number(cierre.monto_punto_bs || 0) + Number(cierre.monto_pago_movil_bs || 0);
    const totalUsdBsEq = Number(cierre.total_usdt || 0) - Number(cierre.monto_efectivo_usd || 0);
    if (totalUsdBsEq > 0 && totalBs > 0) {
      tasa = totalBs / totalUsdBsEq;
    } else {
      tasa = 1.0; // Fallback
    }
  }

  // --- BRAND COLOR SYSTEM ---
  const PRIMARY_COLOR = [234, 42, 51]; // Pizza Red #EA2A33
  const SECONDARY_COLOR = [71, 85, 105]; // Slate 600
  const TEXT_DARK = [30, 41, 59]; // Slate 800
  const TEXT_MUTED = [148, 163, 184]; // Slate 400
  const BG_LIGHT = [248, 250, 252]; // Slate 50

  // Helper for text formatting
  const fmtMoneyUSD = (n) => `$${Number(n || 0).toFixed(2)}`;
  const fmtMoneyBs = (n) =>
    `Bs. ${Number(n || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formattedDate = cierre.fecha_hora
    ? new Date(cierre.fecha_hora).toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const formattedTime = cierre.fecha_hora
    ? new Date(cierre.fecha_hora).toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  // --- HEADER SECTION ---
  // Logo
  if (img) {
    // logo.png aspect ratio: let's draw it at 32mm width and 32mm height (square)
    doc.addImage(img, "PNG", 14, 12, 32, 32);
  }

  // Company Information (Right Aligned)
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PIZZERÍA NIKO", 196, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SECONDARY_COLOR);
  doc.text("R.I.F.: J-12345678-9", 196, 23, { align: "right" });
  doc.text("Sistema de Control Interno y Caja", 196, 27, { align: "right" });
  doc.text("Email: administracion@pizzerianiko.com", 196, 31, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // border-slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 48, 196, 48);

  // --- DOCUMENT TITLE ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(`REPORTE DE CIERRE DE CAJA #${cierre.id_cierre || "N/A"}`, 14, 57);

  // --- METADATA GRID ---
  // Background for metadata box
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(14, 62, 182, 28, 4, 4, "F");

  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Información del Cierre:", 18, 68);

  doc.setFont("helvetica", "bold");
  doc.text("Cajero Responsable:", 18, 75);
  doc.setFont("helvetica", "normal");
  doc.text(cierre.usuario_nombre || "Cajero Desconocido", 55, 75);

  doc.setFont("helvetica", "bold");
  doc.text("Fecha del Cierre:", 18, 82);
  doc.setFont("helvetica", "normal");
  doc.text(`${formattedDate}  a las  ${formattedTime}`, 55, 82);

  doc.setFont("helvetica", "bold");
  doc.text("Órdenes Procesadas:", 120, 75);
  doc.setFont("helvetica", "normal");
  doc.text(`${cierre.num_ordenes || 0} órdenes`, 155, 75);

  if (tasa) {
    doc.setFont("helvetica", "bold");
    doc.text("Tasa de Cambio:", 120, 82);
    doc.setFont("helvetica", "normal");
    doc.text(`Bs. ${tasa.toFixed(2)}`, 155, 82);
  }

  // --- TOTAL BOX (HERO DISPLAY) ---
  doc.setFillColor(254, 242, 242); // Red-50
  doc.roundedRect(14, 96, 182, 18, 3, 3, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("TOTAL GENERAL CONCILIADO EN DIVISA (USDT):", 20, 107);

  doc.setFontSize(16);
  doc.text(fmtMoneyUSD(cierre.total_usdt), 190, 108, { align: "right" });

  // --- TABLE OF BREAKDOWN ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Desglose Detallado por Método de Pago", 14, 124);

  // Generate Table using autoTable
  autoTable(doc, {
    startY: 128,
    head: [["Método de Pago", "Moneda", "Monto Declarado en Caja", "Equivalencia en USD"]],
    body: [
      [
        "Efectivo en Dólares (USD)",
        "USD ($)",
        fmtMoneyUSD(cierre.monto_efectivo_usd),
        fmtMoneyUSD(cierre.monto_efectivo_usd),
      ],
      [
        "Efectivo en Bolívares (Bs)",
        "VES (Bs.)",
        fmtMoneyBs(cierre.monto_efectivo_bs),
        tasa > 0 ? fmtMoneyUSD(cierre.monto_efectivo_bs / tasa) : "—",
      ],
      [
        "Punto de Venta / Tarjeta (Bs)",
        "VES (Bs.)",
        fmtMoneyBs(cierre.monto_punto_bs),
        tasa > 0 ? fmtMoneyUSD(cierre.monto_punto_bs / tasa) : "—",
      ],
      [
        "Transferencia / Pago Móvil (Bs)",
        "VES (Bs.)",
        fmtMoneyBs(cierre.monto_pago_movil_bs),
        tasa > 0 ? fmtMoneyUSD(cierre.monto_pago_movil_bs / tasa) : "—",
      ],
    ],
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "right", cellWidth: 47 },
      3: { halign: "right", cellWidth: 40, fontStyle: "bold" },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: 14, right: 14 },
    theme: "striped",
  });

  // --- SIGNATURE SECTION ---
  const finalY = doc.lastAutoTable.finalY || 160;
  
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);
  // Signature Line
  doc.line(70, finalY + 30, 140, finalY + 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("FIRMA DEL CAJERO", 105, finalY + 35, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(cierre.usuario_nombre || "Cajero", 105, finalY + 39, { align: "center" });

  // --- FOOTER SECTION ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `Documento de control interno generado el ${new Date().toLocaleString("es-VE")}.`,
    14,
    285
  );
  doc.text(
    "Pág 1 de 1",
    196,
    285,
    { align: "right" }
  );

  // Save the document
  doc.save(`Cierre_Caja_${cierre.id_cierre || "N_A"}_${formattedDate.replace(/\//g, "-")}.pdf`);
};
