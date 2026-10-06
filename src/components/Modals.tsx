import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { FilamentSpool, KanbanOrder, FailureAudit, WarehouseSupplyItem, PurchaseRecord } from '../types';
import {
  AlertTriangle,
  Scale,
  DollarSign,
  X,
  CheckCircle,
  Recycle,
  Search,
  ChevronDown,
  Check,
  Sparkles,
  Paperclip,
  Upload,
  CreditCard,
  FileText,
  ExternalLink,
  Edit3,
  ShoppingCart,
  Plus,
  Trash2,
  Image as ImageIcon,
  History,
  Calendar,
  Layers,
  Tag,
} from 'lucide-react';

interface FailureModalProps {
  order?: KanbanOrder | null;
  onClose: () => void;
}

export const FailureModal: React.FC<FailureModalProps> = ({ order, onClose }) => {
  const { filaments, orders, reportFailure } = useWorkshop();

  const [orderSearchQuery, setOrderSearchQuery] = useState(order?.folio || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<KanbanOrder | null>(order || null);

  const [orderFolio, setOrderFolio] = useState(order?.folio || 'COTZ-0018');
  const [itemTitle, setItemTitle] = useState(order?.title || 'Juego de Macetas Facetadas KIMO');
  const [cause, setCause] = useState<FailureAudit['cause']>('Warping / Adhesión');
  const [gramsLost, setGramsLost] = useState(
    order
      ? Math.max(10, Math.round(order.filamentUsedGrams * ((order.progressPercent || 50) / 100))).toString()
      : '115'
  );
  const [selectedSpoolId, setSelectedSpoolId] = useState(
    order?.filamentSpoolIds?.[0] || filaments[0]?.id || ''
  );
  const [actionTaken, setActionTaken] = useState(
    'Cama PEI lavada con agua tibia, desengrasada con alcohol isopropílico y recalibrada altura Z.'
  );

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered orders for predictive search
  const filteredOrders = useMemo(() => {
    const query = orderSearchQuery.toLowerCase().trim();
    if (!query) return orders.slice(0, 5);
    return orders.filter(
      (o) =>
        o.folio.toLowerCase().includes(query) ||
        o.clientName.toLowerCase().includes(query) ||
        o.title.toLowerCase().includes(query)
    );
  }, [orders, orderSearchQuery]);

  // Handle selecting an order from predictive combobox
  const handleSelectOrder = (selected: KanbanOrder) => {
    setSelectedOrder(selected);
    setOrderFolio(selected.folio);
    setOrderSearchQuery(selected.folio);
    setItemTitle(selected.title);

    // Auto-select spool from order filaments or find best match
    if (selected.filamentSpoolIds && selected.filamentSpoolIds.length > 0) {
      const match = filaments.find((f) => selected.filamentSpoolIds.includes(f.id));
      if (match) {
        setSelectedSpoolId(match.id);
      } else {
        setSelectedSpoolId(selected.filamentSpoolIds[0]);
      }
    } else if (filaments.length > 0) {
      setSelectedSpoolId(filaments[0].id);
    }

    // Auto-suggest grams lost based on print progress
    const progress = selected.progressPercent > 0 ? selected.progressPercent : 50;
    const estimatedLost = Math.max(10, Math.round(selected.filamentUsedGrams * (progress / 100)));
    setGramsLost(estimatedLost.toString());

    setIsSearchOpen(false);
  };

  const selectedSpool = filaments.find((f) => f.id === selectedSpoolId) || filaments[0];
  const parsedGrams = parseFloat(gramsLost) || 0;
  const estimatedCost = (parsedGrams * (selectedSpool?.costPerGram || 0.28)).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportFailure({
      orderFolio,
      itemTitle,
      cause,
      gramsLost: parsedGrams,
      spoolId: selectedSpoolId,
      actionTaken,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center font-bold shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#350463]">
                Reportar Falla / Merma de Taller
              </h3>
              <span className="text-[11px] text-[#4B4450]">
                Auditoría de desperdicio y descuento automático en rack
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Fila Superior de Métricas Rápidas (Master KPI Strip) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#FFDAD6]/40 border border-[#FFCDD2]">
              <span className="text-[10px] text-[#BA1A1A] uppercase font-bold block truncate">Costo Absorbido</span>
              <span className="text-xl font-extrabold text-[#BA1A1A] font-mono">
                -${estimatedCost} MXN
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB]">
              <span className="text-[10px] text-[#4B4450] uppercase font-bold block truncate">Gramos Perdidos</span>
              <span className="text-xl font-extrabold text-[#1C1C18] font-mono">
                {parsedGrams}g
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#C0F441]/30 border border-[#C0F441]/50">
              <span className="text-[10px] text-[#2E3F00] uppercase font-bold block truncate">Recuperación Eco</span>
              <span className="text-xl font-extrabold text-[#2E3F00] font-mono">
                ~{Math.round(parsedGrams * 0.85)}g (85%)
              </span>
            </div>
          </div>

          <form id="failure-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* REQUIREMENT 3: COMBOBOX / BUSCADOR PREDICTIVO INTELIGENTE */}
            <div className="relative" ref={searchContainerRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#1C1C18] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#350463]" />
                  <span>Buscador Predictivo de Orden (Folio o Cliente)</span>
                </label>
                {selectedOrder && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#6D3ACD]" /> Vinculada
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={orderSearchQuery}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setOrderSearchQuery(e.target.value);
                    setOrderFolio(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Escribe folio (ej. COTZ-0018) o cliente (ej. Maceta, Paty)..."
                  className="w-full px-3 py-2 pl-9 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#350463] focus:outline-none focus:border-[#6D3ACD] focus:ring-2 focus:ring-[#6D3ACD]/20 transition-all"
                />
                <Search className="w-4 h-4 text-[#4B4450] absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B4450] hover:text-[#1C1C18]"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* PREDICTIVE RESULTS DROPDOWN */}
              {isSearchOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-[#CDC3D2]/40 max-h-56 overflow-y-auto z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[#4B4450] tracking-wider border-b border-[#F0EEE7]">
                    Órdenes en Taller ({filteredOrders.length})
                  </div>
                  {filteredOrders.length === 0 ? (
                    <div className="p-3 text-center text-[#4B4450] text-[11px]">
                      No se encontraron órdenes coincidentes. Puedes usar este folio manual.
                    </div>
                  ) : (
                    filteredOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => handleSelectOrder(ord)}
                        className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                          orderFolio === ord.folio
                            ? 'bg-[#EADDFB] text-[#350463]'
                            : 'hover:bg-[#FAF7F0] text-[#1C1C18]'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-[#350463]">{ord.folio}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white font-bold text-[#4B4450] border border-[#CDC3D2]/30">
                              {ord.status}
                            </span>
                          </div>
                          <span className="font-bold text-[11px] truncate text-[#1C1C18]">{ord.title}</span>
                          <span className="text-[10px] text-[#4B4450] truncate">{ord.clientName}</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold block text-[#6D3ACD]">
                            {ord.progressPercent}% avance
                          </span>
                          <span className="text-[10px] text-[#4B4450] font-mono">
                            {ord.filamentUsedGrams}g tot.
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Smart Auto-fill info banner */}
              {selectedOrder && (
                <div className="mt-1.5 p-2 rounded-xl bg-[#FAF7F0] border border-[#E5E2DB] flex items-center justify-between text-[11px] text-[#4B4450]">
                  <span>
                    Cliente: <strong className="text-[#1C1C18]">{selectedOrder.clientName}</strong>
                  </span>
                  <span className="text-[#350463] font-bold">
                    Avance: {selectedOrder.progressPercent}% • {selectedOrder.filamentUsedGrams}g est.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Folio Confirmado</label>
                <input
                  type="text"
                  value={orderFolio}
                  onChange={(e) => setOrderFolio(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#350463] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Pieza Afectada</label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Causa de Falla</label>
                <select
                  value={cause}
                  onChange={(e) => setCause(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-bold text-[#350463] focus:outline-none"
                >
                  <option value="Warping / Adhesión">Warping / Adhesión</option>
                  <option value="Atasco / Boquilla">Atasco / Boquilla</option>
                  <option value="Capa desplazada">Capa desplazada</option>
                  <option value="Corte de luz / Térmico">Corte de luz / Térmico</option>
                  <option value="Otro">Otro defecto</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#1C1C18]">Gramos Perdidos</label>
                  {selectedOrder && (
                    <span className="text-[10px] text-[#6D3ACD] font-bold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Sugerido p/avance
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={gramsLost}
                  onChange={(e) => setGramsLost(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#BA1A1A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1C1C18] block mb-1">
                Bobina Afectada (Descontar Gramos)
              </label>
              <select
                value={selectedSpoolId}
                onChange={(e) => setSelectedSpoolId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
              >
                {filaments.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.gramsRemaining}g disponibles - ${f.costPerGram}/g)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#1C1C18] block mb-1">Acción Correctiva Realizada</label>
              <textarea
                rows={2}
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* Barra Inferior Fija del Drawer (Sticky Footer) */}
        <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-[#4B4450] font-medium truncate max-w-[200px] sm:max-w-[240px]">
            Descuento de {parsedGrams}g en rack
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#F0EEE7] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="failure-form"
              className="px-4 py-2 rounded-xl bg-[#BA1A1A] hover:bg-[#93000A] text-white font-bold text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Confirmar Falla</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ScaleCalibrationModalProps {
  spool: FilamentSpool;
  onClose: () => void;
}

export const ScaleCalibrationModal: React.FC<ScaleCalibrationModalProps> = ({ spool, onClose }) => {
  const { calibrateSpoolWeight } = useWorkshop();

  const [grossWeight, setGrossWeight] = useState(
    (spool.gramsRemaining + spool.spoolTareGrams).toFixed(0)
  );
  const [tareGrams, setTareGrams] = useState(spool.spoolTareGrams.toString());

  const parsedGross = parseFloat(grossWeight) || 0;
  const parsedTare = parseFloat(tareGrams) || 0;
  // Requirement: Input "Peso Bruto en Báscula (g)" - "Tara del Carrete: [ 180 ] g (editable)" = "Gramos Netos Disponibles"
  const netGrams = Math.max(0, parsedGross - parsedTare);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    calibrateSpoolWeight(spool.id, parsedGross, parsedTare);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#C0F441] text-[#2E3F00] flex items-center justify-center shadow-xs">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#350463]">Pesar en Báscula Digital</h3>
                <span className="text-[11px] text-[#4B4450] font-mono">{spool.sku} • {spool.name}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="text-xs text-[#4B4450]">
              Coloca el carrete físico con su bobina plástica sobre la báscula digital del taller KiMO para descontar la tara y calibrar gramos netos:
            </div>

            {/* Calculation display */}
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#4B4450]">Peso Bruto de Báscula:</span>
                <strong className="font-mono text-sm text-[#350463]">{parsedGross} g</strong>
              </div>
              <div className="flex justify-between items-center text-[#BA1A1A]">
                <span>Tara del Carrete (Plástico):</span>
                <strong className="font-mono text-sm">-{parsedTare} g</strong>
              </div>
              <div className="pt-2 border-t border-[#E5E2DB] flex justify-between items-center text-sm">
                <span className="font-bold text-[#350463]">Gramos Netos Disponibles:</span>
                <span className="font-black font-mono text-base text-[#2E3F00] bg-[#C0F441] px-3 py-1 rounded-xl shadow-xs">
                  {netGrams.toFixed(1)} g
                </span>
              </div>
            </div>

            <form id="scale-form" onSubmit={handleConfirm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">
                    Peso Bruto Báscula (g)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-base text-[#350463] text-center focus:outline-none focus:border-[#6D3ACD]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">
                    Tara Carrete (g)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={tareGrams}
                    onChange={(e) => setTareGrams(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-base text-[#BA1A1A] text-center focus:outline-none focus:border-[#6D3ACD]"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sticky Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-[#4B4450] font-bold text-xs hover:bg-[#F0EEE7] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="scale-form"
            className="px-5 py-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-extrabold text-xs shadow-xs cursor-pointer active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirmar Calibración</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================================
// MODAL: HISTORIAL DE ADQUISICIONES & REABASTECIMIENTO (REQ 4)
// ========================================================
interface PurchaseHistoryModalProps {
  itemType: 'filament' | 'supply';
  filament?: FilamentSpool | null;
  supply?: WarehouseSupplyItem | null;
  onClose: () => void;
}

export const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({
  itemType,
  filament,
  supply,
  onClose,
}) => {
  const { addFilamentPurchase, restockWarehouseSupply } = useWorkshop();

  const [showRestockForm, setShowRestockForm] = useState(false);
  const [restockDate, setRestockDate] = useState(new Date().toISOString().split('T')[0]);
  const [restockQuantity, setRestockQuantity] = useState(itemType === 'filament' ? '1' : '10');
  const [restockUnit, setRestockUnit] = useState(itemType === 'filament' ? 'kg' : (supply?.unit || 'piezas'));
  const [restockTotalCost, setRestockTotalCost] = useState(
    itemType === 'filament' ? (filament?.costPerKg || 280).toString() : ((supply?.cost || 10) * 10).toString()
  );
  const [restockSupplier, setRestockSupplier] = useState(
    (itemType === 'filament' ? filament?.supplier : supply?.supplier) || 'Amazon México'
  );
  const [restockUrl, setRestockUrl] = useState(
    (itemType === 'filament' ? filament?.purchaseUrl : supply?.purchaseUrl) || ''
  );
  const [restockNotes, setRestockNotes] = useState('');

  const targetTitle = itemType === 'filament' ? filament?.name : supply?.name;
  const targetSku = itemType === 'filament' ? filament?.sku : supply?.sku;
  const historyList = (itemType === 'filament' ? filament?.purchaseHistory : supply?.purchaseHistory) || [];
  const currentStock = itemType === 'filament' ? `${filament?.gramsRemaining}g` : `${supply?.stock} ${supply?.unit}`;
  const currentCost = itemType === 'filament' ? `$${filament?.costPerGram.toFixed(2)}/g ($${filament?.costPerKg.toFixed(2)}/kg)` : `$${supply?.cost.toFixed(2)}/${supply?.unit}`;
  const mainPurchaseUrl = (itemType === 'filament' ? filament?.purchaseUrl : supply?.purchaseUrl) || restockUrl;

  const parsedQty = parseFloat(restockQuantity) || 1;
  const parsedCost = parseFloat(restockTotalCost) || 0;
  const calcUnitCost = parsedQty > 0 ? (parsedCost / parsedQty).toFixed(2) : '0.00';

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemType === 'filament' && filament) {
      addFilamentPurchase(filament.id, {
        date: restockDate,
        quantity: parsedQty,
        unit: restockUnit,
        totalCost: parsedCost,
        unitCost: parseFloat(calcUnitCost) || 0,
        supplier: restockSupplier,
        purchaseUrl: restockUrl,
        notes: restockNotes,
      });
    } else if (itemType === 'supply' && supply) {
      restockWarehouseSupply(supply.id, {
        date: restockDate,
        quantity: parsedQty,
        unit: restockUnit,
        totalCost: parsedCost,
        unitCost: parseFloat(calcUnitCost) || 0,
        supplier: restockSupplier,
        purchaseUrl: restockUrl,
        notes: restockNotes,
      });
    }
    setShowRestockForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center font-bold text-lg shadow-xs">
                <History className="w-6 h-6 text-[#6D3ACD]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-[#350463]">
                    Historial de Adquisiciones & Reabastecimiento
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#4B4450] mt-0.5">
                  <span className="font-mono font-bold text-[#6D3ACD]">{targetSku}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#1C1C18] truncate max-w-[280px]">{targetTitle}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB]">
              <span className="text-[10px] text-[#4B4450] uppercase font-bold block truncate">Stock en Taller</span>
              <span className="text-base sm:text-lg font-black text-[#1C1C18] font-mono">{currentStock}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#EADDFB]/30 border border-[#6D3ACD]/30">
              <span className="text-[10px] text-[#350463] uppercase font-bold block truncate">Costo Promedio</span>
              <span className="text-xs sm:text-sm font-bold text-[#350463] font-mono block mt-1 truncate">{currentCost}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#C0F441]/30 border border-[#C0F441]/50 flex flex-col justify-between">
              <span className="text-[10px] text-[#2E3F00] uppercase font-bold block truncate">Enlace a Tienda</span>
              {mainPurchaseUrl ? (
                <a
                  href={mainPurchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-black text-[#2E3F00] hover:underline"
                >
                  <span>🔗 Abrir Producto</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[11px] text-[#7A6A50] italic">Sin URL asignada</span>
              )}
            </div>
          </div>

          {/* TABLA DE COMPRAS HISTÓRICAS */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-[#350463] uppercase tracking-wider flex items-center gap-1.5">
                <span>Registros de Compra Pasados</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F0] text-[#4B4450] font-mono font-bold">
                  {historyList.length}
                </span>
              </h4>
            </div>

            {historyList.length === 0 ? (
              <div className="p-6 text-center bg-[#FAF7F0] rounded-2xl border border-dashed border-[#CDC3D2] text-xs text-[#4B4450]">
                No hay compras previas registradas. ¡Haz clic en el botón de abajo para registrar la primera entrada!
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#CDC3D2]/40 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F0] text-[#4B4450] text-[11px] font-bold uppercase tracking-wider border-b border-[#CDC3D2]/40">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Cantidad</th>
                      <th className="py-2.5 px-3">Costo Total</th>
                      <th className="py-2.5 px-3">Costo Unitario</th>
                      <th className="py-2.5 px-3">Proveedor</th>
                      <th className="py-2.5 px-3 text-right">Enlace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEE7]">
                    {historyList.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#1C1C18] whitespace-nowrap">
                          {rec.date}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#350463]">
                          {rec.quantity} {rec.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1C1C18]">
                          ${rec.totalCost.toFixed(2)} MXN
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#2E3F00] font-bold">
                          ${rec.unitCost.toFixed(2)}/{rec.unit === 'kg' ? 'kg' : 'pza'}
                        </td>
                        <td className="py-2.5 px-3 text-[#4B4450] font-medium">
                          {rec.supplier || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {rec.purchaseUrl ? (
                            <a
                              href={rec.purchaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EADDFB] hover:bg-[#6D3ACD] hover:text-white text-[#350463] font-bold text-[11px] transition-colors"
                            >
                              <span>🔗 Ir al Producto</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[#CDC3D2] text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FORMULARIO DE REABASTECIMIENTO / NUEVA COMPRA */}
          {showRestockForm ? (
            <form onSubmit={handleRestockSubmit} className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#6D3ACD]/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#CDC3D2]/30">
                <span className="font-extrabold text-xs text-[#350463] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#6D3ACD]" />
                  <span>Registrar Nueva Compra / Reabastecimiento</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowRestockForm(false)}
                  className="text-xs text-[#4B4450] hover:text-[#1C1C18] font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">Fecha de Compra</label>
                  <input
                    type="date"
                    value={restockDate}
                    onChange={(e) => setRestockDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2] font-semibold text-[#1C1C18] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">
                    Cantidad ({restockUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2] font-mono font-bold text-[#350463] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">Costo Total ($ MXN)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={restockTotalCost}
                    onChange={(e) => setRestockTotalCost(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2] font-mono font-bold text-[#1C1C18] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">Tienda / Proveedor</label>
                  <input
                    type="text"
                    value={restockSupplier}
                    onChange={(e) => setRestockSupplier(e.target.value)}
                    placeholder="ej. Amazon, Mercado Libre, ColorPlus"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2] font-semibold text-[#1C1C18] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">URL / Enlace de Compra</label>
                  <input
                    type="url"
                    value={restockUrl}
                    onChange={(e) => setRestockUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2] text-[#1C1C18] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#2E3F00] font-bold">
                  Costo Unitario resultante: ${calcUnitCost} / {restockUnit}
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-extrabold text-xs shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Guardar y Sumar Stock</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowRestockForm(true)}
              className="w-full py-3 rounded-2xl bg-[#350463] hover:bg-[#4C237A] text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#C0F441]" />
              <span>+ Registrar Nueva Compra / Reabastecer</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-4 border-t border-[#F0EEE7] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E5E2DB] text-[#4B4450] font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================================
// MODAL: EDITAR DETALLES DE CARRETE DE FILAMENTO
// ========================================================
interface EditSpoolModalProps {
  spool: FilamentSpool;
  onClose: () => void;
}

export const EditSpoolModal: React.FC<EditSpoolModalProps> = ({ spool, onClose }) => {
  const { updateFilament } = useWorkshop();

  const [name, setName] = useState(spool.name);
  const [brand, setBrand] = useState(spool.brand);
  const [material, setMaterial] = useState(spool.material);
  const [colorName, setColorName] = useState(spool.colorName);
  const [colorHex, setColorHex] = useState(spool.colorHex);
  const [spoolTareGrams, setSpoolTareGrams] = useState(spool.spoolTareGrams.toString());
  const [costPerKg, setCostPerKg] = useState(spool.costPerKg.toString());
  const [supplier, setSupplier] = useState(spool.supplier || '');
  const [purchaseUrl, setPurchaseUrl] = useState(spool.purchaseUrl || '');
  const [imageUrl, setImageUrl] = useState(spool.imageUrl || '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedKgCost = parseFloat(costPerKg) || 280;
    const parsedTare = parseFloat(spoolTareGrams) || 180;

    updateFilament(spool.id, {
      name,
      brand,
      material,
      colorName,
      colorHex,
      spoolTareGrams: parsedTare,
      costPerKg: parsedKgCost,
      costPerGram: Number((parsedKgCost / 1000).toFixed(2)),
      supplier,
      purchaseUrl,
      imageUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center font-bold shadow-xs">
              <Edit3 className="w-5 h-5 text-[#6D3ACD]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#350463]">Editar Detalles de Bobina</h3>
              <span className="text-[11px] text-[#4B4450] font-mono">{spool.sku}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <form id="edit-spool-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Nombre / Título</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Marca / Fabricante</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Tipo de Material</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Nombre del Color</label>
                <input
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Muestra Cromática (#Hex)</label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 p-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-full font-mono font-bold text-xs bg-transparent focus:outline-none text-[#350463]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Tara Bobina Vacía (g)</label>
                <input
                  type="number"
                  step="1"
                  value={spoolTareGrams}
                  onChange={(e) => setSpoolTareGrams(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#BA1A1A] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Costo Base ($ MXN / kg)</label>
                <input
                  type="number"
                  step="1"
                  value={costPerKg}
                  onChange={(e) => setCostPerKg(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#350463] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Tienda / Proveedor</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="ej. Amazon México, ColorPlus"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1C1C18] block mb-1">URL / Enlace de Compra</label>
              <input
                type="url"
                value={purchaseUrl}
                onChange={(e) => setPurchaseUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#1C1C18] block mb-1">Foto Real del Carrete (URL o Subir)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-xs text-[#1C1C18] focus:outline-none"
                />
                <label className="px-3 py-2 rounded-xl bg-[#EADDFB] hover:bg-[#6D3ACD] hover:text-white text-[#350463] font-bold text-xs cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              {imageUrl && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <img src={imageUrl} alt="Carrete preview" className="w-10 h-10 object-cover rounded-lg border border-[#CDC3D2]" />
                  <span className="text-[11px] text-[#2E3F00] font-bold">Vista previa de foto asignada</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Sticky Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-[#4B4450] font-bold text-xs hover:bg-[#F0EEE7] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-spool-form"
            className="px-5 py-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-extrabold text-xs shadow-xs cursor-pointer active:translate-y-0.5 transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================================
// MODAL: EDITAR DETALLES DE INSUMO DE ENSAMBLE / EMPAQUE
// ========================================================
interface EditSupplyModalProps {
  supply: WarehouseSupplyItem;
  onClose: () => void;
}

export const EditSupplyModal: React.FC<EditSupplyModalProps> = ({ supply, onClose }) => {
  const { updateWarehouseSupply } = useWorkshop();

  const [name, setName] = useState(supply.name);
  const [spec, setSpec] = useState(supply.spec || '');
  const [category, setCategory] = useState(supply.category);
  const [stock, setStock] = useState(supply.stock.toString());
  const [unit, setUnit] = useState(supply.unit);
  const [cost, setCost] = useState(supply.cost.toString());
  const [supplier, setSupplier] = useState(supply.supplier || '');
  const [purchaseUrl, setPurchaseUrl] = useState(supply.purchaseUrl || '');
  const [imageUrl, setImageUrl] = useState(supply.imageUrl || '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWarehouseSupply(supply.id, {
      name,
      spec,
      category,
      stock: parseFloat(stock) || 0,
      unit,
      cost: parseFloat(cost) || 0,
      supplier,
      purchaseUrl,
      imageUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center font-bold shadow-xs">
              <Edit3 className="w-5 h-5 text-[#6D3ACD]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#350463]">Editar Insumo de Ensamble / Empaque</h3>
              <span className="text-[11px] text-[#4B4450] font-mono">{supply.sku}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <form id="edit-supply-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-[#1C1C18] block mb-1">Nombre del Insumo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#1C1C18] block mb-1">Especificación / Descripción</label>
              <input
                type="text"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Categoría</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Unidad de Medida</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  placeholder="piezas, pliegos, unidades"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Stock Actual</label>
                <input
                  type="number"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#350463] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Costo Unitario ($ MXN)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#1C1C18] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">Tienda / Proveedor</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="ej. Amazon México, Mercado Libre"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1C18] block mb-1">URL de Compra</label>
                <input
                  type="url"
                  value={purchaseUrl}
                  onChange={(e) => setPurchaseUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1C1C18] block mb-1">Foto del Insumo (URL o Subir)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-xs text-[#1C1C18] focus:outline-none"
                />
                <label className="px-3 py-2 rounded-xl bg-[#EADDFB] hover:bg-[#6D3ACD] hover:text-white text-[#350463] font-bold text-xs cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              {imageUrl && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <img src={imageUrl} alt="Insumo preview" className="w-10 h-10 object-cover rounded-lg border border-[#CDC3D2]" />
                  <span className="text-[11px] text-[#2E3F00] font-bold">Vista previa de foto asignada</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Sticky Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-[#4B4450] font-bold text-xs hover:bg-[#F0EEE7] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-supply-form"
            className="px-5 py-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-extrabold text-xs shadow-xs cursor-pointer active:translate-y-0.5 transition-all"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

interface LiquidationModalProps {
  order: KanbanOrder;
  onClose: () => void;
}

export const LiquidationModal: React.FC<LiquidationModalProps> = ({ order, onClose }) => {
  const { liquidateBalance } = useWorkshop();
  const [method, setMethod] = useState<string>('Transferencia SPEI');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [refNotes, setRefNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    { id: 'Transferencia SPEI', label: 'Transferencia SPEI', icon: '🏦' },
    { id: 'Clip / Mercado Pago', label: 'Clip / Mercado Pago', icon: '💳' },
    { id: 'Stripe', label: 'Stripe', icon: '🌐' },
    { id: 'Mercado Libre', label: 'Mercado Libre', icon: '📦' },
    { id: 'Amazon', label: 'Amazon', icon: '🛒' },
    { id: 'Efectivo', label: 'Efectivo', icon: '💵' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
    }
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      liquidateBalance(order.id, method, proofFileName || 'comprobante_bancario.pdf');
      setIsSubmitting(false);
      onClose();
    }, 250);
  };

  const alreadyPaid = order.totalPrice - order.pendingBalance;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-purple-100 overflow-hidden flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* ENCABEZADO ESTÁNDAR (SISTEMA DE DISEÑO BASE) */}
        <div className="px-5 sm:px-6 py-5 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center shadow-xs">
              <DollarSign className="w-6 h-6 text-[#350463]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-[#350463] tracking-tight">
                  Registrar Pago & Liquidación
                </h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#350463] text-white font-bold">
                  {order.folio}
                </span>
              </div>
              <p className="text-xs text-[#4B4450]">
                Confirmación de cobro de saldo para entrega o despacho de taller
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#4B4450] hover:text-[#1C1C18] hover:bg-[#F0EEE7] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* FILA SUPERIOR DE MÉTRICAS RÁPIDAS (ROUNDED-2XL) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/30 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[#4B4450]">Total de la Orden</span>
              <span className="text-base font-extrabold text-[#1C1C18] font-mono">
                ${order.totalPrice.toFixed(2)} MXN
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F0EEE7] border border-[#CDC3D2]/30 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[#4B4450]">Anticipo Cobrado</span>
              <span className="text-base font-extrabold text-[#2E3F00] font-mono">
                ${Math.max(0, alreadyPaid).toFixed(2)} MXN
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFE4DE] border border-[#FFCDD2] flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#93000A]">Saldo a Liquidar</span>
              <span className="text-base font-black text-[#93000A] font-mono">
                ${order.pendingBalance.toFixed(2)} MXN
              </span>
            </div>
          </div>

          {/* CUERPO PRINCIPAL */}
          <div className="space-y-4">
            {/* Cliente Info */}
            <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#4B4450] uppercase tracking-wider block font-bold">Cliente</span>
                <strong className="text-[#350463] text-sm">{order.clientName}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#4B4450] uppercase tracking-wider block font-bold">Proyecto</span>
                <span className="text-[#1C1C18] font-medium">{order.title}</span>
              </div>
            </div>

            {/* Selector de Método de Pago (6 opciones requeridas) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1C1C18] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#6D3ACD]" />
                <span>Seleccionar Método de Pago</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {paymentMethods.map((m) => {
                  const isSelected = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`py-2.5 px-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#350463] text-white border-[#350463] shadow-xs'
                          : 'bg-white border-[#CDC3D2]/40 text-[#4B4450] hover:border-[#6D3ACD] hover:bg-[#FAF7F0]'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="text-xs font-bold leading-tight">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo para cargar Comprobante (JPG / PDF) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1C18] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-[#6D3ACD]" />
                  <span>Adjuntar Comprobante (JPG / PDF)</span>
                </span>
                {proofFileName && (
                  <span className="text-[11px] font-bold text-[#86B100] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Archivo cargado
                  </span>
                )}
              </label>

              <div className="relative border-2 border-dashed border-[#CDC3D2] hover:border-[#6D3ACD] rounded-2xl p-4 text-center bg-[#FAF7F0]/60 transition-colors">
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                  <div className="w-9 h-9 rounded-xl bg-[#EADDFB] text-[#350463] flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#350463]">
                    {proofFileName ? proofFileName : 'Haz clic o arrastra el comprobante aquí'}
                  </span>
                  <span className="text-[11px] text-[#4B4450]">
                    Formatos válidos: PDF, JPG, PNG (Captura de SPEI o ticket Clip)
                  </span>
                </div>
              </div>
            </div>

            {/* Notas o Folio de Transacción */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4B4450]">
                Folio de Operación / Referencia Bancaria (Opcional)
              </label>
              <input
                type="text"
                value={refNotes}
                onChange={(e) => setRefNotes(e.target.value)}
                placeholder="Ej. Rastreo SPEI #982142, Auth Clip #003182"
                className="w-full px-3.5 py-2.5 bg-white border border-[#CDC3D2]/40 rounded-xl text-xs text-[#1C1C18] focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/30"
              />
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR FIJA (FOOTER) */}
        <div className="p-4 px-6 border-t border-[#F0EEE7] bg-[#FAF7F0] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#2E3F00] font-semibold">
            <CheckCircle className="w-4 h-4 text-[#86B100]" />
            <span>Al confirmar, la tarjeta cambia a badge verde "100% Pagado".</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#CDC3D2] text-[#4B4450] hover:bg-white text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar Pago & Liquidar Saldo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
