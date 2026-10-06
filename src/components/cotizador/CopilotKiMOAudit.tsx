import React, { useState } from 'react';
import { CotizadorModelItem, CopilotAuditData, BomItem, CustomServiceItem } from '../../types';
import {
  Sparkles,
  Wrench,
  TrendingUp,
  CheckCircle,
  Copy,
  Plus,
  Compass,
  ShieldAlert,
  TreePine,
  Cpu,
  DollarSign,
  Tag,
  Target,
  MessageSquare,
  FileCheck,
  Check,
  Zap,
} from 'lucide-react';

interface CopilotKiMOAuditProps {
  model: CotizadorModelItem;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onApplyTechnical: (appliedNotes: string, suggestedBed?: string) => void;
  onAddUpsellToBom: (name: string, cost: number) => void;
  onAddUpsellService: (concept: string, price: number) => void;
}

export const CopilotKiMOAudit: React.FC<CopilotKiMOAuditProps> = ({
  model,
  isAnalyzing,
  onAnalyze,
  onApplyTechnical,
  onAddUpsellToBom,
  onAddUpsellService,
}) => {
  const [activeTab, setActiveTab] = useState<'technical' | 'commercial'>('technical');
  const [appliedTech, setAppliedTech] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [addedUpsells, setAddedUpsells] = useState<Record<string, boolean>>({});

  const audit = model.copilotAudit;

  const handleApplyTechNotes = () => {
    if (!audit?.technical) return;
    const techNotes = `[AUDITORÍA GEMINI] ${audit.technical.orientationAndAdhesion} // ${audit.technical.structuralStrength} // ${audit.technical.supportManagement} // ${audit.technical.hardwareCompatibility}`;
    onApplyTechnical(techNotes, audit.technical.suggestedBed);
    setAppliedTech(true);
    setTimeout(() => setAppliedTech(false), 4000);
  };

  const handleCopyPitch = (pitch: string) => {
    navigator.clipboard.writeText(pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 3000);
  };

  const handleAddUpsell = (upsell: {
    title: string;
    description: string;
    suggestedAddonPrice: number;
    type?: 'bom' | 'service';
    bomName?: string;
    serviceConcept?: string;
  }) => {
    if (upsell.type === 'service' || upsell.serviceConcept) {
      onAddUpsellService(upsell.serviceConcept || upsell.title, upsell.suggestedAddonPrice);
    } else {
      onAddUpsellToBom(upsell.bomName || upsell.title, upsell.suggestedAddonPrice);
    }
    setAddedUpsells((prev) => ({ ...prev, [upsell.title]: true }));
  };

  return (
    <div className="rounded-3xl bg-linear-to-br from-[#FAF7F0] via-white to-[#EADDFB]/30 border-2 border-[#6D3ACD]/30 p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* HEADER DEL CONTENEDOR COPILOT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CDC3D2]/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#350463] text-[#C0F441] flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-[#350463]">
                🧠 Copilot KiMO: Análisis Técnico y Comercial con IA
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-black uppercase font-mono tracking-wider">
                Gemini Vision
              </span>
            </div>
            <span className="text-[11px] text-[#4B4450]">
              Auditoría multimodal de geometría, riesgos en cama PEI, pricing por valor y oportunidades de upselling.
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isAnalyzing}
          onClick={onAnalyze}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-[#6D3ACD] hover:bg-[#350463] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:translate-y-0.5 disabled:opacity-50 shrink-0"
        >
          <Zap className={`w-4 h-4 text-[#C0F441] ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analizando Modelo...' : '⚡ Analizar Modelo con Gemini'}</span>
        </button>
      </div>

      {/* ESTADO DE CARGA */}
      {isAnalyzing && (
        <div className="p-6 rounded-2xl bg-[#EADDFB]/40 border border-[#6D3ACD]/30 flex flex-col items-center justify-center gap-2 text-center animate-pulse">
          <Sparkles className="w-7 h-7 text-[#6D3ACD] animate-spin" />
          <span className="text-xs font-black text-[#350463]">
            Gemini analizando geometría, riesgos de corte y potencial de mercado...
          </span>
          <span className="text-[11px] text-[#4B4450]">
            Evaluando adherencia en cama PEI, resistencia estructural e ideas de venta cruzada para CDMX
          </span>
        </div>
      )}

      {/* CONTENIDO DEL ANÁLISIS */}
      {!isAnalyzing && audit && (
        <div className="flex flex-col gap-3.5 animate-in fade-in">
          {/* SELECTOR DE PESTAÑAS */}
          <div className="flex items-center justify-between bg-[#F0EEE7] rounded-2xl p-1 border border-[#CDC3D2]/40">
            <button
              type="button"
              onClick={() => setActiveTab('technical')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'technical'
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'text-[#4B4450] hover:text-[#1C1C18]'
              }`}
            >
              <Wrench className="w-4 h-4 text-[#C0F441]" />
              <span>🔧 Recomendaciones Técnicas de Taller & Laminación</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('commercial')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'commercial'
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'text-[#4B4450] hover:text-[#1C1C18]'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-[#C0F441]" />
              <span>💼 Sugerencias de Venta, Pricing & Upselling</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* PESTAÑA 1: RECOMENDACIONES TÉCNICAS (TALLER)              */}
          {/* ======================================================== */}
          {activeTab === 'technical' && (
            <div className="flex flex-col gap-3 text-xs animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Orientación y Adhesión */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[#350463] font-black">
                    <Compass className="w-4 h-4 text-[#6D3ACD]" />
                    <span>Orientación & Adhesión en Cama:</span>
                  </div>
                  <p className="text-[11px] text-[#4B4450] leading-snug">
                    {audit.technical.orientationAndAdhesion}
                  </p>
                </div>

                {/* 2. Resistencia Estructural */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[#350463] font-black">
                    <ShieldAlert className="w-4 h-4 text-[#6D3ACD]" />
                    <span>Resistencia Estructural (Paredes & Relleno):</span>
                  </div>
                  <p className="text-[11px] text-[#4B4450] leading-snug">
                    {audit.technical.structuralStrength}
                  </p>
                </div>

                {/* 3. Gestión de Soportes */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[#350463] font-black">
                    <TreePine className="w-4 h-4 text-[#6D3ACD]" />
                    <span>Gestión de Soportes (Tree Supports):</span>
                  </div>
                  <p className="text-[11px] text-[#4B4450] leading-snug">
                    {audit.technical.supportManagement}
                  </p>
                </div>

                {/* 4. Compatibilidad de Hardware */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[#350463] font-black">
                    <Cpu className="w-4 h-4 text-[#6D3ACD]" />
                    <span>Compatibilidad de Boquilla & Capa:</span>
                  </div>
                  <p className="text-[11px] text-[#4B4450] leading-snug">
                    {audit.technical.hardwareCompatibility}
                  </p>
                </div>
              </div>

              {/* Botón de acción rápida: Aplicar al Cotizador */}
              <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#6D3ACD]/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="text-[11px] text-[#4B4450] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#86B100] shrink-0" />
                  <span>
                    Inserta las recomendaciones en las <strong>Notas de Manufactura</strong> para que aparezcan en el <strong>Job Ticket del Taller</strong>.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleApplyTechNotes}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    appliedTech
                      ? 'bg-[#C0F441] text-[#2E3F00]'
                      : 'bg-[#350463] hover:bg-[#4C237A] text-white'
                  }`}
                >
                  {appliedTech ? (
                    <>
                      <Check className="w-4 h-4 text-[#2E3F00]" />
                      <span>¡Parámetros y Notas Aplicados!</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 text-[#C0F441]" />
                      <span>Aplicar Parámetros Sugeridos al Cotizador</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 2: ESTRATEGIA COMERCIAL & UPSELLING (NEGOCIO)     */}
          {/* ======================================================== */}
          {activeTab === 'commercial' && (
            <div className="flex flex-col gap-3 text-xs animate-in fade-in">
              {/* Tarjeta de Rango de Precio Sugerido por Valor Percibido */}
              <div className="p-4 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#4B4450] uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#6D3ACD]" />
                    <span>Rango de Precio Sugerido por Valor Percibido (CDMX):</span>
                  </span>
                  <div className="text-base font-black text-[#350463] font-mono">
                    {audit.commercial.suggestedPriceRange}
                  </div>
                  <p className="text-[11px] text-[#4B4450] leading-snug">
                    {audit.commercial.perceivedValueExplanation}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-center shrink-0">
                  <span className="text-[10px] text-[#4B4450] block font-medium">Nicho Objetivo:</span>
                  <span className="font-bold text-xs text-[#6D3ACD] block mt-0.5 max-w-[200px] leading-tight">
                    {audit.commercial.targetNiche}
                  </span>
                </div>
              </div>

              {/* Ideas de Valor Agregado (Upselling) */}
              <div className="flex flex-col gap-2">
                <span className="font-black text-xs text-[#350463] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#6D3ACD]" />
                  <span>Oportunidades de Venta Cruzada (Upselling) para Elevar Ticket:</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {audit.commercial.upsellingOpportunities.map((upsell, uIdx) => {
                    const isAdded = !!addedUpsells[upsell.title];
                    return (
                      <div
                        key={uIdx}
                        className="p-3 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-xs text-[#350463] truncate">
                              {upsell.title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-[#C0F441]/40 text-[#2E3F00] font-mono font-black text-[10px]">
                              +${upsell.suggestedAddonPrice}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#4B4450] leading-snug">
                            {upsell.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddUpsell(upsell)}
                          className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isAdded
                              ? 'bg-[#E5E2DB] text-[#4B4450] cursor-default'
                              : 'bg-[#EADDFB] hover:bg-[#6D3ACD] hover:text-white text-[#350463]'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#2E3F00]" />
                              <span>Agregado a Cotización</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar a {upsell.type === 'service' ? 'Servicios' : 'BOM'} (+${upsell.suggestedAddonPrice})</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pitch de Venta para WhatsApp / Propuesta */}
              <div className="p-3.5 rounded-2xl bg-[#EADDFB]/30 border border-[#6D3ACD]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-[#350463] uppercase tracking-wider flex items-center gap-1 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#6D3ACD]" />
                    <span>Pitch Comercial para WhatsApp / Propuesta Cliente:</span>
                  </span>
                  <p className="text-xs font-semibold text-[#350463] italic leading-snug">
                    "{audit.commercial.salesPitch}"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyPitch(audit.commercial.salesPitch)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#6D3ACD]/40 text-[#350463] text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  {copiedPitch ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E3F00]" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#6D3ACD]" />
                      <span>Copiar Frase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
