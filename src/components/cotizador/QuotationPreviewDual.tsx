import React from 'react';
import { CotizadorDraftData, WorkshopSettings, CotizadorModelItem, BomItem } from '../../types';
import { BED_PLATE_OPTIONS } from './CotizadorTypes';
import { FileText, Printer, QrCode, Package } from 'lucide-react';

interface QuotationPreviewDualProps {
  draft: CotizadorDraftData;
  settings: WorkshopSettings;
  previewTab: 'cliente' | 'taller';
  setPreviewTab: (tab: 'cliente' | 'taller') => void;
  estimatedDeliveryDaysText?: string;
  // Precomputed financial figures
  modelLineCalculations: {
    model: CotizadorModelItem;
    clientQty: number;
    bufferQty: number;
    totalWorkshopQty: number;
    unitPriceAbsorbed: number;
    subtotal: number;
    unitPriceAllInclusive?: number;
    subtotalAllInclusive?: number;
    totalMachineHours: number;
    directCost: number;
    overheadCost: number;
  }[];
  bomItems: BomItem[];
  servicesSubtotal: number;
  grossTotal: number;
  discountAmount: number;
  shippingAmount: number;
  gatewayFeeAmount: number;
  transferFeeToClient: boolean;
  packagingChargedToClient?: number;
  packagingAndExtrasTotalCost?: number;
  taxableBase: number;
  vatAmount: number;
  effectiveDiscountPercent?: number;
  clipExtraProfitAmount?: number;
  finalTotal: number;
  deposit50: number;
}

