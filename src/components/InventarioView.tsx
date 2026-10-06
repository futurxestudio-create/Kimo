import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { FilamentSpool, WarehouseSupplyItem } from '../types';
import {
  Scale,
  PlusCircle,
  Search,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  ShoppingCart,
  Droplet,
  Layers,
  X,
  Archive,
  RefreshCw,
  ExternalLink,
  Edit3,
  Trash2,
  Image as ImageIcon,
  History,
  Package,
  Upload,
  Plus,
  ArrowUpRight,
  Filter,
  Check,
} from 'lucide-react';
import {
  ScaleCalibrationModal,
  PurchaseHistoryModal,
  EditSpoolModal,
  EditSupplyModal,
} from './Modals';

interface InventarioViewProps {
  onOpenScaleModal?: (spool: FilamentSpool) => void;
}

const STANDARD_MATERIALS = ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'Nylon', 'Resina', 'PC'];

export const InventarioView: React.FC<InventarioViewProps> = () => {
  const {
    filaments,
    warehouseSupplies,
    registerNewSpool,
    addWarehouseSupply,
    deleteFilament,
    deleteWarehouseSupply,
    calibrateSpoolWeight,
    settings,
    updateSettings,
  } = useWorkshop();

  const inventoryCategories = settings.inventoryCategories || ['Herrajes', 'Electrónica', 'Embalaje', 'Láminas Maquila', 'Fijación / Tornillería'];

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 1. Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState<'all' | 'filaments' | 'supplies' | 'critical'>('all');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('all');

  // 2. Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerType, setRegisterType] = useState<'filament' | 'supply'>('filament');

  // Scale Modal
  const [scaleModalSpool, setScaleModalSpool] = useState<FilamentSpool | null>(null);

  // Purchase History Modal
  const [historyModalTarget, setHistoryModalTarget] = useState<{
    type: 'filament' | 'supply';
    filament?: FilamentSpool;
    supply?: WarehouseSupplyItem;
  } | null>(null);

  // Edit Modals
  const [editingSpool, setEditingSpool] = useState<FilamentSpool | null>(null);
  const [editingSupply, setEditingSupply] = useState<WarehouseSupplyItem | null>(null);

  // Context Menu state
  const [activeMenuSpoolId, setActiveMenuSpoolId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSpoolId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Dual Registration Form State (Filament vs Supply)
  // Flow A: Filament
  const [fBrand, setFBrand] = useState('SUNLU');
  const [fName, setFName] = useState('PETG Terracota Mate');
  const [fMaterialSelect, setFMaterialSelect] = useState('PETG');
  const [fCustomMaterial, setFCustomMaterial] = useState('');
  const [fColorName, setFColorName] = useState('Terracota / Madera');
  const [fColorHex, setFColorHex] = useState('#A0522D');
  const [fPrice, setFPrice] = useState('280.00');
  const [fGrams, setFGrams] = useState('1000');
  const [fTare, setFTare] = useState('180');
  const [fSupplier, setFSupplier] = useState('Amazon México');
  const [fPurchaseUrl, setFPurchaseUrl] = useState('');
  const [fImageUrl, setFImageUrl] = useState('');

  // Flow B: General Supply
  const [sName, setSName] = useState('Imanes de Neodimio 6×3mm');
  const [sSpec, setSSpec] = useState('N52 niquelados para tapas magnéticas');
  const [sCategory, setSCategory] = useState('Herrajes');
  const [sCustomCategory, setSCustomCategory] = useState('');
  const [sQuantity, setSQuantity] = useState('50');
  const [sUnit, setSUnit] = useState('piezas');
  const [sTotalCost, setSTotalCost] = useState('160.00');
  const [sSupplier, setSSupplier] = useState('Mercado Libre');
  const [sPurchaseUrl, setSPurchaseUrl] = useState('');
  const [sImageUrl, setSImageUrl] = useState('');
  const [sMinAlert, setSMinAlert] = useState('15');

  const [isSaving, setIsSaving] = useState(false);

  // Helper file upload handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'filament' | 'supply') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          if (target === 'filament') setFImageUrl(reader.result);
          else setSImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Live calculations in Registration Form
  const parsedFPrice = parseFloat(fPrice) || 0;
  const parsedFGrams = parseFloat(fGrams) || 1;
  const calculatedCostPerGram = (parsedFPrice / parsedFGrams).toFixed(2);

  const parsedSQty = parseFloat(sQuantity) || 1;
  const parsedSTotal = parseFloat(sTotalCost) || 0;
  const calculatedSupplyUnitCost = (parsedSTotal / parsedSQty).toFixed(2);

  // Handlers for Dual Registration
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      if (registerType === 'filament') {
        const finalMaterial = fMaterialSelect === 'custom' ? (fCustomMaterial.trim() || 'Custom') : fMaterialSelect;
        const finalCostPerGram = parseFloat(calculatedCostPerGram) || 0.28;
        const initialPurchase = {
          id: `pur-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          quantity: parsedFGrams >= 1000 ? parsedFGrams / 1000 : parsedFGrams,
          unit: parsedFGrams >= 1000 ? 'kg' : 'g',
          totalCost: parsedFPrice,
          unitCost: finalCostPerGram,
          supplier: fSupplier,
          purchaseUrl: fPurchaseUrl,
          notes: 'Alta inicial en inventario',
        };

        registerNewSpool({
          sku: `FIL-${finalMaterial.toUpperCase().replace(/\s+/g, '')}-${fBrand.toUpperCase().replace(/\s+/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
          name: fName.trim() || `${fBrand} ${finalMaterial} ${fColorName}`,
          brand: fBrand.trim() || 'Genérico',
          material: finalMaterial,
          colorName: fColorName.trim() || 'Color',
          colorHex: fColorHex,
          gramsRemaining: parsedFGrams,
          capacityGrams: parsedFGrams,
          costPerGram: finalCostPerGram,
          costPerKg: parsedFPrice,
          spoolTareGrams: parseFloat(fTare) || 180,
          status: 'optimal',
          finish: 'Estándar',
          humidity: '18% HR',
          supplier: fSupplier.trim() || undefined,
          purchaseUrl: fPurchaseUrl.trim() || undefined,
          imageUrl: fImageUrl.trim() || undefined,
          purchaseHistory: [initialPurchase],
        });
      } else {
        const finalCategory = sCategory === 'custom' ? (sCustomCategory.trim() || 'Varios') : sCategory;
        const finalUnitCost = parseFloat(calculatedSupplyUnitCost) || 0;
        const initialPurchase = {
          id: `pur-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          quantity: parsedSQty,
          unit: sUnit,
          totalCost: parsedSTotal,
          unitCost: finalUnitCost,
          supplier: sSupplier,
          purchaseUrl: sPurchaseUrl,
          notes: 'Alta inicial de insumo',
        };

        addWarehouseSupply({
          sku: `INS-${finalCategory.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          name: sName.trim(),
          spec: sSpec.trim() || undefined,
          category: finalCategory,
          stock: parsedSQty,
          unit: sUnit.trim() || 'piezas',
          cost: finalUnitCost,
          totalCost: parsedSTotal,
          supplier: sSupplier.trim() || undefined,
          purchaseUrl: sPurchaseUrl.trim() || undefined,
          imageUrl: sImageUrl.trim() || undefined,
          minAlertStock: parseFloat(sMinAlert) || 5,
          purchaseHistory: [initialPurchase],
        });
      }

      setIsSaving(false);
      setShowRegisterModal(false);
    }, 300);
  };

  // KPIs Calculations
  const totalGramsInStock = filaments.reduce((acc, f) => acc + f.gramsRemaining, 0);
  const totalFilamentValuation = filaments.reduce((acc, f) => acc + f.gramsRemaining * f.costPerGram, 0);
  const totalSupplyValuation = warehouseSupplies.reduce((acc, s) => acc + s.stock * s.cost, 0);
  const totalCombinedValuation = totalFilamentValuation + totalSupplyValuation;

  const criticalSpools = filaments.filter((f) => f.gramsRemaining < 400);
  const criticalSupplies = warehouseSupplies.filter((s) => s.stock <= (s.minAlertStock || 5));
  const totalCriticalCount = criticalSpools.length + criticalSupplies.length;

  // Available unique materials for the material filter dropdown
  const availableMaterials = useMemo(() => {
    const set = new Set<string>();
    filaments.forEach((f) => {
      if (f.material) set.add(f.material);
    });
    STANDARD_MATERIALS.forEach((m) => set.add(m));
    return Array.from(set);
  }, [filaments]);

  // Universal Filtering Logic
  const filteredFilaments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return filaments.filter((f) => {
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.sku.toLowerCase().includes(q) ||
        f.material.toLowerCase().includes(q) ||
        f.colorName.toLowerCase().includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        (f.supplier && f.supplier.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Tab filter
      if (mainTab === 'supplies') return false;
      if (mainTab === 'critical' && f.gramsRemaining >= 400) return false;

      // Material filter
      if (selectedMaterialFilter !== 'all') {
        if (f.material.toLowerCase() !== selectedMaterialFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [filaments, searchTerm, mainTab, selectedMaterialFilter]);

  const filteredSupplies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return warehouseSupplies.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.spec && s.spec.toLowerCase().includes(q)) ||
        (s.supplier && s.supplier.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Tab filter
      if (mainTab === 'filaments') return false;
      if (mainTab === 'critical' && s.stock > (s.minAlertStock || 5)) return false;

      return true;
    });
  }, [warehouseSupplies, searchTerm, mainTab]);

  return (
    <div className="w-full flex flex-col gap-6 py-4 max-w-[1720px] mx-auto">
      {/* 1. ENCABEZADO Y KPIS */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6D3ACD] animate-pulse" />
                Almacén Activo CDMX
              </span>
              <span className="text-xs text-[#4B4450] font-medium">BOM, Bobinas & Insumos de Ensamble</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#350463] tracking-tight">
              Inventario de Filamentos & Almacén General
            </h1>
            <p className="text-xs lg:text-sm text-[#4B4450]">
              Control milimétrico por gramaje, pesaje en báscula digital, enlace a proveedores y reabastecimiento continuo.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl shadow-xs border border-[#CDC3D2]/30 self-start lg:self-auto">
            <RefreshCw className="w-4 h-4 text-[#6D3ACD]" />
            <div className="flex flex-col text-xs">
              <span className="text-[10px] text-[#4B4450]">Control de Almacén</span>
              <span className="font-bold text-[#350463]">
                {filaments.length} bobinas • {warehouseSupplies.length} insumos de ensamble
              </span>
            </div>
          </div>
        </div>

        {/* 4 KPIS SUPERIORES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-[#CDC3D2]/30 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4B4450] uppercase tracking-wider">
                Bobinas en Taller
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#350463] text-[#C0F441] flex items-center justify-center font-bold text-xs shadow-xs">
                {filaments.length}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#350463]">{filaments.length}</span>
                <span className="text-sm font-bold text-[#6D3ACD]">carretes</span>
              </div>
              <p className="text-xs text-[#4B4450] mt-1">
                <span className="font-bold text-[#2E3F00]">
                  {filaments.filter((f) => f.gramsRemaining >= 400).length} óptimas
                </span>{' '}
                •{' '}
                <span className="font-bold text-[#BA1A1A]">
                  {criticalSpools.length} críticas (&lt; 400g)
                </span>
              </p>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-[#CDC3D2]/30 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4B4450] uppercase tracking-wider">
                Filamento Disponible
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#C0F441] text-[#2E3F00] flex items-center justify-center shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#350463]">
                  {totalGramsInStock.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-sm font-bold text-[#2E3F00]">g</span>
              </div>
              <p className="text-xs text-[#4B4450] mt-1">
                ~{(totalGramsInStock / 1000).toFixed(2)} kg pesados y listos en rack
              </p>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-[#CDC3D2]/30 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4B4450] uppercase tracking-wider">
                Capital Total en Almacén
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#8656E8] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                $
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#350463]">
                  ${totalCombinedValuation.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-[#4B4450]">MXN</span>
              </div>
              <p className="text-xs text-[#4B4450] mt-1">
                ${totalFilamentValuation.toFixed(0)} en filamento • ${totalSupplyValuation.toFixed(0)} en herrajes/empaque
              </p>
            </div>
          </div>

          {/* KPI 4: Alertas de Stock */}
          <div className="bg-[#FFDAD6]/50 rounded-3xl p-5 shadow-xs border border-[#FFCDD2] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#BA1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#BA1A1A] animate-ping" />
                Alertas de Stock
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#BA1A1A] text-white text-[10px] font-bold">
                Por Agotarse
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#BA1A1A]">{totalCriticalCount}</span>
                <span className="text-sm font-bold text-[#BA1A1A]">artículos</span>
              </div>
              <p className="text-xs text-[#93000A] mt-1">
                {criticalSpools.length} bobinas &lt; 400g • {criticalSupplies.length} insumos bajo mínimo
              </p>
              <button
                onClick={() => setMainTab('critical')}
                className="mt-1 text-xs text-[#350463] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Filtrar artículos críticos</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE HERRAMIENTAS, BÚSQUEDA GLOBAL Y FILTROS JERÁRQUICOS (REQ 1) */}
      <section className="flex flex-col gap-3 bg-white p-4 rounded-3xl shadow-xs border border-[#CDC3D2]/30">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Input de Búsqueda Universal en Vivo */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B4450]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Buscar bobinas o insumos por nombre, marca, material, color, categoría o SKU..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F0] rounded-2xl text-xs text-[#1C1C18] focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/30 border border-[#CDC3D2]/30 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#4B4450] hover:text-[#1C1C18]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Botón Principal de Registro Dual */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setRegisterType('filament');
                setShowRegisterModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-black shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Registrar Compra / Entrar Insumo</span>
            </button>
          </div>
        </div>

        {/* Pestañas Principales Jerárquicas (REQ 1) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0EEE7]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => {
                setMainTab('all');
                setSelectedMaterialFilter('all');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === 'all'
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-[#4B4450] hover:bg-[#EADDFB]/50 hover:text-[#350463]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todos los Artículos ({filaments.length + warehouseSupplies.length})</span>
            </button>

            <button
              onClick={() => setMainTab('filaments')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === 'filaments'
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-[#4B4450] hover:bg-[#EADDFB]/50 hover:text-[#350463]'
              }`}
            >
              <span>🧶 Filamentos ({filaments.length})</span>
            </button>

            <button
              onClick={() => setMainTab('supplies')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === 'supplies'
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-[#4B4450] hover:bg-[#EADDFB]/50 hover:text-[#350463]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Insumos & Empaque ({warehouseSupplies.length})</span>
            </button>

            <button
              onClick={() => setMainTab('critical')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === 'critical'
                  ? 'bg-[#BA1A1A] text-white shadow-xs'
                  : 'bg-[#FFDAD6] text-[#93000A] hover:bg-[#FFCDD2]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>⚠️ Por Agotarse / Crítico ({totalCriticalCount})</span>
            </button>
          </div>

          {/* Subfiltro Compacto por Material si aplica (REQ 1) */}
          {(mainTab === 'all' || mainTab === 'filaments') && (
            <div className="flex items-center gap-2 text-xs bg-[#FAF7F0] px-3 py-1.5 rounded-2xl border border-[#CDC3D2]/40">
              <span className="text-[#4B4450] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#6D3ACD]" />
                Material:
              </span>
              <select
                value={selectedMaterialFilter}
                onChange={(e) => setSelectedMaterialFilter(e.target.value)}
                className="bg-white px-2.5 py-1 rounded-xl border border-[#CDC3D2]/50 font-bold text-[#350463] text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Materiales ({filaments.length})</option>
                {availableMaterials.map((mat) => {
                  const count = filaments.filter((f) => f.material.toLowerCase() === mat.toLowerCase()).length;
                  return (
                    <option key={mat} value={mat}>
                      {mat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* 3. RACK VISUAL DE CARRETES DE FILAMENTO (REQ 3) */}
      {(mainTab === 'all' || mainTab === 'filaments' || (mainTab === 'critical' && filteredFilaments.length > 0)) && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6D3ACD]" />
              <h2 className="font-extrabold text-sm text-[#350463] uppercase tracking-wider">
                Carretes de Filamento en Taller ({filteredFilaments.length})
              </h2>
            </div>
            <span className="text-xs text-[#4B4450]">
              Tara base calibrada • Pesaje en tiempo real
            </span>
          </div>

          {filteredFilaments.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-[#CDC3D2]/40 text-xs text-[#4B4450]">
              No se encontraron bobinas con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredFilaments.map((spool) => {
                const pct = Math.min(100, Math.round((spool.gramsRemaining / spool.capacityGrams) * 100));
                const isCritical = spool.gramsRemaining < 400;
                const isMenuOpen = activeMenuSpoolId === spool.id;

                return (
                  <div
                    key={spool.id}
                    className="bg-white rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-[#CDC3D2]/30 relative group"
                  >
                    <div>
                      {/* Top Header of Spool Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {/* FOTO REAL O DONUT CROMÁTICO (REQ 3) */}
                          <div className="relative w-14 h-14 rounded-2xl bg-[#FAF7F0] flex items-center justify-center shadow-inner border border-[#CDC3D2]/40 overflow-hidden shrink-0">
                            {spool.imageUrl ? (
                              <img
                                src={spool.imageUrl}
                                alt={spool.name}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              <span
                                className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center border border-[#CDC3D2]/50"
                                style={{ backgroundColor: spool.colorHex }}
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-[#FAF7F0]" />
                              </span>
                            )}

                            {/* Muestra Cromática Hex Badge visible siempre */}
                            <span
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-xs"
                              style={{ backgroundColor: spool.colorHex }}
                              title={`Color: ${spool.colorName} (${spool.colorHex})`}
                            />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-[#4B4450] font-mono">{spool.sku}</span>
                            <h3 className="font-bold text-sm text-[#350463] leading-snug truncate" title={spool.name}>
                              {spool.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-[#FAF7F0] text-[#4B4450] text-[10px] font-semibold border border-[#CDC3D2]/30">
                                {spool.material} 1.75mm
                              </span>
                              {isCritical ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A] text-[10px] font-bold">
                                  ⚠️ &lt; 400g
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-[#C0F441]/40 text-[#2E3F00] text-[10px] font-bold">
                                  Óptimo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* MENÚ CONTEXTUAL DE TRES PUNTOS (...) FUNCIONAL (REQ 3) */}
                        <div className="relative" ref={isMenuOpen ? menuRef : null}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuSpoolId(isMenuOpen ? null : spool.id)}
                            className="text-[#4B4450] hover:text-[#350463] hover:bg-[#FAF7F0] p-1.5 rounded-xl transition-colors cursor-pointer"
                            title="Opciones de bobina"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 top-8 bg-white rounded-2xl shadow-2xl border border-[#CDC3D2]/50 w-56 z-30 p-1.5 space-y-1 animate-in fade-in zoom-in-95 text-xs">
                              {/* Opción 1: Editar Detalles */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuSpoolId(null);
                                  setEditingSpool(spool);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left font-bold text-[#1C1C18] hover:bg-[#EADDFB] hover:text-[#350463] transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#6D3ACD]" />
                                <span>✏️ Editar Detalles</span>
                              </button>

                              {/* Opción 2: Historial de Compras & Proveedor */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuSpoolId(null);
                                  setHistoryModalTarget({ type: 'filament', filament: spool });
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left font-bold text-[#1C1C18] hover:bg-[#EADDFB] hover:text-[#350463] transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5 text-[#86B100]" />
                                <span>🛒 Historial & Compras</span>
                              </button>

                              {/* Opción 3: Abrir Enlace de Compra */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuSpoolId(null);
                                  if (spool.purchaseUrl) {
                                    window.open(spool.purchaseUrl, '_blank');
                                  } else {
                                    setEditingSpool(spool);
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left font-bold text-[#1C1C18] hover:bg-[#EADDFB] hover:text-[#350463] transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#350463]" />
                                <span>🔗 Abrir Enlace de Tienda</span>
                              </button>

                              <div className="border-t border-[#F0EEE7] my-1" />

                              {/* Opción 4: Dar de Baja / Archivar */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuSpoolId(null);
                                  if (window.confirm(`¿Dar de baja y eliminar la bobina ${spool.name} (${spool.sku}) del rack?`)) {
                                    deleteFilament(spool.id);
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left font-bold text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#BA1A1A]" />
                                <span>🗑️ Dar de Baja / Archivar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar & Grams Available */}
                      <div className="mt-4 bg-[#FAF7F0] p-3 rounded-2xl flex flex-col gap-1.5 border border-[#E5E2DB]">
                        <div className="flex items-baseline justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isCritical ? 'text-[#BA1A1A]' : 'text-[#1C1C18]'
                            }`}
                          >
                            {spool.gramsRemaining.toFixed(1)} g{' '}
                            <span className="font-normal text-[#4B4450]">netos disponibles</span>
                          </span>
                          <span className="text-xs font-black font-mono text-[#350463]">{pct}%</span>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-[#E5E2DB] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical ? 'bg-[#BA1A1A]' : 'bg-[#C0F441]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-[#4B4450] pt-0.5 font-mono">
                          <span>Tara: {spool.spoolTareGrams}g</span>
                          <span>Capacidad: {spool.capacityGrams}g</span>
                        </div>
                      </div>

                      {/* Pricing & Supplier Row */}
                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#FAF7F0] p-2.5 rounded-2xl border border-[#E5E2DB]/60">
                          <span className="text-[10px] text-[#4B4450] block">Costo unitario</span>
                          <span className="font-bold text-xs text-[#350463] block font-mono">
                            ${spool.costPerGram.toFixed(2)} <span className="font-normal text-[10px]">/g</span>
                          </span>
                          <span className="text-[10px] text-[#4B4450] block font-mono">
                            ${spool.costPerKg.toFixed(2)} / kg
                          </span>
                        </div>

                        <div className="bg-[#FAF7F0] p-2.5 rounded-2xl border border-[#E5E2DB]/60 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-[#4B4450] block">Proveedor</span>
                            <span className="font-bold text-xs text-[#1C1C18] block truncate">
                              {spool.supplier || 'N/A'}
                            </span>
                          </div>
                          {spool.purchaseUrl && (
                            <a
                              href={spool.purchaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#6D3ACD] font-bold hover:underline inline-flex items-center gap-0.5 truncate"
                            >
                              <span>Ver en tienda</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BOTÓN ÚNICO DE BÁSCULA (REQ 3 - Eliminada duplicidad) */}
                    <div className="mt-4 pt-2 border-t border-[#F0EEE7] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setScaleModalSpool(spool)}
                        className="w-full py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#350463] hover:text-white text-[#350463] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Scale className="w-3.5 h-3.5 text-[#6D3ACD] group-hover:text-[#C0F441]" />
                        <span>⚖️ Pesar en Báscula</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. SECCIÓN INFERIOR: ALMACÉN DE INSUMOS DE ENSAMBLE & EMPAQUE (REQ 1 & REQ 4) */}
      {(mainTab === 'all' || mainTab === 'supplies' || (mainTab === 'critical' && filteredSupplies.length > 0)) && (
        <section className="bg-white rounded-3xl p-6 shadow-xs border border-[#CDC3D2]/30 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#86B100]" />
                <h2 className="text-lg font-bold text-[#350463]">
                  Insumos de Ensamble, Herrajes & Empaque ({filteredSupplies.length})
                </h2>
              </div>
              <p className="text-xs text-[#4B4450]">
                Herrajes, módulos electrónicos, cajas kraft y láminas maquiladas para cotizaciones multicapa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRegisterType('supply');
                setShowRegisterModal(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-[#FAF7F0] hover:bg-[#EADDFB] text-[#350463] border border-[#6D3ACD]/30 font-bold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#6D3ACD]" />
              <span>+ Agregar Insumo</span>
            </button>
          </div>

          {filteredSupplies.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF7F0] rounded-2xl border border-dashed border-[#CDC3D2] text-xs text-[#4B4450]">
              No se encontraron insumos con los filtros actuales.
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#CDC3D2]/30 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F0] text-[#4B4450] text-[11px] uppercase tracking-wider font-bold border-b border-[#CDC3D2]/30">
                    <th className="py-3 px-4">Artículo / Especificación</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Stock en Taller</th>
                    <th className="py-3 px-4">Costo Unitario</th>
                    <th className="py-3 px-4">Tienda / Proveedor</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EEE7]">
                  {filteredSupplies.map((item) => {
                    const isLowStock = item.stock <= (item.minAlertStock || 5);

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF7F0]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 flex items-center justify-center overflow-hidden shrink-0">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-[#6D3ACD]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-[#350463] block truncate max-w-[260px]">{item.name}</span>
                              <span className="text-[11px] text-[#4B4450] font-normal truncate block max-w-[260px]">
                                {item.spec || item.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-[#EADDFB]/50 text-[#350463] text-[11px] font-semibold">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-[#1C1C18] font-mono">
                          {item.stock} {item.unit}
                        </td>

                        <td className="py-3 px-4 font-bold text-[#350463] font-mono">
                          ${item.cost.toFixed(2)} MXN
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#1C1C18] font-medium">{item.supplier || 'N/A'}</span>
                            {item.purchaseUrl && (
                              <a
                                href={item.purchaseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#6D3ACD] hover:text-[#350463]"
                                title="Abrir tienda"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A] font-bold text-[10px]">
                              ⚠️ Stock Bajo (&le; {item.minAlertStock || 5})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#2E3F00] font-bold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 text-[#86B100]" />
                              Disponible
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón + Reabastecer (Abre Historial de Compras y Reabastecimiento) */}
                            <button
                              type="button"
                              onClick={() => setHistoryModalTarget({ type: 'supply', supply: item })}
                              className="px-3 py-1.5 rounded-xl bg-[#C0F441]/40 hover:bg-[#C0F441] text-[#2E3F00] font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Historial de compras y reabastecimiento"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Reabastecer</span>
                            </button>

                            {/* Botón Editar */}
                            <button
                              type="button"
                              onClick={() => setEditingSupply(item)}
                              className="p-1.5 rounded-xl hover:bg-[#EADDFB] text-[#4B4450] hover:text-[#350463] transition-colors cursor-pointer"
                              title="Editar insumo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar el insumo "${item.name}" del almacén?`)) {
                                  deleteWarehouseSupply(item.id);
                                }
                              }}
                              className="p-1.5 rounded-xl hover:bg-[#FFDAD6] text-[#4B4450] hover:text-[#BA1A1A] transition-colors cursor-pointer"
                              title="Eliminar insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 5. MODAL DE ALTA DUAL: "FILAMENTO" VS "INSUMO DE ENSAMBLE / EMPAQUE" (REQ 2) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header con Pestañas de Selector de Tipo (REQ 2) */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center font-bold shadow-xs">
                  <PlusCircle className="w-5 h-5 text-[#6D3ACD]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#350463]">
                    Registrar Entrada al Almacén
                  </h3>
                  <span className="text-[11px] text-[#4B4450]">
                    Selecciona si registrarás un carrete de filamento o un insumo general
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Selector de Tipo de Producto en Dos Pestañas (REQ 2) */}
              <div className="grid grid-cols-2 gap-2 bg-[#FAF7F0] p-1.5 rounded-2xl border border-[#CDC3D2]/40">
                <button
                  type="button"
                  onClick={() => setRegisterType('filament')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    registerType === 'filament'
                      ? 'bg-[#350463] text-white shadow-xs'
                      : 'text-[#4B4450] hover:text-[#1C1C18]'
                  }`}
                >
                  <span>🧶 Carrete de Filamento</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegisterType('supply')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    registerType === 'supply'
                      ? 'bg-[#350463] text-white shadow-xs'
                      : 'text-[#4B4450] hover:text-[#1C1C18]'
                  }`}
                >
                  <span>🧩 Insumo de Ensamble / Empaque</span>
                </button>
              </div>

              {/* Formulario Dinámico según Tipo */}
              {registerType === 'filament' ? (
                /* ======================================================== */
                /* FLUJO A: FILAMENTO (REQ 2)                               */
                /* ======================================================== */
                <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
                  {/* Fila de Métricas Rápidas */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/30">
                    <div>
                      <span className="text-[10px] text-[#4B4450] uppercase font-bold block">Costo / g</span>
                      <span className="font-mono font-black text-sm text-[#2E3F00]">${calculatedCostPerGram} MXN</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4B4450] uppercase font-bold block">Capacidad Neta</span>
                      <span className="font-mono font-black text-sm text-[#1C1C18]">{fGrams}g</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4B4450] uppercase font-bold block">Inversión Total</span>
                      <span className="font-mono font-black text-sm text-[#350463]">${fPrice} MXN</span>
                    </div>
                  </div>

                  {/* Selector de Material con Select Limpio y Opción Dinámica (REQ 2) */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#1C1C18] block">
                      Tipo de Material de Extrusión:
                    </label>
                    <select
                      value={fMaterialSelect}
                      onChange={(e) => setFMaterialSelect(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-bold text-[#350463] text-xs focus:outline-none cursor-pointer"
                    >
                      {STANDARD_MATERIALS.map((mat) => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                      <option value="custom">➕ Agregar Nuevo Tipo de Material Personalizado...</option>
                    </select>

                    {fMaterialSelect === 'custom' && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={fCustomMaterial}
                          onChange={(e) => setFCustomMaterial(e.target.value)}
                          placeholder="Escribe el nombre del nuevo material (ej. ASA-CF, TPU 95A, PLA Seda)..."
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#6D3ACD] font-bold text-[#350463] text-xs focus:outline-none animate-in fade-in"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Marca / Fabricante</label>
                      <input
                        type="text"
                        value={fBrand}
                        onChange={(e) => setFBrand(e.target.value)}
                        required
                        placeholder="ej. SUNLU, Polymaker, eSUN"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Nombre / Título de la Bobina</label>
                      <input
                        type="text"
                        value={fName}
                        onChange={(e) => setFName(e.target.value)}
                        required
                        placeholder="ej. PETG Terracota Mate 1kg"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Nombre del Color</label>
                      <input
                        type="text"
                        value={fColorName}
                        onChange={(e) => setFColorName(e.target.value)}
                        required
                        placeholder="ej. Terracota, Blanco Puro"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Muestra Cromática (#Hex)</label>
                      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                        <input
                          type="color"
                          value={fColorHex}
                          onChange={(e) => setFColorHex(e.target.value)}
                          className="w-7 h-7 rounded-lg border-0 p-0 cursor-pointer shadow-xs"
                        />
                        <input
                          type="text"
                          value={fColorHex}
                          onChange={(e) => setFColorHex(e.target.value)}
                          className="w-full font-mono font-bold text-xs bg-transparent focus:outline-none text-[#350463]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Precio ($ MXN)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={fPrice}
                        onChange={(e) => setFPrice(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#350463] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Peso Neto (g)</label>
                      <input
                        type="number"
                        step="50"
                        min="1"
                        value={fGrams}
                        onChange={(e) => setFGrams(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Tara Vacía (g)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={fTare}
                        onChange={(e) => setFTare(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono text-[#BA1A1A] font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Datos de Adquisición: Proveedor y URL (REQ 2) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Tienda / Proveedor</label>
                      <input
                        type="text"
                        value={fSupplier}
                        onChange={(e) => setFSupplier(e.target.value)}
                        placeholder="ej. Amazon México, Mercado Libre, ColorPlus"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">URL / Enlace de Compra</label>
                      <input
                        type="url"
                        value={fPurchaseUrl}
                        onChange={(e) => setFPurchaseUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Campo de Imagen (Subir local o URL) (REQ 2) */}
                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Foto del Carrete / Bobina</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={fImageUrl}
                        onChange={(e) => setFImageUrl(e.target.value)}
                        placeholder="Ingresa URL de imagen https://..."
                        className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-xs text-[#1C1C18] focus:outline-none"
                      />
                      <label className="px-3 py-2 rounded-xl bg-[#EADDFB] hover:bg-[#6D3ACD] hover:text-white text-[#350463] font-bold text-xs cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(e, 'filament')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {fImageUrl && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                        <img src={fImageUrl} alt="Preview" className="w-9 h-9 object-cover rounded-lg border border-[#CDC3D2]" />
                        <span className="text-[11px] text-[#2E3F00] font-bold">Vista previa de bobina cargada</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-between mt-4">
                    <span className="text-xs text-[#4B4450] font-mono">
                      ${calculatedCostPerGram}/g • Rack Taller KiMO
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRegisterModal(false)}
                        className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#F0EEE7]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-black text-xs shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Archive className="w-4 h-4" />
                        <span>{isSaving ? 'Guardando...' : 'Guardar Carrete en Rack'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* ======================================================== */
                /* FLUJO B: INSUMO / HERRAJE / EMPAQUE (REQ 2)              */
                /* ======================================================== */
                <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
                  {/* Fila de Métricas Rápidas */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/30">
                    <div>
                      <span className="text-[10px] text-[#4B4450] uppercase font-bold block">Costo / Unidad</span>
                      <span className="font-mono font-black text-sm text-[#2E3F00]">${calculatedSupplyUnitCost} MXN</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4B4450] uppercase font-bold block">Cantidad Total</span>
                      <span className="font-mono font-black text-sm text-[#1C1C18]">{sQuantity} {sUnit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4B4450] uppercase font-bold block">Inversión Total</span>
                      <span className="font-mono font-black text-sm text-[#350463]">${sTotalCost} MXN</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Nombre del Insumo / Herraje</label>
                    <input
                      type="text"
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      required
                      placeholder="ej. Imanes de Neodimio 6×3mm, Tornillos M3, Cajas Kraft"
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Especificación / Descripción Técnica</label>
                    <input
                      type="text"
                      value={sSpec}
                      onChange={(e) => setSSpec(e.target.value)}
                      placeholder="ej. Grado N52 niquelados para tapas magnéticas e insertos"
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-[#1C1C18]">Categoría</label>
                        <button
                          type="button"
                          onClick={() => setIsCategoryModalOpen(true)}
                          className="text-[10px] font-bold text-[#6D3ACD] hover:underline"
                        >
                          ⚙️ Organizar
                        </button>
                      </div>
                      <select
                        value={sCategory}
                        onChange={(e) => setSCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-bold text-[#350463] text-xs focus:outline-none cursor-pointer"
                      >
                        {inventoryCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="custom">➕ Otra Categoría...</option>
                      </select>

                      {sCategory === 'custom' && (
                        <div className="pt-1.5">
                          <input
                            type="text"
                            value={sCustomCategory}
                            onChange={(e) => setSCustomCategory(e.target.value)}
                            placeholder="Ej. Embalaje/Cajas Grandes"
                            required
                            className="w-full px-3 py-1.5 rounded-xl bg-white border-2 border-[#6D3ACD] font-bold text-xs text-[#350463] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Unidad de Medida</label>
                      <input
                        type="text"
                        value={sUnit}
                        onChange={(e) => setSUnit(e.target.value)}
                        required
                        placeholder="piezas, pliegos, unidades, packs"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Cantidad Adquirida</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={sQuantity}
                        onChange={(e) => setSQuantity(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#350463] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Costo Total ($ MXN)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={sTotalCost}
                        onChange={(e) => setSTotalCost(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Alerta Stock &le;</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={sMinAlert}
                        onChange={(e) => setSMinAlert(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono text-[#BA1A1A] font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Tienda / Proveedor</label>
                      <input
                        type="text"
                        value={sSupplier}
                        onChange={(e) => setSSupplier(e.target.value)}
                        placeholder="ej. Amazon, Mercado Libre, Cartoneras CDMX"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">URL de Compra</label>
                      <input
                        type="url"
                        value={sPurchaseUrl}
                        onChange={(e) => setSPurchaseUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-[#1C1C18] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">Foto del Insumo</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={sImageUrl}
                        onChange={(e) => setSImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-xs text-[#1C1C18] focus:outline-none"
                      />
                      <label className="px-3 py-2 rounded-xl bg-[#EADDFB] hover:bg-[#6D3ACD] hover:text-white text-[#350463] font-bold text-xs cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(e, 'supply')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-between mt-4">
                    <span className="text-xs text-[#4B4450] font-mono">
                      Costo: ${calculatedSupplyUnitCost} / {sUnit}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRegisterModal(false)}
                        className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#F0EEE7]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-black text-xs shadow-xs active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Archive className="w-4 h-4" />
                        <span>{isSaving ? 'Guardando...' : 'Guardar Insumo en Almacén'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL BÁSCULA DIGITAL UNIFICADO (REQ 3) */}
      {scaleModalSpool && (
        <ScaleCalibrationModal
          spool={scaleModalSpool}
          onClose={() => setScaleModalSpool(null)}
        />
      )}

      {/* 7. MODAL HISTORIAL DE COMPRAS & REABASTECIMIENTO (REQ 4) */}
      {historyModalTarget && (
        <PurchaseHistoryModal
          itemType={historyModalTarget.type}
          filament={historyModalTarget.filament}
          supply={historyModalTarget.supply}
          onClose={() => setHistoryModalTarget(null)}
        />
      )}

      {/* 8. MODAL EDITAR BOBINA DE FILAMENTO */}
      {editingSpool && (
        <EditSpoolModal
          spool={editingSpool}
          onClose={() => setEditingSpool(null)}
        />
      )}

      {/* 9. MODAL EDITAR INSUMO DE ALMACÉN */}
      {editingSupply && (
        <EditSupplyModal
          supply={editingSupply}
          onClose={() => setEditingSupply(null)}
        />
      )}

      {/* 10. MODAL GESTIONAR CATEGORÍAS */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#CDC3D2]/30 bg-[#FAF7F0] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#350463]">📂 Organizar Categorías</h2>
                <p className="text-xs text-gray-500">Puedes usar "Carpeta/Subcarpeta" para anidar.</p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EADDFB] text-[#6D3ACD] hover:bg-[#D5BDFC] transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej. Embalaje/Bolsas"
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#CDC3D2] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      e.preventDefault();
                      if (!inventoryCategories.includes(newCategoryName.trim())) {
                        updateSettings({ inventoryCategories: [...inventoryCategories, newCategoryName.trim()] });
                        setNewCategoryName('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategoryName.trim() && !inventoryCategories.includes(newCategoryName.trim())) {
                      updateSettings({ inventoryCategories: [...inventoryCategories, newCategoryName.trim()] });
                      setNewCategoryName('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6D3ACD] text-white font-bold text-sm"
                >
                  Añadir
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {inventoryCategories.map(cat => (
                  <div key={cat} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <span className="font-semibold text-sm text-gray-800">{cat}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const confirmDelete = window.confirm(`¿Eliminar la categoría "${cat}"?`);
                        if (confirmDelete) {
                          updateSettings({ inventoryCategories: inventoryCategories.filter(c => c !== cat) });
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-[#CDC3D2]/30 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-[#EADDFB] text-[#350463] font-bold text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
