import React, { useRef, useState, useMemo } from 'react';
import { useWorkshop } from '../../context/WorkshopContext';
import { CotizadorModelItem, FilamentSpool, AmsSlotItem, BedPlateType, BomItem, CustomServiceItem, WorkshopSettings } from '../../types';
import {
  MATERIAL_OPTIONS,
  BED_PLATE_OPTIONS,
  QUICK_COLORS,
} from './CotizadorTypes';
import {
  Sparkles,
  Upload,
  Copy,
  Trash2,
  Lock,
  Palette,
  ExternalLink,
  Folder,
  Layers,
  Clock,
  Wrench,
  Plus,
  X,
  Edit3,
  ChevronDown,
  Package,
  DollarSign,
  Percent,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Scissors,
  Hammer,
  AlertTriangle,
  Search,
  Printer,
} from 'lucide-react';

interface ModelCardProps {
  model: CotizadorModelItem;
  index: number;
  totalModels: number;
  filaments: FilamentSpool[];
  settings?: WorkshopSettings;
  onUpdate: (updated: CotizadorModelItem) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddUpsellToBom?: (name: string, cost: number) => void;
  onAddUpsellService?: (concept: string, price: number) => void;
  onAddNextModel?: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  index,
  totalModels,
  filaments,
  settings,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddNextModel,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelImagePreview, setModelImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualModeNotice, setManualModeNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pieceTitleInputRef = useRef<HTMLInputElement>(null);

  // Sub-acordeones colapsables limpios por modelo (REQ 1)
  const [openSubAccordions, setOpenSubAccordions] = useState({
    bom: false,
    services: false,
    finance: true,
  });

