import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../../context/WorkshopContext';
import { WorkshopOperatingBudget } from '../../types';
import {
  X,
  DollarSign,
  Calculator,
  Building2,
  Laptop,
  Armchair,
  Wrench,
  Car,
  Megaphone,
  Globe,
  Package,
  Tag,
  Gift,
  Check,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface OperatingBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const defaultOperatingBudget: WorkshopOperatingBudget = {
  estimatedMonthlyHours: 160,
  rentaTallerMensual: 2500,
  amortizacionComputadoraMensual: 600,
  amortizacionEscritorioMobiliarioMensual: 250,
  herramientasTallerMensual: 200,
  movilidadTransporteMensual: 800,
  marketingPublicidadContenidoMensual: 1200,
  softwareLicenciasInternetMensual: 500,
  otrosGastosFijosMensual: 250,
  lacaAdhesivoPorHora: 2.0,
  consumiblesMttoMenorPorHora: 2.0,
  empaqueBaseCosto: 25.0,
  tarjetaPresentacionCosto: 3.5,
  stickersCosto: 4.0,
  souvenirCosto: 8.0,
};

export const OperatingBudgetModal: React.FC<OperatingBudgetModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, addNotification } = useWorkshop();

  const currentBudget: WorkshopOperatingBudget = {
    ...defaultOperatingBudget,
    ...(settings.operatingBudget || {}),
  };

  const [form, setForm] = useState<WorkshopOperatingBudget>(currentBudget);
  const [activeSubTab, setActiveSubTab] = useState<'gastos_fijos' | 'insumos_impresion' | 'packaging'>('gastos_fijos');

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...defaultOperatingBudget,
        ...(settings.operatingBudget || {}),
      });
    }
  }, [isOpen, settings.operatingBudget]);

  if (!isOpen) return null;

  // Cálculos dinámicos
  const totalGastosFijosMensuales =
    Number(form.rentaTallerMensual || 0) +
    Number(form.amortizacionComputadoraMensual || 0) +
    Number(form.amortizacionEscritorioMobiliarioMensual || 0) +
    Number(form.herramientasTallerMensual || 0) +
    Number(form.movilidadTransporteMensual || 0) +
    Number(form.marketingPublicidadContenidoMensual || 0) +
    Number(form.softwareLicenciasInternetMensual || 0) +
    Number(form.otrosGastosFijosMensual || 0);

  const horasMensuales = Math.max(1, Number(form.estimatedMonthlyHours) || 160);
  const cuotaOverheadPorHora = Number((totalGastosFijosMensuales / horasMensuales).toFixed(2));
  const insumosDirectosPorHora = Number(
    (Number(form.lacaAdhesivoPorHora || 0) + Number(form.consumiblesMttoMenorPorHora || 0)).toFixed(2)
  );
  const totalAbsorcionPorHora = Number((cuotaOverheadPorHora + insumosDirectosPorHora).toFixed(2));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      operatingBudget: form,
      defaultPackagingCost: Number(form.empaqueBaseCosto) || 25,
    });
    addNotification('✅ Presupuesto operativo y estructura de insumos guardados.');
    onClose();
  };

  const handleResetDefaults = () => {
    setForm(defaultOperatingBudget);
    addNotification('Valores restaurados al estándar de taller 3D.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-[#CDC3D2]/50 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* CABECERA */}
        <div className="p-5 sm:p-6 border-b border-[#CDC3D2]/40 bg-[#FAF7F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center shrink-0 border border-[#6D3ACD]/20">
              <Calculator className="w-6 h-6 text-[#6D3ACD]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#350463] leading-tight">
                  Estructura de Costos, Presupuesto & Insumos de Taller (OPEX)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#C0F441]/30 text-[#2E3F00] text-[10px] font-black uppercase tracking-wider">
                  Prorrateo 3D
                </span>
              </div>
              <p className="text-xs text-[#4B4450]">
                Configura los gastos reales de tu negocio (renta, computadora, laca, empaques) para que cada cotización absorba su parte justa y garantices utilidad neta real.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#F0EEE7] text-[#4B4450] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* BANNER KPIS DE ABSORCIÓN FINANCIERA */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F7F4FA] border border-[#6D3ACD]/20 space-y-1">
              <span className="text-[10px] font-bold text-[#6D3ACD] uppercase tracking-wider block">
                Presupuesto Fijo Mensual
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#350463]">
                ${totalGastosFijosMensuales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-[#4B4450]">Renta, PC, marketing, etc.</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-1">
              <span className="text-[10px] font-bold text-[#4B4450] uppercase tracking-wider block">
                Horas Productivas / Mes
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#1C1C18]">
                {horasMensuales} <span className="text-xs font-sans text-gray-500">hrs</span>
              </div>
              <span className="text-[10px] text-[#4B4450]">Capacidad taller mensual</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-1">
              <span className="text-[10px] font-bold text-[#4B4450] uppercase tracking-wider block">
                Overhead Gastos Fijos / Hr
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#350463]">
                ${cuotaOverheadPorHora.toFixed(2)} <span className="text-xs font-sans text-gray-500">MXN/h</span>
              </div>
              <span className="text-[10px] text-[#4B4450]">Fijo ÷ Horas mensuales</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#C0F441]/20 border border-[#86B100]/40 space-y-1">
              <span className="text-[10px] font-bold text-[#2E3F00] uppercase tracking-wider block">
                Total Absorción por Hora
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#2E3F00]">
                ${totalAbsorcionPorHora.toFixed(2)} <span className="text-xs font-sans text-[#2E3F00]/70">MXN/h</span>
              </div>
              <span className="text-[10px] text-[#2E3F00] font-semibold">Overhead + Insumos de máquina</span>
            </div>
          </div>

          {/* SUB-PESTAÑAS DE NAVEGACIÓN */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAF7F0] rounded-2xl border border-[#CDC3D2]/40">
            <button
              type="button"
              onClick={() => setActiveSubTab('gastos_fijos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'gastos_fijos'
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'text-[#4B4450] hover:bg-[#EADDFB]/40'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. Gastos Fijos & Infraestructura (${totalGastosFijosMensuales}/mes)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('insumos_impresion')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'insumos_impresion'
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'text-[#4B4450] hover:bg-[#EADDFB]/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>2. Insumos Directos de Impresión (${insumosDirectosPorHora}/hr)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('packaging')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'packaging'
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'text-[#4B4450] hover:bg-[#EADDFB]/40'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>3. Packaging & Merchandising (Base)</span>
            </button>
          </div>

          {/* FORMULARIO POR PESTAÑAS */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* 1. GASTOS FIJOS MENSUALES */}
            {activeSubTab === 'gastos_fijos' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <span className="font-bold">¿Cómo funciona la absorción de gastos fijos?</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Ingresa el costo mensual estimado de los recursos que sostienen tu taller. El sistema los divide automáticamente entre las horas productivas que operas al mes (ej. 160 hrs). De esta manera, cada hora de impresión absorbe <strong>${cuotaOverheadPorHora.toFixed(2)} MXN</strong>, asegurando que tu cliente pague una fracción proporcional de la renta, la computadora y el marketing.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-1">
                  <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#6D3ACD]" />
                    <span>Horas estimadas de operación del taller al mes:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="5"
                      min="10"
                      value={form.estimatedMonthlyHours}
                      onChange={(e) => setForm({ ...form, estimatedMonthlyHours: Number(e.target.value) })}
                      className="w-32 p-2 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-xs text-[#4B4450]">
                      horas/mes (Ejemplo: 1 impresora trabajando 6h diarias = ~180 hrs; 2 impresoras = ~360 hrs)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-1.5">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Renta del taller / espacio ($/mes):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.rentaTallerMensual}
                      onChange={(e) => setForm({ ...form, rentaTallerMensual: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-[10px] text-[#4B4450]">
                      Espacio dedicado o parte proporcional del taller/estudio.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-1.5">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Computadora de diseño / slicing ($/mes):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.amortizacionComputadoraMensual}
                      onChange={(e) => setForm({ ...form, amortizacionComputadoraMensual: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-[10px] text-[#4B4450]">
                      Amortización mensual del equipo de cómputo para laminación y CAD.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-1.5">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Armchair className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Escritorio, estantes & mobiliario ($/mes):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.amortizacionEscritorioMobiliarioMensual}
                      onChange={(e) => setForm({ ...form, amortizacionEscritorioMobiliarioMensual: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-[10px] text-[#4B4450]">
                      Mesa de trabajo, gavetas para filamento y sillas ergonómicas.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-1.5">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Herramientas mayores de taller ($/mes):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.herramientasTallerMensual}
                      onChange={(e) => setForm({ ...form, herramientasTallerMensual: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-[10px] text-[#4B4450]">
                      Calibrador digital, dremel, cautín de insertos, alicates, llaves allen.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-1.5">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Movilidad, transporte & logística interna ($/mes):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.movilidadTransporteMensual}
                      onChange={(e) => setForm({ ...form, movilidadTransporteMensual: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-[10px] text-[#4B4450]">
                      Gasolina o traslados para surtir filamentos y llevar paquetes.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-1.5">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Marketing, creación de contenido & publicidad ($/mes):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.marketingPublicidadContenidoMensual}
                      onChange={(e) => setForm({ ...form, marketingPublicidadContenidoMensual: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-[10px] text-[#4B4450]">
                      Pauta en redes, producción fotográfica, videos y campañas comerciales.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-1.5">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Software, licencias CAD & servicio de Internet ($/mes):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.softwareLicenciasInternetMensual}
                      onChange={(e) => setForm({ ...form, softwareLicenciasInternetMensual: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-[10px] text-[#4B4450]">
                      Conexión a internet del taller, licencias de diseño o membresías de modelos.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-1.5">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Otros gastos fijos / Fondo de contingencias ($/mes):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.otrosGastosFijosMensual}
                      onChange={(e) => setForm({ ...form, otrosGastosFijosMensual: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-[10px] text-[#4B4450]">
                      Reserva de imprevistos o gastos varios no contemplados.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. INSUMOS DIRECTOS DE IMPRESIÓN */}
            {activeSubTab === 'insumos_impresion' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-2xl bg-[#EADDFB]/40 border border-[#6D3ACD]/20 text-xs text-[#350463] flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#6D3ACD] mt-0.5" />
                  <div>
                    <span className="font-bold">Insumos consumidos por cada hora de extrusión:</span>
                    <p className="text-[11px] text-[#4B4450] leading-relaxed mt-0.5">
                      Estos insumos se gastan gradualmente con cada impresión que realiza el taller. Al integrarlos por hora, el cotizador calcula automáticamente su costo exacto para cada proyecto.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#6D3ACD]" />
                        <span>Laca / Adhesivo de cama ($ MXN por hora):</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold text-[#6D3ACD] bg-[#F3EEFA] px-2 py-0.5 rounded">
                        ${Number(form.lacaAdhesivoPorHora || 0).toFixed(2)}/h
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.lacaAdhesivoPorHora}
                      onChange={(e) => setForm({ ...form, lacaAdhesivoPorHora: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <p className="text-[10px] text-[#4B4450]">
                      Gasto de laca fijadora (Nelly/3DLac), pegamento en barra Magigoo o spray de adhesión PEI. Típicamente $1.50 - $3.00 MXN/hr.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-[#6D3ACD]" />
                        <span>Lubricante, alcohol IPA & consumibles ($ MXN por hora):</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold text-[#6D3ACD] bg-[#F3EEFA] px-2 py-0.5 rounded">
                        ${Number(form.consumiblesMttoMenorPorHora || 0).toFixed(2)}/h
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.consumiblesMttoMenorPorHora}
                      onChange={(e) => setForm({ ...form, consumiblesMttoMenorPorHora: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <p className="text-[10px] text-[#4B4450]">
                      Grasa de varillas/husillos, alcohol isopropílico para limpieza, toallitas sin pelusa, navajas de corte, lijas y agujas destapadoras.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PACKAGING Y MERCHANDISING */}
            {activeSubTab === 'packaging' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-2xl bg-[#C0F441]/20 border border-[#86B100]/30 text-xs text-[#2E3F00] flex items-start gap-2.5">
                  <Package className="w-4 h-4 shrink-0 text-[#2E3F00] mt-0.5" />
                  <div>
                    <span className="font-bold">Costos base predeterminados de empaque y entrega:</span>
                    <p className="text-[11px] text-[#2E3F00]/90 leading-relaxed mt-0.5">
                      Estos montos se cargan como plantilla base en cada cotización nueva. En cada cotización individual puedes elegir si cobrarlos al cliente o absorberlos como costo interno del taller.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-2">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Empaque Base (Caja, bolsa burbuja, embalaje):</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.empaqueBaseCosto}
                      onChange={(e) => setForm({ ...form, empaqueBaseCosto: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <p className="text-[10px] text-[#4B4450]">
                      Costo de caja de cartón, plástico burbuja, bolsa hermética ziploc y cinta adhesiva.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-2">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Tarjeta de Presentación / Agradecimiento:</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.tarjetaPresentacionCosto}
                      onChange={(e) => setForm({ ...form, tarjetaPresentacionCosto: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <p className="text-[10px] text-[#4B4450]">
                      Costo unitario de tarjeta impresa con redes sociales o instrucciones de cuidado.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-2">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Stickers Promocionales KiMO de Regalo:</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.stickersCosto}
                      onChange={(e) => setForm({ ...form, stickersCosto: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <p className="text-[10px] text-[#4B4450]">
                      Costo de calcomanías troqueladas de cortesía para el unboxing del cliente.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#CDC3D2]/50 space-y-2">
                    <label className="text-xs font-bold text-[#350463] flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Souvenir / Detalle de Cortesía:</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.souvenirCosto}
                      onChange={(e) => setForm({ ...form, souvenirCosto: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                    />
                    <p className="text-[10px] text-[#4B4450]">
                      Llavero impreso de cortesía o detalle sorpresa para fidelizar al cliente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F0EEE7] text-[#4B4450] font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-[#CDC3D2]/50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Sugeridos</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#350463] hover:bg-[#240A44] text-white font-extrabold text-xs shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#C0F441]" />
                  <span>Guardar y Aplicar a Cotizador</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
