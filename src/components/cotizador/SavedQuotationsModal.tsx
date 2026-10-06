import React, { useState, useMemo } from 'react';
import { SavedQuotation, QuotationStatus } from '../../types';
import {
  X,
  Search,
  FileText,
  Rocket,
  Edit3,
  Calendar,
  Clock,
  Package,
  Layers,
  CheckCircle2,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Sparkles,
  DollarSign,
  Palette,
  Eye,
  AlertCircle,
  Globe,
} from 'lucide-react';

interface SavedQuotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: SavedQuotation[];
  onEdit: (quote: SavedQuotation) => void;
  onLaunchToWorkshop: (quote: SavedQuotation) => void;
  onViewPdf: (quote: SavedQuotation) => void;
  onDuplicate?: (quote: SavedQuotation) => void;
  onDelete?: (quoteId: string) => void;
}

type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'three_months';
type SortOption = 'recent' | 'highest_amount' | 'client_az';

export const SavedQuotationsModal: React.FC<SavedQuotationsModalProps> = ({
  isOpen,
  onClose,
  quotations,
  onEdit,
  onLaunchToWorkshop,
  onViewPdf,
  onDuplicate,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [expandedQuoteIds, setExpandedQuoteIds] = useState<Record<string, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedQuoteIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Counts for status tabs
  const counts = useMemo(() => {
    const all = quotations.length;
    const drafts = quotations.filter((q) => q.status === 'Borrador').length;
    const sent = quotations.filter((q) => q.status === 'Enviada').length;
    const workshop = quotations.filter(
      (q) => q.status === 'En Producción' || q.status === 'Enviada a Taller'
    ).length;
    const webRequests = quotations.filter((q) => q.status === 'Nueva Solicitud Web (Por Revisar)').length;
    return { all, drafts, sent, workshop, webRequests };
  }, [quotations]);

  // Filtered & Sorted Quotations
  const processedQuotes = useMemo(() => {
    const now = new Date();
    const query = searchQuery.trim().toLowerCase();

    return quotations
      .filter((q) => {
        // 1. Reactive Search by Folio, Client, Project, or Materials used
        const modelsList = q.models || [];
        const materialsUsed = modelsList
          .flatMap((m) => (m.amsSlots || []).map((s) => `${s.material} ${s.name}`))
          .join(' ')
          .toLowerCase();

        const matchesQuery =
          !query ||
          q.folio.toLowerCase().includes(query) ||
          q.clientName.toLowerCase().includes(query) ||
          q.projectName.toLowerCase().includes(query) ||
          (q.date && q.date.toLowerCase().includes(query)) ||
          materialsUsed.includes(query);

        if (!matchesQuery) return false;

        // 2. Status Tab Filter
        if (selectedStatusTab === 'drafts' && q.status !== 'Borrador') return false;
        if (selectedStatusTab === 'sent' && q.status !== 'Enviada') return false;
        if (selectedStatusTab === 'web' && q.status !== 'Nueva Solicitud Web (Por Revisar)') return false;
        if (
          selectedStatusTab === 'workshop' &&
          q.status !== 'En Producción' &&
          q.status !== 'Enviada a Taller'
        )
          return false;

        // 3. Date Range Filter
        if (dateRange !== 'all') {
          const createdAt = q.createdAt ? new Date(q.createdAt) : null;
          if (createdAt) {
            const diffMs = now.getTime() - createdAt.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (dateRange === 'today' && diffDays > 1) return false;
            if (dateRange === 'week' && diffDays > 7) return false;
            if (dateRange === 'month' && diffDays > 30) return false;
            if (dateRange === 'three_months' && diffDays > 90) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // 4. Sort Options
        if (sortBy === 'highest_amount') {
          return (b.total || 0) - (a.total || 0);
        }
        if (sortBy === 'client_az') {
          return a.clientName.localeCompare(b.clientName);
        }
        // Default: most recent first
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [quotations, searchQuery, selectedStatusTab, dateRange, sortBy]);

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'Nueva Solicitud Web (Por Revisar)':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD700]/30 text-[#854D0E] border border-[#CA8A04]/40 animate-pulse">
            <Globe className="w-3 h-3 text-[#B45309]" />
            <span>🌐 Solicitud Web (Por Revisar)</span>
          </span>
        );
      case 'En Producción':
      case 'Enviada a Taller':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C0F441] text-[#2E3F00] border border-[#A7DB28]">
            <Rocket className="w-3 h-3 text-[#2E3F00]" />
            <span>En Producción / Taller</span>
          </span>
        );
      case 'Enviada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EADDFB] text-[#4C237A] border border-[#6D3ACD]/30">
            <FileText className="w-3 h-3" />
            <span>Enviada al Cliente</span>
          </span>
        );
      case 'Borrador':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F0] text-[#7A6A50] border border-[#CDC3D2]">
            <span>📝 Borrador</span>
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-5xl bg-white h-screen shadow-2xl border-l border-[#EADDFB] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAWER HEADER */}
        <div className="p-4 sm:p-5 px-6 border-b border-[#F0EEE7] flex items-center justify-between bg-gradient-to-r from-[#FAF7F0] via-white to-[#F3EEFA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#350463] text-[#C0F441] flex items-center justify-center font-bold text-lg shadow-sm">
              📂
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#350463]">
                  Carpeta Inteligente de Cotizaciones
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] text-[10px] font-bold font-mono">
                  {quotations.length} {quotations.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <span className="text-xs text-[#4B4450]">
                Explorador con filtros temporales, desglose colapsable por modelo y duplicación rápida.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#4B4450] hover:text-[#BA1A1A] hover:bg-[#FFDAD6]/50 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA SUPERIOR DE BÚSQUEDA Y FILTROS RÁPIDOS */}
        <div className="p-4 px-6 bg-white border-b border-[#F0EEE7] flex flex-col gap-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Buscador reactivo */}
            <div className="relative flex-1 min-w-[260px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por folio (COTZ-...), cliente, proyecto o materiales..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2] text-xs font-medium text-[#1C1C18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]"
              />
              <Search className="w-4 h-4 text-[#6D3ACD] absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-1 text-[#4B4450] hover:text-[#BA1A1A] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Selectores Secundarios: Rango Temporal & Ordenamiento */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Rango Temporal */}
              <div className="flex items-center gap-1.5 bg-[#FAF7F0] px-2.5 py-1.5 rounded-xl border border-[#CDC3D2]/40 text-xs text-[#4B4450]">
                <Calendar className="w-3.5 h-3.5 text-[#6D3ACD]" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
                  className="bg-transparent font-bold text-[#350463] focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all">📅 Fecha: Todas</option>
                  <option value="today">Hoy</option>
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mes</option>
                  <option value="three_months">Últimos 3 meses</option>
                </select>
              </div>

              {/* Ordenamiento */}
              <div className="flex items-center gap-1.5 bg-[#FAF7F0] px-2.5 py-1.5 rounded-xl border border-[#CDC3D2]/40 text-xs text-[#4B4450]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#6D3ACD]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent font-bold text-[#350463] focus:outline-none cursor-pointer text-xs"
                >
                  <option value="recent">⇅ Más Recientes</option>
                  <option value="highest_amount">Mayor Importe ($)</option>
                  <option value="client_az">Cliente A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pestañas de Estatus (Segmented Control) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1 rounded-2xl border border-[#CDC3D2]/50 text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatusTab('all')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                  selectedStatusTab === 'all'
                    ? 'bg-[#350463] text-white shadow-xs'
                    : 'text-[#4B4450] hover:bg-[#EADDFB]'
                }`}
              >
                <span>Todas</span>
                <span className="font-mono text-[10px] opacity-80">({counts.all})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusTab('drafts')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                  selectedStatusTab === 'drafts'
                    ? 'bg-[#350463] text-white shadow-xs'
                    : 'text-[#4B4450] hover:bg-[#EADDFB]'
                }`}
              >
                <span>📝 Borradores</span>
                <span className="font-mono text-[10px] opacity-80">({counts.drafts})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusTab('sent')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                  selectedStatusTab === 'sent'
                    ? 'bg-[#350463] text-white shadow-xs'
                    : 'text-[#4B4450] hover:bg-[#EADDFB]'
                }`}
              >
                <span>📤 Enviadas</span>
                <span className="font-mono text-[10px] opacity-80">({counts.sent})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusTab('web')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                  selectedStatusTab === 'web'
                    ? 'bg-[#854D0E] text-[#FEF08A] shadow-xs'
                    : 'text-[#854D0E] hover:bg-[#FEF08A]/50 bg-[#FEF08A]/20'
                }`}
              >
                <span>🌐 Solicitudes Web</span>
                <span className="font-mono text-[10px] font-black">({counts.webRequests})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusTab('workshop')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                  selectedStatusTab === 'workshop'
                    ? 'bg-[#350463] text-white shadow-xs'
                    : 'text-[#4B4450] hover:bg-[#EADDFB]'
                }`}
              >
                <span>🚀 Aprobadas / En Taller</span>
                <span className="font-mono text-[10px] opacity-80">({counts.workshop})</span>
              </button>
            </div>

            <span className="text-xs font-mono font-bold text-[#4C237A] bg-[#EADDFB] px-3 py-1 rounded-full border border-[#6D3ACD]/30">
              Mostrando {processedQuotes.length} de {quotations.length}
            </span>
          </div>
        </div>

        {/* LISTADO DE COTIZACIONES OPTIMIZADO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FAF7F0]/30">
          {processedQuotes.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2.5">
              <span className="text-4xl">📂</span>
              <span className="font-bold text-sm text-[#350463]">
                No se encontraron cotizaciones con los filtros actuales
              </span>
              <span className="text-xs text-[#4B4450] max-w-md">
                Prueba borrando el término de búsqueda o seleccionando otra pestaña de estatus o rango temporal.
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusTab('all');
                  setDateRange('all');
                }}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2] text-[#350463] font-bold text-xs hover:bg-[#F0EEE7] cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            processedQuotes.map((quote) => {
              const modelsList = quote.models || [];
              const totalPieces =
                quote.totalPieces ||
                modelsList.reduce((sum, m) => sum + (m.clientQty || 0), 0);
              const totalHours =
                quote.totalHours ||
                modelsList.reduce((sum, m) => sum + (m.printHours || 0), 0);
              const isExpanded = !!expandedQuoteIds[quote.id];

              return (
                <div
                  key={quote.id}
                  className="rounded-2xl bg-white border border-[#CDC3D2]/50 hover:border-[#6D3ACD] shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Fila Principal del Registro */}
                  <div className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Botón expandir + Datos clave */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleExpand(quote.id)}
                        className="p-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#EADDFB] text-[#6D3ACD] mt-0.5 transition-transform duration-200 cursor-pointer"
                        title={isExpanded ? 'Ocultar miniaturas' : 'Ver miniaturas y materiales'}
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-[#350463]' : ''
                          }`}
                        />
                      </button>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#350463] bg-[#EADDFB] px-2.5 py-0.5 rounded-lg border border-[#6D3ACD]/30">
                            {quote.folio}
                          </span>
                          {getStatusBadge(quote.status)}
                          <span className="text-[11px] text-[#4B4450] flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-[#6D3ACD]" />
                            <span>{quote.date || 'Reciente'}</span>
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-[#1C1C18] truncate">
                          {quote.projectName}
                        </h3>

                        <div className="text-xs text-[#4B4450] flex flex-wrap items-center gap-x-4 gap-y-0.5">
                          <span>
                            Cliente: <strong className="text-[#1C1C18]">{quote.clientName}</strong>
                          </span>
                          {quote.clientContact && (
                            <span className="text-[11px] text-[#7A6A50]">
                              • Contacto: {quote.clientContact}
                            </span>
                          )}
                        </div>

                        {/* Badges de especificación cuantitativa */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#4B4450] font-mono flex items-center gap-1">
                            <Layers className="w-3 h-3 text-[#6D3ACD]" />
                            <span>{modelsList.length} {modelsList.length === 1 ? 'modelo' : 'modelos'}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#4B4450] font-mono flex items-center gap-1">
                            <Package className="w-3 h-3 text-[#6D3ACD]" />
                            <span>{totalPieces} pzs totales</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#4B4450] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#6D3ACD]" />
                            <span>{totalHours.toFixed(1)}h taller</span>
                          </span>
                          {quote.total > 0 && (
                            <span className="font-mono font-black text-xs text-[#2E3F00] bg-[#C0F441] px-2.5 py-0.5 rounded-lg shadow-2xs">
                              ${quote.total.toFixed(2)} MXN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones Clave por Registro */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F0EEE7]">
                      {/* [ ✏️ Abrir y Editar ] */}
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(quote);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EADDFB] text-[#350463] border border-[#CDC3D2] font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs"
                        title="Cargar inmediatamente todos los datos en el configurador activo"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#6D3ACD]" />
                        <span>✏️ Editar</span>
                      </button>

                      {/* [ 🚀 Lanzar a Taller ] */}
                      <button
                        type="button"
                        onClick={() => {
                          onLaunchToWorkshop(quote);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#350463] hover:bg-[#240A44] text-white font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="Envía la orden a 'En Cola' del taller con ficha técnica y pasa a producción"
                      >
                        <Rocket className="w-3.5 h-3.5 text-[#C0F441]" />
                        <span>🚀 A Taller</span>
                      </button>

                      {/* [ 📄 Ver PDF ] */}
                      <button
                        type="button"
                        onClick={() => {
                          onViewPdf(quote);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C0F441] hover:bg-[#aee02d] text-[#2E3F00] font-black text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="Abre directamente la previsualización del documento comercial"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>📄 Ver PDF</span>
                      </button>

                      {/* [ 📋 Duplicar ] */}
                      {onDuplicate && (
                        <button
                          type="button"
                          onClick={() => onDuplicate(quote)}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F0] text-[#4B4450] hover:text-[#350463] border border-[#CDC3D2] font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs"
                          title="Duplicar cotización con nuevo folio para cliente recurrente"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#6D3ACD]" />
                          <span>Duplicar</span>
                        </button>
                      )}

                      {/* [ 🗑️ Archivar / Eliminar ] */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(quote.id)}
                          className="p-2 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded-xl transition-colors cursor-pointer"
                          title="Eliminar cotización"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DESGLOSE COLAPSABLE RÁPIDO (MINIATURAS Y MATERIALES INCLUIDOS) */}
                  {isExpanded && (
                    <div className="px-5 py-3.5 bg-[#FAF7F0] border-t border-[#E5E2DB] flex flex-col gap-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#350463] flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-[#6D3ACD]" />
                          <span>Partidas y Materiales en esta Cotización:</span>
                        </span>
                        <span className="text-[10px] text-[#4B4450]">
                          Flete asignado: <strong>${(quote.deliveryCost || 0).toFixed(2)} MXN</strong> ({quote.deliveryType || 'Recolección'})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {modelsList.map((m, mIdx) => (
                          <div
                            key={m.id || mIdx}
                            className="p-2.5 rounded-xl bg-white border border-[#CDC3D2]/50 shadow-2xs flex flex-col justify-between gap-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-[#350463] text-xs truncate">
                                #{mIdx + 1}. {m.pieceTitle}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-[#6D3ACD] bg-[#EADDFB] px-1.5 py-0.2 rounded">
                                {m.clientQty} pzs
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {(m.amsSlots || []).map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[10px] text-[#4B4450]"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 border border-black/20"
                                    style={{ backgroundColor: s.colorHex }}
                                  />
                                  <span>{s.material}</span>
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-[#4B4450] pt-1 border-t border-[#F0EEE7]">
                              <span>⏱️ {m.printHours}h ({m.platesCount || 1} cama{m.platesCount !== 1 ? 's' : ''})</span>
                              <span className="font-mono font-bold text-[#350463]">Margen: {m.desiredMarginPercent || 25}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Insumos BOM y servicios extras si los hay */}
                      {((quote.bomItems && quote.bomItems.length > 0) || (quote.customServices && quote.customServices.length > 0)) && (
                        <div className="pt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-[#4B4450]">
                          {quote.bomItems && quote.bomItems.length > 0 && (
                            <span>
                              📦 Insumos BOM: <strong>{quote.bomItems.map((b) => `${b.quantity}x ${b.name}`).join(', ')}</strong>
                            </span>
                          )}
                          {quote.customServices && quote.customServices.length > 0 && (
                            <span>
                              🛠️ Acabados: <strong>{quote.customServices.map((s) => s.name || s.concept).join(', ')}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diálogo de confirmación de eliminación inline */}
                  {deleteConfirmId === quote.id && (
                    <div className="p-3 px-5 bg-[#FFF3E0] border-t-2 border-[#FFB74D] flex items-center justify-between text-xs text-[#E65100] animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#E65100]" />
                        <span>¿Confirmas eliminar la cotización <strong>{quote.folio}</strong> ({quote.clientName})? Esta acción no se puede deshacer.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#CDC3D2] text-[#4B4450] font-bold hover:bg-[#F0EEE7] cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onDelete) onDelete(quote.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#BA1A1A] text-white font-bold hover:bg-[#93000A] cursor-pointer shadow-2xs"
                        >
                          Sí, Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 px-6 bg-[#FAF7F0] border-t border-[#F0EEE7] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#4B4450]">
          <span>
            💡 <em>Usa el botón <strong>[ 📋 Duplicar ]</strong> para generar una nueva cotización con folio único conservando todas las piezas y materiales.</em>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-[#CDC3D2] text-[#1C1C18] font-bold hover:bg-[#F0EEE7] cursor-pointer transition-all shadow-2xs"
          >
            Cerrar Explorador
          </button>
        </div>
      </div>
    </div>
  );
};
