import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "../assets/login/logo.png";
import { getSucursalPalette } from "../components/admin/CierresAdminScreen";

// Helper to load image as a Promise
const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
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
    const totalBs =
      Number(cierre.monto_efectivo_bs || 0) +
      Number(cierre.monto_punto_bs || 0) +
      Number(cierre.monto_pago_movil_bs || 0);
    const totalUsdBsEq =
      Number(cierre.total_usdt || 0) - Number(cierre.monto_efectivo_usd || 0);
    if (totalUsdBsEq > 0 && totalBs > 0) {
      tasa = totalBs / totalUsdBsEq;
    } else {
      tasa = 1.0;
    }
  }

  // --- DYNAMIC BRANCH COLOR PALETTE ---
  const palette = getSucursalPalette(cierre.id_sucursal);
  const ACCENT = palette.bg;         // e.g. [239, 68, 68]
  const ACCENT_LIGHT = palette.light;      // e.g. [254, 226, 226]

  // Static colors
  const TEXT_DARK = [30, 41, 59];    // slate-800
  const TEXT_MUTED = [148, 163, 184]; // slate-400
  const SLATE_600 = [71, 85, 105];
  const BG_LIGHT = [248, 250, 252]; // slate-50
  const WHITE = [255, 255, 255];

  // Money formatters
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


  // ═══════════════════════════════════════════════════════
  // HEADER — Logo + Company info
  // ═══════════════════════════════════════════════════════
  if (img) {
    doc.addImage(img, "PNG", 14, 13, 30, 30);
  }

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...TEXT_DARK);
  doc.text("PIZZERÍA NICO", 196, 19, { align: "right" });

  // Branch name (colored)
  const sucursalNombre = cierre.sucursal || "Sucursal Principal";
  const sucursalDir = cierre.sucursal_direccion || "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text(sucursalNombre.toUpperCase(), 196, 26, { align: "right" });

  if (sucursalDir) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE_600);
    doc.text(sucursalDir, 196, 31, { align: "right" });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Sistema de Control Interno y Caja", 196, sucursalDir ? 36 : 31, { align: "right" });

  // Divider line (accent colored)
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(14, 47, 196, 47);

  // ═══════════════════════════════════════════════════════
  // DOCUMENT TITLE
  // ═══════════════════════════════════════════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`REPORTE DE CIERRE DE CAJA`, 14, 56);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(`#${cierre.id_cierre || "N/A"}`, 196, 56, { align: "right" });

  // ═══════════════════════════════════════════════════════
  // METADATA GRID BOX
  // ═══════════════════════════════════════════════════════
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(14, 61, 182, 32, 4, 4, "F");

  // Left accent stripe inside box
  doc.setFillColor(...ACCENT);
  doc.roundedRect(14, 61, 3, 32, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_600);
  doc.text("INFORMACIÓN DEL CIERRE", 21, 68);

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Cajero:", 21, 76);
  doc.setFont("helvetica", "normal");
  doc.text(cierre.usuario_nombre || "Cajero Desconocido", 46, 76);

  doc.setFont("helvetica", "bold");
  doc.text("Sucursal:", 120, 76);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...ACCENT);
  doc.text(sucursalNombre, 142, 76);

  // Row 2
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 21, 83);
  doc.setFont("helvetica", "normal");
  doc.text(`${formattedDate}  •  ${formattedTime}`, 46, 83);

  doc.setFont("helvetica", "bold");
  doc.text("Órdenes:", 120, 83);
  doc.setFont("helvetica", "normal");
  doc.text(`${cierre.num_ordenes || 0}`, 142, 83);

  // Row 3
  if (tasa && tasa !== 1.0) {
    doc.setFont("helvetica", "bold");
    doc.text("Tasa de Cambio:", 21, 90);
    doc.setFont("helvetica", "normal");
    doc.text(`Bs. ${tasa.toFixed(2)} / USD`, 58, 90);
  }

  if (sucursalDir) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text("Dirección:", 120, 90);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE_600);
    const dirLines = doc.splitTextToSize(sucursalDir, 50);
    doc.text(dirLines[0], 142, 90);
  }

  // ═══════════════════════════════════════════════════════
  // TOTAL HERO BOX
  // ═══════════════════════════════════════════════════════
  doc.setFillColor(...ACCENT_LIGHT);
  doc.roundedRect(14, 99, 182, 20, 3, 3, "F");

  // Left accent stripe
  doc.setFillColor(...ACCENT);
  doc.roundedRect(14, 99, 4, 20, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("TOTAL GENERAL CONCILIADO (USDT):", 22, 112);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...ACCENT);
  doc.text(fmtMoneyUSD(cierre.total_usdt), 193, 113, { align: "right" });

  // ═══════════════════════════════════════════════════════
  // BREAKDOWN TABLE
  // ═══════════════════════════════════════════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Desglose Detallado por Método de Pago", 14, 130);

  autoTable(doc, {
    startY: 134,
    head: [["Método de Pago", "Moneda", "Monto Declarado", "Equiv. USD"]],
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
      fillColor: ACCENT,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 72 },
      1: { halign: "center", cellWidth: 24 },
      2: { halign: "right", cellWidth: 48 },
      3: { halign: "right", cellWidth: 38, fontStyle: "bold", textColor: ACCENT },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: ACCENT_LIGHT,
    },
    margin: { left: 14, right: 14 },
    theme: "striped",
  });

  // ═══════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `Documento generado el ${new Date().toLocaleString("es-VE")} · ${sucursalNombre}`,
    14,
    285
  );
  doc.text("Pág 1 de 1", 196, 285, { align: "right" });

  // Save
  doc.save(
    `Cierre_${sucursalNombre.replace(/\s+/g, "_")}_#${cierre.id_cierre || "N_A"}_${formattedDate.replace(/\//g, "-")}.pdf`
  );
};
