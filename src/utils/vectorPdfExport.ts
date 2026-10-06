import jsPDF from 'jspdf';

export interface QuotationExportData {
  folio: string;
  clientName: string;
  clientContact: string;
  projectName: string;
  estimatedDeliveryDays: number;
  dateStr: string;
  items: Array<{
    pieceTitle: string;
    tech: string;
    material: string;
    quantity: number;
    hours: number;
    grams: number;
    unitPrice: number;
    subtotal: number;
    finishes: string;
  }>;
  taxableBase: number;
  discountPercent: number;
  discountAmount: number;
  vatAmount: number;
  finalTotal: number;
  deposit50: number;
  totalPieces: number;
  totalHours: number;
  totalGrams: number;
}

/**
 * Generates pure vector PDF documents using jsPDF native drawing primitives.
 * Completely immune to html2canvas, CSS parsing, or OKLCH errors.
 */
export function generateVectorPDFs(data: QuotationExportData) {
  const folio = data.folio || 'COTZ-2026';

  // Helper to draw Page 1: Cotización Comercial (Cliente)
  const drawClientQuotationPage = (doc: jsPDF) => {
    // Top banner
    doc.setFillColor(53, 4, 99); // #350463
    doc.rect(0, 0, 210, 32, 'F');

    // Accent line
    doc.setFillColor(192, 244, 65); // #C0F441
    doc.rect(0, 32, 210, 2, 'F');

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('KiMO 3D STUDIO', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(234, 221, 251);
    doc.text('Fabricación Aditiva Industrial • Prototipado Rápido & Series Cortas', 14, 22);
    doc.text('RFC: KIM230915AB1 • WhatsApp: +52 55 1234 5678 • CDMX, México', 14, 27);

    // Folio & Date badge (Right aligned)
    doc.setFillColor(109, 58, 205); // #6D3ACD
    doc.roundedRect(145, 6, 52, 20, 2, 2, 'F');
    doc.setTextColor(192, 244, 65); // #C0F441
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(folio, 171, 13, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${data.dateStr}`, 171, 18, { align: 'center' });
    doc.text('Validez: 15 días naturales', 171, 23, { align: 'center' });

    // Client & Project Box
    doc.setFillColor(250, 247, 240); // #FAF7F0
    doc.roundedRect(14, 38, 182, 24, 2, 2, 'F');
    doc.setDrawColor(205, 195, 210);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 38, 182, 24, 2, 2, 'S');

    doc.setTextColor(53, 4, 99);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('DATOS DEL CLIENTE Y PROYECTO:', 18, 44);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 28, 24);
    doc.setFontSize(8);
    doc.text(`Cliente: ${data.clientName || 'Cliente Particular'}`, 18, 50);
    doc.text(`Contacto / Tel: ${data.clientContact || 'N/A'}`, 18, 56);

    doc.text(`Proyecto: ${data.projectName || 'Fabricación 3D KiMO'}`, 105, 50);
    doc.text(`Tiempo de Entrega: ${data.estimatedDeliveryDays} días hábiles`, 105, 56);

    // Summary KPIs cards
    const kpiY = 66;
    const kpiWidth = 43;
    const kpiHeight = 13;
    const kpiSpacing = 3.3;

    // Card 1: Piezas
    doc.setFillColor(240, 238, 231);
    doc.roundedRect(14, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'F');
    doc.setFontSize(7);
    doc.setTextColor(75, 68, 80);
    doc.text('TOTAL PIEZAS', 16, kpiY + 4.5);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(53, 4, 99);
    doc.text(`${data.totalPieces} uds.`, 16, kpiY + 10.5);

    // Card 2: Horas
    doc.setFillColor(240, 238, 231);
    doc.roundedRect(14 + (kpiWidth + kpiSpacing), kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(75, 68, 80);
    doc.text('TIEMPO ESTIMADO', 16 + (kpiWidth + kpiSpacing), kpiY + 4.5);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(53, 4, 99);
    doc.text(`${data.totalHours.toFixed(1)} hrs`, 16 + (kpiWidth + kpiSpacing), kpiY + 10.5);

    // Card 3: Material
    doc.setFillColor(240, 238, 231);
    doc.roundedRect(14 + (kpiWidth + kpiSpacing) * 2, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(75, 68, 80);
    doc.text('MATERIAL / PESO', 16 + (kpiWidth + kpiSpacing) * 2, kpiY + 4.5);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(53, 4, 99);
    doc.text(`${data.totalGrams.toFixed(0)}g PLA+`, 16 + (kpiWidth + kpiSpacing) * 2, kpiY + 10.5);

    // Card 4: Garantía
    doc.setFillColor(234, 221, 251);
    doc.roundedRect(14 + (kpiWidth + kpiSpacing) * 3, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(109, 58, 205);
    doc.text('CALIDAD KiMO', 16 + (kpiWidth + kpiSpacing) * 3, kpiY + 4.5);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(53, 4, 99);
    doc.text('Grado Industrial', 16 + (kpiWidth + kpiSpacing) * 3, kpiY + 10.5);

    // Table Header
    const tableTop = 84;
    doc.setFillColor(53, 4, 99);
    doc.rect(14, tableTop, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('#', 17, tableTop + 4.8);
    doc.text('DESCRIPCIÓN DEL MODELO / SERVICIO', 25, tableTop + 4.8);
    doc.text('TECNOLOGÍA / ACABADO', 105, tableTop + 4.8);
    doc.text('CANT', 145, tableTop + 4.8, { align: 'center' });
    doc.text('P. UNIT', 165, tableTop + 4.8, { align: 'right' });
    doc.text('TOTAL MXN', 192, tableTop + 4.8, { align: 'right' });

    // Table Rows
    let rowY = tableTop + 7;
    doc.setFont('helvetica', 'normal');
    data.items.forEach((item, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 247, isEven ? 255 : 240);
      doc.rect(14, rowY, 182, 9, 'F');
      doc.setDrawColor(230, 225, 220);
      doc.line(14, rowY + 9, 196, rowY + 9);

      doc.setTextColor(75, 68, 80);
      doc.setFontSize(7.5);
      doc.text(`${idx + 1}`, 17, rowY + 6);

      doc.setTextColor(28, 28, 24);
      doc.setFont('helvetica', 'bold');
      const truncatedTitle = item.pieceTitle.length > 38 ? item.pieceTitle.substring(0, 36) + '...' : item.pieceTitle;
      doc.text(truncatedTitle, 25, rowY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(75, 68, 80);
      const descTech = `${item.tech} • ${item.finishes || 'Acabado Estándar'}`;
      const truncatedTech = descTech.length > 28 ? descTech.substring(0, 26) + '...' : descTech;
      doc.text(truncatedTech, 105, rowY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(53, 4, 99);
      doc.text(`${item.quantity}`, 145, rowY + 6, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(28, 28, 24);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 165, rowY + 6, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(53, 4, 99);
      doc.text(`$${item.subtotal.toFixed(2)}`, 192, rowY + 6, { align: 'right' });

      rowY += 9;
    });

    // Space after table
    const finTop = Math.max(rowY + 5, 175);

    // Left Box: Bank SPEI & Notes
    doc.setFillColor(250, 247, 240);
    doc.roundedRect(14, finTop, 100, 52, 2, 2, 'F');
    doc.setDrawColor(205, 195, 210);
    doc.roundedRect(14, finTop, 100, 52, 2, 2, 'S');

    doc.setTextColor(53, 4, 99);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DATOS PARA PAGO (TRANSFERENCIA SPEI):', 18, finTop + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 28, 24);
    doc.setFontSize(7.5);
    doc.text('• Banco: BBVA México', 18, finTop + 13);
    doc.text('• Titular: KiMO 3D STUDIO S.A.S.', 18, finTop + 18);
    doc.text('• CLABE Interbancaria: 0121 8001 5498 7234 11', 18, finTop + 23);
    doc.text(`• Concepto / Referencia: ${folio}`, 18, finTop + 28);

    doc.setDrawColor(205, 195, 210);
    doc.line(18, finTop + 32, 108, finTop + 32);

    doc.setTextColor(75, 68, 80);
    doc.setFontSize(7);
    doc.text('Condiciones de Fabricación:', 18, finTop + 37);
    doc.text('1. Se requiere anticipo del 50% para programar máquinas.', 18, finTop + 42);
    doc.text('2. Tolerancia dimensional estándar: ±0.2 mm según geometría.', 18, finTop + 46);
    doc.text('3. Liquidación del 50% restante contra aviso de finalización.', 18, finTop + 50);

    // Right Box: Totals Breakdown
    const totalsBoxX = 118;
    const totalsBoxW = 78;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(totalsBoxX, finTop, totalsBoxW, 52, 2, 2, 'F');
    doc.setDrawColor(205, 195, 210);
    doc.roundedRect(totalsBoxX, finTop, totalsBoxW, 52, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 68, 80);
    doc.text('Subtotal Base:', totalsBoxX + 6, finTop + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(28, 28, 24);
    doc.text(`$${(data.taxableBase + data.discountAmount).toFixed(2)} MXN`, totalsBoxX + totalsBoxW - 6, finTop + 8, { align: 'right' });

    if (data.discountAmount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(186, 26, 26);
      doc.text(`Descuento (-${data.discountPercent}%):`, totalsBoxX + 6, finTop + 14);
      doc.setFont('helvetica', 'bold');
      doc.text(`-$${data.discountAmount.toFixed(2)} MXN`, totalsBoxX + totalsBoxW - 6, finTop + 14, { align: 'right' });
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 68, 80);
    doc.text('IVA Trasladado (16%):', totalsBoxX + 6, finTop + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(28, 28, 24);
    doc.text(`$${data.vatAmount.toFixed(2)} MXN`, totalsBoxX + totalsBoxW - 6, finTop + 20, { align: 'right' });

    // Total Highlight Box
    doc.setFillColor(53, 4, 99);
    doc.roundedRect(totalsBoxX + 4, finTop + 25, totalsBoxW - 8, 14, 2, 2, 'F');
    doc.setTextColor(192, 244, 65);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL FINAL:', totalsBoxX + 8, finTop + 34);
    doc.setFontSize(11);
    doc.text(`$${data.finalTotal.toFixed(2)} MXN`, totalsBoxX + totalsBoxW - 8, finTop + 34, { align: 'right' });

    // Deposit note
    doc.setTextColor(46, 63, 0);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Anticipo 50% requerido: $${data.deposit50.toFixed(2)} MXN`, totalsBoxX + 6, finTop + 45);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 115, 125);
    doc.text(`Documento generado por Plataforma KiMO 3D Studio • ${folio} • Página 1 de Cotización Oficial`, 105, 285, { align: 'center' });
  };

  // Helper to draw Page 2: Ficha Técnica para el Taller
  const drawWorkshopPage = (doc: jsPDF) => {
    // Top banner (Workshop style - Deep purple with warning/workshop accents)
    doc.setFillColor(37, 2, 71); // Darker tone
    doc.rect(0, 0, 210, 32, 'F');

    // Accent line in Workshop Lime
    doc.setFillColor(192, 244, 65);
    doc.rect(0, 32, 210, 2, 'F');

    // Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('KiMO 3D STUDIO • CONTROL DE TALLER', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(234, 221, 251);
    doc.text('HOJA DE RUTA TÉCNICA • PARÁMETROS DE FABRICACIÓN Y CONTROL DE CALIDAD', 14, 22);
    doc.text('Documento Interno Confidencial • Área de Fabricación y Post-Proceso', 14, 27);

    // Folio Badge
    doc.setFillColor(109, 58, 205);
    doc.roundedRect(145, 6, 52, 20, 2, 2, 'F');
    doc.setTextColor(192, 244, 65);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`ORDEN TALLER`, 171, 13, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(folio, 171, 18, { align: 'center' });
    doc.text(`Fecha: ${data.dateStr}`, 171, 23, { align: 'center' });

    // Top Specs Grid
    const specTop = 38;
    const cardW = 43.5;
    const cardH = 22;

    // Spec 1: Piezas
    doc.setFillColor(250, 247, 240);
    doc.roundedRect(14, specTop, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(205, 195, 210);
    doc.roundedRect(14, specTop, cardW, cardH, 2, 2, 'S');
    doc.setTextColor(75, 68, 80);
    doc.setFontSize(7);
    doc.text('UNIDADES A FABRICAR', 18, specTop + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(53, 4, 99);
    doc.text(`${data.totalPieces} Piezas`, 18, specTop + 14);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(109, 58, 205);
    doc.text('Lote Completo', 18, specTop + 19);

    // Spec 2: Horas
    doc.setFillColor(250, 247, 240);
    doc.roundedRect(60.5, specTop, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(205, 195, 210);
    doc.roundedRect(60.5, specTop, cardW, cardH, 2, 2, 'S');
    doc.setTextColor(75, 68, 80);
    doc.setFontSize(7);
    doc.text('TIEMPO TOTAL MÁQUINA', 64.5, specTop + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(53, 4, 99);
    doc.text(`${data.totalHours.toFixed(1)} Horas`, 64.5, specTop + 14);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(109, 58, 205);
    doc.text('Ocupación estimada', 64.5, specTop + 19);

    // Spec 3: Gramos
    doc.setFillColor(250, 247, 240);
    doc.roundedRect(107, specTop, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(205, 195, 210);
    doc.roundedRect(107, specTop, cardW, cardH, 2, 2, 'S');
    doc.setTextColor(75, 68, 80);
    doc.setFontSize(7);
    doc.text('PESO MATERIAL TOTAL', 111, specTop + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(53, 4, 99);
    doc.text(`${data.totalGrams.toFixed(0)} Gramos`, 111, specTop + 14);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(109, 58, 205);
    doc.text('Incluye purga y soportes', 111, specTop + 19);

    // Spec 4: Compromiso de entrega
    doc.setFillColor(234, 221, 251);
    doc.roundedRect(153.5, specTop, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(109, 58, 205);
    doc.roundedRect(153.5, specTop, cardW, cardH, 2, 2, 'S');
    doc.setTextColor(109, 58, 205);
    doc.setFontSize(7);
    doc.text('TIEMPO DE ENTREGA', 157.5, specTop + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(53, 4, 99);
    doc.text(`${data.estimatedDeliveryDays} Días Hábiles`, 157.5, specTop + 14);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 68, 80);
    doc.text('Meta de entrega', 157.5, specTop + 19);

    // Workshop Pieces Table
    const tableTop = 66;
    doc.setFillColor(37, 2, 71);
    doc.rect(14, tableTop, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('#', 17, tableTop + 4.8);
    doc.text('MODELO / PARTE A IMPRIMIR', 25, tableTop + 4.8);
    doc.text('TECNOLOGÍA / MATERIAL', 85, tableTop + 4.8);
    doc.text('CANT', 125, tableTop + 4.8, { align: 'center' });
    doc.text('TIEMPO TOTAL', 145, tableTop + 4.8, { align: 'right' });
    doc.text('GRAMOS', 168, tableTop + 4.8, { align: 'right' });
    doc.text('ESTADO', 188, tableTop + 4.8, { align: 'center' });

    let rowY = tableTop + 7;
    doc.setFont('helvetica', 'normal');
    data.items.forEach((item, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 247, isEven ? 255 : 240);
      doc.rect(14, rowY, 182, 10, 'F');
      doc.setDrawColor(230, 225, 220);
      doc.line(14, rowY + 10, 196, rowY + 10);

      doc.setTextColor(75, 68, 80);
      doc.setFontSize(7.5);
      doc.text(`${idx + 1}`, 17, rowY + 6.5);

      doc.setTextColor(28, 28, 24);
      doc.setFont('helvetica', 'bold');
      const title = item.pieceTitle.length > 30 ? item.pieceTitle.substring(0, 28) + '...' : item.pieceTitle;
      doc.text(title, 25, rowY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(109, 58, 205);
      doc.text(`Acabado: ${item.finishes || 'Estándar'}`, 25, rowY + 8.5);

      doc.setTextColor(75, 68, 80);
      doc.setFontSize(7);
      doc.text(`${item.tech} - PLA+`, 85, rowY + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(53, 4, 99);
      doc.text(`${item.quantity} pzs`, 125, rowY + 6.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(28, 28, 24);
      doc.text(`${(item.hours * item.quantity).toFixed(1)} hrs`, 145, rowY + 6.5, { align: 'right' });

      doc.text(`${(item.grams * item.quantity).toFixed(0)} g`, 168, rowY + 6.5, { align: 'right' });

      // Checkbox for workshop completion
      doc.setDrawColor(109, 58, 205);
      doc.rect(186, rowY + 3.5, 4, 4, 'S');

      rowY += 10;
    });

    // Technical Protocols & Checklist
    const protoTop = Math.max(rowY + 6, 175);

    // Left Box: Slicing Parameters
    doc.setFillColor(250, 247, 240);
    doc.roundedRect(14, protoTop, 88, 52, 2, 2, 'F');
    doc.setDrawColor(205, 195, 210);
    doc.roundedRect(14, protoTop, 88, 52, 2, 2, 'S');

    doc.setTextColor(53, 4, 99);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PARÁMETROS TÉCNICOS DE LAMINADO:', 18, protoTop + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 28, 24);
    doc.setFontSize(7.5);
    doc.text('• Altura de Capa: 0.20 mm (Equilibrada)', 18, protoTop + 14);
    doc.text('• Relleno (Infill): 20% Cuadrícula / Giroide', 18, protoTop + 20);
    doc.text('• Boquilla (Nozzle): 0.40 mm Latón / Acero', 18, protoTop + 26);
    doc.text('• Temperatura Extrusor: 215°C | Cama: 60°C', 18, protoTop + 32);
    doc.text('• Velocidad de Impresión: 150 - 250 mm/s', 18, protoTop + 38);
    doc.text('• Patrón de Soporte: Árbol / Slim Tree', 18, protoTop + 44);

    // Right Box: Quality Control Checklist
    const chkX = 108;
    const chkW = 88;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(chkX, protoTop, chkW, 52, 2, 2, 'F');
    doc.setDrawColor(205, 195, 210);
    doc.roundedRect(chkX, protoTop, chkW, 52, 2, 2, 'S');

    doc.setTextColor(53, 4, 99);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CHECKLIST DE CONTROL DE CALIDAD TALLER:', chkX + 5, protoTop + 7);

    const checkItems = [
      'Calibración y limpieza de cama de impresión',
      'Inspección visual de primera capa (sin warping)',
      'Retiro seguro de soportes y desbastado de rebabas',
      'Lijado / curado UV / acabado superficial acordado',
      'Verificación dimensional con vernier (tolerancia ±0.2mm)',
      'Empaque de protección con burbuja y rotulación',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(28, 28, 24);
    checkItems.forEach((chk, i) => {
      const cy = protoTop + 13 + i * 5.8;
      doc.setDrawColor(109, 58, 205);
      doc.rect(chkX + 5, cy - 2.5, 3.2, 3.2, 'S');
      doc.text(chk, chkX + 11, cy);
    });

    // Signature Area
    const signTop = protoTop + 56;
    doc.setFontSize(7);
    doc.setTextColor(75, 68, 80);
    doc.text('Firma Operador de Impresión:', 18, signTop + 14);
    doc.line(55, signTop + 14, 100, signTop + 14);

    doc.text('Firma Supervisor de Calidad:', 115, signTop + 14);
    doc.line(152, signTop + 14, 195, signTop + 14);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 115, 125);
    doc.text(`Documento Técnico de Taller KiMO 3D • ${folio} • Página 2 de Expediente de Fabricación`, 105, 285, { align: 'center' });
  };

  return {
    // 1. Download Unified Complete Dossier (Page 1: Cotización, Page 2: Ficha Taller)
    downloadCompleteDossier: () => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      drawClientQuotationPage(doc);
      doc.addPage();
      drawWorkshopPage(doc);
      doc.save(`Expediente_Completo_KiMO_${folio}.pdf`);
    },

    // 2. Download Client Quotation Only
    downloadClientQuotation: () => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      drawClientQuotationPage(doc);
      doc.save(`Cotizacion_KiMO_${folio}.pdf`);
    },

    // 3. Download Workshop Sheet Only
    downloadWorkshopSheet: () => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      drawWorkshopPage(doc);
      doc.save(`Ficha_Taller_KiMO_${folio}.pdf`);
    },

    // 4. Download Both Separate PDFs in sequence
    downloadBothSeparatePDFs: () => {
      // PDF 1: Cotización
      const doc1 = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      drawClientQuotationPage(doc1);
      doc1.save(`Cotizacion_KiMO_${folio}.pdf`);

      // PDF 2: Ficha Taller (350ms delay so browser handles both seamlessly)
      setTimeout(() => {
        const doc2 = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        drawWorkshopPage(doc2);
        doc2.save(`Ficha_Taller_KiMO_${folio}.pdf`);
      }, 350);
    },
  };
}