  const toggleSubAccordion = (key: 'bom' | 'services' | 'finance') => {
    setOpenSubAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Estado para creación rápida de insumo BOM
  const [newBomName, setNewBomName] = useState('');
  const [newBomQty, setNewBomQty] = useState(1);
  const [newBomCost, setNewBomCost] = useState(2.5);

  // REQ 1 (Combobox predictivo de insumos BOM)
  const [showManualBomForm, setShowManualBomForm] = useState(false);
  const [bomSearchQuery, setBomSearchQuery] = useState('');
  const [bomDropdownOpen, setBomDropdownOpen] = useState(false);
  const [selectedBomItem, setSelectedBomItem] = useState<{ id: string; name: string; unitCost: number; category?: string; sku?: string } | null>(null);
  const [bomQty, setBomQty] = useState(1);
  const [bomUnitCost, setBomUnitCost] = useState(0);
  const bomSearchInputRef = useRef<HTMLInputElement>(null);
  const bomQtyInputRef = useRef<HTMLInputElement>(null);

  const { warehouseSupplies, printers } = useWorkshop();

  // Lista de impresoras disponibles (Flota Taller)
  const availablePrinters = useMemo(() => {
    return (printers || []).map((p) => ({
      id: p.id,
      label: `🖨️ ${p.alias} • ${p.marca} ${p.modelo} ($${Number(p.tarifaHoraBase ?? 45).toFixed(2)}/hr)`,
      value: p.id,
      modelMatch: `${p.marca} ${p.modelo}`,
      tarifaHoraBase: Number(p.tarifaHoraBase ?? 45),
      printerDevice: p,
    }));
  }, [printers]);

  // Impresora asignada resuelta y su tarifa por hora ingresada al registrarla
  const assignedPrinterDevice = useMemo(() => {
    if (printers && printers.length > 0) {
      if (model.assignedPrinter) {
        const found = printers.find(
          (p) =>
            p.id === model.assignedPrinter ||
            p.alias === model.assignedPrinter ||
            `${p.marca} ${p.modelo}` === model.assignedPrinter ||
            p.modelo === model.assignedPrinter
        );
        if (found) return found;
      }
      return printers.find((p) => p.estado !== 'baja') || printers[0];
    }
    return null;
  }, [printers, model.assignedPrinter]);

  const printerHourlyRate = useMemo(() => {
    if (assignedPrinterDevice?.tarifaHoraBase !== undefined) {
      return Number(assignedPrinterDevice.tarifaHoraBase);
    }
    return Number(settings?.activePrinter?.hourlyRate || 10.0);
  }, [assignedPrinterDevice, settings?.activePrinter?.hourlyRate]);

  // Análisis inteligente de impresora recomendada exclusiva para este modelo
  const idealPrinterForModel = useMemo(() => {
    const amsCount = (model.amsSlots || []).length;
    const materials = (model.amsSlots || []).map((s) => (s.material || 'PLA').toUpperCase());
    const hasTechnical = materials.some((mat) =>
      ['ABS', 'ASA', 'NYLON', 'PC', 'PA', 'CARBON', 'PET-CF'].some((tech) => mat.includes(tech))
    );
    const totalGrams = (model.amsSlots || []).reduce((acc, s) => acc + (s.grams || 0), 0) + (model.purgaGrams || 0);

    if (hasTechnical) {
      return {
        model: 'Bambu Lab P1S Combo',
        badge: 'Cámara Cerrada Técnica',
        reason: `Detectamos filamento técnico (${materials.join(', ')}). Requiere cabina cerrada con control térmico.`,
      };
    }
    if (amsCount > 1) {
      return {
        model: 'Bambu Lab A1 Combo',
        badge: `${amsCount} Ranuras AMS`,
        reason: `Configuración multicolor (${amsCount} ranuras). Ideal para AMS y purga optimizada.`,
      };
    }
    if (model.clientQty <= 5 && totalGrams < 150) {
      return {
        model: 'Bambu Lab A1 Mini',
        badge: 'Monocromático Ágil',
        reason: 'Lote compacto y monocromático. Máxima eficiencia energética y arranque veloz.',
      };
    }
    return {
      model: 'Bambu Lab A1 Combo',
      badge: 'FDM Estándar',
      reason: 'Excelente velocidad y calibración automática de flujo en cama 256x256mm.',
    };
  }, [model.amsSlots, model.purgaGrams, model.clientQty]);

  // Insumo manual fuera de catálogo
  const [manualBomName, setManualBomName] = useState('');
  const [manualBomQty, setManualBomQty] = useState(1);
  const [manualBomCost, setManualBomCost] = useState(5.0);

  // Unificación de catálogo de insumos BOM (Almacén Real)
  const combinedBomCatalog = useMemo(() => {
    return (warehouseSupplies || []).map((s) => ({
      id: s.id,
      sku: s.sku,
      name: s.name,
      unitCost: s.cost,
      category: s.category,
    }));
  }, [warehouseSupplies]);

  // Filtrado reactivo del catálogo en base a lo que escribe el usuario (ej: "iman", "tornillo", "led")
  const filteredBomCatalog = combinedBomCatalog.filter((item) => {
    const q = bomSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  const handleSelectCatalogItem = (item: { id: string; name: string; unitCost: number; category?: string; sku?: string }) => {
    setSelectedBomItem(item);
    setBomSearchQuery(item.name);
    setBomUnitCost(item.unitCost);
    setBomDropdownOpen(false);
    setTimeout(() => {
      bomQtyInputRef.current?.focus();
      bomQtyInputRef.current?.select();
    }, 50);
  };

  const handleConfirmAddBom = () => {
    if (!bomSearchQuery.trim()) return;
    const itemToAdd: BomItem = {
      id: `bom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: bomSearchQuery.trim(),
      quantity: Math.max(1, bomQty),
      unitCost: Math.max(0, bomUnitCost),
      category: selectedBomItem?.category || 'Consumibles',
    };
    onUpdate({
      ...model,
      bomItems: [...(model.bomItems || []), itemToAdd],
    });
    setBomSearchQuery('');
    setSelectedBomItem(null);
    setBomQty(1);
    setBomUnitCost(0);
    setBomDropdownOpen(false);
  };

  const handleAddManualBomItem = () => {
    if (!manualBomName.trim()) return;
    const itemToAdd: BomItem = {
      id: `bom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: manualBomName.trim(),
      quantity: Math.max(1, manualBomQty),
      unitCost: Math.max(0, manualBomCost),
      category: 'Manual / Fuera Catálogo',
    };
    onUpdate({
      ...model,
      bomItems: [...(model.bomItems || []), itemToAdd],
    });
    setManualBomName('');
    setManualBomQty(1);
    setManualBomCost(5.0);
    setShowManualBomForm(false);
  };

  // Estado para creación rápida de servicio manual
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcQty, setNewSvcQty] = useState(1);
  const [newSvcPrice, setNewSvcPrice] = useState(35.0);

  // Financial calculations for this individual model (REQ 1)
  const cfeRate = settings?.cfeRatePerKwh ?? 2.15;
  const watts = settings?.printerWatts ?? 150;
  const mttoPercent = settings?.maintenanceFundPercent ?? 12;
  const laborRate = settings?.laborRatePerHour ?? 75;
  const defaultMargin = settings?.defaultMarginPercent ?? 30;

  const mClientQty = Math.max(1, model.clientQty);
  const mBufferQty = model.includeBuffer ? Math.max(0, model.bufferQty || 0) : 0;
  const mBufferRatio = mBufferQty / mClientQty;
  const mBaseHours = Math.max(0.1, model.printHours || 0.5);
  const mHoursWithBuffer = mBaseHours * (1 + mBufferRatio);

  const mFilamentCost = model.amsSlots.reduce((acc, s) => {
    const rate = s.costPerGram || 0.28;
    return acc + (s.grams || 0) * (1 + mBufferRatio) * rate;
  }, 0) + (model.purgaGrams || 0) * 0.28;

  const mCfeCost = mHoursWithBuffer * (watts / 1000) * cfeRate;
  const mMttoCost = mFilamentCost * (mttoPercent / 100);

  // Insumos BOM asignados exclusivamente a este modelo
  const modelBomItems = model.bomItems || [];
  const modelBomCost = modelBomItems.reduce((acc, b) => acc + (b.quantity || 0) * (b.unitCost || 0), 0);

  // Servicios y acabados manuales asignados exclusivamente a este modelo (concepto y costo directo - REQ 3)
  const modelCustomServices = model.customServices || [];
  const modelServicesCost = modelCustomServices.reduce((acc, s) => acc + (s.quantity || 0) * (s.unitPrice || 0), 0);
  // Horas dedicadas de mano de obra del operador para este modelo
  const modelLaborCost = (model.dedicatedLaborHours || 0) * laborRate;
  const modelTotalManualCost = modelServicesCost + modelLaborCost;

  // Costo Directo Consolidado del Modelo
  const modelDirectCostTotal = mFilamentCost + mCfeCost + mMttoCost + modelBomCost + modelTotalManualCost;

  // REQ 2: Margen Deseado para este Modelo (%)
  // 1. Piso mínimo sugerido del 20%
  // 2. Tarifa por hora en función de la impresora asignada y el dato ingresado al registrarla
  const minRequiredProfitForModel = mHoursWithBuffer * printerHourlyRate;
  const minMarginForHourlyRate = (minRequiredProfitForModel / Math.max(0.01, modelDirectCostTotal)) * 100;
  const effectiveMinMargin = Math.max(20, Math.ceil(minMarginForHourlyRate * 10) / 10);

  const rawMargin = model.desiredMarginPercent ?? defaultMargin;
  const modelMarginPercent = Math.max(effectiveMinMargin, rawMargin);

  // Matemática intuitiva y transparente de Markup Directo:
  // Precio de Venta = Costo Directo * (1 + Margen% / 100)
  const modelCommercialTotal = modelDirectCostTotal * (1 + modelMarginPercent / 100);

  const modelUnitPrice = Number((modelCommercialTotal / mClientQty).toFixed(2));
  const modelSubtotal = Number((modelUnitPrice * mClientQty).toFixed(2));
  const modelNetProfit = modelSubtotal - modelDirectCostTotal;
  const modelProfitPerHour = modelNetProfit / Math.max(0.1, mHoursWithBuffer);
  const meetsMinRate = modelProfitPerHour >= printerHourlyRate;


  const handleAddCustomBom = () => {
    if (!newBomName.trim()) return;
    const newBom: BomItem = {
      id: `bom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newBomName.trim(),
      quantity: Math.max(1, newBomQty),
      unitCost: Math.max(0, newBomCost),
      category: 'herrajes',
    };
    onUpdate({
      ...model,
      bomItems: [...(model.bomItems || []), newBom],
    });
    setNewBomName('');
    setNewBomQty(1);
    setNewBomCost(2.5);
  };

  const handleUpdateBomItem = (bIdx: number, updated: Partial<BomItem>) => {
    const nextBoms = [...(model.bomItems || [])];
    nextBoms[bIdx] = { ...nextBoms[bIdx], ...updated };
    onUpdate({ ...model, bomItems: nextBoms });
  };

  const handleRemoveBomItem = (bIdx: number) => {
    const nextBoms = (model.bomItems || []).filter((_, i) => i !== bIdx);
    onUpdate({ ...model, bomItems: nextBoms });
  };

  // Handlers para Sub-acordeón B (Servicios)
  const handleAddCustomService = () => {
    if (!newSvcName.trim()) return;
    const newSvc: CustomServiceItem = {
      id: `svc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newSvcName.trim(),
      quantity: Math.max(1, newSvcQty),
      unitPrice: Math.max(0, newSvcPrice),
      category: 'acabado',
    };
    onUpdate({
      ...model,
      customServices: [...(model.customServices || []), newSvc],
    });
    setNewSvcName('');
    setNewSvcQty(1);
    setNewSvcPrice(35.0);
  };

  const handleUpdateCustomService = (sIdx: number, updated: Partial<CustomServiceItem>) => {
    const nextSvcs = [...(model.customServices || [])];
    nextSvcs[sIdx] = { ...nextSvcs[sIdx], ...updated };
    onUpdate({ ...model, customServices: nextSvcs });
  };

  const handleRemoveCustomService = (sIdx: number) => {
    const nextSvcs = (model.customServices || []).filter((_, i) => i !== sIdx);
    onUpdate({ ...model, customServices: nextSvcs });
  };

  // Handler para Margen Individual (Piso mínimo 20%, validación dual $10.50/hr y sin límite superior - REQ 2)
  const handleMarginChange = (val: number) => {
    const safeMargin = Math.max(effectiveMinMargin, Math.max(20, val));
    onUpdate({
      ...model,
      desiredMarginPercent: safeMargin,
    });
  };

  // REGLAS AUTOMÁTICAS DE MERMA Y BUFFER POR TAMAÑO DE LOTE (REQ 1)
  const handleClientQtyChange = (newQty: number) => {
    const qty = Math.max(1, newQty);
    let newFailureRate = model.failureRatePercent;
    let newIncludeBuffer = model.includeBuffer;
    let newBufferQty = model.bufferQty;

    if (qty < 10) {
      newFailureRate = 15;
      newIncludeBuffer = false;
      newBufferQty = 0;
    } else {
      newFailureRate = 8;
      newIncludeBuffer = true;
      // Buffer activado (+2 sugerido por defecto para lotes >= 10)
      newBufferQty = Math.max(2, Math.round(qty * 0.08));
    }

    onUpdate({
      ...model,
      clientQty: qty,
      failureRatePercent: newFailureRate,
      includeBuffer: newIncludeBuffer,
      bufferQty: newBufferQty,
    });
  };

  // Instant Slicer 3MF / GCode file metadata reader (0ms local JS parse)
  const handleParseSlicerFile = async (file: File) => {
    if (!file) return;
    const cleanFileName = file.name.replace(/\.(3mf|gcode|stl|3d)$/i, '').replace(/[_-]/g, ' ');
    let hours = model.printHours || 0;
    let mins = model.printMinutes || 0;
    let grams = model.amsSlots[0]?.grams || 0;

    try {
      const text = await file.text();
      // Regex matching for slice time (e.g. 2h 30m or estimated printing time = 150m)
      const timeMatch = text.match(/estimated printing time[^=]*=\s*(?:(\d+)h)?\s*(?:(\d+)m)?/i) ||
                        text.match(/(\d+)h\s*(\d+)m/i);
      if (timeMatch) {
        if (timeMatch[1]) hours = parseInt(timeMatch[1], 10);
        if (timeMatch[2]) mins = parseInt(timeMatch[2], 10);
      }

      // Regex matching for filament weight in grams
      const weightMatch = text.match(/filament used \[g\]\s*=\s*([\d\.]+)/i) ||
                          text.match(/total weight\s*:\s*([\d\.]+)/i) ||
                          text.match(/(\d+(?:\.\d+)?)g/i);
      if (weightMatch && weightMatch[1]) {
        grams = Math.round(parseFloat(weightMatch[1]));
      }
    } catch {
      // Fallback filename extraction
    }

    const updatedSlots = [...model.amsSlots];
    if (updatedSlots.length > 0) {
      updatedSlots[0] = { ...updatedSlots[0], grams: grams || updatedSlots[0].grams };
    }

    onUpdate({
      ...model,
      pieceTitle: model.pieceTitle.trim() ? model.pieceTitle : cleanFileName,
      printHours: hours,
      printMinutes: mins,
      amsSlots: updatedSlots,
    });
  };

  // Botón de contingencia para llenar manualmente sin bloquear
  const handleActivateManualMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnalyzing(false);
    setManualModeNotice(true);
    pieceTitleInputRef.current?.focus();
  };

  // Filament slots handlers (REQ 4)
  const handleAddSlot = () => {
    const nextSlotNum = model.amsSlots.length + 1;
    const defaultColor = QUICK_COLORS[(nextSlotNum - 1) % QUICK_COLORS.length].hex;
    const newSlot: AmsSlotItem = {
      slot: nextSlotNum,
      name: `Filamento Ranura #${nextSlotNum}`,
      material: 'PETG',
      colorHex: defaultColor,
      grams: 80,
      costPerGram: 0.28,
    };
    onUpdate({
      ...model,
      amsSlots: [...model.amsSlots, newSlot],
    });
  };

  const handleUpdateSlot = (slotIdx: number, updates: Partial<AmsSlotItem>) => {
    const next = [...model.amsSlots];
    next[slotIdx] = { ...next[slotIdx], ...updates };
    onUpdate({ ...model, amsSlots: next });
  };

  const handleRemoveSlot = (slotIdx: number) => {
    if (model.amsSlots.length <= 1) return;
    const next = model.amsSlots
      .filter((_, i) => i !== slotIdx)
      .map((s, idx) => ({ ...s, slot: idx + 1 }));
    onUpdate({ ...model, amsSlots: next });
  };

  // Cascade spool selection (REQ 4)
  const handleSelectSpool = (slotIdx: number, value: string) => {
    if (value === '__manual__') {
      handleUpdateSlot(slotIdx, {
        spoolId: undefined,
      });
      return;
    }

    const spool = filaments.find((f) => f.id === value);
    if (!spool) return;

    handleUpdateSlot(slotIdx, {
      spoolId: spool.id,
      name: spool.name,
      material: spool.material,
      colorHex: spool.colorHex,
      costPerGram: spool.costPerGram || Number((spool.costPerKg / 1000).toFixed(2)),
    });
  };

  const totalFilamentGrams = model.amsSlots.reduce((sum, s) => sum + (s.grams || 0), 0);
  const bufferTotalWorkshopQty = model.clientQty + (model.includeBuffer ? model.bufferQty : 0);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/40 shadow-xs flex flex-col gap-4 transition-all hover:border-[#6D3ACD]/40">
      {/* HEADER DE LA PARTIDA / MODELO 3D */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EEE7] gap-2.5">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-[#350463] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
            #{index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <input
              ref={pieceTitleInputRef}
              type="text"
              value={model.pieceTitle}
              onChange={(e) => onUpdate({ ...model, pieceTitle: e.target.value })}
              placeholder="Nombre del Modelo / Pieza 3D..."
              className="w-full font-black text-sm text-gray-900 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#6D3ACD] rounded px-1.5 py-0.5"
            />
            <span className="text-[11px] text-gray-500 block truncate">
              Partida #{index + 1} • Fabricación Aditiva Técnica
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
              model.clientQty < 10
                ? 'bg-[#FFF3E0] text-[#E65100] border border-[#FFB74D]'
                : 'bg-[#C0F441]/40 text-[#2E3F00] border border-[#86B100]'
            }`}
          >
            {model.clientQty < 10 ? 'Lote Pequeño (<10 pzs) • 15% Merma' : 'Lote Estándar (≥10 pzs) • 8% Merma'}
          </span>
        </div>
      </div>



      
      {/* FILA 1: Grid Compacto Numérico (Piezas, Impresión, Mano de Obra, Merma) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Piezas Solicitadas */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-900 flex items-center justify-between">
            <span>Piezas:</span>
          </label>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
            <input
              type="number"
              min={1}
              value={model.clientQty}
              onChange={(e) => handleClientQtyChange(parseInt(e.target.value, 10) || 1)}
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Horas Impresión */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 flex items-center justify-between">
            <span>Horas Impresión:</span>
          </label>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={model.printHours}
              onChange={(e) =>
                onUpdate({
                  ...model,
                  printHours: Math.max(0.1, parseFloat(e.target.value) || 0.1),
                })
              }
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Horas Mano Obra */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 flex items-center justify-between">
            <span>Horas Mano Obra:</span>
          </label>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
            <input
              type="number"
              step="0.25"
              min="0"
              value={model.dedicatedLaborHours ?? 0}
              onChange={(e) =>
                onUpdate({
                  ...model,
                  dedicatedLaborHours: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Merma g */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 flex items-center justify-between">
            <span>Merma (g):</span>
          </label>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
            <input
              type="number"
              min="0"
              value={model.purgaGrams || 0}
              onChange={(e) =>
                onUpdate({
                  ...model,
                  purgaGrams: Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* FILA 2: Placas & Buffer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
        {/* Campo 2: Placas / Camas */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-900 flex items-center justify-between">
            <span>Placas / Camas:</span>
            <span className="text-[10px] text-[#2E3F00] bg-[#C0F441] px-1.5 py-0.5 rounded font-mono font-bold">
              ~{(model.clientQty / model.platesCount).toFixed(1)} pzs/cama
            </span>
          </label>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 focus-within:border-[#6D3ACD]">
            <input
              type="number"
              min={1}
              value={model.platesCount}
              onChange={(e) =>
                onUpdate({ ...model, platesCount: Math.max(1, parseInt(e.target.value, 10) || 1) })
              }
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none font-mono"
            />
            <span className="text-xs font-bold text-purple-600">placas</span>
          </div>
        </div>

        {/* Campo 3: Buffer de Respaldo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-900 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={model.includeBuffer}
                onChange={(e) =>
                  onUpdate({
                    ...model,
                    includeBuffer: e.target.checked,
                    bufferQty: e.target.checked
                      ? Math.max(1, model.bufferQty || Math.round(model.clientQty * 0.08))
                      : 0,
                  })
                }
                className="accent-[#6D3ACD] w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span>Buffer de Falla:</span>
            </span>
            <span className="text-[10px] text-gray-900 font-mono font-bold">
              Total taller: {bufferTotalWorkshopQty} pzs
            </span>
          </label>
          <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-gray-200">
            <button
              type="button"
              disabled={!model.includeBuffer}
              onClick={() =>
                onUpdate({
                  ...model,
                  bufferQty: Math.max(1, model.bufferQty - 1),
                })
              }
              className="w-6 h-6 flex items-center justify-center text-gray-900 font-bold hover:bg-gray-50 rounded disabled:opacity-30 cursor-pointer"
            >
              -
            </button>
            <span className="font-mono font-black text-sm text-gray-900">
              {model.includeBuffer ? `+${model.bufferQty} pzs` : '0 pzs'}
            </span>
            <button
              type="button"
              disabled={!model.includeBuffer}
              onClick={() =>
                onUpdate({
                  ...model,
                  bufferQty: model.bufferQty + 1,
                })
              }
              className="w-6 h-6 flex items-center justify-center text-gray-900 font-bold hover:bg-gray-50 rounded disabled:opacity-30 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* FILA 3: ASIGNACIÓN DE IMPRESORA, CAMA & RUTAS DE FABRICACIÓN */}
      <div className="p-3.5 rounded-2xl bg-linear-to-r from-[#FAF7F0] to-[#F3EEFA] border border-[#6D3ACD]/30 flex flex-col gap-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
            <Printer className="w-4 h-4 text-purple-600" />
            <span>Asignación de Impresora & Ficha de Fabricación</span>
          </span>

          {/* Sugerencia inteligente para este modelo específico */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">Ideal:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#350463] text-[#C0F441] font-mono font-bold text-[10px] shadow-2xs">
              {idealPrinterForModel.model} ({idealPrinterForModel.badge})
            </span>
            {model.assignedPrinter !== idealPrinterForModel.model && (
              <button
                type="button"
                onClick={() => onUpdate({ ...model, assignedPrinter: idealPrinterForModel.model })}
                className="px-2 py-0.5 rounded-lg bg-white border border-[#6D3ACD]/40 text-purple-600 font-bold text-[10px] hover:bg-[#EADDFB] transition-colors cursor-pointer"
                title={idealPrinterForModel.reason}
              >
                ⚡ Asignar sugerida
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Selector de Impresora Asignada */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] text-gray-500 font-bold block mb-1">
              Impresora Asignada a este Modelo:
            </label>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 focus-within:border-[#6D3ACD]">
              <Printer className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <select
                value={model.assignedPrinter || idealPrinterForModel.model}
                onChange={(e) => onUpdate({ ...model, assignedPrinter: e.target.value })}
                className="w-full bg-transparent font-bold text-xs text-gray-900 focus:outline-none cursor-pointer"
              >
                {availablePrinters.map((pr) => (
                  <option key={pr.id} value={pr.value}>
                    {pr.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-gray-500">
                Tarifa base de equipo: <strong className="font-mono text-purple-600">${printerHourlyRate.toFixed(2)} MXN/hr</strong>
              </span>
              <span className={`font-mono font-bold ${meetsMinRate ? 'text-[#2E7D32]' : 'text-[#BA1A1A]'}`}>
                {meetsMinRate ? `✓ Cumple tarifa` : `⚠ Debajo de $${printerHourlyRate.toFixed(2)}/hr`}
              </span>
            </div>
          </div>

          {/* Selector de Cama / Placa */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] text-gray-500 font-bold block mb-1">
              Cama / Placa de Impresión:
            </label>
            <select
              value={model.bedType}
              onChange={(e) => onUpdate({ ...model, bedType: e.target.value as BedPlateType })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 font-semibold text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6D3ACD]"
            >
              {BED_PLATE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* URL Modelo 3D */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] text-gray-500 font-bold block mb-1">
              URL del Modelo 3D (MakerWorld / Nube):
            </label>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200">
              <input
                type="url"
                value={model.modelUrl || ''}
                onChange={(e) => onUpdate({ ...model, modelUrl: e.target.value })}
                placeholder="https://makerworld.com/es/models/..."
                className="w-full text-xs font-mono text-gray-900 bg-transparent focus:outline-none"
              />
              {model.modelUrl && (
                <a
                  href={model.modelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-gray-900 shrink-0"
                  title="Abrir enlace"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Ruta Local / Carpeta Taller */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] text-gray-500 font-bold block mb-1">
              Carpeta Taller / Ruta de Archivo:
            </label>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200">
              <Folder className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <input
                type="text"
                value={model.localPath || ''}
                onChange={(e) => onUpdate({ ...model, localPath: e.target.value })}
                placeholder="/Drive/KiMO/Modelos/..."
                className="w-full text-xs font-mono text-gray-900 bg-transparent focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FILA 4: FILAMENTOS EN CASCADA Y BLOQUEO DE COSTO (REQ 4) */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-purple-600" />
            <span>
              Ranuras AMS ({model.amsSlots.length} ranuras • {totalFilamentGrams}g base)
            </span>
          </span>

          <button
            type="button"
            onClick={handleAddSlot}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#6D3ACD] hover:bg-[#350463] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir Ranura / Color Extra</span>
          </button>
        </div>

        {/* LISTADO DE SLOTS CON CASCADA Y CANDADO */}
        <div className="space-y-2">
          {model.amsSlots.map((slot, sIdx) => {
            const isCostLocked = !!slot.spoolId;
            const matchingSpools = filaments.filter((f) => {
              if (slot.material === 'Otro') return true;
              const sMat = slot.material.toLowerCase();
              const fMat = f.material.toLowerCase();
              return fMat.includes(sMat) || sMat.includes(fMat);
            });

            return (
              <div
                key={sIdx}
                className="p-3 rounded-2xl bg-gray-50 border border-gray-200/40 flex flex-col gap-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    {/* Color Swatch */}
                    <div className="relative group shrink-0">
                      <label
                        className="w-7 h-7 rounded-xl border-2 border-white shadow-2xs block cursor-pointer"
                        style={{ backgroundColor: slot.colorHex }}
                        title="Seleccionar color"
                      >
                        <input
                          type="color"
                          value={slot.colorHex}
                          onChange={(e) => handleUpdateSlot(sIdx, { colorHex: e.target.value })}
                          className="opacity-0 w-full h-full cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-black text-gray-900 text-xs">
                          Slot #{slot.slot}
                        </span>

                        {/* Paso 1: Selector de Material */}
                        <select
                          value={slot.material}
                          onChange={(e) =>
                            handleUpdateSlot(sIdx, {
                              material: e.target.value,
                              spoolId: undefined,
                            })
                          }
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-gray-200/60 font-bold text-gray-900"
                        >
                          {MATERIAL_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>

                        {/* Paso 2: Selector de Bobina Disponible en Inventario (Cascada) */}
                        <select
                          value={slot.spoolId || '__manual__'}
                          onChange={(e) => handleSelectSpool(sIdx, e.target.value)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#6D3ACD]/40 font-semibold text-gray-900 max-w-[230px] truncate"
                        >
                          <option value="__manual__">
                            ✍️ Manual / Fuera de Catálogo
                          </option>
                          {matchingSpools.length > 0 && (
                            <optgroup label={`Bobinas en Rack (${slot.material})`}>
                              {matchingSpools.map((sp) => (
                                <option key={sp.id} value={sp.id}>
                                  🟢 {sp.name} ({sp.gramsRemaining}g disp. • ${sp.costPerGram || (sp.costPerKg / 1000).toFixed(2)}/g)
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => handleUpdateSlot(sIdx, { name: e.target.value })}
                        placeholder="Nombre / Marca del filamento..."
                        className="w-full mt-1 bg-transparent font-medium text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6D3ACD] rounded px-1"
                      />
                    </div>
                  </div>

                  {/* Gramos y Costo $/g con Candado de Bloqueo (REQ 4) */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500">Gramos:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={slot.grams}
                          onChange={(e) =>
                            handleUpdateSlot(sIdx, {
                              grams: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className="w-14 text-right py-0.5 px-1 rounded-lg bg-white border border-gray-200 font-mono font-bold text-gray-900"
                        />
                        <span className="font-bold text-gray-500">g</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        {isCostLocked ? (
                          <span className="text-[#2E3F00] font-bold flex items-center">
                            <Lock className="w-2.5 h-2.5 mr-0.5" /> Bloqueado:
                          </span>
                        ) : (
                          <span>Costo $/g:</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min={0.05}
                          readOnly={isCostLocked}
                          value={slot.costPerGram || 0.28}
                          onChange={(e) =>
                            handleUpdateSlot(sIdx, {
                              costPerGram: parseFloat(e.target.value) || 0.28,
                            })
                          }
                          className={`w-14 text-right py-0.5 px-1 rounded-lg font-mono text-xs ${
                            isCostLocked
                              ? 'bg-[#E5E2DB]/60 text-gray-500 border border-gray-200 cursor-not-allowed font-bold'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Botón eliminar ranura */}
                    {model.amsSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(sIdx)}
                        className="p-1.5 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded-xl transition-colors cursor-pointer"
                        title="Eliminar ranura"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESCENTRALIZACIÓN: SUB-ACORDEONES A, B Y C POR MODELO    */}
      {/* (BOM, SERVICIOS MANUALES Y MARGEN INDEPENDIENTE - REQ 1) */}
      {/* ======================================================== */}
      <div className="pt-2 border-t border-gray-200/40 flex flex-col gap-3">
        {/* ENCABEZADO DE SUB-MÓDULOS DEL MODELO */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-[#4C237A] uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Configuración Descentralizada del Modelo #{index + 1}</span>
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            Insumos, acabados y precio unitario integrado
          </span>
        </div>

        {/* ======================================================== */}
        {/* SUB-ACORDEÓN A: INSUMOS BOM DEL MODELO                  */}
        {/* ======================================================== */}
        <div className="border-t border-gray-100 pt-4 mt-4 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSubAccordion('bom')}
            className="w-full py-3 flex items-center justify-between text-left cursor-pointer transition-colors font-semibold text-gray-900"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-[#4C237A] text-white flex items-center justify-center font-bold text-[10px]">
                A
              </span>
              <Package className="w-4 h-4 text-purple-600" />
              <span className="font-extrabold text-xs text-gray-900">
                Insumos BOM del Modelo (Herrajes, Imanes, Cajas)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EADDFB] text-gray-900 font-bold text-[10px]">
                {modelBomItems.length} {modelBomItems.length === 1 ? 'insumo' : 'insumos'} • ${modelBomCost.toFixed(2)} MXN
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#4C237A] transition-transform duration-200 ${
                openSubAccordions.bom ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSubAccordions.bom && (
            <div className="p-3.5 flex flex-col gap-3 bg-white text-xs animate-in fade-in-50 duration-150">
              {/* Buscador predictivo en vivo (Combobox) de Insumos BOM (REQ 1) */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-[#6D3ACD]/30 flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-black text-gray-900 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-purple-600" />
                    <span>Buscador Predictivo de Insumos (Catálogo de Taller):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualBomForm(!showManualBomForm)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EADDFB] border border-[#6D3ACD]/40 text-[#4C237A] font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs hover:scale-105"
                  >
                    <span>{showManualBomForm ? '✕ Cerrar Manual' : '+ Crear Insumo Manual'}</span>
                  </button>
                </div>

                {!showManualBomForm ? (
                  <div className="flex flex-wrap items-end gap-2 text-xs relative">
                    {/* Campo de búsqueda con autocompletado en vivo */}
                    <div className="flex-1 min-w-[200px] relative">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">
                        Insumo / Consumible:
                      </label>
                      <div className="relative">
                        <input
                          ref={bomSearchInputRef}
                          type="text"
                          value={bomSearchQuery}
                          onChange={(e) => {
                            setBomSearchQuery(e.target.value);
                            setBomDropdownOpen(true);
                          }}
                          onFocus={() => setBomDropdownOpen(true)}
                          placeholder="Buscar insumo (ej. imán, tornillo, led, caja, inserto)..."
                          className="w-full pl-8 pr-7 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]"
                        />
                        <Search className="w-3.5 h-3.5 text-purple-600 absolute left-2.5 top-2.5 pointer-events-none" />
                        {bomSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setBomSearchQuery('');
                              setSelectedBomItem(null);
                            }}
                            className="absolute right-2.5 top-2 text-gray-500 hover:text-[#BA1A1A] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Lista desplegable predictiva flotante */}
                      {bomDropdownOpen && filteredBomCatalog.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto divide-y divide-[#E5E2DB] rounded-xl border border-[#6D3ACD]/30 bg-white shadow-xl z-30">
                          {filteredBomCatalog.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectCatalogItem(item)}
                              className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center justify-between transition-colors cursor-pointer group"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-gray-900 group-hover:text-purple-600">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  Categoría: <strong>{item.category}</strong>
                                </span>
                              </div>
                              <span className="font-mono font-black text-xs text-[#2E3F00] bg-[#C0F441]/40 px-2 py-0.5 rounded-md">
                                ${item.unitCost.toFixed(2)} MXN
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Campo de Cantidad (autofocus al seleccionar) */}
                    <div className="w-20">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">
                        Cantidad:
                      </label>
                      <input
                        ref={bomQtyInputRef}
                        type="number"
                        min="1"
                        value={bomQty}
                        onChange={(e) => setBomQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmAddBom();
                        }}
                        className="w-full px-2 py-2 rounded-xl bg-white border border-gray-200 font-mono text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]"
                      />
                    </div>

                    {/* Costo Unitario precargado */}
                    <div className="w-24">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">
                        Costo U. ($):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={bomUnitCost}
                        onChange={(e) => setBomUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmAddBom();
                        }}
                        className="w-full px-2 py-2 rounded-xl bg-white border border-gray-200 font-mono text-right font-bold text-gray-900 focus:outline-none"
                      />
                    </div>

                    {/* Botón Asignar */}
                    <button
                      type="button"
                      onClick={handleConfirmAddBom}
                      disabled={!bomSearchQuery.trim()}
                      className="px-4 py-2 rounded-xl bg-[#4C237A] hover:bg-[#350463] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C0F441]" />
                      <span>Asignar</span>
                    </button>
                  </div>
                ) : (
                  /* Formulario manual para consumibles fuera de catálogo */
                  <div className="flex flex-wrap items-end gap-2 text-xs p-2.5 rounded-xl bg-white border border-gray-200/60 animate-in fade-in">
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">
                        Nombre de Insumo Fuera de Catálogo:
                      </label>
                      <input
                        type="text"
                        value={manualBomName}
                        onChange={(e) => setManualBomName(e.target.value)}
                        placeholder="Ej. Balero cerámico 608, Eje acero 4mm..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6D3ACD]"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">
                        Cantidad:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={manualBomQty}
                        onChange={(e) => setManualBomQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-gray-200 font-mono text-center font-bold text-gray-900"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">
                        Costo U. ($):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={manualBomCost}
                        onChange={(e) => setManualBomCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-gray-200 font-mono text-right font-bold text-gray-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddManualBomItem}
                      disabled={!manualBomName.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-[#6D3ACD] hover:bg-[#4C237A] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Guardar Manual</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tabla de insumos asignados a este modelo */}
              {modelBomItems.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200/40 bg-gray-50">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#F0EEE7] text-gray-500 font-bold">
                      <tr>
                        <th className="py-1.5 px-2.5">Insumo Requerido</th>
                        <th className="py-1.5 px-2 text-center w-20">Cant.</th>
                        <th className="py-1.5 px-2 text-right w-24">Costo U.</th>
                        <th className="py-1.5 px-2 text-right w-24">Subtotal</th>
                        <th className="py-1.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2DB] bg-white">
                      {modelBomItems.map((bom, bIdx) => (
                        <tr key={bom.id || bIdx}>
                          <td className="py-1.5 px-2.5 font-medium text-gray-900">{bom.name}</td>
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={bom.quantity}
                              onChange={(e) =>
                                handleUpdateBomItem(bIdx, {
                                  quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="w-14 text-center py-0.5 px-1 rounded border border-gray-200 font-mono font-bold text-gray-900"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <span className="text-[10px] text-gray-500">$</span>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={bom.unitCost}
                                onChange={(e) =>
                                  handleUpdateBomItem(bIdx, {
                                    unitCost: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-14 text-right py-0.5 px-1 rounded border border-gray-200 font-mono text-xs text-gray-900"
                              />
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-gray-900">
                            ${((bom.quantity || 0) * (bom.unitCost || 0)).toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveBomItem(bIdx)}
                              className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded-md transition-colors cursor-pointer"
                              title="Eliminar insumo de este modelo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 text-center text-gray-500 text-[11px]">
                  Sin insumos BOM asignados. Agrega imanes, tornillos o empaques que lleve exclusivamente este modelo.
                </div>
              )}

              <span className="text-[10px] text-gray-500 italic">
                🔒 En la cotización comercial del cliente estos insumos se consolidan dentro del precio unitario y se listan como "• Incluye: ..." estrictamente sin precios individuales.
              </span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SUB-ACORDEÓN B: SERVICIOS & ACABADOS MANUALES           */}
        {/* ======================================================== */}
        <div className="border-t border-gray-100 pt-4 mt-4 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSubAccordion('services')}
            className="w-full py-3 flex items-center justify-between text-left cursor-pointer transition-colors font-semibold text-gray-900"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-[#4C237A] text-white flex items-center justify-center font-bold text-[10px]">
                B
              </span>
              <Wrench className="w-4 h-4 text-purple-600" />
              <span className="font-extrabold text-xs text-gray-900">
                Servicios & Acabados Manuales del Modelo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EADDFB] text-gray-900 font-bold text-[10px]">
                {modelCustomServices.length} {modelCustomServices.length === 1 ? 'servicio' : 'servicios'} • ${modelTotalManualCost.toFixed(2)} MXN
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#4C237A] transition-transform duration-200 ${
                openSubAccordions.services ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSubAccordions.services && (
            <div className="p-3.5 flex flex-col gap-3 bg-white text-xs animate-in fade-in-50 duration-150">
              {/* Formulario para agregar servicio adicional manual (sin horas de operador - REQ 2) */}
              <div className="flex flex-wrap items-end gap-2 text-xs p-3 rounded-xl bg-gray-50 border border-gray-200/40">
                <div className="flex-1 min-w-[220px]">
                  <label className="text-[10px] text-gray-500 font-bold block mb-1">
                    Nombre del Servicio / Acabado Adicional:
                  </label>
                  <input
                    type="text"
                    value={newSvcName}
                    onChange={(e) => setNewSvcName(e.target.value)}
                    placeholder="Ej. Pintura artesanal, Lijado fino y pulido, Grabado de placa..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#6D3ACD]"
                  />
                </div>

                <div className="w-36">
                  <label className="text-[10px] text-gray-500 font-bold block mb-1">
                    Importe / Costo Directo ($ MXN):
                  </label>
                  <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={newSvcPrice}
                      onChange={(e) => setNewSvcPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs font-mono font-bold text-gray-900 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 font-bold">MXN</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomService}
                  disabled={!newSvcName.trim()}
                  className="px-4 py-2 rounded-lg bg-[#4C237A] hover:bg-[#350463] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 active:translate-y-0.5 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C0F441]" />
                  <span>+ Agregar Servicio</span>
                </button>
              </div>

              {/* Lista de servicios asignados a este modelo (Nombre, Costo directo y Eliminar - REQ 2) */}
              {modelCustomServices.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200/40 bg-gray-50">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#F0EEE7] text-gray-500 font-bold">
                      <tr>
                        <th className="py-2 px-3">Servicio / Acabado Adicional</th>
                        <th className="py-2 px-3 text-right w-40">Importe / Costo ($ MXN)</th>
                        <th className="py-2 px-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2DB] bg-white">
                      {modelCustomServices.map((svc, sIdx) => (
                        <tr key={svc.id || sIdx}>
                          <td className="py-2 px-3 font-semibold text-gray-900">
                            {svc.name || svc.concept || 'Servicio'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[10px] text-gray-500">$</span>
                              <input
                                type="number"
                                step="5"
                                min="0"
                                value={svc.unitPrice}
                                onChange={(e) =>
                                  handleUpdateCustomService(sIdx, {
                                    unitPrice: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-24 text-right py-0.5 px-1.5 rounded border border-gray-200 font-mono text-xs font-bold text-gray-900"
                              />
                              <span className="text-[10px] text-gray-500">MXN</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomService(sIdx)}
                              className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded-md transition-colors cursor-pointer"
                              title="Eliminar este servicio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 text-center text-gray-500 text-[11px]">
                  Sin servicios manuales adicionales. Registra acabados como pintura artesanal, lijado fino, etc.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SUB-ACORDEÓN C: PARÁMETROS FINANCIEROS & MARGEN INDIV.   */}
        {/* ======================================================== */}
        <div className="rounded-2xl border-2 border-[#6D3ACD]/30 bg-white overflow-hidden shadow-xs transition-all">
          <button
            type="button"
            onClick={() => toggleSubAccordion('finance')}
            className="w-full p-3 bg-linear-to-r from-[#FAF7F0] to-[#F3EEFA] hover:bg-[#EADDFB]/70 flex items-center justify-between text-left cursor-pointer transition-colors border-b border-purple-100"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-[#6D3ACD] text-white flex items-center justify-center font-bold text-[10px]">
                C
              </span>
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="font-black text-xs text-gray-900">
                Parámetros Financieros & Margen Individual del Modelo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-black text-[10px]">
                {modelMarginPercent}% Margen • ${modelUnitPrice.toFixed(2)} MXN/pza
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#4C237A] transition-transform duration-200 ${
                openSubAccordions.finance ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSubAccordions.finance && (
            <div className="p-4 flex flex-col gap-3.5 bg-white text-xs animate-in fade-in-50 duration-150">
              {/* CAMPO PRINCIPAL: MARGEN / PORCENTAJE DESEADO CLARO Y ENTENDIBLE */}
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border-2 border-[#6D3ACD]/30 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-purple-600" />
                        <span>Porcentaje de Ganancia Deseada (% de Margen)</span>
                      </label>
                      {effectiveMinMargin > 20 && (
                        <span className="text-[10px] font-bold text-purple-600 bg-[#EADDFB] px-2 py-0.5 rounded-full border border-[#6D3ACD]/30">
                          Piso mín: {effectiveMinMargin.toFixed(0)}% (${printerHourlyRate.toFixed(2)}/hr)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500">
                      ¿Cuánto quieres ganar por encima del costo de fabricación? El precio final se calcula sumando este porcentaje a tus costos directos.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border-2 border-[#6D3ACD] shadow-xs">
                      <input
                        type="number"
                        min={20}
                        value={modelMarginPercent}
                        onChange={(e) => handleMarginChange(parseFloat(e.target.value) || 20)}
                        className="w-16 text-center font-black font-mono text-gray-900 text-base focus:outline-none"
                      />
                      <span className="font-black text-purple-600 text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Niveles claros y recomendados */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Nivel de Rentabilidad Rápido:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { pct: 25, label: 'Mínimo', desc: 'Piso de taller' },
                      { pct: 35, label: 'Estándar', desc: 'Comercial 3D' },
                      { pct: 50, label: 'Rentable', desc: 'Buena utilidad' },
                      { pct: 75, label: 'Premium', desc: 'Piezas complejas' },
                      { pct: 100, label: 'Duplicar', desc: 'Costo x2' },
                    ].map((opt) => (
                      <button
                        key={opt.pct}
                        type="button"
                        onClick={() => handleMarginChange(opt.pct)}
                        className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                          modelMarginPercent === opt.pct
                            ? 'bg-[#350463] text-white border-[#350463] shadow-xs'
                            : 'bg-white text-gray-500 hover:bg-[#EADDFB]/50 border-gray-200/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-xs">{opt.pct}%</strong>
                          <span className={`text-[9px] uppercase font-bold ${modelMarginPercent === opt.pct ? 'text-[#C0F441]' : 'text-purple-600'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <span className={`text-[10px] block mt-0.5 ${modelMarginPercent === opt.pct ? 'text-white/80' : 'text-[#7A7382]'}`}>
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explicación de impacto en dinero real */}
                <div className="p-2.5 rounded-xl bg-white border border-[#6D3ACD]/20 text-[11px] text-gray-900 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    💡 Costo por pieza: <strong>${(modelDirectCostTotal / mClientQty).toFixed(2)} MXN</strong> + Tu Ganancia: <strong className="text-[#86B100]">+${((modelDirectCostTotal / mClientQty) * (modelMarginPercent / 100)).toFixed(2)} MXN</strong>
                  </div>
                  <div className="font-mono font-bold text-xs">
                    = Precio Venta: <span className="text-purple-600">${modelUnitPrice.toFixed(2)} MXN / pza</span>
                  </div>
                </div>
              </div>

              {/* CONSOLIDACIÓN TRANSPARENTE DE COSTOS DIRECTOS */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/40 space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Consolidación de Costos Directos (Filamentos + Luz CFE + Desgaste + BOM + Servicios):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white border border-gray-200/30 flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500">Filamentos:</span>
                    <strong className="text-gray-900 font-mono">${mFilamentCost.toFixed(2)}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-gray-200/30 flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500">Luz CFE ({mHoursWithBuffer.toFixed(1)}h):</span>
                    <strong className="text-gray-900 font-mono">${mCfeCost.toFixed(2)}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-gray-200/30 flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500">Desgaste ({mttoPercent}%):</span>
                    <strong className="text-gray-900 font-mono">${mMttoCost.toFixed(2)}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-gray-200/30 flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500">Insumos BOM:</span>
                    <strong className="text-purple-600 font-mono">${modelBomCost.toFixed(2)}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-gray-200/30 flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500">Servicios/M.O.:</span>
                    <strong className="text-purple-600 font-mono">${modelTotalManualCost.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/30 text-xs">
                  <span className="font-bold text-gray-500">Costo Total Directo de Fabricación:</span>
                  <span className="font-mono font-black text-gray-900 text-sm">
                    ${modelDirectCostTotal.toFixed(2)} MXN
                  </span>
                </div>
              </div>

              {/* RESULTADO COMERCIAL: PRECIO UNITARIO FINAL */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-[#350463] to-[#4C237A] text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div>
                  <span className="text-[10px] font-bold text-[#EADDFB] uppercase tracking-wider block">
                    Precio Comercial Calculado (Absorbe Insumos y Servicios)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-[#C0F441] font-mono">
                      ${modelUnitPrice.toFixed(2)} MXN
                    </span>
                    <span className="text-xs text-white/80 font-medium">/ pieza cliente</span>
                  </div>
                  <span className="text-[11px] text-[#EADDFB]">
                    Subtotal Partida ({mClientQty} pzs): <strong>${modelSubtotal.toFixed(2)} MXN</strong>
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-[#EADDFB]">
                    Utilidad Proyectada: <strong>${modelNetProfit.toFixed(2)} MXN ({modelMarginPercent}%)</strong>
                  </span>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black font-mono ${
                      meetsMinRate
                        ? 'bg-[#C0F441] text-[#2E3F00]'
                        : 'bg-[#FFDAD6] text-[#BA1A1A]'
                    }`}
                  >
                    {meetsMinRate ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>${modelProfitPerHour.toFixed(2)} MXN / hr máquina</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER DE LA PARTIDA: DUPLICAR Y ELIMINAR (REQ 2) */}
      <div className="pt-2 border-t border-[#F0EEE7] flex items-center justify-between text-xs">
        <span className="text-[11px] text-gray-500 font-mono">
          ID: {model.id} • Cama: {BED_PLATE_OPTIONS.find((b) => b.id === model.bedType)?.label}
        </span>

        <div className="flex items-center gap-2">
          {/* Botón Duplicar Modelo */}
          <button
            type="button"
            onClick={onDuplicate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-[#EADDFB] text-gray-900 border border-gray-200/50 font-bold transition-all cursor-pointer text-xs"
          >
            <Copy className="w-3.5 h-3.5 text-purple-600" />
            <span>Duplicar Modelo</span>
          </button>

          {/* Botón Eliminar Partida */}
          {totalModels > 1 && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFDAD6]/60 hover:bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30 font-bold transition-all cursor-pointer text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Partida</span>
            </button>
          )}
        </div>
      </div>

      {/* BOTÓN DESTACADO: AÑADIR SIGUIENTE MODELO / PARTIDA (REQ 1) */}
      {index === totalModels - 1 && onAddNextModel && (
        <div className="pt-3 mt-1 border-t-2 border-dashed border-[#6D3ACD]/30">
          <button
            type="button"
            onClick={onAddNextModel}
            className="w-full py-3.5 px-4 rounded-xl bg-[#4C237A] hover:bg-[#350463] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] border-2 border-[#6D3ACD]/30 hover:border-[#C0F441]"
          >
            <Plus className="w-4 h-4 text-[#C0F441]" />
            <span>+ Añadir Siguiente Modelo / Partida 3D</span>
          </button>
        </div>
      )}
    </div>
  );
};
