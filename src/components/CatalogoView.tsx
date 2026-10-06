import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { CatalogRecipe, BomItem } from '../types';
import {
  Sparkles,
  Zap,
  Clock,
  Scale,
  Layers,
  Search,
  ArrowRight,
  X,
  Tag,
  CheckCircle,
  Thermometer,
  Plus,
  Download,
  Edit3,
  Trash2,
  MoreVertical,
  Upload,
  Check,
  ChevronDown,
  Palette,
  ExternalLink,
  DollarSign,
  Package,
  Wrench,
  Globe,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  Folder,
} from 'lucide-react';

// Categorías dinámicas desde settings
const BED_TYPES = [
  'PEI Texturizada',
  'PEI Lisa',
  'Placa Alta Temperatura',
  'Placa Satinada',
  'Placa Ingeniería',
] as const;
const INFILL_PATTERNS = ['Gyroide', 'Rejilla', 'Panal', 'Rectilíneo', 'Líneas', 'Cúbico'] as const;

export const CatalogoView: React.FC = () => {
  const {
    catalog,
    savedQuotations,
    orders,
    filaments,
    warehouseSupplies,
    settings,
    loadRecipeIntoCotizador,
    addCatalogRecipe,
    updateCatalogRecipe,
    deleteCatalogRecipe,
    updateSettings,
  } = useWorkshop();

  const categoriesList = settings.catalogCategories || ['Decoración', 'Iluminación', 'Corporativo', 'Mecánico / Funcional', 'Médico'];

  // 1. Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRecipeForDrawer, setSelectedRecipeForDrawer] = useState<CatalogRecipe | null>(null);

  // 2. Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerTab, setRegisterTab] = useState<'import' | 'manual'>('import');
  const [editingRecipe, setEditingRecipe] = useState<CatalogRecipe | null>(null);
  
  // Category Manager State
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 3. Card context menu state
  const [activeMenuRecipeId, setActiveMenuRecipeId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuRecipeId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Form State (Secciones A, B, C, D)
  const [importSearchQuery, setImportSearchQuery] = useState('');
  const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<'quotation' | 'order' | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // General info
  const [formTitle, setFormTitle] = useState('Set Macetas Modulares Facetadas');
  const [formSubtitle, setFormSubtitle] = useState('Set de 3 piezas encajables con diseño geométrico y autorriego');
  const [formCategory, setFormCategory] = useState<CatalogRecipe['category']>('Decoración');
  const [formDescription, setFormDescription] = useState(
    'Modelo optimizado para fabricación en serie con costuras alineadas en aristas vivas y sin necesidad de soportes. Excelente rigidez estructural y acabado superficial prémium.'
  );
  const [formImageUrl, setFormImageUrl] = useState(
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80'
  );
  const [formDimensions, setFormDimensions] = useState('14 x 14 x 16 cm (Set 3 piezas)');
  const [formTags, setFormTags] = useState<string[]>(['Macetas', 'Geométrico', 'Decoración', 'Bambu A1']);
  const [newTagInput, setNewTagInput] = useState('');

  // Sección A: Parámetros de Impresión y Slicer Calibrados
  const [formEstimatedHours, setFormEstimatedHours] = useState('4.5');
  const [formBedType, setFormBedType] = useState<string>('PEI Texturizada');
  const [formLayerHeight, setFormLayerHeight] = useState('0.20 mm');
  const [formInfill, setFormInfill] = useState('15%');
  const [formInfillPattern, setFormInfillPattern] = useState<string>('Gyroide');
  const [formNozzleTemp, setFormNozzleTemp] = useState('220°C');
  const [formBedTemp, setFormBedTemp] = useState('65°C');
  const [formRecommendedFilaments, setFormRecommendedFilaments] = useState<
    { name: string; hex: string; grams: number; material?: string }[]
  >([
    { name: 'SUNLU PETG Blanco Puro', hex: '#FFFFFF', grams: 110, material: 'PETG' },
    { name: 'eSUN PETG Terracota', hex: '#A0522D', grams: 70, material: 'PETG' },
  ]);

  // Sección B: Insumos de Ensamble & BOM
  const [formBomItems, setFormBomItems] = useState<BomItem[]>([
    { id: 'bom-1', name: 'Caja Kraft Protección 15x15cm', quantity: 1, unitCost: 12.5 },
    { id: 'bom-2', name: 'Insertos de Goma Antiderrapante', quantity: 4, unitCost: 2.0 },
  ]);
  const [selectedSupplyToAdd, setSelectedSupplyToAdd] = useState<string>('');

  // Sección C: Mano de Obra y Servicios Manuales
  const [formManualHours, setFormManualHours] = useState('0.25');
  const [formLaborRate, setFormLaborRate] = useState((settings.laborRatePerHour || 50).toString());

  // Sección D: Reglas de Rentabilidad y Precios
  const [formMarginPercent, setFormMarginPercent] = useState('35');
  const [formSuggestedPrice, setFormSuggestedPrice] = useState('380.00');
  const [formIsPublishedInStore, setFormIsPublishedInStore] = useState(true);

  // Live calculations for financial breakdown (REQ 2D)
  const financialMetrics = useMemo(() => {
    const hours = parseFloat(formEstimatedHours) || 0;
    const filamentCost = formRecommendedFilaments.reduce(
      (acc, f) => acc + (f.grams || 0) * 0.45,
      0
    );
    const cfeCost = hours * ((settings.printerWatts || 120) / 1000) * (settings.cfeRatePerKwh || 2.2);
    const amortCost =
      hours * (settings.activePrinter?.hourlyRate || 45) * ((settings.maintenanceFundPercent || 8) / 100);
    const bomCost = formBomItems.reduce((acc, b) => acc + (b.quantity || 0) * (b.unitCost || 0), 0);
    const laborCost = (parseFloat(formManualHours) || 0) * (parseFloat(formLaborRate) || 50);

    const directCost = filamentCost + cfeCost + amortCost + bomCost + laborCost;
    const margin = parseFloat(formMarginPercent) || 0;

    let autoPrice = 0;
    if (margin > 80) {
      autoPrice = directCost * (1 + margin / 100);
    } else {
      autoPrice = margin < 100 ? directCost / Math.max(0.01, 1 - margin / 100) : directCost * 2;
    }

    const netProfit = (parseFloat(formSuggestedPrice) || autoPrice) - directCost;
    const profitPerHour = hours > 0 ? netProfit / hours : netProfit;
    const isMinProfitValid = profitPerHour >= 10.5 && netProfit >= directCost * 0.15;

    return {
      filamentCost,
      cfeCost,
      amortCost,
      bomCost,
      laborCost,
      directCost,
      autoPrice,
      netProfit,
      profitPerHour,
      isMinProfitValid,
    };
  }, [
    formEstimatedHours,
    formRecommendedFilaments,
    formBomItems,
    formManualHours,
    formLaborRate,
    formMarginPercent,
    formSuggestedPrice,
    settings,
  ]);

  // Sourcing list for predictive search in Import mode
  const importableSources = useMemo(() => {
    const query = importSearchQuery.toLowerCase().trim();
    const quoteItems = savedQuotations.map((q) => ({
      type: 'quotation' as const,
      id: q.id,
      folio: q.folio,
      title: q.projectName || q.models?.[0]?.pieceTitle || 'Cotización',
      clientName: q.clientName,
      date: q.date,
      hours: q.totalHours || q.models?.[0]?.printHours || 3,
      grams: q.models?.reduce((acc, m) => acc + (m.amsSlots || []).reduce((s, a) => s + (a.grams || 0), 0), 0) || 150,
      price: q.total || 350,
      models: q.models || [],
      bomItems: q.bomItems || [],
      draftData: q.draftData,
    }));

    const orderItems = orders.map((o) => ({
      type: 'order' as const,
      id: o.id,
      folio: o.folio,
      title: o.title,
      clientName: o.clientName,
      date: o.deliveryDate,
      hours: o.printHours || 2,
      grams: o.filamentUsedGrams || 100,
      price: o.totalPrice || 250,
      models: o.models || [],
      bomItems: o.bomItems || [],
      filamentColors: o.filamentColors || [],
    }));

    const all = [...quoteItems, ...orderItems];
    if (!query) return all.slice(0, 8);
    return all.filter(
      (item) =>
        item.folio.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.clientName.toLowerCase().includes(query)
    );
  }, [savedQuotations, orders, importSearchQuery]);

  // Handle selecting a quotation/order to import
  const handleSelectImportSource = (source: typeof importableSources[0]) => {
    setSelectedSourceType(source.type);
    setSelectedSourceId(source.id);
    setIsImportDropdownOpen(false);

    // Auto-populate fields
    const productTitle = source.title;
    setFormTitle(productTitle);
    setFormSubtitle(`Modelo probado con éxito en ${source.folio} (${source.clientName})`);
    setFormEstimatedHours(source.hours.toString());
    setFormSuggestedPrice(source.price.toString());
    setFormMarginPercent('35');

    // Auto-determine Category
    const titleLower = productTitle.toLowerCase();
    if (titleLower.includes('luz') || titleLower.includes('led') || titleLower.includes('lámpara')) {
      setFormCategory('Iluminación');
    } else if (titleLower.includes('trofeo') || titleLower.includes('corporativo') || titleLower.includes('stand')) {
      setFormCategory('Corporativo');
    } else if (titleLower.includes('soporte') || titleLower.includes('engranaje') || titleLower.includes('brazo')) {
      setFormCategory('Mecánico / Funcional');
    } else {
      setFormCategory('Decoración');
    }

    // Extract filaments if available
    if (source.models && source.models.length > 0) {
      const primaryModel = source.models[0];
      const slots = primaryModel.amsSlots || [];
      if (slots.length > 0) {
        setFormRecommendedFilaments(
          slots.map((s) => ({
            name: s.name || `${s.material} Color`,
            hex: s.colorHex || '#4C237A',
            grams: s.grams || 50,
            material: s.material || 'PETG',
          }))
        );
      }
      if (primaryModel.bedType) {
        const bedMap: Record<string, string> = {
          textured_pei: 'PEI Texturizada',
          smooth_pei: 'PEI Lisa',
          high_temp: 'Placa Alta Temperatura',
          engineering_cold: 'Placa Ingeniería',
        };
        setFormBedType(bedMap[primaryModel.bedType] || 'PEI Texturizada');
      }
      if (primaryModel.bomItems && primaryModel.bomItems.length > 0) {
        setFormBomItems(primaryModel.bomItems);
      }
    } else if (source.bomItems && source.bomItems.length > 0) {
      setFormBomItems(source.bomItems);
    }

    setFormTags(['Validado en Taller', source.folio, source.clientName.split(' ')[0]]);
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Tag helper
  const handleAddTag = () => {
    if (newTagInput.trim() && !formTags.includes(newTagInput.trim())) {
      setFormTags([...formTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter((t) => t !== tagToRemove));
  };

  // Filament Slot Helpers
  const handleAddFilamentSlot = () => {
    setFormRecommendedFilaments((prev) => [
      ...prev,
      { name: 'PETG Color Adicional', hex: '#6D3ACD', grams: 30, material: 'PETG' },
    ]);
  };

  const handleRemoveFilamentSlot = (idx: number) => {
    setFormRecommendedFilaments((prev) => prev.filter((_, i) => i !== idx));
  };

  // BOM Items Helpers
  const handleAddBomItemFromSupply = () => {
    if (!selectedSupplyToAdd) return;
    const supply = warehouseSupplies.find((s) => s.id === selectedSupplyToAdd);
    if (supply) {
      setFormBomItems((prev) => [
        ...prev,
        {
          id: `bom-${Date.now()}`,
          name: `${supply.name} ${supply.spec || ''}`.trim(),
          quantity: 1,
          unitCost: supply.cost,
          sku: supply.sku,
        },
      ]);
      setSelectedSupplyToAdd('');
    }
  };

  const handleAddCustomBomItem = () => {
    setFormBomItems((prev) => [
      ...prev,
      {
        id: `bom-${Date.now()}`,
        name: 'Insumo Físico Extra',
        quantity: 1,
        unitCost: 10.0,
      },
    ]);
  };

  const handleRemoveBomItem = (id: string) => {
    setFormBomItems((prev) => prev.filter((b) => b.id !== id));
  };

  // Handle Save Recipe (Create or Edit)
  const handleSaveRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSku = `REC-${formCategory.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalGramsCalc = formRecommendedFilaments.reduce((acc, f) => acc + (f.grams || 0), 0);

    const recipePayload = {
      title: formTitle.trim(),
      subtitle: formSubtitle.trim(),
      category: formCategory,
      description: formDescription.trim(),
      estimatedHours: parseFloat(formEstimatedHours) || 1,
      estimatedGrams: totalGramsCalc || 50,
      suggestedPrice: parseFloat(formSuggestedPrice) || financialMetrics.autoPrice || 100,
      marginPercent: parseFloat(formMarginPercent) || 30,
      imageUrl:
        formImageUrl.trim() ||
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80',
      tags: formTags,
      layerHeight: formLayerHeight,
      infill: formInfill,
      infillPattern: formInfillPattern,
      nozzleTemp: formNozzleTemp,
      bedTemp: formBedTemp,
      bedType: formBedType,
      materials: Array.from(new Set(formRecommendedFilaments.map((f) => f.material || 'PETG'))),
      recommendedFilaments: formRecommendedFilaments,
      bomItems: formBomItems,
      manualHours: parseFloat(formManualHours) || 0,
      laborRate: parseFloat(formLaborRate) || 50,
      directCost: Number(financialMetrics.directCost.toFixed(2)),
      isPublishedInStore: formIsPublishedInStore,
      dimensions: formDimensions,
    };

    if (editingRecipe) {
      updateCatalogRecipe(editingRecipe.id, recipePayload);
      setEditingRecipe(null);
    } else {
      addCatalogRecipe({
        ...recipePayload,
        sku: newSku,
        salesCount: 0,
      });
      setIsRegisterModalOpen(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (recipe: CatalogRecipe) => {
    setEditingRecipe(recipe);
    setFormTitle(recipe.title);
    setFormSubtitle(recipe.subtitle);
    setFormCategory(recipe.category);
    setFormDescription(recipe.description);
    setFormEstimatedHours(recipe.estimatedHours.toString());
    setFormSuggestedPrice(recipe.suggestedPrice.toString());
    setFormMarginPercent(recipe.marginPercent.toString());
    setFormImageUrl(recipe.imageUrl);
    setFormLayerHeight(recipe.layerHeight);
    setFormInfill(recipe.infill);
    setFormInfillPattern(recipe.infillPattern || 'Gyroide');
    setFormNozzleTemp(recipe.nozzleTemp);
    setFormBedTemp(recipe.bedTemp);
    setFormBedType(recipe.bedType || 'PEI Texturizada');
    setFormRecommendedFilaments(recipe.recommendedFilaments || []);
    setFormBomItems(recipe.bomItems || []);
    setFormManualHours((recipe.manualHours || 0.2).toString());
    setFormLaborRate((recipe.laborRate || 50).toString());
    setFormIsPublishedInStore(recipe.isPublishedInStore !== false);
    setFormDimensions(recipe.dimensions || '15 x 15 x 15 cm');
    setFormTags(recipe.tags);
  };

  // Filter Catalog items
  const filteredCatalog = useMemo(() => {
    return catalog.filter((recipe) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        recipe.title.toLowerCase().includes(q) ||
        recipe.subtitle.toLowerCase().includes(q) ||
        recipe.sku.toLowerCase().includes(q) ||
        recipe.tags.some((t) => t.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (selectedCategory !== 'all') return recipe.category === selectedCategory;
      return true;
    });
  }, [catalog, searchTerm, selectedCategory]);

  return (
    <div className="w-full flex flex-col gap-6 py-4 max-w-[1720px] mx-auto">
      {/* 1. HEADER SECTION CON BOTÓN PRINCIPAL Y CONTADOR DINÁMICO (REQ 1) */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#6D3ACD]" />
              Biblioteca de Modelos 3D & Recetas de Fabricación
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#350463] tracking-tight">
            Catálogo & Recetas de Producción
          </h1>
          <p className="text-xs lg:text-sm text-[#4B4450]">
            Archivos pre-laminados, parámetros calibrados en Bambu Lab A1, insumos BOM y costeo directo en 1 clic.
          </p>
        </div>

        {/* Botón Principal y Badge Dinámico (REQ 1) */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs px-3.5 py-2 rounded-2xl bg-white border border-[#CDC3D2]/40 text-[#350463] font-bold shadow-2xs">
            {catalog.length} {catalog.length === 1 ? 'receta lista' : 'recetas listas'} para taller
          </span>

          <button
            type="button"
            onClick={() => {
              setRegisterTab('import');
              setIsRegisterModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-black text-xs shadow-xs active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Receta / Producto</span>
          </button>
        </div>
      </section>

      {/* 2. SEARCH & CATEGORIES */}
      <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-3xl shadow-xs border border-[#CDC3D2]/30">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B4450]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar modelo por nombre, etiqueta, SKU o categoría..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7F0] rounded-xl text-xs text-[#1C1C18] focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/30 border border-[#CDC3D2]/30 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 flex-1">
          {['all', ...categoriesList].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#350463] text-white shadow-xs'
                  : 'bg-[#F0EEE7] text-[#4B4450] hover:text-[#1C1C18]'
              }`}
            >
              {cat === 'all' ? `Todas (${catalog.length})` : cat}
            </button>
          ))}
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FAF7F0] text-[#6D3ACD] border border-[#6D3ACD]/30 hover:bg-[#EADDFB] transition-all whitespace-nowrap"
          >
            ⚙️ Organizar
          </button>
        </div>
      </section>

      {/* 3. CATALOG CARDS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {filteredCatalog.map((item) => {
          const isMenuOpen = activeMenuRecipeId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between border border-[#CDC3D2]/30 group relative"
            >
              <div>
                {/* Product Image */}
                <div className="w-full h-44 rounded-2xl overflow-hidden relative bg-[#FAF7F0] mb-4 border border-[#CDC3D2]/30">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#350463]/85 backdrop-blur-xs text-[#C0F441] text-[10px] font-bold shadow-xs">
                    {item.category}
                  </span>
                  <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/95 text-[#350463] text-[10px] font-mono font-bold shadow-xs">
                    {item.sku}
                  </span>

                  {item.isPublishedInStore !== false && (
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#2E3F00]/90 text-[#C0F441] text-[9px] font-bold shadow-xs flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" /> En Tienda
                    </span>
                  )}

                  {/* Context Menu */}
                  <div className="absolute top-2.5 left-2.5" ref={isMenuOpen ? menuRef : null}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuRecipeId(isMenuOpen ? null : item.id);
                      }}
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#350463] flex items-center justify-center shadow-md transition-all cursor-pointer"
                      title="Opciones de receta"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute left-0 top-8 bg-white rounded-2xl shadow-2xl border border-[#CDC3D2]/50 w-48 z-30 p-1.5 space-y-1 animate-in fade-in zoom-in-95 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuRecipeId(null);
                            handleOpenEditModal(item);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left font-bold text-[#1C1C18] hover:bg-[#EADDFB] hover:text-[#350463] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#6D3ACD]" />
                          <span>✏️ Editar Receta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuRecipeId(null);
                            if (window.confirm(`¿Eliminar la receta "${item.title}" del catálogo?`)) {
                              deleteCatalogRecipe(item.id);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left font-bold text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#BA1A1A]" />
                          <span>🗑️ Eliminar del Catálogo</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <h2 className="text-base font-bold text-[#350463] leading-snug group-hover:text-[#6D3ACD] transition-colors line-clamp-1" title={item.title}>
                  {item.title}
                </h2>
                <p className="text-xs text-[#4B4450] mt-1 line-clamp-2 leading-relaxed">
                  {item.subtitle}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {item.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-[#FAF7F0] text-[#350463] text-[10px] font-semibold border border-[#E5E2DB]"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-[10px] text-[#4B4450] font-bold self-center">
                      +{item.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Technical specs strip */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-[#FAF7F0] text-xs text-[#4B4450] border border-[#E5E2DB]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#6D3ACD]" />
                    <span>
                      Tiempo: <strong className="text-[#350463] font-bold">{item.estimatedHours}h</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-[#6D3ACD]" />
                    <span>
                      Gramos: <strong className="text-[#350463] font-bold">{item.estimatedGrams}g</strong>
                    </span>
                  </div>
                </div>

                {/* Price & Margin */}
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-[#4B4450] uppercase font-bold block">
                      Precio Sugerido
                    </span>
                    <span className="text-xl font-extrabold text-[#350463] font-mono">
                      ${item.suggestedPrice.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-[#4B4450]">MXN</span>
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold">
                    +{item.marginPercent}% neto
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 pt-3 border-t border-[#F0EEE7] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => loadRecipeIntoCotizador(item)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-black text-xs shadow-xs active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>⚡ Cargar Directo en Cotizador Activo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRecipeForDrawer(item)}
                  className="w-full py-1.5 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#F0EEE7] text-[#350463] font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Ver Ficha Técnica Completa</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6D3ACD]" />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. DRAWER DUAL DE ALTA: ENRIQUECIMIENTO TOTAL (REQ 2 & 3) */}
      {(isRegisterModalOpen || editingRecipe) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center font-bold shadow-xs">
                  {editingRecipe ? <Edit3 className="w-5 h-5 text-[#6D3ACD]" /> : <Plus className="w-5 h-5 text-[#6D3ACD]" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#350463]">
                    {editingRecipe ? 'Editar Receta de Fabricación' : 'Crear / Importar Receta de Producción'}
                  </h3>
                  <span className="text-[11px] text-[#4B4450]">
                    {editingRecipe
                      ? `Modificando ${editingRecipe.sku}`
                      : 'Profundidad técnica, parámetros de corte y desglose financiero de taller'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setEditingRecipe(null);
                }}
                className="p-2 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

              {/* Tab selector */}
              {!editingRecipe && (
                <div className="grid grid-cols-2 gap-2 my-4 bg-[#FAF7F0] p-1.5 rounded-2xl border border-[#CDC3D2]/40">
                  <button
                    type="button"
                    onClick={() => setRegisterTab('import')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      registerTab === 'import'
                        ? 'bg-[#350463] text-white shadow-xs'
                        : 'text-[#4B4450] hover:text-[#1C1C18]'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>📥 Importar desde Cotización / Taller (Recomendado)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterTab('manual')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      registerTab === 'manual'
                        ? 'bg-[#350463] text-white shadow-xs'
                        : 'text-[#4B4450] hover:text-[#1C1C18]'
                    }`}
                  >
                    <span>✍️ Registro Manual desde Cero</span>
                  </button>
                </div>
              )}

              {/* Predictive search selector */}
              {!editingRecipe && registerTab === 'import' && (
                <div className="mb-4 p-3.5 rounded-2xl bg-[#EADDFB]/30 border border-[#6D3ACD]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#350463] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#6D3ACD]" />
                      <span>Buscar cotización u orden terminada para auto-completar:</span>
                    </span>
                    {selectedSourceId && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Datos Precargados
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={importSearchQuery}
                      onFocus={() => setIsImportDropdownOpen(true)}
                      onChange={(e) => {
                        setImportSearchQuery(e.target.value);
                        setIsImportDropdownOpen(true);
                      }}
                      placeholder="Escribe folio (ej. COTZ-2026-00018) o cliente/proyecto..."
                      className="w-full px-3 py-2 pl-9 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-bold text-[#350463] focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/30"
                    />
                    <Search className="w-4 h-4 text-[#4B4450] absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B4450]"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isImportDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isImportDropdownOpen && (
                    <div className="bg-white rounded-2xl shadow-xl border border-[#CDC3D2]/50 max-h-52 overflow-y-auto p-1.5 space-y-1 z-40">
                      <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[#4B4450] border-b border-[#F0EEE7]">
                        Fuentes Disponibles ({importableSources.length})
                      </div>
                      {importableSources.length === 0 ? (
                        <div className="p-3 text-center text-xs text-[#4B4450]">
                          No se encontraron cotizaciones u órdenes con ese término.
                        </div>
                      ) : (
                        importableSources.map((item) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => handleSelectImportSource(item)}
                            className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                              selectedSourceId === item.id ? 'bg-[#EADDFB] text-[#350463]' : 'hover:bg-[#FAF7F0] text-[#1C1C18]'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#350463]">{item.folio}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAF7F0] text-[#4B4450] font-bold">
                                  {item.type === 'quotation' ? 'Cotización' : 'Orden Taller'}
                                </span>
                              </div>
                              <span className="font-bold text-xs truncate text-[#1C1C18]">{item.title}</span>
                              <span className="text-[10px] text-[#4B4450] truncate">{item.clientName}</span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-bold text-[#350463] font-mono block">${item.price.toFixed(2)}</span>
                              <span className="text-[10px] text-[#4B4450]">{item.hours}h</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* COMPLETE ENRICHED FORM */}
              <form onSubmit={handleSaveRecipeSubmit} className="space-y-4 text-xs">
                {/* 1. INFORMACIÓN GENERAL & IMAGEN */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#350463] uppercase tracking-wider block text-[11px]">
                      1. Información del Producto & Tienda
                    </span>
                    {/* TOGGLE TIENDA WEB (REQ 2D) */}
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-xl border border-[#CDC3D2]/40">
                      <input
                        type="checkbox"
                        checked={formIsPublishedInStore}
                        onChange={(e) => setFormIsPublishedInStore(e.target.checked)}
                        className="rounded text-[#6D3ACD] focus:ring-[#6D3ACD]"
                      />
                      <Globe className="w-3.5 h-3.5 text-[#6D3ACD]" />
                      <span className="font-bold text-[11px] text-[#350463]">
                        {formIsPublishedInStore ? '🌐 Publicado en Tienda Web' : '🔒 Sólo Catálogo Interno'}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-[#1C1C18] block mb-1">Nombre del Producto / Modelo</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        required
                        placeholder="ej. Set Macetas Modulares Facetadas"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 font-bold text-[#1C1C18] text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Categoría</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 font-bold text-[#350463] text-xs focus:outline-none cursor-pointer"
                      >
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Subtítulo / Resumen</label>
                      <input
                        type="text"
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        required
                        placeholder="ej. Set de 3 piezas encajables con autorriego"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-[#1C1C18] text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Dimensiones Físicas</label>
                      <input
                        type="text"
                        value={formDimensions}
                        onChange={(e) => setFormDimensions(e.target.value)}
                        placeholder="ej. 14 x 14 x 16 cm"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-[#1C1C18] text-xs focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Imagen URL / Foto</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs text-[#1C1C18] focus:outline-none font-mono"
                        />
                        <label className="px-3 py-2 rounded-xl bg-[#EADDFB] hover:bg-[#6D3ACD] hover:text-white text-[#350463] font-bold text-xs cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Etiquetas (Tags)</label>
                      <div className="flex flex-wrap gap-1.5 items-center p-1.5 rounded-xl bg-white border border-[#CDC3D2]/50">
                        {formTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] text-[10px] font-bold flex items-center gap-1"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-[#BA1A1A]"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          placeholder="+ Tag..."
                          className="text-[11px] px-2 py-0.5 bg-transparent focus:outline-none text-[#1C1C18] min-w-[70px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN A: PARÁMETROS DE IMPRESIÓN Y SLICER CALIBRADOS (REQ 2A) */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#350463] uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#6D3ACD]" />
                      <span>Sección A: Parámetros de Impresión & Slicer Calibrados</span>
                    </span>
                    <span className="text-[10px] text-[#4B4450] font-mono">Bambu Lab A1 Ready</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Horas Máquina (hrs)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formEstimatedHours}
                        onChange={(e) => setFormEstimatedHours(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 font-mono font-bold text-[#350463] text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Tipo de Cama PEI</label>
                      <select
                        value={formBedType}
                        onChange={(e) => setFormBedType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 font-bold text-[#350463] text-xs focus:outline-none cursor-pointer"
                      >
                        {BED_TYPES.map((bt) => (
                          <option key={bt} value={bt}>
                            {bt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Altura de Capa</label>
                      <input
                        type="text"
                        value={formLayerHeight}
                        onChange={(e) => setFormLayerHeight(e.target.value)}
                        placeholder="0.20 mm"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Patrón & Infill %</label>
                      <div className="grid grid-cols-2 gap-1">
                        <select
                          value={formInfillPattern}
                          onChange={(e) => setFormInfillPattern(e.target.value)}
                          className="px-1.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 text-[10px] font-bold text-[#1C1C18]"
                        >
                          {INFILL_PATTERNS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={formInfill}
                          onChange={(e) => setFormInfill(e.target.value)}
                          placeholder="15%"
                          className="px-1.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs text-[#1C1C18] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Temp Boquilla</label>
                      <input
                        type="text"
                        value={formNozzleTemp}
                        onChange={(e) => setFormNozzleTemp(e.target.value)}
                        placeholder="220°C"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Temp Cama</label>
                      <input
                        type="text"
                        value={formBedTemp}
                        onChange={(e) => setFormBedTemp(e.target.value)}
                        placeholder="65°C"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs text-[#1C1C18] focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 flex items-end justify-between p-2 rounded-xl bg-[#EADDFB]/40 border border-[#6D3ACD]/20">
                      <span className="text-[11px] text-[#350463] font-bold">
                        Gramos Totales de Filamento:{' '}
                        <strong className="text-sm font-extrabold font-mono">
                          {formRecommendedFilaments.reduce((acc, f) => acc + (f.grams || 0), 0)}g
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddFilamentSlot}
                        className="px-2.5 py-1 rounded-lg bg-[#350463] text-white text-[10px] font-bold hover:bg-[#6D3ACD] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> + Ranura AMS
                      </button>
                    </div>
                  </div>

                  {/* Dynamic AMS Filament Slots */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#4B4450] block">
                      Ranuras de Filamentos AMS Asignadas:
                    </span>
                    {formRecommendedFilaments.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2 rounded-xl bg-white border border-[#CDC3D2]/40 flex flex-wrap items-center gap-2 justify-between"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <span className="w-5 h-5 rounded-full bg-[#350463] text-[#C0F441] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <input
                            type="color"
                            value={slot.hex}
                            onChange={(e) => {
                              const newSlots = [...formRecommendedFilaments];
                              newSlots[sIdx].hex = e.target.value;
                              setFormRecommendedFilaments(newSlots);
                            }}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => {
                              const newSlots = [...formRecommendedFilaments];
                              newSlots[sIdx].name = e.target.value;
                              setFormRecommendedFilaments(newSlots);
                            }}
                            placeholder="Nombre del filamento/bobina"
                            className="flex-1 px-2 py-1 rounded bg-[#FAF7F0] border border-[#CDC3D2]/30 text-xs font-semibold"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={slot.material || 'PETG'}
                            onChange={(e) => {
                              const newSlots = [...formRecommendedFilaments];
                              newSlots[sIdx].material = e.target.value;
                              setFormRecommendedFilaments(newSlots);
                            }}
                            className="px-2 py-1 rounded bg-[#FAF7F0] border border-[#CDC3D2]/30 text-xs font-bold text-[#350463]"
                          >
                            <option value="PLA+">PLA+</option>
                            <option value="PETG">PETG</option>
                            <option value="TPU">TPU</option>
                            <option value="ABS">ABS</option>
                            <option value="Nylon">Nylon</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={slot.grams}
                              onChange={(e) => {
                                const newSlots = [...formRecommendedFilaments];
                                newSlots[sIdx].grams = parseFloat(e.target.value) || 0;
                                setFormRecommendedFilaments(newSlots);
                              }}
                              className="w-16 px-2 py-1 rounded bg-[#FAF7F0] border border-[#CDC3D2]/30 text-xs font-mono font-bold text-right"
                            />
                            <span className="text-[10px] text-[#4B4450]">g</span>
                          </div>

                          {formRecommendedFilaments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFilamentSlot(sIdx)}
                              className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECCIÓN B: INSUMOS DE ENSAMBLE & COMPONENTES FÍSICOS (BOM) (REQ 2B) */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#350463] uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#6D3ACD]" />
                      <span>Sección B: Insumos de Ensamble & Componentes Físicos (BOM)</span>
                    </span>
                    <span className="text-[10px] text-[#2E3F00] font-bold bg-[#C0F441]/50 px-2 py-0.5 rounded-full">
                      Costo BOM: ${financialMetrics.bomCost.toFixed(2)} MXN
                    </span>
                  </div>

                  {/* Selector desde inventario o agregar libre */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={selectedSupplyToAdd}
                      onChange={(e) => setSelectedSupplyToAdd(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 text-xs font-semibold text-[#1C1C18]"
                    >
                      <option value="">Seleccionar insumo de almacén...</option>
                      {warehouseSupplies.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} ({sup.spec || sup.category}) — ${sup.cost.toFixed(2)}/{sup.unit} (Stock: {sup.stock})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddBomItemFromSupply}
                      disabled={!selectedSupplyToAdd}
                      className="px-3 py-1.5 rounded-xl bg-[#350463] text-white font-bold text-xs hover:bg-[#6D3ACD] disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Desde Almacén
                    </button>

                    <button
                      type="button"
                      onClick={handleAddCustomBomItem}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#CDC3D2] text-[#350463] font-bold text-xs hover:bg-[#EADDFB] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> + Personalizado
                    </button>
                  </div>

                  {/* Lista dinámica de BOM */}
                  {formBomItems.length === 0 ? (
                    <p className="text-[11px] text-[#4B4450] italic py-1">
                      No hay insumos físicos asignados a esta receta (sólo impresión directa).
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {formBomItems.map((bom, bIdx) => (
                        <div
                          key={bom.id || bIdx}
                          className="p-2 rounded-xl bg-white border border-[#CDC3D2]/40 flex items-center justify-between text-xs gap-2"
                        >
                          <input
                            type="text"
                            value={bom.name}
                            onChange={(e) => {
                              const newBom = [...formBomItems];
                              newBom[bIdx].name = e.target.value;
                              setFormBomItems(newBom);
                            }}
                            className="flex-1 px-2 py-1 rounded bg-[#FAF7F0] border border-[#CDC3D2]/30 text-xs font-semibold"
                          />

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-[#4B4450]">Cant:</span>
                              <input
                                type="number"
                                min="1"
                                value={bom.quantity}
                                onChange={(e) => {
                                  const newBom = [...formBomItems];
                                  newBom[bIdx].quantity = parseInt(e.target.value) || 1;
                                  setFormBomItems(newBom);
                                }}
                                className="w-12 px-1.5 py-1 rounded bg-[#FAF7F0] border border-[#CDC3D2]/30 text-xs font-mono font-bold text-center"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-[#4B4450]">Unit: $</span>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={bom.unitCost}
                                onChange={(e) => {
                                  const newBom = [...formBomItems];
                                  newBom[bIdx].unitCost = parseFloat(e.target.value) || 0;
                                  setFormBomItems(newBom);
                                }}
                                className="w-16 px-1.5 py-1 rounded bg-[#FAF7F0] border border-[#CDC3D2]/30 text-xs font-mono font-bold text-right"
                              />
                            </div>

                            <span className="text-xs font-mono font-bold text-[#350463] w-16 text-right">
                              =${(bom.quantity * bom.unitCost).toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveBomItem(bom.id)}
                              className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECCIÓN C: MANO DE OBRA Y SERVICIOS MANUALES (REQ 2C) */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#350463] uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-[#6D3ACD]" />
                      <span>Sección C: Mano de Obra & Post-Proceso Artesanal</span>
                    </span>
                    <span className="text-[10px] text-[#2E3F00] font-bold bg-[#C0F441]/50 px-2 py-0.5 rounded-full">
                      Costo Mano de Obra: ${financialMetrics.laborCost.toFixed(2)} MXN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">
                        Horas de Ensamble / Limpieza Requeridas (hrs)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={formManualHours}
                        onChange={(e) => setFormManualHours(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 font-mono font-bold text-[#350463] text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">
                        Tarifa de Mano de Obra Aplicada ($/hr)
                      </label>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={formLaborRate}
                        onChange={(e) => setFormLaborRate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 font-mono font-bold text-[#1C1C18] text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN D: REGLAS DE RENTABILIDAD Y PRECIOS EN VIVO (REQ 2D) */}
                <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-[#FAF7F0] to-[#F3EEFA] border border-[#6D3ACD]/30 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#350463] uppercase tracking-wider block text-xs flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#6D3ACD]" />
                      <span>Sección D: Reglas de Rentabilidad & Desglose Financiero de Taller</span>
                    </span>
                    {financialMetrics.isMinProfitValid ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#2E3F00]" /> Rentabilidad Taller Validada (&gt;$10.50/hr)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Margen Bajo (&lt;$10.50/hr)
                      </span>
                    )}
                  </div>

                  {/* Resumen de Costo Directo */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl bg-white border border-[#CDC3D2]/40 text-center">
                    <div>
                      <span className="text-[10px] text-[#4B4450] block">Filamento</span>
                      <span className="font-mono font-bold text-xs text-[#1C1C18]">
                        ${financialMetrics.filamentCost.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4B4450] block">Luz CFE</span>
                      <span className="font-mono font-bold text-xs text-[#1C1C18]">
                        ${financialMetrics.cfeCost.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4B4450] block">Amort. Máquina</span>
                      <span className="font-mono font-bold text-xs text-[#1C1C18]">
                        ${financialMetrics.amortCost.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4B4450] block">Insumos BOM</span>
                      <span className="font-mono font-bold text-xs text-[#1C1C18]">
                        ${financialMetrics.bomCost.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4B4450] block">Mano de Obra</span>
                      <span className="font-mono font-bold text-xs text-[#1C1C18]">
                        ${financialMetrics.laborCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#350463] text-white">
                    <span className="text-xs font-bold">Costo Directo Total de Taller:</span>
                    <span className="font-mono font-extrabold text-sm text-[#C0F441]">
                      ${financialMetrics.directCost.toFixed(2)} MXN
                    </span>
                  </div>

                  {/* Margen y Precio Sugerido */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Margen Deseado (%)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="1"
                          min="5"
                          value={formMarginPercent}
                          onChange={(e) => {
                            setFormMarginPercent(e.target.value);
                          }}
                          required
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 font-mono font-bold text-[#350463] text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormSuggestedPrice(financialMetrics.autoPrice.toFixed(2));
                          }}
                          className="px-2 py-1.5 bg-[#EADDFB] hover:bg-[#6D3ACD] hover:text-white rounded-xl text-[10px] font-bold text-[#350463] shrink-0"
                          title="Recalcular Precio según margen"
                        >
                          Auto
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Precio de Venta Sugerido ($ MXN)</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={formSuggestedPrice}
                        onChange={(e) => setFormSuggestedPrice(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 font-mono font-black text-[#2E3F00] text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1C18] block mb-1">Ganancia Neta / Hora</label>
                      <div className="px-2.5 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/50 flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#2E3F00]">
                          +${financialMetrics.netProfit.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#4B4450] font-mono font-bold">
                          (${financialMetrics.profitPerHour.toFixed(2)}/hr)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit & Cancel Footer */}
                <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-between">
                  <span className="text-xs text-[#4B4450]">
                    Se guardará con todos los parámetros técnicos y financieros sincronizados.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterModalOpen(false);
                        setEditingRecipe(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#F0EEE7] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-black text-xs shadow-xs active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingRecipe ? 'Guardar Cambios' : 'Guardar en Catálogo'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. DRAWER LATERAL: FICHA TÉCNICA DE RECETA COMPLETA */}
      {selectedRecipeForDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EEE7]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-[#350463] text-[#C0F441] flex items-center justify-center font-bold text-xs shadow-xs">
                    REC
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#350463]">
                      Ficha Técnica de Fabricación
                    </h3>
                    <span className="text-[11px] text-[#4B4450] font-mono">{selectedRecipeForDrawer.sku}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecipeForDrawer(null)}
                  className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image banner */}
              <div className="w-full h-48 rounded-2xl overflow-hidden my-4 bg-[#FAF7F0] border border-[#CDC3D2]/40 relative">
                <img
                  src={selectedRecipeForDrawer.imageUrl}
                  alt={selectedRecipeForDrawer.title}
                  className="w-full h-full object-cover"
                />
                {selectedRecipeForDrawer.isPublishedInStore !== false && (
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-[#2E3F00] text-[#C0F441] text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <Globe className="w-3 h-3" /> Publicado en Tienda Web
                  </span>
                )}
              </div>

              <h2 className="text-xl font-extrabold text-[#350463]">{selectedRecipeForDrawer.title}</h2>
              <p className="text-xs text-[#4B4450] mt-1 leading-relaxed">
                {selectedRecipeForDrawer.description}
              </p>

              {/* Slicing Specifications */}
              <div className="my-4 p-4 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-xs space-y-2.5">
                <span className="font-bold text-[#350463] uppercase tracking-wider block">
                  Parámetros de Corte Calibrados
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#4B4450]">Altura de Capa:</span>{' '}
                    <strong className="text-[#350463]">{selectedRecipeForDrawer.layerHeight}</strong>
                  </div>
                  <div>
                    <span className="text-[#4B4450]">Patrón Infill:</span>{' '}
                    <strong className="text-[#350463]">
                      {selectedRecipeForDrawer.infillPattern || 'Gyroide'} ({selectedRecipeForDrawer.infill})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#4B4450]">Temp Boquilla:</span>{' '}
                    <strong className="text-[#350463]">{selectedRecipeForDrawer.nozzleTemp}</strong>
                  </div>
                  <div>
                    <span className="text-[#4B4450]">Temp Cama PEI:</span>{' '}
                    <strong className="text-[#350463]">{selectedRecipeForDrawer.bedTemp}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#4B4450]">Placa de Impresión:</span>{' '}
                    <strong className="text-[#350463]">{selectedRecipeForDrawer.bedType || 'PEI Texturizada'}</strong>
                  </div>
                </div>
              </div>

              {/* BOM Items */}
              {selectedRecipeForDrawer.bomItems && selectedRecipeForDrawer.bomItems.length > 0 && (
                <div className="my-4">
                  <span className="font-bold text-xs text-[#350463] uppercase tracking-wider block mb-2">
                    Componentes Físicos & BOM
                  </span>
                  <div className="space-y-1.5">
                    {selectedRecipeForDrawer.bomItems.map((bom, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-white border border-[#E5E2DB] flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-[#1C1C18]">{bom.quantity}x {bom.name}</span>
                        <span className="font-mono text-[#350463] font-bold">
                          ${(bom.quantity * bom.unitCost).toFixed(2)} MXN
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Filaments */}
              <div className="my-4">
                <span className="font-bold text-xs text-[#350463] uppercase tracking-wider block mb-2">
                  Filamentos Recomendados AMS
                </span>
                <div className="space-y-1.5">
                  {selectedRecipeForDrawer.recommendedFilaments.map((f, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-white border border-[#E5E2DB] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-[#CDC3D2]"
                          style={{ backgroundColor: f.hex }}
                        />
                        <span className="font-bold text-[#1C1C18]">{f.name} ({f.material || 'PETG'})</span>
                      </div>
                      <span className="font-mono text-[#350463] font-bold">{f.grams} g</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial strip */}
              <div className="my-4 p-3 rounded-2xl bg-[#EADDFB]/40 border border-[#6D3ACD]/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#4B4450] uppercase font-bold block">Precio de Venta</span>
                  <span className="text-lg font-black text-[#350463] font-mono">
                    ${selectedRecipeForDrawer.suggestedPrice.toFixed(2)} MXN
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-xl bg-[#C0F441] text-[#2E3F00] font-black">
                  +{selectedRecipeForDrawer.marginPercent}% Margen Neto
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0EEE7]">
              <button
                type="button"
                onClick={() => {
                  loadRecipeIntoCotizador(selectedRecipeForDrawer);
                  setSelectedRecipeForDrawer(null);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] font-black text-xs shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Cargar Directo en Cotizador Activo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL ORGANIZAR CATEGORÍAS */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1C1C18]/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-[#CDC3D2] w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#F0EEE7] flex items-center justify-between">
              <h3 className="font-extrabold text-[#350463] flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#6D3ACD]" />
                Organizar Categorías
              </h3>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="p-1 text-[#4B4450] hover:bg-[#F0EEE7] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim() && !categoriesList.includes(newCategoryName.trim())) {
                      updateSettings({ catalogCategories: [...categoriesList, newCategoryName.trim()] });
                      setNewCategoryName('');
                    }
                  }}
                  placeholder="Nueva categoría..."
                  className="flex-1 px-3 py-2 bg-white border border-[#CDC3D2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]"
                />
                <button
                  onClick={() => {
                    if (newCategoryName.trim() && !categoriesList.includes(newCategoryName.trim())) {
                      updateSettings({ catalogCategories: [...categoriesList, newCategoryName.trim()] });
                      setNewCategoryName('');
                    }
                  }}
                  className="px-4 py-2 bg-[#350463] text-white font-bold rounded-xl text-sm hover:bg-[#4C237A]"
                >
                  Agregar
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {categoriesList.map(cat => (
                  <div key={cat} className="flex items-center justify-between p-2 bg-[#FAF7F0] border border-[#CDC3D2]/40 rounded-xl">
                    <span className="font-semibold text-[#1C1C18] text-sm">{cat}</span>
                    <button
                      onClick={() => {
                        updateSettings({ catalogCategories: categoriesList.filter(c => c !== cat) });
                        if (selectedCategory === cat) setSelectedCategory('all');
                      }}
                      className="text-[#BA1A1A] hover:bg-[#FFDAD6] p-1 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
