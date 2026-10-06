import React, { useState, useMemo, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { CotizadorModelItem, CustomServiceItem, BomItem } from '../types';
import { createNewModelItem } from './cotizador/CotizadorTypes';
import { ModelCard } from './cotizador/ModelCard';
import { QuotationPreviewDual } from './cotizador/QuotationPreviewDual';
import { SavedQuotationsModal } from './cotizador/SavedQuotationsModal';
import { exportIdenticalQuotationPDFs } from '../utils/pdfExport';

import { QuotationExportData, generateVectorPDFs } from '../utils/vectorPdfExport';
import {
  Zap,
  Save,
  ChevronDown,
  Layers,
  Wrench,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Building,
  Truck,
  FileText,
  FileDown,
  Printer,
  Share2,
  Check,
  Sparkles,
  Info,
  Folder,
  Rocket,
  X,
  Calculator,
} from 'lucide-react';

export const CotizadorView: React.FC = () => {
  const {
    cotizadorDraft,
    setCotizadorDraft,
    settings,
    updateSettings,
    addOrderFromCotizador,
    filaments,
    printers,
    warehouseSupplies,
    savedQuotations,
    saveQuotation,
    loadQuotationIntoCotizador,
    launchQuotationToWorkshop,
    deleteSavedQuotation,
    duplicateQuotation,
    getNextQuotationFolio,
    calculateTotalOverheadPerHour,
  } = useWorkshop();

  const masterOverheadRate = calculateTotalOverheadPerHour();
  const totalAbsorcionPorHora = masterOverheadRate;
  const workshopSuppliesRatePerHour = 0; // Se absorbe en overheadRate
  const overheadRatePerHour = masterOverheadRate;
  const estMonthlyHours = 160; // Mocked for display purposes

  const [isQuotationsModalOpen, setIsQuotationsModalOpen] = useState(false);
  const [isSavingQuotation, setIsSavingQuotation] = useState(false);

  // Accordion open/close state (Requirement 1)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    models: true,
    logistics: true,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Preview tab state (cliente vs taller)
  const [previewTab, setPreviewTab] = useState<'cliente' | 'taller'>('cliente');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Auto-sincronizar el folio correlativo oficial si está vacío o en valor inicial
  useEffect(() => {
    if (!cotizadorDraft.folio || (cotizadorDraft.folio === 'COTZ-2026-00001' && savedQuotations.length > 0)) {
      const nextFolio = getNextQuotationFolio();
      if (cotizadorDraft.folio !== nextFolio) {
        setCotizadorDraft((prev) => ({ ...prev, folio: nextFolio }));
      }
    }
  }, [getNextQuotationFolio, savedQuotations]);

  // Models collection (Requirement 2)
  const models: CotizadorModelItem[] = useMemo(() => {
    if (cotizadorDraft.models && cotizadorDraft.models.length > 0) {
      return cotizadorDraft.models;
    }
    return [createNewModelItem(1)];
  }, [cotizadorDraft]);

  const handleUpdateModel = (index: number, updated: CotizadorModelItem) => {
    const nextModels = [...models];
    nextModels[index] = updated;
    setCotizadorDraft((prev) => ({
      ...prev,
      models: nextModels,
      // sync primary fields for compatibility
      pieceTitle: nextModels[0].pieceTitle,
      clientQty: nextModels[0].clientQty,
      platesCount: nextModels[0].platesCount,
      printHours: nextModels[0].printHours,
      purgaGrams: nextModels[0].purgaGrams,
      includeBuffer: nextModels[0].includeBuffer,
      bufferQty: nextModels[0].bufferQty,
      amsSlots: nextModels[0].amsSlots,
    }));
  };

  const handleAddModel = () => {
    const nextIdx = models.length + 1;
    const newMod = createNewModelItem(nextIdx);
    const nextModels = [...models, newMod];
    setCotizadorDraft((prev) => ({ ...prev, models: nextModels }));
  };

  const handleDuplicateModel = (index: number) => {
    const source = models[index];
    const clone: CotizadorModelItem = {
      ...source,
      id: `mod-${Date.now()}`,
      pieceTitle: `${source.pieceTitle} (Copia)`,
      amsSlots: source.amsSlots.map((s) => ({ ...s })),
    };
    const nextModels = [...models];
    nextModels.splice(index + 1, 0, clone);
    setCotizadorDraft((prev) => ({ ...prev, models: nextModels }));
  };

  const handleDeleteModel = (index: number) => {
    if (models.length <= 1) return;
    const nextModels = models.filter((_, i) => i !== index);
    setCotizadorDraft((prev) => ({ ...prev, models: nextModels }));
  };

  // ========================================================
  // ESTRUCTURA DE COSTOS DE TALLER, GASTOS FIJOS (OPEX) & INSUMOS DIRECTOS
  // - Renta, computadora, marketing, movilidad y amortizaciones prorrateadas por hora
  // - Laca/adhesivo, lubricante, alcohol IPA y consumibles de máquina
  // ========================================================
  // ========================================================
  const includeOverhead = cotizadorDraft.includeOverheadAbsorption !== false;
  const includeWorkshopSupplies = cotizadorDraft.includeWorkshopSupplies !== false;



  // ========================================================
  // CÁLCULOS ECONÓMICOS MULTI-MODELO DESCENTRALIZADOS
  // Insumos BOM, Servicios, Mano de Obra, Insumos Taller y Margen Comprensible
  // ========================================================
  let totalWorkshopMachineHours = 0;
  let totalWorkshopLaborHours = 0;
  let totalModelsDirectCost = 0;
  let totalProjectRequiredProfitHourly = 0;
  let totalModelsFilamentCost = 0;
  let totalModelsCfeCost = 0;
  let totalModelsMttoCost = 0;
  let totalModelsLaborCost = 0;
  let totalProjectWorkshopSuppliesCost = 0;
  let totalProjectOverheadCost = 0;

  const modelLineCalculations = models.map((m) => {
    const mClientQty = Math.max(1, m.clientQty);
    const mBufferQty = m.includeBuffer ? Math.max(0, m.bufferQty || 0) : 0;
    const mBufferRatio = mBufferQty / mClientQty;
    const mTotalWorkshopQty = mClientQty + mBufferQty;

    const mBaseHours = Math.max(0.1, m.printHours || 0.5);
    const mHoursWithBuffer = mBaseHours * (1 + mBufferRatio);
    totalWorkshopMachineHours += mHoursWithBuffer;

    // Mano de Obra (Horas dedicadas de taller)
    const mLaborHours = Math.max(0, m.dedicatedLaborHours || 0);
    totalWorkshopLaborHours += mLaborHours;
    const mLaborRate = settings.laborRatePerHour || 55.0;
    const mLaborCost = mLaborHours * mLaborRate;
    totalModelsLaborCost += mLaborCost;

    // Buscar impresora asignada al modelo en la flota registrada
    const assignedPrinterDevice = (printers || []).find(
      (p) =>
        p.id === m.assignedPrinter ||
        p.alias === m.assignedPrinter ||
        `${p.marca} ${p.modelo}` === m.assignedPrinter ||
        p.modelo === m.assignedPrinter
    ) || (printers && printers.length > 0 ? printers[0] : null);

    // Tarifa por hora en función de la impresora y el dato introducido al registrarla
    const mHourlyRate = assignedPrinterDevice?.tarifaHoraBase !== undefined
      ? Number(assignedPrinterDevice.tarifaHoraBase)
      : (settings?.activePrinter?.hourlyRate || 10.0);

    // Filament cost
    const mFilamentCost = m.amsSlots.reduce((acc, s) => {
      const rate = s.costPerGram || 0.28;
      return acc + (s.grams || 0) * (1 + mBufferRatio) * rate;
    }, 0) + (m.purgaGrams || 0) * 0.28;
    totalModelsFilamentCost += mFilamentCost;

    // CFE
    const mCfeCost = mHoursWithBuffer * (settings.printerWatts / 1000) * settings.cfeRatePerKwh;
    totalModelsCfeCost += mCfeCost;

    // Maintenance Fund
    const mMttoCost = mFilamentCost * (settings.maintenanceFundPercent / 100);
    totalModelsMttoCost += mMttoCost;

    // Insumos BOM exclusivos asignados a este modelo
    const mBomItems = m.bomItems || [];
    const mBomCost = mBomItems.reduce((acc, b) => acc + (b.quantity || 0) * (b.unitCost || 0), 0);

    // Servicios manuales exclusivos asignados a este modelo
    const mCustomServices = m.customServices || [];
    const mServicesCost = mCustomServices.reduce((acc, s) => acc + (s.unitPrice || 0) * (s.quantity || 1), 0);

    // Insumos directos de máquina (Laca, adhesión, lubricante, alcohol IPA)
    // Insumos Taller (Ya absorbidos en masterOverheadRate)
    const mWorkshopSuppliesCost = 0;
    totalProjectWorkshopSuppliesCost += mWorkshopSuppliesCost;

    // Absorción proporcional de gastos fijos de taller (Renta, computadora, mobiliario, marketing, etc.)
    // Absorción maestra (CAPEX + OPEX + Insumos/hr)
    const mOverheadCost = includeOverhead ? mHoursWithBuffer * masterOverheadRate : 0;
    totalProjectOverheadCost += mOverheadCost;

    // Consolidación de costos directos (material + energía + mtto + insumos BOM + acabados + mano de obra + insumos taller + absorción gastos fijos)
    const mDirectCost = mFilamentCost + mCfeCost + mMttoCost + mBomCost + mServicesCost + mLaborCost + mWorkshopSuppliesCost + mOverheadCost;
    totalModelsDirectCost += mDirectCost;

    // Margen Inteligente y Comprensible (Markup Directo y Lineal):
    // Precio = Costo * (1 + Margen % / 100)
    // Regla de Taller: En función de la tarifa por hora de la impresora registrada
    const rawMargin = m.desiredMarginPercent ?? settings.defaultMarginPercent ?? 30;
    const minRequiredProfitForThisModel = mHoursWithBuffer * mHourlyRate;
    totalProjectRequiredProfitHourly += minRequiredProfitForThisModel;

    const minMarginForHourly = (minRequiredProfitForThisModel / Math.max(0.01, mDirectCost)) * 100;
    const effectiveMargin = Math.max(20, Math.ceil(minMarginForHourly * 10) / 10, rawMargin);

    // Precio comercial directo y predecible
    const mPriceCommercial = mDirectCost * (1 + effectiveMargin / 100);
    const unitPriceAbsorbed = Number((mPriceCommercial / mClientQty).toFixed(2));
    const subtotal = Number((mClientQty * unitPriceAbsorbed).toFixed(2));

    return {
      model: m,
      clientQty: mClientQty,
      bufferQty: mBufferQty,
      totalWorkshopQty: mTotalWorkshopQty,
      unitPriceAbsorbed,
      subtotal,
      totalMachineHours: Number(mHoursWithBuffer.toFixed(1)),
      directCost: mDirectCost,
      marginPercent: effectiveMargin,
      bomCost: mBomCost,
      servicesCost: mServicesCost,
      bomItems: mBomItems,
      customServices: mCustomServices,
      printerRate: mHourlyRate,
      workshopSuppliesCost: mWorkshopSuppliesCost,
      overheadCost: mOverheadCost,
    };
  });

  const modelsSubtotal = modelLineCalculations.reduce((sum, line) => sum + line.subtotal, 0);
  const totalClientPiecesAllModels = models.reduce((sum, m) => sum + m.clientQty, 0);

  // Total Bruto consolida todos los modelos
  const grossTotal = modelsSubtotal;
  const bomItems: BomItem[] = [];
  const servicesSubtotal = 0;

  // Logistics & Gateway Fees
  const shippingAmount = cotizadorDraft.deliveryCost ?? 85.0;
  const paymentMethod = cotizadorDraft.paymentMethod || 'clip';
  const transferFeeToClient = cotizadorDraft.transferPaymentFeeToClient !== false;

  // ========================================================
  // EMPAQUETADO, EMBALAJE & EXTRAS (TARJETAS, SOUVENIRS, STICKERS)
  // ========================================================
  const packagingItems = cotizadorDraft.packagingItems || [];
  const extraItems = cotizadorDraft.extraItems || [];

  // Costo físico de empaque y extras para el taller
  const packagingAndExtrasTotalCost = Number((
    packagingItems.reduce((acc, item) => acc + item.cost, 0) +
    extraItems.reduce((acc, item) => acc + item.cost, 0)
  ).toFixed(2));

  // Monto cargado al cliente en cotización comercial
  const packagingChargedToClient = Number((
    packagingItems.reduce((acc, item) => acc + (item.chargeToClient ? item.cost : 0), 0) +
    extraItems.reduce((acc, item) => acc + (item.chargeToClient ? item.cost : 0), 0)
  ).toFixed(2));

  // ========================================================
  // REGLA DE PROTECCIÓN DE TALLER: TARIFA EN FUNCIÓN DE LA FLOTA DE IMPRESORAS
  // - La utilidad de manufactura respeta la tarifa base por hora configurada al dar de alta cada impresora
  // - Tope máximo de descuento del 35% automático
  // ========================================================
  const totalHours = Math.max(0.1, totalWorkshopMachineHours);
  const minRequiredProfitHourly = totalProjectRequiredProfitHourly > 0
    ? totalProjectRequiredProfitHourly
    : totalHours * (settings.activePrinter?.hourlyRate || 10.0);
  const minRatePerHour = Number((minRequiredProfitHourly / totalHours).toFixed(2));
  const internalCostsTotal = Number((totalModelsDirectCost + packagingAndExtrasTotalCost).toFixed(2));
  const minRequiredProfit20Percent = internalCostsTotal * 0.20;

  // Utilidad directa de producción antes de descuento comercial
  const profitBeforeDiscount = Math.max(0, (grossTotal + packagingChargedToClient) - internalCostsTotal);

  // Descuento máximo seguro para garantizar >= $10.00/hr y >= 20% de margen base
  const maxDiscountForHourlyRate = Math.max(0, profitBeforeDiscount - minRequiredProfitHourly);
  const maxDiscountFor20PercentMargin = Math.max(0, profitBeforeDiscount - minRequiredProfit20Percent);
  const maxSafeDiscountAmount = Math.max(0, Number(Math.min(maxDiscountForHourlyRate, maxDiscountFor20PercentMargin).toFixed(2)));

  // Porcentaje máximo de descuento seguro (con tope estricto del 35% y piso de $10.00/hr)
  const maxSafeDiscountPercentExact = grossTotal > 0
    ? Math.min(35, Math.floor((maxSafeDiscountAmount / grossTotal) * 100))
    : 0;

  // El porcentaje de descuento aplicado NUNCA puede rebasar el tope seguro
  const requestedDiscountPercent = settings.volumeDiscountPercent ?? 0;
  const effectiveDiscountPercent = Math.min(maxSafeDiscountPercentExact, Math.max(0, requestedDiscountPercent));
  const isDiscountBlocked = requestedDiscountPercent > maxSafeDiscountPercentExact;
  const discountAmount = Number((grossTotal * (effectiveDiscountPercent / 100)).toFixed(2));

  const subtotalNeto = Math.max(0, grossTotal - discountAmount) + packagingChargedToClient + shippingAmount;
  const vatAmount = cotizadorDraft.requireInvoice
    ? Number((subtotalNeto * (settings.vatRatePercent / 100)).toFixed(2))
    : 0;
  const totalBeforeGateway = Number((subtotalNeto + vatAmount).toFixed(2));

  let gatewayFeePercent = 0;
  let gatewayFeeFixed = 0;
  let gatewayName = 'Transferencia SPEI';
  let gatewayRateBadge = '0%';

  if (paymentMethod === 'clip') {
    gatewayFeePercent = 0.0418; // 3.6% + IVA terminal Clip o enlace
    gatewayFeeFixed = 0;
    gatewayName = 'Terminal Clip / MP';
    gatewayRateBadge = '4.18%';
  } else if (paymentMethod === 'stripe') {
    gatewayFeePercent = 0.036; // 3.6% + $3.00 MXN pasarela web
    gatewayFeeFixed = 3.0;
    gatewayName = 'Pasarela Stripe';
    gatewayRateBadge = '3.6% + $3';
  } else if (paymentMethod === 'mercadolibre') {
    gatewayFeePercent = 0.15; // 15% comisión venta Marketplace
    gatewayFeeFixed = 0;
    gatewayName = 'Mercado Libre';
    gatewayRateBadge = '15.0%';
  } else if (paymentMethod === 'cash') {
    gatewayName = 'Efectivo en Taller';
    gatewayRateBadge = '0%';
  }

  let gatewayFeeAmount = 0;
  if (gatewayFeePercent > 0 || gatewayFeeFixed > 0) {
    gatewayFeeAmount = Number((totalBeforeGateway * gatewayFeePercent + gatewayFeeFixed).toFixed(2));
  }

  // Base estándar de pasarela Clip (4.18%)
  const clipBaselinePercent = 0.0418;
  const isDirectPayment = paymentMethod === 'spei' || paymentMethod === 'cash';
  // En transferencia y efectivo, se cobra el precio estándar y esa comisión del 4.18% es ganancia extra para nosotros
  const clipExtraProfitAmount = isDirectPayment
    ? Number(((grossTotal - discountAmount) * clipBaselinePercent).toFixed(2))
    : 0;

  // Al cliente no se le cobra recargo por pasarela (solo envío). Total limpio comercial.
  const finalTotal = totalBeforeGateway;
  const deposit50 = Number((finalTotal * 0.5).toFixed(2));
  const taxableBase = subtotalNeto;

  // ========================================================
  // CÁLCULO DE TIEMPO DE ENTREGA ESTIMADO (DÍAS HÁBILES)
  // - Si las horas totales de trabajo son < 24 hrs -> en automático 3 días hábiles
  // - Si son >= 24 hrs -> se calcula según horas de taller requeridas (8h/jornada) con margen
  // - Si requiere envío/paquetería -> se agregan días adicionales de logística
  // ========================================================
  const totalWorkHours = totalWorkshopMachineHours + totalWorkshopLaborHours;
  let productionDays = 3;
  if (totalWorkHours >= 24) {
    productionDays = Math.max(3, Math.ceil((totalWorkHours * 1.25) / 8));
  }

  // Días adicionales si requiere envío
  const hasShipping = (cotizadorDraft.deliveryType && cotizadorDraft.deliveryType !== 'counter') || shippingAmount > 0;
  let shippingExtraDays = 0;
  if (cotizadorDraft.deliveryType === 'paqueteria') {
    shippingExtraDays = 2; // Paquetería nacional añade 2 días hábiles
  } else if (hasShipping) {
    shippingExtraDays = 1; // Envío local / express añade 1 día hábil
  }

  const estimatedDeliveryWorkDays = productionDays + shippingExtraDays;
  const estimatedDeliveryDaysText = `${estimatedDeliveryWorkDays} días hábiles (Aprox.)`;

  // Prorrateo automático de flete para cotización comercial todo incluido
  const extraToProrate = taxableBase - grossTotal;
  const finalModelLineCalculations = modelLineCalculations.map((line) => {
    const ratio = grossTotal > 0 ? line.subtotal / grossTotal : 1 / Math.max(1, modelLineCalculations.length);
    const lineShare = extraToProrate * ratio;
    const subtotalAllInclusive = Number((line.subtotal + lineShare).toFixed(2));
    const unitPriceAllInclusive = Number((subtotalAllInclusive / line.clientQty).toFixed(2));
    return {
      ...line,
      subtotalAllInclusive,
      unitPriceAllInclusive,
    };
  });

  // Utilidad Neta Real y Consistente del Taller:
  // - En transferencia y efectivo: al no cobrar ni integrar la comisión de Clip (4.18%), ese porcentaje queda como GANANCIA EXTRA para nosotros.
  // - En pasarelas digitales (Clip, Stripe): el taller absorbe internamente la comisión para no cobrarle extra al cliente.
  const absorbedGatewayFee = gatewayFeeAmount;
  const netProfitProjected = Math.max(
    0,
    Number(
      (
        (grossTotal + packagingChargedToClient) -
        discountAmount -
        internalCostsTotal -
        absorbedGatewayFee +
        clipExtraProfitAmount
      ).toFixed(2)
    )
  );

  // Tarifa efectiva de ganancia por hora de máquina (armonizada con la partida: >= $10.00/hr)
  const profitPerHour = Number((netProfitProjected / totalHours).toFixed(2));

  // Auto-clamp: Si el descuento configurado excede el tope seguro, sincronizarlo inmediatamente
  useEffect(() => {
    if (settings.volumeDiscountPercent > maxSafeDiscountPercentExact) {
      updateSettings({ volumeDiscountPercent: maxSafeDiscountPercentExact });
    }
  }, [maxSafeDiscountPercentExact, settings.volumeDiscountPercent, updateSettings]);



  // Botón Guardar Cotización (REQ 4)
  const handleSaveQuotationOnly = async () => {
    setIsSavingQuotation(true);
    await saveQuotation(cotizadorDraft, 'Borrador');
    setTimeout(() => {
      setIsSavingQuotation(false);
    }, 400);
  };

  // Botón Unificado de Guardado & Integración con Taller (REQ 4)
  const [isSavingUnified, setIsSavingUnified] = useState(false);
  const handleUnifiedSaveBothFiles = async () => {
    setIsSavingUnified(true);
    await saveQuotation(cotizadorDraft, 'Enviada a Taller');
    addOrderFromCotizador({
      workshopNotes: cotizadorDraft.workshopNotes || cotizadorDraft.notes,
    });
    setTimeout(() => {
      setIsSavingUnified(false);
    }, 400);
  };

  // Upsell handlers triggered from Copilot KiMO AI recommendations (descentralizado al primer modelo)
  const handleAddUpsellToBom = (name: string, cost: number) => {
    const newBom: BomItem = {
      id: `bom-upsell-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      quantity: 1,
      unitCost: cost,
      category: 'herrajes',
    };
    if (models.length > 0) {
      const updatedModels = [...models];
      updatedModels[0] = {
        ...updatedModels[0],
        bomItems: [...(updatedModels[0].bomItems || []), newBom],
      };
      setCotizadorDraft((prev) => ({
        ...prev,
        models: updatedModels,
      }));
    }
  };

  const handleAddUpsellService = (concept: string, price: number) => {
    const newService: CustomServiceItem = {
      id: `srv-upsell-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: concept,
      quantity: 1,
      unitPrice: price,
      category: 'acabado',
    };
    if (models.length > 0) {
      const updatedModels = [...models];
      updatedModels[0] = {
        ...updatedModels[0],
        customServices: [...(updatedModels[0].customServices || []), newService],
      };
      setCotizadorDraft((prev) => ({
        ...prev,
        models: updatedModels,
      }));
    }
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);

  // Impresión nativa del sistema / Guardar como PDF del navegador
  const handlePrintDocument = (_targetTab: 'ambos' | 'cliente' | 'taller' = 'ambos') => {
    const folio = cotizadorDraft.folio || 'COTZ-2026';
    const sheet = document.getElementById('printable-quotation-sheet');
    const sheetHtml = sheet ? sheet.innerHTML : '';

    const printWindow = window.open('', '_blank', 'width=950,height=1100');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Expediente_KiMO_${folio}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
            body {
              font-family: 'Poppins', system-ui, -apple-system, sans-serif;
              background: #ffffff;
              color: #1C1C18;
              margin: 0;
              padding: 24px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div class="no-print bg-gray-50 p-4 border border-[#CDC3D2] rounded-2xl mb-6 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900 text-sm">Expediente Oficial KiMO • Impresión / Guardar PDF</h3>
              <p class="text-xs text-gray-500">En la ventana de destino de tu impresora, selecciona <strong>"Guardar como PDF"</strong>.</p>
            </div>
            <button onclick="window.print()" class="px-5 py-2.5 bg-[#350463] text-[#C0F441] font-black text-xs rounded-xl shadow-md cursor-pointer hover:bg-[#250247]">
              🖨️ Abrir Diálogo Guardar PDF
            </button>
          </div>
          <div>
            ${sheetHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper para preparar los datos estructurados del expediente
  const getQuotationExportData = (): QuotationExportData => {
    const totalGramsCalc = models.reduce((acc, m) => {
      const slotG = (m.amsSlots || []).reduce((sAcc, s) => sAcc + (s.grams || 0), 0);
      return acc + (slotG + (m.purgaGrams || 0)) * Math.max(1, m.clientQty);
    }, 0);

    return {
      folio: cotizadorDraft.folio || 'COTZ-2026',
      clientName: cotizadorDraft.clientName || 'Cliente Particular',
      clientContact: cotizadorDraft.clientContact || 'N/A',
      projectName: cotizadorDraft.projectName || 'Fabricación 3D KiMO',
      estimatedDeliveryDays: estimatedDeliveryWorkDays,
      dateStr: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: finalModelLineCalculations.map((l) => {
        const slotGrams = (l.model.amsSlots || []).reduce((sAcc, s) => sAcc + (s.grams || 0), 0) + (l.model.purgaGrams || 0);
        const finishesList = (l.customServices || []).map((s) => s.name).join(', ');
        const mat = l.model.amsSlots?.[0]?.material || 'PLA+';

        return {
          pieceTitle: l.model.pieceTitle || 'Pieza Personalizada KiMO',
          tech: 'FDM Industrial',
          material: mat,
          quantity: l.clientQty || 1,
          hours: l.totalMachineHours / Math.max(1, l.clientQty),
          grams: slotGrams,
          unitPrice: l.unitPriceAllInclusive || 0,
          subtotal: l.subtotalAllInclusive || 0,
          finishes: finishesList || 'Acabado Estándar',
        };
      }),
      taxableBase,
      discountPercent: effectiveDiscountPercent,
      discountAmount,
      vatAmount,
      finalTotal,
      deposit50,
      totalPieces: totalClientPiecesAllModels,
      totalHours: totalWorkshopMachineHours,
      totalGrams: totalGramsCalc,
    };
  };

  // DESCARGA DE PDF IDÉNTICO A LA PREVISUALIZACIÓN EN PANTALLA
  const handleExecuteDownload = async (mode: 'ambos' | 'completo' | 'cliente' | 'taller' | 'imprimir' = 'ambos') => {
    if (isExportingPDF) return;
    if (mode === 'imprimir') {
      handlePrintDocument('ambos');
      return;
    }

    setIsExportingPDF(true);
    setShowDownloadMenu(false);
    setExportProgressText('⏳ Generando diseño idéntico en PDF...');

    try {
      await exportIdenticalQuotationPDFs({
        folio: cotizadorDraft.folio || 'COTZ-2026',
        clientElementId: 'exportable-client-sheet',
        workshopElementId: 'exportable-workshop-sheet',
        mode: mode === 'completo' ? 'completo' : mode === 'cliente' ? 'cliente' : mode === 'taller' ? 'taller' : 'ambos',
      });
      setExportProgressText('✅ ¡PDFs idénticos descargados!');
    } catch (err) {
      console.warn('Fallback a exportación vectorial debido a captura:', err);
      try {
        const data = getQuotationExportData();
        const generator = generateVectorPDFs(data);
        if (mode === 'ambos') {
          generator.downloadBothSeparatePDFs();
        } else if (mode === 'completo') {
          generator.downloadCompleteDossier();
        } else if (mode === 'cliente') {
          generator.downloadClientQuotation();
        } else if (mode === 'taller') {
          generator.downloadWorkshopSheet();
        }
        setExportProgressText('✅ ¡PDFs descargados con éxito!');
      } catch (fallbackErr) {
        console.error('Error final en descarga:', fallbackErr);
        setExportProgressText('⚠️ Error en la descarga');
      }
    } finally {
      setIsExportingPDF(false);
      setTimeout(() => {
        setExportProgressText(null);
      }, 3500);
    }
  };

  const handleWhatsAppShare = () => {
    const linesText = finalModelLineCalculations
      .map(
        (l, i) =>
          `*${i + 1}. ${l.clientQty}x ${l.model.pieceTitle}*\n   • Incluye: acabados e insumos\n   • P. Unitario: $${l.unitPriceAllInclusive.toFixed(2)} MXN\n   • Importe: $${l.subtotalAllInclusive.toFixed(2)} MXN`
      )
      .join('\n\n');

    let paymentDetailsText = `💳 *Datos para Transferencia SPEI:*\n• Banco: BBVA México\n• CLABE: 0121 8001 5498 7234 11\n• Referencia: ${cotizadorDraft.folio}`;
    if (paymentMethod === 'clip') {
      paymentDetailsText = `💳 *Pago con Terminal Clip / Tarjeta:*\n• Enlace seguro / Terminal física (Visa, MC, AMEX)\n• Referencia: ${cotizadorDraft.folio}`;
    } else if (paymentMethod === 'stripe') {
      paymentDetailsText = `🌐 *Pago Online Seguro Stripe:*\n• Pasarela Web protegida 256-bit\n• Referencia: ${cotizadorDraft.folio}`;
    } else if (paymentMethod === 'mercadolibre') {
      paymentDetailsText = `📦 *Mercado Libre / Mercado Pago:*\n• Compra protegida por Mercado Libre\n• Referencia: ${cotizadorDraft.folio}`;
    } else if (paymentMethod === 'cash') {
      paymentDetailsText = `💵 *Pago en Efectivo contra Entrega:*\n• En Taller KiMO Studio CDMX\n• Referencia: ${cotizadorDraft.folio}`;
    }

    const msg = `*KiMO 3D Studio - Cotización Oficial* 🖨️✨\n` +
      `*Folio:* ${cotizadorDraft.folio}\n` +
      `*Cliente:* ${cotizadorDraft.clientName || 'Cliente'}\n` +
      `*Proyecto:* ${cotizadorDraft.projectName || 'Fabricación Aditiva 3D'}\n\n` +
      `📦 *Partidas Cotizadas (Todo Incluido):*\n${linesText}\n\n` +
      `*Subtotal Partidas:* $${grossTotal.toFixed(2)} MXN\n` +
      (discountAmount > 0 ? `*Descuento Comercial (-${effectiveDiscountPercent}%):* -$${discountAmount.toFixed(2)} MXN\n` : '') +
      (packagingAndExtrasTotalCost > 0 ? `*Empaque & Kit Unboxing:* ${chargePackagingToClient ? `+$${packagingChargedToClient.toFixed(2)} MXN` : '$0.00 MXN (Cortesía KiMO)'}\n` : '') +
      (shippingAmount > 0 ? `*Envío / Flete:* +$${shippingAmount.toFixed(2)} MXN\n` : '') +
      (vatAmount > 0 ? `*IVA (16% Fiscal):* $${vatAmount.toFixed(2)} MXN\n` : '') +
      `*TOTAL FINAL:* $${finalTotal.toFixed(2)} MXN\n` +
      `*Anticipo 50% para inicio:* $${deposit50.toFixed(2)} MXN\n\n` +
      `${paymentDetailsText}\n\n` +
      `Quedamos a tus órdenes en KiMO 3D Studio.`;

    const phoneClean = (cotizadorDraft.clientContact || '').replace(/\D/g, '');
    const waUrl = phoneClean.length >= 10
      ? `https://wa.me/52${phoneClean.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
    navigator.clipboard.writeText(msg);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 p-6 min-h-screen bg-slate-50">
      {/* TOP HEADER RIBBON */}
      <section className="w-full px-6 py-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-2xl bg-[#350463] text-[#C0F441] flex items-center justify-center font-bold text-sm shadow-xs">
            <Zap className="w-5 h-5" />
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-gray-900">Cotizador Activo Pro</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold uppercase tracking-wider">
                Arquitectura Multi-Modelo v4.5
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Acordeones colapsables, multi-modelo por cotización, reglas automáticas de merma/buffer y protección de margen.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-[#1C1C18] text-xs font-semibold shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#86B100] animate-pulse" />
            {models.length} {models.length === 1 ? 'Modelo 3D' : 'Modelos 3D'} • {totalClientPiecesAllModels} pzs
          </span>

          {/* Badge: [ Gastos Operativos Aplicados ] */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold transition-all shadow-xs cursor-default">
            <Calculator className="w-4 h-4 text-gray-500" />
            <span>Gastos Operativos Aplicados:</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white text-gray-900 shadow-sm border border-gray-200">
              +${totalAbsorcionPorHora.toFixed(2)}/hr
            </span>
          </div>

          {/* Botón: [ 📂 Consultar Cotizaciones Guardadas ] (REQ 4) */}
          <button
            type="button"
            onClick={() => setIsQuotationsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-[#EADDFB] text-gray-900 border-2 border-[#6D3ACD]/30 hover:border-[#6D3ACD] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Abrir catálogo y gestión de cotizaciones guardadas"
          >
            <Folder className="w-4 h-4 text-[#6D3ACD]" />
            <span>📂 Consultar Cotizaciones Guardadas</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[#EADDFB] text-[#4C237A] font-bold">
              {savedQuotations.length}
            </span>
          </button>
        </div>
      </section>

      {/* SPLIT SCREEN WORKSPACE (50% / 50%) */}
      <section className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* ======================================================== */}
        {/* COLUMNA IZQUIERDA: 6 PANELES TIPO ACORDEÓN (6 COLS)      */}
        {/* ======================================================== */}
        <div className="lg:w-1/2 flex flex-col gap-6">
          {/* SECCIÓN 1: DATOS GENERALES DEL PROYECTO & CLIENTE */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => toggleSection('general')}
              className="w-full p-6 bg-white hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Sección 1: Datos Generales del Proyecto & Cliente
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Folio: <strong>{cotizadorDraft.folio}</strong> • {cotizadorDraft.clientName || 'Cliente Particular'}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-[#4C237A] shrink-0 transition-transform duration-200 ${
                  openSections.general ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections.general && (
              <div className="p-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">
                    Nombre del Proyecto:
                  </label>
                  <input
                    type="text"
                    value={cotizadorDraft.projectName}
                    onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, projectName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">
                    Nombre del Cliente / Empresa:
                  </label>
                  <input
                    type="text"
                    value={cotizadorDraft.clientName}
                    onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">
                    Persona de Contacto:
                  </label>
                  <input
                    type="text"
                    value={cotizadorDraft.clientContact}
                    onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, clientContact: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[#1C1C18] focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">
                    Folio Oficial de Cotización:
                  </label>
                  <input
                    type="text"
                    value={cotizadorDraft.folio}
                    onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, folio: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold text-[#6D3ACD] focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: PARTIDAS Y MODELOS 3D (MULTI-MODELO REQ 2, 3, 4, 5) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => toggleSection('models')}
              className="w-full p-6 bg-white hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      Sección 2: Partidas y Modelos 3D
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#4C237A] text-white font-black font-mono text-[10px]">
                      {models.length} {models.length === 1 ? 'Partida' : 'Partidas'}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Modelos con dropzone OCR, contingencia manual, cama PEI, filamentos y buffer de merma.
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-[#4C237A] shrink-0 transition-transform duration-200 ${
                  openSections.models ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections.models && (
              <div className="p-4 pt-3 flex flex-col gap-4 animate-in fade-in">
                {/* Cabecera informativa de modelos */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Configura cada modelo por separado con sus tiempos, placas, filamentos, insumos, servicios y margen:
                  </span>
                  <span className="text-xs font-mono font-bold text-[#4C237A] bg-[#EADDFB] px-2.5 py-0.5 rounded-full border border-[#6D3ACD]/30">
                    {models.length} {models.length === 1 ? 'partida configurada' : 'partidas configuradas'}
                  </span>
                </div>

                {/* Listado de tarjetas de modelos */}
                <div className="space-y-4">
                  {models.map((mod, idx) => (
                    <ModelCard
                      key={mod.id}
                      model={mod}
                      index={idx}
                      totalModels={models.length}
                      filaments={filaments}
                      settings={settings}
                      onUpdate={(updated) => handleUpdateModel(idx, updated)}
                      onDuplicate={() => handleDuplicateModel(idx)}
                      onDelete={() => handleDeleteModel(idx)}
                      onAddUpsellToBom={handleAddUpsellToBom}
                      onAddUpsellService={handleAddUpsellService}
                      onAddNextModel={handleAddModel}
                    />
                  ))}
                </div>

                {/* COMENTARIOS & INSTRUCCIONES ESPECIALES PARA FICHA DE TALLER (REQ 4) */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border-2 border-[#6D3ACD]/25 flex flex-col gap-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#4C237A] flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Comentarios & Instrucciones Especiales para Ficha de Taller</span>
                    </label>
                    <span className="text-[10px] text-[#4C237A] font-mono font-bold bg-[#EADDFB] px-2.5 py-0.5 rounded-full border border-[#6D3ACD]/30">
                      Ficha Técnica & Kanban
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={cotizadorDraft.workshopNotes || ''}
                    onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, workshopNotes: e.target.value })}
                    placeholder="Ej. Usar costura trasera alineada, cuidado con la pieza 3 al retirar soportes, verificar ajuste con imanes..."
                    className="w-full p-2.5 bg-white border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18] focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-transparent"
                  />
                  <span className="text-[10px] text-gray-500">
                    Estas notas técnicas se sincronizan automáticamente con la Ficha de Taller (Job Ticket) y la orden de Kanban en "En Cola".
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: LOGÍSTICA, IMPUESTOS Y MÉTODO DE PAGO (DESCENTRALIZADO - REQ 1) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => toggleSection('logistics')}
              className="w-full p-6 bg-white hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      Sección 3: Logística, Impuestos y Método de Pago
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#4C237A] text-white font-bold text-[10px]">
                      {paymentMethod === 'clip' ? 'CLIP / MP (3.6% + IVA)' : paymentMethod.toUpperCase()} • Flete: ${shippingAmount.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Pasarelas de cobro, flete editable y facturación fiscal con 16% de IVA.
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-[#4C237A] shrink-0 transition-transform duration-200 ${
                  openSections.logistics ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections.logistics && (
              <div className="p-4 pt-3 flex flex-col gap-4 text-xs animate-in fade-in">
                {/* Método de pago */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#6D3ACD]" />
                    <span>Método de Pago & Pasarela</span>
                  </span>

                  <div className="p-3 rounded-2xl bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-base shrink-0 shadow-2xs">
                        {paymentMethod === 'clip' ? '💳' : paymentMethod === 'stripe' ? '🌐' : paymentMethod === 'mercadolibre' ? '📦' : paymentMethod === 'spei' ? '🏦' : '💵'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-gray-900">
                            {gatewayName} ({gatewayRateBadge})
                          </span>
                          {gatewayFeeAmount > 0 && (
                            <span className="font-mono text-[11px] font-bold text-[#6D3ACD]">
                              +${gatewayFeeAmount.toFixed(2)} MXN
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500">
                          {isDirectPayment
                            ? `🌟 Cobro directo por ${gatewayName}: La comisión Clip (4.18%) se convierte en margen extra para el taller.`
                            : gatewayFeeAmount > 0
                            ? 'Costo de pasarela integrado (en la cotización del cliente no se menciona recargo).'
                            : 'Sin deducción de comisión'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-[#CDC3D2]/30 shrink-0">
                      {[
                        { id: 'clip', label: 'Clip', icon: '💳' },
                        { id: 'stripe', label: 'Stripe', icon: '🌐' },
                        { id: 'mercadolibre', label: 'ML', icon: '📦' },
                        { id: 'spei', label: 'SPEI', icon: '🏦' },
                        { id: 'cash', label: 'Efectivo', icon: '💵' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setCotizadorDraft({ ...cotizadorDraft, paymentMethod: pm.id as any })}
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            paymentMethod === pm.id
                              ? 'bg-[#350463] text-white shadow-xs'
                              : 'text-gray-500 hover:bg-white'
                          }`}
                        >
                          {pm.icon} {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isDirectPayment ? (
                    <div className="px-3 py-2 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7] text-[#2E7D32] flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium">
                        🌟 <strong>Ganancia Extra para Nosotros:</strong> Al pagar con transferencia o efectivo, no se paga la comisión base de Clip y queda 100% como utilidad extra de taller:
                      </span>
                      <span className="font-mono font-black text-xs text-[#1B5E20]">
                        +${clipExtraProfitAmount.toFixed(2)} MXN (+4.18%)
                      </span>
                    </div>
                  ) : gatewayFeeAmount > 0 ? (
                    <div className="px-3 py-2 rounded-xl bg-gray-50 border border-[#CDC3D2]/30 flex items-center justify-between text-xs">
                      <span className="text-gray-500 text-[11px]">
                        Comisión procesador ({gatewayRateBadge}): <strong className="font-mono text-[#6D3ACD]">${gatewayFeeAmount.toFixed(2)} MXN</strong> (Absorbida por taller • En la cotización del cliente NO se menciona recargo, solo se detalla el envío).
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[#6D3ACD] font-mono text-[10px] font-bold">
                        Comisión Interna
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Logística de Envíos */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#CDC3D2]/30">
                  <span className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#6D3ACD]" />
                    <span>Logística & Envíos (Costo Editable)</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'counter', title: 'Recolección Taller ($0)', cost: 0 },
                      { id: 'uber_flash', title: 'Uber Flash ($85)', cost: 85 },
                      { id: 'paqueteria', title: 'Paquetería Nal. ($140)', cost: 140 },
                      { id: 'custom', title: 'Personalizado', cost: shippingAmount },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setCotizadorDraft({
                            ...cotizadorDraft,
                            deliveryType: s.id as any,
                            deliveryCost: s.id === 'custom' ? shippingAmount : s.cost,
                          })
                        }
                        className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          cotizadorDraft.deliveryType === s.id
                            ? 'bg-[#EADDFB] border-[#6D3ACD] text-gray-900 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-[#F0EEE7]'
                        }`}
                      >
                        <span>{s.title}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200">
                    <span className="text-gray-500 font-medium">Costo de Envío / Flete:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">$</span>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={shippingAmount}
                        onChange={(e) =>
                          setCotizadorDraft({
                            ...cotizadorDraft,
                            deliveryCost: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-24 text-right py-1 px-2 rounded-lg bg-gray-50 border border-[#CDC3D2] font-mono font-bold text-gray-900"
                      />
                      <span className="font-bold text-gray-900">MXN</span>
                    </div>
                  </div>
                </div>

                {/* Empaquetado, Embalaje & Extras Unboxing */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#CDC3D2]/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Empaquetado, Embalaje & Extras Unboxing</span>
                    </span>
                    <span className="font-mono font-bold text-xs text-[#6D3ACD] px-2 py-0.5 rounded-full bg-[#EADDFB]">
                      Total Kit: ${packagingAndExtrasTotalCost.toFixed(2)} MXN
                    </span>
                  </div>

                  {/* EMPAQUETADO DINÁMICO */}
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white border border-[#CDC3D2]/30 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[11px] text-[#350463] uppercase tracking-wide">
                        Empaquetado & Embalaje
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newPkg = { id: `pkg-${Date.now()}`, name: '', cost: 0, chargeToClient: true };
                          setCotizadorDraft({ ...cotizadorDraft, packagingItems: [...packagingItems, newPkg] });
                        }}
                        className="text-[10px] font-bold text-[#6D3ACD] hover:underline"
                      >
                        + Añadir Empaque
                      </button>
                    </div>

                    <datalist id="warehouse-supplies-empaque">
                      {warehouseSupplies.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>

                    <div className="flex flex-col gap-3">
                      {packagingItems.map((item, idx) => (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <input
                            type="text"
                            list="warehouse-supplies-empaque"
                            placeholder="Buscar en stock o escribir..."
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const found = warehouseSupplies.find(s => s.name === val);
                              const updated = [...packagingItems];
                              updated[idx].name = val;
                              if (found) updated[idx].cost = found.cost;
                              setCotizadorDraft({ ...cotizadorDraft, packagingItems: updated });
                            }}
                            className="flex-1 w-full sm:w-auto text-xs py-1.5 px-2 rounded-lg bg-gray-50 border border-[#CDC3D2] focus:outline-none"
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-gray-900">$</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={item.cost}
                                onChange={(e) => {
                                  const updated = [...packagingItems];
                                  updated[idx].cost = parseFloat(e.target.value) || 0;
                                  setCotizadorDraft({ ...cotizadorDraft, packagingItems: updated });
                                }}
                                className="w-16 text-right py-1 px-2 rounded-lg bg-gray-50 border border-[#CDC3D2] font-mono font-bold text-gray-900 text-xs"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...packagingItems];
                                updated[idx].chargeToClient = !updated[idx].chargeToClient;
                                setCotizadorDraft({ ...cotizadorDraft, packagingItems: updated });
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                item.chargeToClient ? 'bg-[#6D3ACD] text-white' : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {item.chargeToClient ? 'Cobrar' : 'Cortesía'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCotizadorDraft({
                                  ...cotizadorDraft,
                                  packagingItems: packagingItems.filter((_, i) => i !== idx)
                                });
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {packagingItems.length === 0 && (
                        <span className="text-xs text-gray-400 italic">Sin empaque seleccionado.</span>
                      )}
                    </div>
                  </div>

                  {/* EXTRAS DINÁMICOS */}
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white border border-[#CDC3D2]/30 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[11px] text-[#350463] uppercase tracking-wide">
                        Extras & Experiencia Unboxing
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newExt = { id: `ext-${Date.now()}`, name: '', cost: 0, chargeToClient: false };
                          setCotizadorDraft({ ...cotizadorDraft, extraItems: [...extraItems, newExt] });
                        }}
                        className="text-[10px] font-bold text-[#6D3ACD] hover:underline"
                      >
                        + Añadir Extra
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {extraItems.map((item, idx) => (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <input
                            type="text"
                            list="warehouse-supplies-empaque"
                            placeholder="Ej. Tarjeta, Sticker, Souvenir..."
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const found = warehouseSupplies.find(s => s.name === val);
                              const updated = [...extraItems];
                              updated[idx].name = val;
                              if (found) updated[idx].cost = found.cost;
                              setCotizadorDraft({ ...cotizadorDraft, extraItems: updated });
                            }}
                            className="flex-1 w-full sm:w-auto text-xs py-1.5 px-2 rounded-lg bg-gray-50 border border-[#CDC3D2] focus:outline-none"
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-gray-900">$</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={item.cost}
                                onChange={(e) => {
                                  const updated = [...extraItems];
                                  updated[idx].cost = parseFloat(e.target.value) || 0;
                                  setCotizadorDraft({ ...cotizadorDraft, extraItems: updated });
                                }}
                                className="w-16 text-right py-1 px-2 rounded-lg bg-gray-50 border border-[#CDC3D2] font-mono font-bold text-gray-900 text-xs"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...extraItems];
                                updated[idx].chargeToClient = !updated[idx].chargeToClient;
                                setCotizadorDraft({ ...cotizadorDraft, extraItems: updated });
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                item.chargeToClient ? 'bg-[#6D3ACD] text-white' : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {item.chargeToClient ? 'Cobrar' : 'Cortesía'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCotizadorDraft({
                                  ...cotizadorDraft,
                                  extraItems: extraItems.filter((_, i) => i !== idx)
                                });
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {extraItems.length === 0 && (
                        <span className="text-xs text-gray-400 italic">Sin extras añadidos.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* INSUMOS DE IMPRESIÓN & ABSORCIÓN OPERATIVA (RENTA, PC, MARKETING, LACA, ETC.) */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#CDC3D2]/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Insumos de Taller & Gastos Operativos (OPEX)</span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      Administrado en Finanzas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* 1. Insumos Directos de Impresión (Laca, lubricante, IPA) */}
                    <div className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 transition-all ${
                      includeWorkshopSupplies ? 'bg-white border-[#CDC3D2]/60' : 'bg-gray-50/70 border-gray-200 opacity-70'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeWorkshopSupplies}
                            onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, includeWorkshopSupplies: e.target.checked })}
                            className="accent-[#6D3ACD] w-4 h-4 rounded cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">🧴 Insumos de Máquina</span>
                            <span className="text-[10px] text-gray-500">Laca, adhesión, lubricante & IPA</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#6D3ACD]">
                          ${totalProjectWorkshopSuppliesCost.toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100">
                        <span>Tasa: ${workshopSuppliesRatePerHour.toFixed(2)} MXN/hr</span>
                        <span>{totalWorkshopMachineHours.toFixed(1)} hrs de proyecto</span>
                      </div>
                    </div>

                    {/* 2. Absorción de Gastos Fijos (Renta, computadora, marketing, movilidad) */}
                    <div className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 transition-all ${
                      includeOverhead ? 'bg-white border-[#CDC3D2]/60' : 'bg-gray-50/70 border-gray-200 opacity-70'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeOverhead}
                            onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, includeOverheadAbsorption: e.target.checked })}
                            className="accent-[#6D3ACD] w-4 h-4 rounded cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">🏢 Absorción Gastos Fijos (OPEX)</span>
                            <span className="text-[10px] text-gray-500">Renta, PC, marketing, movilidad</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#2E3F00]">
                          ${totalProjectOverheadCost.toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100">
                        <span>Tasa: ${overheadRatePerHour.toFixed(2)} MXN/hr</span>
                        <span>Prorrateado en base a {estMonthlyHours}h/mes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Facturación Fiscal */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#CDC3D2]/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Régimen Fiscal & Facturación</span>
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cotizadorDraft.requireInvoice}
                        onChange={(e) =>
                          setCotizadorDraft({ ...cotizadorDraft, requireInvoice: e.target.checked })
                        }
                        className="accent-[#6D3ACD] w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-900">
                        ¿Requiere Factura Fiscal? (+16% IVA)
                      </span>
                    </label>
                  </div>

                  {cotizadorDraft.requireInvoice && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium">RFC Cliente</label>
                        <input
                          type="text"
                          value={cotizadorDraft.rfc}
                          onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, rfc: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white font-mono font-bold text-gray-900 border border-gray-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium">Razón Social</label>
                        <input
                          type="text"
                          value={cotizadorDraft.razonSocial}
                          onChange={(e) => setCotizadorDraft({ ...cotizadorDraft, razonSocial: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white font-semibold text-[#1C1C18] border border-gray-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>



          {/* RESUMEN EJECUTIVO DE RENTABILIDAD & MÉTRICAS (REGLA $10.00 MXN / HORA) */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#CDC3D2]/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6D3ACD]" />
                <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                  Resumen Ejecutivo de Taller & Protección de Utilidad
                </h4>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#6D3ACD]">
                Regla Mínima: $10.00 MXN / hr
              </span>
            </div>

            {/* Métricas Consolidadas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-[#CDC3D2]/30">
                <span className="text-[10px] text-gray-500 block">Costos Directos:</span>
                <span className="font-mono font-bold text-gray-900">${internalCostsTotal.toFixed(2)} MXN</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-[#CDC3D2]/30">
                <span className="text-[10px] text-gray-500 block">Subtotal Partidas:</span>
                <span className="font-mono font-bold text-gray-900">${grossTotal.toFixed(2)} MXN</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-[#CDC3D2]/30">
                <span className="text-[10px] text-gray-500 block">Utilidad Neta Taller:</span>
                <span className="font-mono font-bold text-[#2E3F00]">${netProfitProjected.toFixed(2)} MXN</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-[#CDC3D2]/30">
                <span className="text-[10px] text-gray-500 block">Tarifa por Hora:</span>
                <span className={`font-mono font-black ${profitPerHour >= minRatePerHour ? 'text-[#2E3F00]' : 'text-[#BA1A1A]'}`}>
                  ${profitPerHour.toFixed(2)} MXN/hr
                </span>
                <span className="text-[9px] text-gray-500 block">Meta flota: ${minRatePerHour.toFixed(2)}/hr</span>
              </div>
            </div>

            {/* Desglose Transparente de Costos Absorbidos */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-gray-900 uppercase tracking-wider">
                  Desglose Íntegro de Costos Absorbidos por el Proyecto:
                </span>
                <span className="font-bold text-gray-500 text-[10px]">
                  Administrado en Finanzas
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[#1C1C18]">
                <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-[#CDC3D2]/30">
                  <span className="text-gray-500">🧵 Filamento:</span>
                  <strong className="font-mono">${totalModelsFilamentCost.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-[#CDC3D2]/30">
                  <span className="text-gray-500">⚡ CFE + Mtto:</span>
                  <strong className="font-mono">${(totalModelsCfeCost + totalModelsMttoCost).toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-[#CDC3D2]/30">
                  <span className="text-gray-500">🧴 Insumos Taller:</span>
                  <strong className="font-mono text-[#6D3ACD]">${totalProjectWorkshopSuppliesCost.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-[#CDC3D2]/30">
                  <span className="text-gray-500">🏢 Gastos Fijos (OPEX):</span>
                  <strong className="font-mono text-[#2E3F00]">${totalProjectOverheadCost.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-[#CDC3D2]/30">
                  <span className="text-gray-500">📦 Empaque & Merch:</span>
                  <strong className="font-mono">${packagingAndExtrasTotalCost.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-[#CDC3D2]/30">
                  <span className="text-gray-500">⏱️ Mano de Obra:</span>
                  <strong className="font-mono">${totalModelsLaborCost.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Impacto de Comisión Pasarela o Ganancia Extra en Taller */}
            <div className="pt-2 border-t border-[#CDC3D2]/30 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-gray-500">
                Modalidad de Cobro: <strong>{gatewayName} ({gatewayRateBadge})</strong>
              </span>
              {isDirectPayment ? (
                <span className="font-mono font-black text-[#2E7D32]">
                  🌟 +${clipExtraProfitAmount.toFixed(2)} MXN (+4.18% Ganancia Extra para Nosotros)
                </span>
              ) : (
                <span className="font-mono font-bold text-[#BA1A1A]">
                  {gatewayFeeAmount > 0
                    ? `-$${gatewayFeeAmount.toFixed(2)} MXN (Absorbida por Taller)`
                    : '$0.00 MXN'}
                </span>
              )}
            </div>

            {profitPerHour < minRatePerHour && (
              <div className="p-2.5 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-[#B71C1C] text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#D32F2F]" />
                <span>
                  <strong>Atención Taller:</strong> Al absorber la comisión de pasarela (${gatewayFeeAmount.toFixed(2)} MXN), tu ganancia por hora cae a ${profitPerHour.toFixed(2)} MXN/hr (por debajo de la meta de ${minRatePerHour.toFixed(2)}/hr). Recomendamos sugerir pago por <em>Transferencia SPEI o Efectivo</em> para retener el +4.18% de ganancia extra.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMNA DERECHA: PREVIEW DUAL FLOTANTE (ACOMPAÑA SCROLL) */}
        {/* ======================================================== */}
        <div className="lg:w-1/2 flex flex-col gap-0 sticky top-6 self-start bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* PREVIEW DUAL */}
          <QuotationPreviewDual
            draft={cotizadorDraft}
            settings={settings}
            previewTab={previewTab}
            setPreviewTab={setPreviewTab}
            estimatedDeliveryDaysText={estimatedDeliveryDaysText}
            modelLineCalculations={finalModelLineCalculations}
            bomItems={bomItems}
            servicesSubtotal={servicesSubtotal}
            grossTotal={grossTotal}
            discountAmount={discountAmount}
            effectiveDiscountPercent={effectiveDiscountPercent}
            clipExtraProfitAmount={clipExtraProfitAmount}
            shippingAmount={shippingAmount}
            gatewayFeeAmount={gatewayFeeAmount}
            transferFeeToClient={transferFeeToClient}
            packagingChargedToClient={packagingChargedToClient}
            packagingAndExtrasTotalCost={packagingAndExtrasTotalCost}
            taxableBase={taxableBase}
            vatAmount={vatAmount}
            finalTotal={finalTotal}
            deposit50={deposit50}
          />

          {/* DESCUENTO COMERCIAL CON TOPE SEGURO */}
          <div className="p-6 border-b border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wider block">
                  🏷️ Descuento Comercial / Volumen (Tope seguro: {maxSafeDiscountPercentExact}%)
                </span>
                <span className="text-[11px] text-gray-500">
                  Garantiza que la ganancia nunca baje de ${minRatePerHour.toFixed(2)} MXN / hr (tarifa de impresoras registradas)
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max={maxSafeDiscountPercentExact}
                  value={effectiveDiscountPercent}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    updateSettings({ volumeDiscountPercent: Math.min(maxSafeDiscountPercentExact, Math.max(0, val)) });
                  }}
                  className="w-14 text-center font-black font-mono text-[#BA1A1A] bg-transparent text-sm focus:outline-none"
                />
                <span className="font-bold text-[#BA1A1A] text-xs">%</span>
                {discountAmount > 0 && (
                  <span className="text-xs font-mono font-bold text-[#BA1A1A] ml-1">
                    (-${discountAmount.toFixed(2)} MXN)
                  </span>
                )}
              </div>
            </div>

            {/* Atajos de Descuento Rápido y Botón Máximo Seguro */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 font-semibold">Atajos:</span>
                {[0, 5, 10, 15, 20, 25, 30]
                  .filter((pct) => pct <= maxSafeDiscountPercentExact)
                  .map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => updateSettings({ volumeDiscountPercent: pct })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        effectiveDiscountPercent === pct
                          ? 'bg-[#BA1A1A] text-white shadow-xs'
                          : 'bg-gray-50 text-gray-500 hover:bg-[#E5E2DB]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
              </div>

              {/* Botón Inteligente: Aplicar Descuento Máximo Seguro */}
              <button
                type="button"
                onClick={() => updateSettings({ volumeDiscountPercent: maxSafeDiscountPercentExact })}
                className="px-2.5 py-1 rounded-lg bg-[#EADDFB] hover:bg-[#D5BDFC] text-gray-900 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                title={`Aplica el descuento máximo permitido (${maxSafeDiscountPercentExact}%) sin perforar los $${minRatePerHour.toFixed(2)}/hr`}
              >
                <Sparkles className="w-3 h-3 text-[#6D3ACD]" />
                <span>Tope Seguro ({maxSafeDiscountPercentExact}%)</span>
              </button>
            </div>

            {/* Alerta de Descuento Bloqueado o Limitado */}
            {isDiscountBlocked && (
              <div className="p-2.5 rounded-xl bg-[#FFF3E0] border border-[#FFB74D] flex items-start gap-2 text-[11px] text-[#E65100]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E65100]" />
                <div>
                  <strong>Tope seguro alcanzado: el descuento no puede superar el {maxSafeDiscountPercentExact}%</strong>
                  <span className="block opacity-90 text-[10px]">
                    Protección activa: la ganancia de máquina está garantizada en al menos ${minRatePerHour.toFixed(2)} MXN / hr según la tarifa de tus impresoras.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ACCIONES DEBAJO DEL PREVIEW: SOLO IMPRIMIR / GUARDAR EN BORRADOR */}
          <div className="p-6 bg-gray-50 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-100">
              <div>
                <span className="font-bold text-gray-900">
                  Folio: <strong className="font-mono text-[#6D3ACD]">{cotizadorDraft.folio}</strong>
                </span>
                <span className="text-gray-500 block text-[11px]">
                  {totalClientPiecesAllModels} pzs • Entrega: <strong>{estimatedDeliveryDaysText}</strong>
                </span>
              </div>
              <div className="text-right">
                
{profitPerHour >= minRatePerHour ? (
  <span className="bg-lime-400 text-purple-900 font-bold text-[10px] px-2 py-0.5 rounded-full mb-1 inline-block">Meta ${minRatePerHour.toFixed(2)}/hr ✓</span>
) : (
  <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2 py-0.5 rounded-full mb-1 inline-block">Debajo de Meta ✗</span>
)}

<span className="text-[10px] text-gray-500 uppercase font-bold block">Total a Pagar</span>
                <span className="font-mono font-black text-[#86B100] text-base">
                  ${finalTotal.toFixed(2)} <span className="text-xs">MXN</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* BOTÓN PRINCIPAL: IMPRIMIR / GUARDAR PDF NATIVO */}
              <button
                type="button"
                onClick={() => handlePrintDocument('ambos')}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#350463] hover:bg-[#250247] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                title="Abre la ventana de impresión para imprimir o Guardar como PDF del sistema"
              >
                <Printer className="w-4 h-4 text-[#C0F441]" />
                <span>🖨️ Imprimir / Guardar como PDF</span>
              </button>

              {/* BOTÓN SECUNDARIO: GUARDAR BORRADOR */}
              <button
                type="button"
                onClick={handleSaveQuotationOnly}
                disabled={isSavingQuotation}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-gray-50 hover:bg-[#E5E2DB] text-gray-900 border border-gray-200 font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                title="Guardar como borrador en el sistema"
              >
                <Save className="w-4 h-4 text-[#6D3ACD]" />
                <span>{isSavingQuotation ? 'Guardando...' : 'Guardar Borrador'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL DE GESTIÓN Y CONSULTA DE COTIZACIONES GUARDADAS (REQ 4) */}
      <SavedQuotationsModal
        isOpen={isQuotationsModalOpen}
        onClose={() => setIsQuotationsModalOpen(false)}
        quotations={savedQuotations}
        onEdit={(quote) => {
          loadQuotationIntoCotizador(quote);
          setIsQuotationsModalOpen(false);
        }}
        onLaunchToWorkshop={(quote) => {
          launchQuotationToWorkshop(quote);
          setIsQuotationsModalOpen(false);
        }}
        onViewPdf={(quote) => {
          loadQuotationIntoCotizador(quote);
          setPreviewTab('cliente');
          setIsQuotationsModalOpen(false);
          setTimeout(() => {
            const sheet = document.getElementById('printable-quotation-sheet');
            sheet?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onDuplicate={(quote) => {
          duplicateQuotation(quote);
        }}
        onDelete={(quoteId) => {
          deleteSavedQuotation(quoteId);
        }}
      />

      {/* MODAL DE ESTRUCTURA DE COSTOS & PRESUPUESTO DE TALLER (OPEX) */}

    </div>
  );
};
