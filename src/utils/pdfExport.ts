import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to convert OKLCH color to sRGB [r, g, b]
function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  const r = +4.0767434099 * L - 3.3077115913 * M + 0.2309699292 * S;
  const g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  const bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;

  const gamma = (x: number) =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055;

  return [
    Math.min(255, Math.max(0, Math.round(gamma(r) * 255))),
    Math.min(255, Math.max(0, Math.round(gamma(g) * 255))),
    Math.min(255, Math.max(0, Math.round(gamma(bl) * 255))),
  ];
}

// Convert any oklch(...) occurrence in CSS or style strings to standard rgb/rgba
function sanitizeAllOklch(css: string): string {
  if (!css || !css.includes('oklch')) return css;
  const converted = css.replace(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+(?:deg|rad|turn)?)\s*(?:\/\s*([\d.]+%?))?\s*\)/gi,
    (_match, lStr, cStr, hStr, aStr) => {
      let l = parseFloat(lStr);
      if (lStr.includes('%')) l = l / 100;
      const c = parseFloat(cStr);
      let h = parseFloat(hStr || '0');
      if (hStr && hStr.includes('rad')) h = (h * 180) / Math.PI;
      else if (hStr && hStr.includes('turn')) h = h * 360;

      const [r, g, b] = oklchToRgb(l, c, h);
      if (aStr) {
        let a = parseFloat(aStr);
        if (aStr.includes('%')) a = a / 100;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    }
  );

  // Catch any remaining irregular oklch patterns as neutral fallback
  if (converted.includes('oklch')) {
    return converted.replace(/oklch\([^)]+\)/gi, 'rgb(109, 58, 205)');
  }
  return converted;
}

/**
 * Helper to render any HTML element to high-res canvas with OKLCH sanitization
 */
export async function renderElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth || 1024,
    onclone: (clonedDoc, clonedElement) => {
      // 1. Sanitize all <style> tags in the cloned DOM to remove any oklch color references
      clonedDoc.querySelectorAll('style').forEach((style) => {
        if (style.textContent && style.textContent.includes('oklch')) {
          style.textContent = sanitizeAllOklch(style.textContent);
        }
      });

      // 2. Sanitize inline styles and computed colors on all cloned elements
      const elements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as HTMLElement[];
      const colorProps = [
        'color',
        'backgroundColor',
        'borderColor',
        'borderTopColor',
        'borderBottomColor',
        'borderLeftColor',
        'borderRightColor',
        'outlineColor',
      ];

      const defaultView = clonedDoc.defaultView || window;

      elements.forEach((el) => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && styleAttr.includes('oklch')) {
          el.setAttribute('style', sanitizeAllOklch(styleAttr));
        }

        try {
          const computed = defaultView.getComputedStyle(el);
          colorProps.forEach((prop) => {
            const val = (computed as any)[prop];
            if (val && typeof val === 'string' && val.includes('oklch')) {
              (el.style as any)[prop] = sanitizeAllOklch(val);
            }
          });
        } catch {
          // Ignore cross-origin or detached frame errors
        }
      });
    },
  });
}

/**
 * Utility to capture an HTML element and download it as a genuine .pdf file.
 * Handles Tailwind CSS v4 oklch colors and multi-page rendering safely.
 */
export async function downloadElementAsPDF(
  elementId: string,
  filename: string,
  onProgress?: (loading: boolean) => void
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id #${elementId} not found for PDF export.`);
    if (onProgress) onProgress(false);
    return false;
  }

  if (onProgress) onProgress(true);

  try {
    const canvas = await renderElementToCanvas(element);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Create PDF instance in A4 format (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Multi-page handling (with 5mm tolerance to avoid accidental trailing blank page)
    while (heightLeft > 5) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Save as .pdf file
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(pdfFilename);

    if (onProgress) onProgress(false);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (onProgress) onProgress(false);
    return false;
  }
}

/**
 * Exports quotation sheets with 100% IDENTICAL design to the live preview.
 * Supports unified dossier, single sheets, or both.
 */
export async function exportIdenticalQuotationPDFs(params: {
  folio: string;
  clientElementId: string;
  workshopElementId: string;
  mode?: 'ambos' | 'completo' | 'cliente' | 'taller';
  onProgress?: (status: string | null) => void;
}): Promise<boolean> {
  const { folio, clientElementId, workshopElementId, mode = 'ambos', onProgress } = params;

  const clientEl = document.getElementById(clientElementId);
  const workshopEl = document.getElementById(workshopElementId);

  if (!clientEl && !workshopEl) {
    console.error('Neither client nor workshop sheet element found');
    return false;
  }

  try {
    const addCanvasToPdf = (pdf: jsPDF, canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    };

    if (mode === 'cliente' && clientEl) {
      if (onProgress) onProgress('⏳ Generando Cotización Cliente...');
      const canvas = await renderElementToCanvas(clientEl);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      addCanvasToPdf(pdf, canvas);
      pdf.save(`Cotizacion_KiMO_${folio}.pdf`);
      return true;
    }

    if (mode === 'taller' && workshopEl) {
      if (onProgress) onProgress('⏳ Generando Ficha Taller...');
      const canvas = await renderElementToCanvas(workshopEl);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      addCanvasToPdf(pdf, canvas);
      pdf.save(`Ficha_Taller_KiMO_${folio}.pdf`);
      return true;
    }

    // Default or 'completo' or 'ambos': Expediente completo unificado con el diseño idéntico
    if (onProgress) onProgress('⏳ Generando Expediente Completo...');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    if (clientEl) {
      const clientCanvas = await renderElementToCanvas(clientEl);
      addCanvasToPdf(pdf, clientCanvas);
    }

    if (workshopEl) {
      if (clientEl) pdf.addPage();
      const workshopCanvas = await renderElementToCanvas(workshopEl);
      addCanvasToPdf(pdf, workshopCanvas);
    }

    pdf.save(`Expediente_Completo_KiMO_${folio}.pdf`);

    // If 'ambos', also download the individual separate files
    if (mode === 'ambos') {
      setTimeout(async () => {
        if (clientEl) {
          const cCanvas = await renderElementToCanvas(clientEl);
          const cPdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          addCanvasToPdf(cPdf, cCanvas);
          cPdf.save(`Cotizacion_KiMO_${folio}.pdf`);
        }
      }, 500);

      setTimeout(async () => {
        if (workshopEl) {
          const wCanvas = await renderElementToCanvas(workshopEl);
          const wPdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          addCanvasToPdf(wPdf, wCanvas);
          wPdf.save(`Ficha_Taller_KiMO_${folio}.pdf`);
        }
      }, 1000);
    }

    return true;
  } catch (err) {
    console.error('Error generating identical quotation PDFs:', err);
    return false;
  }
}