export const QuotationPreviewDual: React.FC<QuotationPreviewDualProps> = ({
  draft,
  settings,
  previewTab,
  setPreviewTab,
  estimatedDeliveryDaysText = '3 a 4 días hábiles (Aprox.)',
  modelLineCalculations,
  bomItems,
  grossTotal,
  discountAmount,
  effectiveDiscountPercent,
  clipExtraProfitAmount = 0,
  shippingAmount,
  gatewayFeeAmount,
  transferFeeToClient,
  packagingChargedToClient = 0,
  packagingAndExtrasTotalCost = 0,
  taxableBase,
  vatAmount,
  finalTotal,
  deposit50,
}) => {
  // Mapeo amigable de nombre de pasarela (sin exponer comisiones al cliente)
  const getGatewayLabel = () => {
    switch (draft.paymentMethod) {
      case 'clip':
        return 'Terminal Clip / Tarjeta Débito y Crédito';
      case 'stripe':
        return 'Pasarela Online Stripe';
      case 'mercadolibre':
        return 'Mercado Libre';
      case 'cash':
        return 'Pago en Efectivo en Taller';
      case 'spei':
      default:
        return 'Transferencia SPEI';
    }
  };

  // Renderizador unificado de la Cotización Comercial para Cliente
  const renderClientView = () => (
    <div className="flex flex-col gap-4 bg-white text-[#1C1C18]">
      {/* Header Membretado */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-[#F0EEE7]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-purple-900 flex items-center justify-center text-lime-400 font-bold text-sm">
              K3D
            </div>
            <span className="font-black text-xl text-gray-900">KiMO 3D Studio</span>
          </div>
          <span className="text-xs font-bold text-purple-600">
            Laboratorio de Fabricación Aditiva • Impresión 3D • Prototipado
          </span>
          <div className="mt-1 text-[11px] text-gray-500 space-y-0.5">
            <div>WhatsApp: <strong>55 7067 9725</strong></div>
            <div>Correo: <strong>kimo.hace@gmail.com</strong></div>
            <div>Instagram: <strong>@kimo.ideas</strong> • CDMX, México</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-right min-w-[200px]">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
            Folio Oficial
          </span>
          <span className="text-lg font-black text-gray-900 font-mono">
            {draft.folio}
          </span>
          <div className="mt-2 text-[11px] text-gray-500 space-y-0.5">
            <div>Fecha: <strong>{new Date().toLocaleDateString('es-MX')}</strong></div>
            <div>Vigencia: <strong>15 días naturales</strong></div>
            <div>Atendido por: <strong className="text-purple-600">Taller KiMO Lab</strong></div>
          </div>
        </div>
      </div>

      {/* Info Cliente & Proyecto */}
      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
            Facturar / Dirigido a:
          </span>
          <div className="font-bold text-gray-900 text-sm">{draft.clientName || 'Cliente General'}</div>
          <span className="text-[11px] text-gray-500">{draft.clientContact || 'Contacto no especificado'}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
            Proyecto:
          </span>
          <div className="font-bold text-purple-600 text-xs">{draft.projectName || 'Fabricación 3D'}</div>
          <span className="text-[11px] text-gray-500">
            Entrega estimada: <strong className="text-gray-900">{estimatedDeliveryDaysText}</strong>
          </span>
        </div>
      </div>

      {/* Tabla de Partidas Comerciales Limpias */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-purple-50 text-gray-900 text-[11px] uppercase tracking-wider font-bold">
              <th className="py-2.5 px-3 text-center w-12">Cant.</th>
              <th className="py-2.5 px-3">Descripción de Partida / Modelo 3D</th>
              <th className="py-2.5 px-3 text-center">Especificación</th>
              <th className="py-2.5 px-3 text-right">P. Unitario</th>
              <th className="py-2.5 px-3 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E2DB] bg-white">
            {modelLineCalculations.map((line, idx) => {
              const assignedBom = line.model.bomItems || [];
              const assignedServices = line.model.customServices || [];
              const bomTexts = assignedBom.map((b) => (b.quantity > 1 ? `${b.quantity}x ${b.name}` : b.name));
              const serviceTexts = assignedServices.map((s) => (s.name || s.concept || 'Servicio'));
              const allIncludes = [...bomTexts, ...serviceTexts];
              const unitPrice = line.unitPriceAllInclusive ?? line.unitPriceAbsorbed;
              const rowSubtotal = line.subtotalAllInclusive ?? line.subtotal;

              return (
                <tr key={line.model.id || idx}>
                  <td className="py-2.5 px-3 text-center font-bold text-gray-900 font-mono">
                    {line.clientQty}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-gray-900 block">
                      #{idx + 1}. {line.model.pieceTitle}
                    </span>
                    
                    {/* Filamento y Colores Reales con muestra visual */}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-900">Filamento:</span>
                      {line.model.amsSlots.map((slot, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px]"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: slot.colorHex || '#333333' }}
                          />
                          <span className="font-medium text-[#1C1C18]">{slot.material} {slot.name}</span>
                        </span>
                      ))}
                    </div>

                    {/* Insumos & Servicios incluidos */}
                    {allIncludes.length > 0 && (
                      <span className="text-[11px] font-semibold text-purple-600 block mt-1 bg-[#F3EEFA] px-2 py-0.5 rounded-md border border-[#6D3ACD]/20">
                        • Incluye: {allIncludes.join(', ')}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-gray-900 text-[10px] font-bold">
                      {line.model.amsSlots.length > 1
                        ? `${line.model.amsSlots.length} Colores AMS`
                        : 'Monocromático'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1C1C18]">
                    <div className="flex flex-col items-end">
                      <span className="text-gray-900 font-bold font-mono">
                        ${unitPrice.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono font-normal">
                        (CD: ${line.directCost.toFixed(2)} + Abs: ${line.overheadCost.toFixed(2)})
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-gray-900">
                    ${rowSubtotal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Desglose Económico, Banco y Método de Pago */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        <div className="sm:col-span-6 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between text-xs">
          <div>
            <span className="font-bold text-xs text-gray-900 uppercase tracking-wider block mb-1">
              Método de Pago Seleccionado: {getGatewayLabel()}
            </span>
            
            {/* Información Dinámica según la forma de pago elegida */}
            {draft.paymentMethod === 'spei' || !draft.paymentMethod ? (
              <div className="space-y-0.5 text-[11px] text-gray-500">
                <div>Banco: <strong>BBVA México</strong></div>
                <div>Beneficiario: <strong>KiMO Impresión y Diseño 3D</strong></div>
                <div>
                  CLABE:{' '}
                  <strong className="text-purple-600 font-mono font-bold">
                    0121 8001 5498 7234 11
                  </strong>
                </div>
                <div>Concepto / Referencia: <strong>{draft.folio}</strong></div>
              </div>
            ) : draft.paymentMethod === 'clip' ? (
              <div className="space-y-0.5 text-[11px] text-gray-500">
                <div>Plataforma: <strong>Terminal Clip / Tarjeta Débito y Crédito</strong></div>
                <div>Acepta: <strong>Visa, Mastercard, AMEX, Carnet, Apple Pay</strong></div>
                <div>Enlace de pago: <strong className="text-purple-600">Generado al autorizar orden</strong></div>
                <div>Referencia: <strong>{draft.folio}</strong></div>
              </div>
            ) : draft.paymentMethod === 'stripe' ? (
              <div className="space-y-0.5 text-[11px] text-gray-500">
                <div>Plataforma: <strong>Pasarela Online Stripe</strong></div>
                <div>Acepta: <strong>Tarjetas Nacionales e Internacionales</strong></div>
                <div>Seguridad: <strong>Encriptación bancaria SSL 256 bits</strong></div>
                <div>Referencia: <strong>{draft.folio}</strong></div>
              </div>
            ) : draft.paymentMethod === 'mercadolibre' ? (
              <div className="space-y-0.5 text-[11px] text-gray-500">
                <div>Canal: <strong>Mercado Libre / Mercado Pago</strong></div>
                <div>Protección: <strong>Programa de Compra Protegida</strong></div>
                <div>Referencia: <strong>{draft.folio}</strong></div>
              </div>
            ) : (
              <div className="space-y-0.5 text-[11px] text-gray-500">
                <div>Modalidad: <strong>Pago en Efectivo contra entrega en Taller</strong></div>
                <div>Ubicación: <strong>Laboratorio KiMO Studio • CDMX</strong></div>
                <div>Referencia: <strong>{draft.folio}</strong></div>
              </div>
            )}
          </div>
          {draft.requireInvoice && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
              <strong>CFDI:</strong> RFC: {draft.rfc} • {draft.razonSocial}
            </div>
          )}
        </div>

        {/* Resumen Comercial con Comisiones y Desglose Completo */}
        <div className="sm:col-span-6 p-3.5 rounded-2xl bg-purple-50/30 border border-[#6D3ACD]/25 flex flex-col gap-2 text-xs">
          {/* Subtotal de Piezas */}
          <div className="flex justify-between text-gray-500">
            <span className="font-medium">Subtotal Partidas:</span>
            <span className="font-mono font-bold text-[#1C1C18]">
              ${grossTotal.toFixed(2)} MXN
            </span>
          </div>

          {/* Renglón Descuento Comercial */}
          {discountAmount > 0 && (
            <div className="flex justify-between text-[#BA1A1A] font-bold border-t border-[#6D3ACD]/15 pt-1">
              <span>Descuento Comercial (-{effectiveDiscountPercent ?? settings.volumeDiscountPercent}%):</span>
              <span className="font-mono">-${discountAmount.toFixed(2)} MXN</span>
            </div>
          )}

          {/* Renglón Empaque, Embalaje & Kit Unboxing */}
          {packagingAndExtrasTotalCost > 0 && (
            <div className="flex justify-between text-gray-500 font-medium border-t border-[#6D3ACD]/15 pt-1 text-[11px]">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">
                  Empaque, Embalaje & Kit Unboxing:
                </span>
                <span className="text-[10px] text-purple-600">
                  {[...(draft.packagingItems || []), ...(draft.extraItems || [])].map(item => item.name).filter(Boolean).join(' • ') || 'Sin empaque específico'}
                </span>
              </div>
              <span className="font-mono font-bold text-[#1C1C18]">
                {packagingChargedToClient > 0
                  ? `+$${packagingChargedToClient.toFixed(2)} MXN`
                  : '$0.00 MXN (Cortesía KiMO)'}
              </span>
            </div>
          )}

          {/* Renglón Envío / Flete */}
          {shippingAmount > 0 && (
            <div className="flex justify-between text-gray-500 font-medium border-t border-[#6D3ACD]/15 pt-1">
              <span>Envío / Flete de Entrega:</span>
              <span className="font-mono font-bold text-[#1C1C18]">+${shippingAmount.toFixed(2)} MXN</span>
            </div>
          )}

          {/* Renglón IVA */}
          {draft.requireInvoice && (
            <div className="flex justify-between text-purple-600 font-bold border-t border-[#6D3ACD]/20 pt-1">
              <span>IVA (16% Fiscal):</span>
              <span className="font-mono">+${vatAmount.toFixed(2)} MXN</span>
            </div>
          )}

          {/* TOTAL FINAL A PAGAR */}
          <div className="p-3 rounded-2xl bg-[#C0F441] text-[#2E3F00] flex items-center justify-between shadow-xs mt-1">
            <span className="font-black text-xs uppercase tracking-wider">TOTAL A PAGAR</span>
            <span className="text-xl font-black font-mono leading-none">
              ${finalTotal.toFixed(2)} <span className="text-xs">MXN</span>
            </span>
          </div>

          <div className="pt-1 space-y-0.5 text-[11px] font-mono">
            <div className="flex justify-between text-gray-900 font-bold">
              <span>Anticipo requerido (50%):</span>
              <span>${deposit50.toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Saldo contra entrega:</span>
              <span>${deposit50.toFixed(2)} MXN</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#F0EEE7] flex items-center justify-between text-[11px] text-gray-500">
        <span>Garantía de Tolerancia Dimensional ±0.15mm en filamentos técnicos.</span>
        <span className="font-mono uppercase text-[10px]">
          PÁGINA 1 / 1 • KIMO STUDIO DIGITAL PDF
        </span>
      </div>
    </div>
  );

  // Renderizador unificado de la Ficha Técnica de Taller
  const renderWorkshopView = () => (
    <div className="flex flex-col gap-4 bg-white text-[#1C1C18]">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-3 border-b-2 border-[#350463]/20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-900 text-white font-mono text-[11px] font-bold">
              HOJA DE RUTA INDUSTRIAL // TALLER
            </span>
            <span className="text-lg font-black text-gray-900 font-mono">
              {draft.folio} // JOB-3D
            </span>
          </div>
          <h2 className="text-sm font-bold text-gray-900 mt-1">
            Plan de Manufactura Aditiva & Setup Multi-Modelo
          </h2>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
            <span className="px-2 py-0.5 rounded bg-gray-50 font-semibold text-gray-900">
              Impresoras: <strong>{Array.from(new Set(modelLineCalculations.map((l) => l.model.assignedPrinter || settings.activePrinter.model || 'Bambu Lab A1 Combo'))).join(', ')}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-gray-900 font-bold">
              Total Partidas: <strong>{modelLineCalculations.length} Modelos 3D</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-500">
              Entrega Programada: <strong>{estimatedDeliveryDaysText}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-50 font-semibold text-purple-700">
              Cobro: <strong>{getGatewayLabel()}</strong>
              {(draft.paymentMethod === 'spei' || draft.paymentMethod === 'cash' || !draft.paymentMethod) ? (
                <span className="ml-1 text-[#2E7D32] font-mono text-[10px] font-bold">
                  (🌟 +4.18% / +${clipExtraProfitAmount.toFixed(2)} MXN Margen Extra Taller)
                </span>
              ) : gatewayFeeAmount > 0 ? (
                <span className="ml-1 text-[#BA1A1A] font-mono text-[10px]">
                  (-${gatewayFeeAmount.toFixed(2)} MXN absorbida en taller)
                </span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-2xl bg-gray-50 border border-gray-200 shrink-0">
          <div className="w-14 h-14 bg-white p-1 rounded-xl border border-gray-200 flex items-center justify-center">
            <QrCode className="w-10 h-10 text-gray-900" />
          </div>
          <div className="flex flex-col text-left text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Job Folio</span>
            <span className="font-mono text-[11px] font-bold text-gray-900">
              {draft.folio}
            </span>
            <span className="text-[10px] text-purple-600 font-semibold">{settings.activePrinter.model}</span>
          </div>
        </div>
      </div>

      {/* INSTRUCCIONES ESPECIALES DE TALLER */}
      {draft.workshopNotes && (
        <div className="p-3.5 rounded-2xl bg-[#F3EEFA] border-2 border-[#6D3ACD]/30 flex flex-col gap-1 text-xs">
          <span className="font-extrabold text-xs text-purple-700 flex items-center gap-1.5 uppercase tracking-wide">
            <span>🛠️ Instrucciones Especiales para Ficha de Taller (Operador):</span>
          </span>
          <p className="text-[11px] text-[#1C1C18] whitespace-pre-line font-medium leading-relaxed bg-white/80 p-2.5 rounded-xl border border-[#6D3ACD]/20">
            {draft.workshopNotes}
          </p>
        </div>
      )}

      {/* DESGLOSE POR CADA MODELO 3D */}
      <div className="space-y-3">
        {modelLineCalculations.map((line, idx) => {
          const bedOpt = BED_PLATE_OPTIONS.find((b) => b.id === line.model.bedType);
          return (
            <div
              key={line.model.id || idx}
              className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-2.5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#6D3ACD] text-white flex items-center justify-center font-bold text-[11px]">
                    #{idx + 1}
                  </span>
                  <strong className="text-gray-900 text-sm">{line.model.pieceTitle}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-purple-900 text-lime-400 font-mono font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                    <Printer className="w-3 h-3" />
                    {line.model.assignedPrinter || settings.activePrinter.model || 'Bambu Lab A1 Combo'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-gray-900 font-bold text-[10px]">
                    Cama: {bedOpt?.label || 'Placa PEI'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#C0F441]/40 text-[#2E3F00] font-bold font-mono text-[10px]">
                    {line.model.platesCount} Placas PEI
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-gray-200">
                  <span className="text-[10px] text-gray-500 block">Lote a Fabricar:</span>
                  <strong className="text-gray-900">
                    {line.totalWorkshopQty} pzs ({line.clientQty} Cliente + {line.bufferQty} Buffer)
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-200">
                  <span className="text-[10px] text-gray-500 block">Horas de Máquina:</span>
                  <strong className="text-gray-900">{line.totalMachineHours} hrs</strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-200">
                  <span className="text-[10px] text-gray-500 block">Mano de Obra Taller:</span>
                  <strong className="text-purple-600">
                    {line.model.dedicatedLaborHours || 0} hrs dedicadas
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-200">
                  <span className="text-[10px] text-gray-500 block">Purga Flushed:</span>
                  <strong className="text-gray-900">{line.model.purgaGrams || 0}g</strong>
                </div>
              </div>

              {/* Diagrama de Bobinas Exactas para este modelo */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Montaje Ranuras AMS ({line.model.amsSlots.length} Filamentos):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {line.model.amsSlots.map((slot) => (
                    <div
                      key={slot.slot}
                      className="p-1.5 px-2 rounded-lg bg-white border border-gray-200 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-[#CDC3D2] shrink-0"
                          style={{ backgroundColor: slot.colorHex || '#333333' }}
                        />
                        <span className="font-bold text-gray-900 truncate">
                          S#{slot.slot} {slot.name}
                        </span>
                      </div>
                      <span className="font-mono text-gray-500 shrink-0 ml-1">
                        {slot.grams}g ({slot.material})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insumos y Servicios de Taller asignados a este modelo (EXTRAS EXPLICITOS) */}
              {((line.model.bomItems && line.model.bomItems.length > 0) || (line.model.customServices && line.model.customServices.length > 0)) && (
                <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex flex-col gap-1 text-[11px]">
                  <span className="font-bold text-gray-900 text-[10px] uppercase tracking-wider">
                    🔧 Insumos & Extras Requeridos para esta Partida:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(line.model.bomItems || []).map((b, bi) => (
                      <span key={bi} className="px-2 py-0.5 rounded-md bg-gray-50 border border-[#CDC3D2]/50 text-gray-900 font-semibold text-[10px]">
                        📦 {b.quantity}x {b.name}
                      </span>
                    ))}
                    {(line.model.customServices || []).map((s, si) => (
                      <span key={si} className="px-2 py-0.5 rounded-md bg-purple-50/60 border border-[#6D3ACD]/30 text-purple-700 font-semibold text-[10px]">
                        🛠️ {s.name || s.concept || 'Servicio'} ({s.quantity || 1}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rutas y URLs para el operador */}
              {(line.model.modelUrl || line.model.localPath) && (
                <div className="p-2 rounded-xl bg-white/80 border border-gray-200 text-[10px] font-mono text-gray-500 space-y-0.5">
                  {line.model.modelUrl && (
                    <div className="truncate">
                      <strong>URL 3D:</strong> {line.model.modelUrl}
                    </div>
                  )}
                  {line.model.localPath && (
                    <div className="truncate">
                      <strong>Ruta Taller:</strong> {line.model.localPath}
                    </div>
                  )}
                </div>
              )}

              {/* Notas de Manufactura */}
              {line.model.notes && (
                <div className="p-2.5 rounded-xl bg-purple-50/40 border border-[#6D3ACD]/30 flex flex-col gap-1 text-[11px]">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#6D3ACD] animate-pulse" />
                    Notas de Manufactura & Parámetros Especiales:
                  </span>
                  <p className="text-gray-900 font-medium whitespace-pre-line leading-relaxed">
                    {line.model.notes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Insumos BOM & Herrajes Físicos para Ensamble */}
      {bomItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wide block mb-2">
            Insumos de Ensamble Físico (BOM de Mesa General)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {bomItems.map((bom) => (
              <div
                key={bom.id}
                className="p-2 rounded-xl bg-white border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <strong className="text-gray-900 block">{bom.name}</strong>
                  <span className="text-gray-500">{bom.quantity} unidades requeridas</span>
                </div>
                <span className="font-mono font-bold text-[#2E3F00] bg-[#C0F441]/30 px-2 py-0.5 rounded-lg">
                  Listo para mesa
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empaque, Embalaje & Kit Unboxing para Operador de Taller */}
      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#F0EEE7]">
          <span className="font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
            <Package className="w-4 h-4 text-purple-600" />
            <span>Empaque, Embalaje & Kit Unboxing Asignado</span>
          </span>
          <span className="font-mono font-bold text-purple-600 text-[11px]">
            Costo Físico Taller: ${packagingAndExtrasTotalCost.toFixed(2)} MXN
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Embalaje Físico:</span>
            <strong className="text-gray-900">
              {(draft.packagingItems || []).map(p => p.name).filter(Boolean).join(' • ') || 'Sin empaque específico'}
            </strong>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Extras Obligatorios de Unboxing:</span>
            <div className="flex flex-wrap gap-1">
              {(draft.extraItems || []).map((eItem, eIdx) => (
                <span key={eIdx} className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-700 font-bold text-[10px]">
                  ✓ {eItem.name}
                </span>
              ))}
              {(!draft.extraItems || draft.extraItems.length === 0) && (
                <span className="text-gray-400 italic">Sin extras asignados</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insumos de Taller & Fondo Operativo (OPEX) */}
      {(settings.operatingBudget || draft.includeWorkshopSupplies !== false) && (
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#F0EEE7]">
            <span className="font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>🧴 Insumos de Producción & Fondo Operativo de Taller (OPEX)</span>
            </span>
            <span className="font-mono font-bold text-[#2E3F00] text-[10px] bg-[#C0F441]/30 px-2 py-0.5 rounded-full">
              Prorrateo Activo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Consumibles de Cama & Máquina:</span>
              <span className="text-gray-900 font-medium leading-relaxed">
                • Laca fijadora / pegamento de cama PEI ({settings.operatingBudget?.lacaAdhesivoPorHora ? `$${settings.operatingBudget.lacaAdhesivoPorHora}/h` : '$2.00/h'})<br />
                • Lubricante husillos, alcohol isopropílico IPA, toallitas y navajas
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Absorción de Gastos Fijos (Infraestructura):</span>
              <span className="text-gray-900 font-medium leading-relaxed">
                • Renta de espacio, luz general e internet de taller<br />
                • Amortización de PC de diseño, mobiliario, herramientas y marketing
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Control de Calidad */}
      <div className="p-3.5 rounded-2xl bg-white border-2 border-dashed border-[#6D3ACD]/30 text-xs">
        <span className="font-bold text-gray-900 uppercase tracking-wide block mb-2">
          Checklist de Taller & Salida de Producción
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          {[
            'Limpieza profunda de placa PEI con alcohol isopropílico',
            'Carga y calibración de bobinas en el AMS',
            'Verificación de piezas de seguridad vs. piezas cliente',
            'Inspección dimensional y tolerancias (±0.15mm)',
            'Ensamble de herrajes BOM en mesa de trabajo',
            `Preparar embalaje e incluir extras de unboxing según configuración`,
            `Etiquetado final con Folio ${draft.folio} y packing de entrega`,
          ].map((step, sIdx) => (
            <label key={sIdx} className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="accent-[#6D3ACD] w-3.5 h-3.5 rounded" />
              <span className="text-[#1C1C18]">{step}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de Pestaña Dual */}
      
      <div className="flex items-center bg-gray-100 rounded-xl p-1 mb-2">
        <button
          type="button"
          onClick={() => setPreviewTab('cliente')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            previewTab === 'cliente'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          1. Vista Cliente
        </button>

        <button
          type="button"
          onClick={() => setPreviewTab('taller')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            previewTab === 'taller'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Printer className="w-4 h-4" />
          2. Ficha Taller
        </button>
      </div>


      {/* LIENZO INTERACTIVO VISIBLE */}
      <div
        id="printable-quotation-sheet"
        className="w-full bg-white rounded-3xl p-6 lg:p-8 shadow-xl border border-gray-200 min-h-[700px] flex flex-col justify-between"
      >
        {previewTab === 'cliente' ? renderClientView() : renderWorkshopView()}
      </div>

      {/* ========================================================================= */}
      {/* CONTENEDORES OCULTOS FUERA DE PANTALLA PARA EXPORTACIÓN PDF 100% IDÉNTICA */}
      {/* ========================================================================= */}
      <div style={{ position: 'fixed', left: '-99999px', top: '0', zIndex: -100, pointerEvents: 'none' }}>
        <div
          id="exportable-client-sheet"
          style={{ width: '800px', backgroundColor: '#ffffff', padding: '32px', fontFamily: "'Poppins', sans-serif" }}
        >
          {renderClientView()}
        </div>

        <div
          id="exportable-workshop-sheet"
          style={{ width: '800px', backgroundColor: '#ffffff', padding: '32px', fontFamily: "'Poppins', sans-serif", marginTop: '50px' }}
        >
          {renderWorkshopView()}
        </div>
      </div>
    </div>
  );
};

