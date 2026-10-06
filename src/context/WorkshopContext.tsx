import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  FilamentSpool,
  KanbanOrder,
  FailureAudit,
  CatalogRecipe,
  WorkshopSettings,
  EcoLoopSilo,
  EcoProcessItem,
  EcoProductSale,
  CotizadorDraftData,
  CotizadorModelItem,
  BomItem,
  CustomServiceItem,
  AmsSlotItem,
  SavedQuotation,
  QuotationStatus,
  WarehouseSupplyItem,
  PurchaseRecord,
  CartItem,
  CustomQuoteSubmission,
  PrinterDevice,
  MaintenanceLog,
  PrinterSparePart,
  WorkshopOperatingBudget,
  CapexAsset,
  OpexFixedCost,
  HourlyConsumable,
} from '../types';
import { defaultOperatingBudget } from '../components/cotizador/OperatingBudgetModal';
import { auth, db, signInWithGoogle, logOut, testConnection } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

export type CotizadorDraft = CotizadorDraftData;

interface WorkshopContextType {
  activeTab: 'dashboard' | 'taller' | 'cotizador' | 'inventario' | 'catalogo' | 'tienda' | 'flota' | 'finanzas';
  setActiveTab: (tab: 'dashboard' | 'taller' | 'cotizador' | 'inventario' | 'catalogo' | 'tienda' | 'flota' | 'finanzas') => void;
  filaments: FilamentSpool[];
  orders: KanbanOrder[];
  failures: FailureAudit[];
  catalog: CatalogRecipe[];
  printers: PrinterDevice[];
  maintenanceLogs: MaintenanceLog[];
  spareParts: PrinterSparePart[];
  addPrinter: (printer: Omit<PrinterDevice, 'id'>) => void;
  updatePrinter: (id: string, updates: Partial<PrinterDevice>) => void;
  retirePrinter: (id: string, reason: string) => void;
  deletePrinterPermanently: (id: string) => void;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  addSparePart: (part: Omit<PrinterSparePart, 'id'>) => void;
  updateSparePart: (id: string, updates: Partial<PrinterSparePart>) => void;
  deleteSparePart: (id: string) => void;
  consumeSparePart: (id: string, qty?: number) => void;
  addCatalogRecipe: (recipe: Omit<CatalogRecipe, 'id'>) => void;
  updateCatalogRecipe: (id: string, updates: Partial<CatalogRecipe>) => void;
  deleteCatalogRecipe: (id: string) => void;
  submitWebOrder: (params: {
    items: CartItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    shippingMethod: 'uber_flash' | 'paqueteria' | 'counter';
    shippingCost: number;
    subtotal: number;
    vatAmount: number;
    total: number;
    stripePaymentId: string;
  }) => KanbanOrder;
  submitCustomWebQuote: (data: CustomQuoteSubmission) => SavedQuotation;
  settings: WorkshopSettings;
  ecoSilos: EcoLoopSilo[];
  ecoProcesses: EcoProcessItem[];
  ecoProducts: EcoProductSale[];
  user: User | null;
  cotizadorDraft: CotizadorDraft;
  setCotizadorDraft: React.Dispatch<React.SetStateAction<CotizadorDraft>>;
  // Gestión persistente de cotizaciones guardadas (REQ 4)
  savedQuotations: SavedQuotation[];
  getNextQuotationFolio: () => string;
  saveQuotation: (draft?: CotizadorDraftData, status?: QuotationStatus) => Promise<SavedQuotation>;
  loadQuotationIntoCotizador: (quote: SavedQuotation) => void;
  launchQuotationToWorkshop: (quote: SavedQuotation) => void;
  deleteSavedQuotation: (id: string) => void;
  duplicateQuotation: (quote: SavedQuotation) => Promise<SavedQuotation>;
  // Inter-screen action handlers
  addOrderFromCotizador: (customData?: Partial<KanbanOrder>) => void;
  loadRecipeIntoCotizador: (recipe: CatalogRecipe) => void;
  finishOrder: (orderId: string) => void;
  reportFailure: (report: {
    orderFolio: string;
    itemTitle: string;
    cause: FailureAudit['cause'];
    gramsLost: number;
    spoolId?: string;
    actionTaken: string;
  }) => void;
  createEcoBatch: (data: {
    siloIndex: number;
    productTitle: string;
    processType: EcoProcessItem['processType'];
    gramsUsed: number;
    unitsToProduce: number;
    unitPrice: number;
    operatingCost: number;
    description: string;
  }) => void;
  sellEcoProduct: (productId: string, units?: number) => void;
  liquidateBalance: (orderId: string, paymentMethod?: string, proofName?: string) => void;
  moveOrderStatus: (orderId: string, newStatus: KanbanOrder['status']) => void;
  updateOrder: (orderId: string, updates: Partial<KanbanOrder>) => void;
  registerNewSpool: (spool: Omit<FilamentSpool, 'id'>) => void;
  updateFilament: (id: string, updates: Partial<FilamentSpool>) => void;
  deleteFilament: (id: string) => void;
  addFilamentPurchase: (spoolId: string, purchase: Omit<PurchaseRecord, 'id'>) => void;
  calibrateSpoolWeight: (spoolId: string, grossWeightGrams: number, customTareGrams?: number) => void;
  warehouseSupplies: WarehouseSupplyItem[];
  addWarehouseSupply: (supply: Omit<WarehouseSupplyItem, 'id'>) => void;
  updateWarehouseSupply: (id: string, updates: Partial<WarehouseSupplyItem>) => void;
  deleteWarehouseSupply: (id: string) => void;
  restockWarehouseSupply: (id: string, purchase: Omit<PurchaseRecord, 'id'>) => void;
  
  capexAssets: CapexAsset[];
  addCapexAsset: (asset: Omit<CapexAsset, 'id'>) => void;
  deleteCapexAsset: (id: string) => void;

  opexFixedCosts: OpexFixedCost[];
  addOpexFixedCost: (cost: Omit<OpexFixedCost, 'id'>) => void;
  deleteOpexFixedCost: (id: string) => void;

  hourlyConsumables: HourlyConsumable[];
  addHourlyConsumable: (consumable: Omit<HourlyConsumable, 'id'>) => void;
  deleteHourlyConsumable: (id: string) => void;

  targetProductiveHoursPerMonth: number;
  setTargetProductiveHoursPerMonth: (hours: number) => void;
  calculateTotalOverheadPerHour: (horasProductivasMes?: number) => number;

  updateSettings: (newSettings: Partial<WorkshopSettings>) => void;
  resetAllDataToZero: () => void;
  handleGoogleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  notifications: string[];
  addNotification: (msg: string) => void;
  dismissNotification: (index: number) => void;
}

const defaultSettings: WorkshopSettings = {
  cfeRatePerKwh: 2.2,
  printerWatts: 120,
  laborRatePerHour: 50.0,
  maintenanceFundPercent: 8.0,
  defaultMarginPercent: 25.0,
  volumeDiscountPercent: 5.0,
  defaultPackagingCost: 15.0,
  vatRatePercent: 16.0,
  includeVat: true,
  operatingBudget: defaultOperatingBudget,
  catalogCategories: ['Decoración', 'Iluminación', 'Corporativo', 'Mecánico / Funcional', 'Médico'],
  inventoryCategories: ['Herrajes', 'Electrónica', 'Embalaje', 'Láminas Maquila', 'Fijación / Tornillería'],
  activePrinter: {
    id: 'IMP-3D-01',
    model: 'Sin Impresora Asignada',
    hourlyRate: 0.0,
    hoursThisMonth: 0.0,
    totalHours: 0.0,
    status: 'disponible',
    nozzleWearHours: 0,
    nozzleMaxHours: 300,
  },
};

const initialFilaments: FilamentSpool[] = [];

const initialWarehouseSupplies: WarehouseSupplyItem[] = [];

const initialOrders: KanbanOrder[] = [];

const initialFailures: FailureAudit[] = [];

const initialCatalog: CatalogRecipe[] = [];

const initialEcoSilos: EcoLoopSilo[] = [
  {
    id: 'silo-petg',
    material: 'Silo PETG (Color Mixto / Multicolor)',
    colorType: 'Prensado Térmico',
    currentGrams: 0,
    targetGrams: 2000,
  },
  {
    id: 'silo-pla',
    material: 'Silo PLA (Monocromático Blanco/Negro)',
    colorType: 'Fundición en Molde Rígido',
    currentGrams: 0,
    targetGrams: 1500,
  },
];

const initialEcoProcesses: EcoProcessItem[] = [];

const initialEcoProducts: EcoProductSale[] = [];

const defaultDraft: CotizadorDraft = {
  folio: 'COTZ-2026-00001',
  clientName: '',
  clientContact: '',
  projectName: '',
  pieceTitle: '',
  clientQty: 1,
  platesCount: 1,
  includeBuffer: false,
  bufferQty: 0,
  printHours: 0,
  purgaGrams: 0,
  failureRatePercent: 0,
  amsSlots: [
    {
      slot: 1,
      name: 'Filamento Principal',
      material: 'PLA',
      colorHex: '#FFFFFF',
      grams: 0,
      costPerGram: 0.28,
    },
  ],
  models: [
    {
      id: 'mod-1',
      pieceTitle: '',
      clientQty: 1,
      platesCount: 1,
      printHours: 0,
      printMinutes: 0,
      purgaGrams: 0,
      failureRatePercent: 0,
      includeBuffer: false,
      bufferQty: 0,
      dedicatedLaborHours: 0,
      bedType: 'textured_pei',
      modelUrl: '',
      localPath: '',
      amsSlots: [
        {
          slot: 1,
          name: 'Filamento Principal',
          material: 'PLA',
          colorHex: '#FFFFFF',
          grams: 0,
          costPerGram: 0.28,
        },
      ],
      notes: '',
      bomItems: [],
      customServices: [],
    },
  ],
  bomItems: [],
  customServices: [],
  services: {
    laserEngraving: false,
    vinylApp: false,
    ledHardware: false,
  },
  packagingType: 'caja_burbuja',
  packagingCost: 25.0,
  includeBusinessCard: true,
  businessCardCost: 3.5,
  includeSouvenir: true,
  souvenirCost: 8.0,
  includeStickers: true,
  stickersCost: 4.0,
  packagingItems: [{ id: 'pkg-default-1', name: 'Caja + Burbuja', cost: 25.0, chargeToClient: true }],
  extraItems: [{ id: 'ext-default-1', name: 'Tarjeta + Souvenir + Sticker', cost: 15.5, chargeToClient: false }],
  chargePackagingToClient: true,
  deliveryType: 'counter',
  deliveryCost: 0,
  requireInvoice: false,
  rfc: '',
  razonSocial: '',
  cfdiUsage: 'G03 - Gastos en general',
  taxRegime: '601 - General de Ley Personas Morales',
  paymentMethod: 'clip',
  transferPaymentFeeToClient: true,
  paymentScheme: '50_deposit',
  notes: '',
  workshopNotes: '',
};

const initialSavedQuotations: SavedQuotation[] = [];

const initialPrinters: PrinterDevice[] = [];

const initialMaintenanceLogs: MaintenanceLog[] = [];

const initialSpareParts: PrinterSparePart[] = [];

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'taller' | 'cotizador' | 'inventario' | 'catalogo' | 'tienda' | 'flota' | 'finanzas'>('dashboard');
  const [printers, setPrinters] = useState<PrinterDevice[]>(() => {
    try { const saved = localStorage.getItem('kimo_printers'); return saved ? JSON.parse(saved) : initialPrinters; } catch { return initialPrinters; }
  });
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    try { const saved = localStorage.getItem('kimo_maintenance_logs'); return saved ? JSON.parse(saved) : initialMaintenanceLogs; } catch { return initialMaintenanceLogs; }
  });
  const [spareParts, setSpareParts] = useState<PrinterSparePart[]>(() => {
    try { const saved = localStorage.getItem('kimo_spare_parts'); return saved ? JSON.parse(saved) : initialSpareParts; } catch { return initialSpareParts; }
  });
  const [filaments, setFilaments] = useState<FilamentSpool[]>(() => {
    try { const saved = localStorage.getItem('kimo_filaments'); return saved ? JSON.parse(saved) : initialFilaments; } catch { return initialFilaments; }
  });
  const [warehouseSupplies, setWarehouseSupplies] = useState<WarehouseSupplyItem[]>(() => {
    try { const saved = localStorage.getItem('kimo_warehouse_supplies'); return saved ? JSON.parse(saved) : initialWarehouseSupplies; } catch { return initialWarehouseSupplies; }
  });
  const [orders, setOrders] = useState<KanbanOrder[]>(() => {
    try { const saved = localStorage.getItem('kimo_orders'); return saved ? JSON.parse(saved) : initialOrders; } catch { return initialOrders; }
  });
  const [failures, setFailures] = useState<FailureAudit[]>(() => {
    try { const saved = localStorage.getItem('kimo_failures'); return saved ? JSON.parse(saved) : initialFailures; } catch { return initialFailures; }
  });
  const [catalog, setCatalog] = useState<CatalogRecipe[]>(() => {
    try { const saved = localStorage.getItem('kimo_catalog_recipes'); return saved ? JSON.parse(saved) : initialCatalog; } catch { return initialCatalog; }
  });
  const [settings, setSettings] = useState<WorkshopSettings>(() => {
    try {
      const saved = localStorage.getItem('kimo_workshop_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          operatingBudget: {
            ...defaultOperatingBudget,
            ...(parsed.operatingBudget || {}),
          },
        };
      }
    } catch {}
    return defaultSettings;
  });
  const [ecoSilos, setEcoSilos] = useState<EcoLoopSilo[]>(initialEcoSilos);
  const [ecoProcesses, setEcoProcesses] = useState<EcoProcessItem[]>([]);
  const [ecoProducts, setEcoProducts] = useState<EcoProductSale[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cotizadorDraft, setCotizadorDraft] = useState<CotizadorDraft>(defaultDraft);
  const [savedQuotations, setSavedQuotations] = useState<SavedQuotation[]>([]);
  const [notifications, setNotifications] = useState<string[]>([
    'Taller iniciado desde cero (Base de datos limpia).',
  ]);

  
  const [capexAssets, setCapexAssets] = useState<CapexAsset[]>(() => {
    try { const saved = localStorage.getItem('kimo_capex_assets'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [opexFixedCosts, setOpexFixedCosts] = useState<OpexFixedCost[]>(() => {
    try { const saved = localStorage.getItem('kimo_opex_fixed_costs'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [hourlyConsumables, setHourlyConsumables] = useState<HourlyConsumable[]>(() => {
    try { const saved = localStorage.getItem('kimo_hourly_consumables'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [targetProductiveHoursPerMonth, setTargetProductiveHoursPerMonth] = useState<number>(() => {
    try { const saved = localStorage.getItem('kimo_target_productive_hours'); return saved ? parseInt(saved, 10) : 160; } catch { return 160; }
  });

  useEffect(() => {
    try { localStorage.setItem('kimo_capex_assets', JSON.stringify(capexAssets)); } catch {}
  }, [capexAssets]);

  useEffect(() => {
    try { localStorage.setItem('kimo_opex_fixed_costs', JSON.stringify(opexFixedCosts)); } catch {}
  }, [opexFixedCosts]);

  useEffect(() => {
    try { localStorage.setItem('kimo_hourly_consumables', JSON.stringify(hourlyConsumables)); } catch {}
  }, [hourlyConsumables]);

  useEffect(() => {
    try { localStorage.setItem('kimo_target_productive_hours', targetProductiveHoursPerMonth.toString()); } catch {}
  }, [targetProductiveHoursPerMonth]);

  const addCapexAsset = (asset: Omit<CapexAsset, 'id'>) => setCapexAssets(prev => [...prev, { ...asset, id: Date.now().toString() }]);
  const deleteCapexAsset = (id: string) => setCapexAssets(prev => prev.filter(a => a.id !== id));

  const addOpexFixedCost = (cost: Omit<OpexFixedCost, 'id'>) => setOpexFixedCosts(prev => [...prev, { ...cost, id: Date.now().toString() }]);
  const deleteOpexFixedCost = (id: string) => setOpexFixedCosts(prev => prev.filter(c => c.id !== id));

  const addHourlyConsumable = (cons: Omit<HourlyConsumable, 'id'>) => setHourlyConsumables(prev => [...prev, { ...cons, id: Date.now().toString() }]);
  const deleteHourlyConsumable = (id: string) => setHourlyConsumables(prev => prev.filter(c => c.id !== id));

  const calculateTotalOverheadPerHour = (horasMes?: number) => {
    const hours = horasMes || targetProductiveHoursPerMonth || 160;
    
    // 1. CAPEX Amortization
    const capexMonthly = capexAssets.reduce((sum, asset) => sum + (asset.costoTotal / (asset.vidaUtilMeses || 1)), 0);
    const capexPerHour = capexMonthly / hours;
    
    // 2. OPEX Fixed Costs
    const opexMonthly = opexFixedCosts.reduce((sum, cost) => sum + cost.costoMensual, 0);
    const opexPerHour = opexMonthly / hours;
    
    // 3. Hourly Consumables
    const variablesPerHour = hourlyConsumables.reduce((sum, cons) => sum + cons.costoPorHora, 0);
    
    return capexPerHour + opexPerHour + variablesPerHour;
  };

  const resetAllDataToZero = () => {
    try {
      localStorage.clear();
    } catch {}
    setPrinters([]);
    setMaintenanceLogs([]);
    setSpareParts([]);
    setFilaments([]);
    setWarehouseSupplies([]);
    setOrders([]);
    setFailures([]);
    setCatalog([]);
    setSavedQuotations([]);
    setEcoSilos(initialEcoSilos);
    setEcoProcesses([]);
    setEcoProducts([]);
    setNotifications(['Base de datos y taller reiniciados desde cero.']);
  };

  useEffect(() => {
    try {
      localStorage.setItem('kimo_filaments', JSON.stringify(filaments));
    } catch {}
  }, [filaments]);

  useEffect(() => {
    try {
      localStorage.setItem('kimo_warehouse_supplies', JSON.stringify(warehouseSupplies));
    } catch {}
  }, [warehouseSupplies]);

  useEffect(() => {
    try {
      localStorage.setItem('kimo_saved_quotations', JSON.stringify(savedQuotations));
    } catch {}
  }, [savedQuotations]);

  useEffect(() => {
    try {
      localStorage.setItem('kimo_catalog_recipes', JSON.stringify(catalog));
    } catch {}
  }, [catalog]);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Sync saved quotations from Firestore
    const syncFirestoreQuotations = async () => {
      try {
        const snap = await getDocs(collection(db, 'quotations'));
        if (!snap.empty) {
          const remoteList: SavedQuotation[] = [];
          snap.forEach((d) => {
            const data = d.data();
            remoteList.push({ ...data, id: d.id } as SavedQuotation);
          });
          setSavedQuotations((prev) => {
            const remoteIds = new Set(remoteList.map((r) => r.id));
            const localOnly = prev.filter((p) => !remoteIds.has(p.id));
            return [...remoteList, ...localOnly];
          });
        }
      } catch (err) {
        // Fallback silently to local cache
      }
    };
    syncFirestoreQuotations();

    return () => unsubscribe();
  }, []);

  const addNotification = (msg: string) => {
    setNotifications((prev) => [msg, ...prev.slice(0, 5)]);
  };

  const dismissNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Requirement A: COTIZADOR -> TALLER
  // Al dar clic en "Guardar y Enviar a Cola de Taller", la cotización se convierte en una tarjeta real dentro de "En Cola"
  const addOrderFromCotizador = (customData?: Partial<KanbanOrder>) => {
    const models = (cotizadorDraft.models && cotizadorDraft.models.length > 0)
      ? cotizadorDraft.models
      : [{
          id: 'mod-1',
          pieceTitle: cotizadorDraft.pieceTitle || 'Pieza 3D Prototipado',
          clientQty: cotizadorDraft.clientQty || 1,
          platesCount: cotizadorDraft.platesCount || 1,
          printHours: cotizadorDraft.printHours || 1,
          purgaGrams: cotizadorDraft.purgaGrams || 0,
          failureRatePercent: cotizadorDraft.failureRatePercent || 8,
          includeBuffer: cotizadorDraft.includeBuffer || false,
          bufferQty: cotizadorDraft.bufferQty || 0,
          dedicatedLaborHours: 1,
          bedType: 'textured_pei' as const,
          amsSlots: cotizadorDraft.amsSlots || [],
          notes: cotizadorDraft.notes || '',
        }];

    let totalClientQty = 0;
    let totalBufferQty = 0;
    let totalPlatesCount = 0;
    let totalPrintHours = 0;
    let totalFilamentGrams = 0;
    let totalFilamentCost = 0;
    let modelsCost3DTotal = 0;
    let modelsItemsTotal = 0;
    const allSpoolIds: string[] = [];
    const allColors: string[] = [];

    const marginRatio = (settings.defaultMarginPercent || 25) / 100;

    models.forEach((m) => {
      const mClientQty = Math.max(1, m.clientQty);
      const mPlates = Math.max(1, m.platesCount || 1);
      const mBuffer = m.includeBuffer ? Math.max(0, m.bufferQty || 0) : 0;
      const mBufferRatio = mBuffer / mClientQty;
      const mHours = Math.max(0.2, m.printHours || 1);
      const mHoursWithBuffer = mHours * (1 + mBufferRatio);

      totalClientQty += mClientQty;
      totalBufferQty += mBuffer;
      totalPlatesCount += mPlates;
      totalPrintHours += mHoursWithBuffer;

      const mSlots = m.amsSlots || [];
      const mBaseGrams = mSlots.reduce((acc, s) => acc + (s.grams || 0), 0);
      const mPurga = m.purgaGrams || 0;
      const mTotalGrams = mBaseGrams * (1 + mBufferRatio) + mPurga;
      totalFilamentGrams += mTotalGrams;

      mSlots.forEach((s) => {
        if (s.spoolId && !allSpoolIds.includes(s.spoolId)) allSpoolIds.push(s.spoolId);
        if (s.colorHex && !allColors.includes(s.colorHex)) allColors.push(s.colorHex);
      });

      const mCostFilament = mSlots.reduce((acc, s) => {
        const rate = s.costPerGram || 0.28;
        return acc + (s.grams || 0) * (1 + mBufferRatio) * rate;
      }, 0) + mPurga * 0.28;
      totalFilamentCost += mCostFilament;

      const mCostCfe = mHoursWithBuffer * (settings.printerWatts / 1000) * settings.cfeRatePerKwh;
      const mCostMtto = mCostFilament * (settings.maintenanceFundPercent / 100);
      const mCostLabor = (m.dedicatedLaborHours || (mHoursWithBuffer * 0.08 + mPlates * 0.15)) * settings.laborRatePerHour;

      const mCostModel = mCostFilament + mCostCfe + mCostMtto + mCostLabor;
      modelsCost3DTotal += mCostModel;

      const mPriceModel = mCostModel / Math.max(0.1, 1 - marginRatio);
      const mUnitPriceAbsorbed = Number((mPriceModel / mClientQty).toFixed(2));
      modelsItemsTotal += mClientQty * mUnitPriceAbsorbed;
    });

    const costInsumosBOM = (cotizadorDraft.bomItems || []).reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );
    const cost3DTotal = modelsCost3DTotal + costInsumosBOM;
    const itemsTotal = modelsItemsTotal;

    // Services (100% manuales según REQ 2)
    const customServicesTotal = (cotizadorDraft.customServices || []).reduce(
      (sum, s) => sum + (s.quantity || 0) * (s.unitPrice || 0),
      0
    );
    const servicesTotal = customServicesTotal;

    const pkgType = cotizadorDraft.packagingType || 'caja_burbuja';
    const pkgBase = cotizadorDraft.packagingCost ?? 25.0;
    const cardCost = cotizadorDraft.includeBusinessCard !== false ? (cotizadorDraft.businessCardCost ?? 3.5) : 0;
    const souvCost = cotizadorDraft.includeSouvenir !== false ? (cotizadorDraft.souvenirCost ?? 8.0) : 0;
    const stickCost = cotizadorDraft.includeStickers !== false ? (cotizadorDraft.stickersCost ?? 4.0) : 0;
    const packagingPhysicalCost = (pkgType !== 'sin_empaque' ? pkgBase : 0) + cardCost + souvCost + stickCost;
    const packagingCharged = cotizadorDraft.chargePackagingToClient !== false ? packagingPhysicalCost : 0;

    const subtotal = itemsTotal + servicesTotal + packagingCharged;
    const discount = subtotal * (settings.volumeDiscountPercent / 100);
    const shipping = cotizadorDraft.deliveryCost || 0;
    const taxable = Math.max(0, subtotal - discount + shipping);
    const vat = cotizadorDraft.requireInvoice ? taxable * 0.16 : 0;
    const baseTotal = taxable + vat;

    let feeAmount = 0;
    if (cotizadorDraft.paymentMethod === 'clip') {
      feeAmount = baseTotal * 0.0418;
    } else if (cotizadorDraft.paymentMethod === 'stripe') {
      feeAmount = baseTotal * 0.036 + 3.0;
    } else if (cotizadorDraft.paymentMethod === 'mercadolibre') {
      feeAmount = baseTotal * 0.15;
    }

    const calculatedTotal = baseTotal + (cotizadorDraft.transferPaymentFeeToClient ? feeAmount : 0);
    const netProfitEst = Math.max(0, taxable - cost3DTotal - packagingPhysicalCost - shipping - (cotizadorDraft.transferPaymentFeeToClient ? 0 : feeAmount));

    const primaryTitle = models.length === 1
      ? models[0].pieceTitle
      : `${models[0].pieceTitle} (+${models.length - 1} modelo${models.length > 2 ? 's' : ''})`;

    const newOrder: KanbanOrder = {
      id: `ord-${Date.now()}`,
      folio: cotizadorDraft.folio || `COTZ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: cotizadorDraft.clientName || 'Cliente Particular',
      contactPerson: cotizadorDraft.clientContact,
      title: primaryTitle,
      category: '3d_print',
      status: 'queue',
      assignedPrinter: settings.activePrinter.model,
      deliveryDate: 'En 3 días',
      progressPercent: 0,
      filamentUsedGrams: Math.round(totalFilamentGrams),
      filamentSpoolIds: allSpoolIds.length > 0 ? allSpoolIds : ['fil-1'],
      filamentColors: allColors.length > 0 ? allColors : ['#4C237A'],
      printHours: Number(totalPrintHours.toFixed(1)),
      totalPrice: Number(calculatedTotal.toFixed(2)),
      pendingBalance: Number((calculatedTotal * 0.5).toFixed(2)),
      isPaid: false,
      paymentScheme: cotizadorDraft.paymentScheme,
      piecesCount: totalClientQty,
      platesCount: totalPlatesCount,
      bufferPieces: totalBufferQty,
      deliveryType: cotizadorDraft.deliveryType === 'custom' ? 'counter' : cotizadorDraft.deliveryType,
      deliveryCost: cotizadorDraft.deliveryCost,
      bomItems: cotizadorDraft.bomItems,
      customServices: cotizadorDraft.customServices,
      models: models,
      costFilament: Number(totalFilamentCost.toFixed(2)),
      costCfe: Number((totalPrintHours * (settings.printerWatts / 1000) * settings.cfeRatePerKwh).toFixed(2)),
      costMtto: Number((totalFilamentCost * (settings.maintenanceFundPercent / 100)).toFixed(2)),
      costInsumos: Number(costInsumosBOM.toFixed(2)),
      costEmpaque: Number((cotizadorDraft.packagingCost || settings.defaultPackagingCost || 15.0).toFixed(2)),
      packagingCost: Number((cotizadorDraft.packagingCost || settings.defaultPackagingCost || 15.0).toFixed(2)),
      ivaAmount: Number(vat.toFixed(2)),
      netProfit: Number(netProfitEst.toFixed(2)),
      notes: cotizadorDraft.workshopNotes || cotizadorDraft.notes,
      workshopNotes: cotizadorDraft.workshopNotes || cotizadorDraft.notes,
      ...customData,
    };

    setOrders((prev) => [newOrder, ...prev]);
    addNotification(`✅ Orden ${newOrder.folio} enviada exitosamente a la Cola del Taller`);
    setActiveTab('taller');
  };

  // Generador automático y consecutivo de Folio de Cotización (REQ Cotizador)
  const getNextQuotationFolio = (): string => {
    const allFolios: string[] = [
      ...savedQuotations.map((q) => q.folio),
      ...orders.map((o) => o.folio),
    ];
    let maxNum = 0;
    allFolios.forEach((f) => {
      if (!f) return;
      const match = f.match(/COTZ-(?:2026-)?(\d+)/i) || f.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `COTZ-2026-${String(nextNum).padStart(5, '0')}`;
  };

  // REQ 4: GESTIÓN, CONSULTA Y EDICIÓN DE COTIZACIONES GUARDADAS
  const saveQuotation = async (draftOverride?: CotizadorDraftData, statusOverride?: QuotationStatus): Promise<SavedQuotation> => {
    const currentDraft = draftOverride || cotizadorDraft;
    const finalStatus: QuotationStatus = statusOverride || 'Borrador';

    const existingIdx = savedQuotations.findIndex((q) => q.folio === currentDraft.folio);
    const assignedFolio = (currentDraft.folio && currentDraft.folio !== 'COTZ-2026-00001')
      ? currentDraft.folio
      : (existingIdx >= 0 ? currentDraft.folio : getNextQuotationFolio());

    const models = currentDraft.models || [];
    const totalPieces = models.reduce((sum, m) => sum + (m.clientQty || 0), 0) || currentDraft.clientQty || 1;
    const totalHours = models.reduce((sum, m) => sum + (m.printHours || 0), 0) || currentDraft.printHours || 1;

    let calculatedSubtotal = 0;
    models.forEach((m) => {
      const mCost = (m.amsSlots || []).reduce((acc, s) => acc + (s.grams || 0) * (s.costPerGram || 0.28), 0) + (m.purgaGrams || 0) * 0.28;
      const margin = Math.max(20, m.desiredMarginPercent || 25);
      calculatedSubtotal += mCost * (1 + margin / 100);
    });
    const pkgType = currentDraft.packagingType || 'caja_burbuja';
    const pkgBase = currentDraft.packagingCost ?? 25.0;
    const cardCost = currentDraft.includeBusinessCard !== false ? (currentDraft.businessCardCost ?? 3.5) : 0;
    const souvCost = currentDraft.includeSouvenir !== false ? (currentDraft.souvenirCost ?? 8.0) : 0;
    const stickCost = currentDraft.includeStickers !== false ? (currentDraft.stickersCost ?? 4.0) : 0;
    const packagingPhysicalCost = (pkgType !== 'sin_empaque' ? pkgBase : 0) + cardCost + souvCost + stickCost;
    const packagingCharged = currentDraft.chargePackagingToClient !== false ? packagingPhysicalCost : 0;

    const shipping = currentDraft.deliveryCost || 0;
    const taxableSubtotal = calculatedSubtotal + packagingCharged;
    const vat = currentDraft.requireInvoice ? (taxableSubtotal + shipping) * 0.16 : 0;
    const baseTotal = taxableSubtotal + vat + shipping;

    let feeAmount = 0;
    if (currentDraft.paymentMethod === 'clip') {
      feeAmount = baseTotal * 0.0418;
    } else if (currentDraft.paymentMethod === 'stripe') {
      feeAmount = baseTotal * 0.036 + 3.0;
    } else if (currentDraft.paymentMethod === 'mercadolibre') {
      feeAmount = baseTotal * 0.15;
    }

    const calculatedTotal = baseTotal + (currentDraft.transferPaymentFeeToClient !== false ? feeAmount : 0);

    const quoteId = existingIdx >= 0 ? savedQuotations[existingIdx].id : `quote-${Date.now()}`;

    const newQuote: SavedQuotation = {
      id: quoteId,
      folio: assignedFolio,
      clientName: currentDraft.clientName || 'Cliente Particular',
      clientContact: currentDraft.clientContact,
      projectName: currentDraft.projectName || 'Fabricación 3D',
      date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      status: finalStatus,
      models,
      bomItems: currentDraft.bomItems,
      customServices: currentDraft.customServices,
      deliveryType: currentDraft.deliveryType,
      deliveryCost: currentDraft.deliveryCost,
      paymentMethod: currentDraft.paymentMethod,
      transferPaymentFeeToClient: currentDraft.transferPaymentFeeToClient,
      requireInvoice: currentDraft.requireInvoice,
      subtotal: Number(calculatedSubtotal.toFixed(2)),
      vatAmount: Number(vat.toFixed(2)),
      total: Number(calculatedTotal.toFixed(2)),
      totalHours: Number(totalHours.toFixed(1)),
      totalPieces,
      notes: currentDraft.notes,
      workshopNotes: currentDraft.workshopNotes,
      draftData: { ...currentDraft },
    };

    setSavedQuotations((prev) => {
      const idx = prev.findIndex((q) => q.id === quoteId || q.folio === newQuote.folio);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newQuote;
        return next;
      }
      return [newQuote, ...prev];
    });

    try {
      await setDoc(doc(db, 'quotations', quoteId), {
        ...newQuote,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore offline / local save for quotation:', e);
    }

    addNotification(`💾 Cotización ${newQuote.folio} guardada (${finalStatus})`);
    return newQuote;
  };

  const loadQuotationIntoCotizador = (quote: SavedQuotation) => {
    if (quote.draftData) {
      setCotizadorDraft({
        ...quote.draftData,
        models: quote.models?.length ? quote.models : quote.draftData.models,
      });
    }
    setActiveTab('cotizador');
    addNotification(`✏️ Cotización ${quote.folio} cargada en el configurador activo`);
  };

  const launchQuotationToWorkshop = (quote: SavedQuotation) => {
    setSavedQuotations((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, status: 'En Producción' } : q))
    );
    if (quote.draftData) {
      setCotizadorDraft(quote.draftData);
    }
    setTimeout(() => {
      addOrderFromCotizador({
        folio: quote.folio,
        clientName: quote.clientName,
        contactPerson: quote.clientContact,
        title: quote.projectName,
        status: 'queue',
        notes: quote.workshopNotes || quote.notes,
        workshopNotes: quote.workshopNotes || quote.notes,
      });
    }, 60);

    try {
      setDoc(doc(db, 'quotations', quote.id), { status: 'En Producción' }, { merge: true });
    } catch (e) {
      console.warn('Firestore quotation status update offline:', e);
    }
    addNotification(`🚀 Cotización ${quote.folio} enviada a Taller (En Producción)`);
  };

  const deleteSavedQuotation = async (id: string) => {
    setSavedQuotations((prev) => prev.filter((q) => q.id !== id));
    try {
      await deleteDoc(doc(db, 'quotations', id));
    } catch (e) {
      console.warn('Firestore quotation deletion offline:', e);
    }
    addNotification('Cotización eliminada');
  };

  const duplicateQuotation = async (quote: SavedQuotation): Promise<SavedQuotation> => {
    const newFolio = getNextQuotationFolio();
    const clonedDraft: CotizadorDraftData = quote.draftData ? {
      ...quote.draftData,
      folio: newFolio,
      projectName: `${quote.projectName} (Copia)`,
    } : {
      ...defaultDraft,
      folio: newFolio,
      clientName: quote.clientName,
      projectName: `${quote.projectName} (Copia)`,
      models: quote.models,
    };

    const newQuote: SavedQuotation = {
      ...quote,
      id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio: newFolio,
      projectName: `${quote.projectName} (Copia)`,
      date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      status: 'Borrador',
      draftData: clonedDraft,
    };

    setSavedQuotations((prev) => [newQuote, ...prev]);
    try {
      await setDoc(doc(db, 'quotations', newQuote.id), {
        ...newQuote,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore quotation duplicate offline:', e);
    }
    addNotification(`📋 Cotización duplicada como ${newFolio} (Borrador)`);
    return newQuote;
  };

  // Requirement B: CATÁLOGO -> COTIZADOR
  // Al hacer clic en "⚡ Cargar Directo en Cotizador Activo", cambia automáticamente a la pestaña con campos prellenados
  const loadRecipeIntoCotizador = (recipe: CatalogRecipe) => {
    setCotizadorDraft((prev) => ({
      ...prev,
      folio: getNextQuotationFolio(),
      pieceTitle: recipe.title,
      projectName: `Fabricación de ${recipe.title}`,
      clientQty: 10,
      includeBuffer: true,
      bufferQty: 1,
      printHours: Number((recipe.estimatedHours * 10 * 0.7).toFixed(1)),
      purgaGrams: recipe.recommendedFilaments.length > 1 ? 80 : 0,
      amsSlots: recipe.recommendedFilaments.map((f, idx) => ({
        slot: idx + 1,
        name: f.name,
        material: recipe.materials[0] || 'PETG',
        colorHex: f.hex,
        grams: f.grams * 10,
        spoolId: filaments.find((sp) => sp.colorHex.toLowerCase() === f.hex.toLowerCase())?.id || filaments[0].id,
      })),
      notes: `Laminado de catálogo: Altura ${recipe.layerHeight}, Infill ${recipe.infill}, Boquilla ${recipe.nozzleTemp}, Cama ${recipe.bedTemp}.`,
    }));

    addNotification(`⚡ Receta "${recipe.title}" cargada en el Cotizador Activo`);
    setActiveTab('cotizador');
  };

  // Requirement C: KANBAN -> INVENTARIO & HARDWARE
  // Al hacer clic en "Finalizar Orden", se descuentan automáticamente los gramos usados del carrete y se suman las horas al odómetro
  const finishOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Move to next step (postprocess or delivered)
    const nextStatus = order.status === 'manufacturing' ? 'postprocess' : 'delivered';

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, progressPercent: 100 } : o))
    );

    // Discount filament grams proportionally or from assigned spools
    if (order.filamentUsedGrams > 0 && order.filamentSpoolIds.length > 0) {
      const gramsPerSpool = order.filamentUsedGrams / order.filamentSpoolIds.length;
      setFilaments((prev) =>
        prev.map((spool) => {
          if (order.filamentSpoolIds.includes(spool.id)) {
            const updatedRemaining = Math.max(0, spool.gramsRemaining - gramsPerSpool);
            return {
              ...spool,
              gramsRemaining: Number(updatedRemaining.toFixed(1)),
              status: updatedRemaining < 400 ? 'critical' : spool.status,
              lastUsageGrams: Number(gramsPerSpool.toFixed(0)),
              lastUsageNote: `En orden ${order.folio}`,
            };
          }
          return spool;
        })
      );
    }

    // Update active printer odometer hours
    setSettings((prev) => ({
      ...prev,
      activePrinter: {
        ...prev.activePrinter,
        hoursThisMonth: Number((prev.activePrinter.hoursThisMonth + order.printHours).toFixed(1)),
        totalHours: Number((prev.activePrinter.totalHours + order.printHours).toFixed(1)),
        nozzleWearHours: prev.activePrinter.nozzleWearHours + Math.floor(order.printHours),
      },
    }));

    addNotification(`🎉 Orden ${order.folio} finalizada. ${order.filamentUsedGrams}g descontados de inventario.`);
  };

  // Requirement D: REGISTRO DE FALLAS -> DASHBOARD & INVENTARIO
  // Reportar falla captura gramos perdidos y causa; descuenta filamento del inventario y suma el costo a "Merma Absorbida por Taller"
  const reportFailure = (report: {
    orderFolio: string;
    itemTitle: string;
    cause: FailureAudit['cause'];
    gramsLost: number;
    spoolId?: string;
    actionTaken: string;
  }) => {
    // Average cost per gram
    const spool = filaments.find((f) => f.id === report.spoolId) || filaments[0];
    const cost = Number((report.gramsLost * spool.costPerGram).toFixed(2));

    const newFailure: FailureAudit = {
      id: `fail-${Date.now()}`,
      orderFolio: report.orderFolio,
      itemTitle: report.itemTitle,
      cause: report.cause,
      gramsLost: report.gramsLost,
      costAbsorbed: cost,
      actionTaken: report.actionTaken || 'Inspección de cama y reinicio de impresión',
      date: new Date().toISOString().split('T')[0],
    };

    setFailures((prev) => [newFailure, ...prev]);

    // Discount from spool
    setFilaments((prev) =>
      prev.map((f) => {
        if (f.id === spool.id) {
          const updated = Math.max(0, f.gramsRemaining - report.gramsLost);
          return {
            ...f,
            gramsRemaining: Number(updated.toFixed(1)),
            status: updated < 400 ? 'critical' : f.status,
            lastUsageGrams: report.gramsLost,
            lastUsageNote: `Merma reportada en ${report.orderFolio}`,
          };
        }
        return f;
      })
    );

    // Feed eco circular silos
    setEcoSilos((prev) =>
      prev.map((silo, idx) =>
        idx === 0 ? { ...silo, currentGrams: silo.currentGrams + Math.floor(report.gramsLost * 0.85) } : silo
      )
    );

    addNotification(`⚠️ Falla registrada en ${report.orderFolio}. -$${cost} MXN sumados a merma absorbida.`);
  };

  // Requirement: LOGÍSTICA EN TALLER -> Registrar Liquidación
  const liquidateBalance = (orderId: string, paymentMethod?: string, proofName?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              pendingBalance: 0,
              isPaid: true,
              paymentMethod: paymentMethod || o.paymentMethod || 'Transferencia SPEI',
              paymentProofName: proofName || o.paymentProofName || 'comprobante_pago.pdf',
            }
          : o
      )
    );
    addNotification(`💰 Pago registrado exitosamente para la orden. Saldo 100% liquidado.`);
  };

  const moveOrderStatus = (orderId: string, newStatus: KanbanOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const isDelivering = newStatus === 'delivered';
          return {
            ...o,
            status: newStatus,
            // If delivered, mark paid if needed and progress to 100%
            isPaid: isDelivering ? true : o.isPaid,
            pendingBalance: isDelivering ? 0 : o.pendingBalance,
            progressPercent: isDelivering ? 100 : o.progressPercent,
          };
        }
        return o;
      })
    );
  };

  const updateOrder = (orderId: string, updates: Partial<KanbanOrder>) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return { ...o, ...updates };
        }
        return o;
      })
    );
  };

  // Requirement: INVENTARIO DE FILAMENTOS -> Registrar Nueva Bobina
  const registerNewSpool = (spoolData: Omit<FilamentSpool, 'id'>) => {
    const newSpool: FilamentSpool = {
      ...spoolData,
      id: `fil-${Date.now()}`,
    };
    setFilaments((prev) => [newSpool, ...prev]);
    addNotification(`🧶 Nueva bobina ${newSpool.name} registrada en el rack.`);
  };

  const updateFilament = (id: string, updates: Partial<FilamentSpool>) => {
    setFilaments((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    addNotification('Bobina actualizada en el rack');
  };

  const deleteFilament = (id: string) => {
    setFilaments((prev) => prev.filter((f) => f.id !== id));
    addNotification('Bobina dada de baja del rack');
  };

  const addFilamentPurchase = (spoolId: string, purchaseData: Omit<PurchaseRecord, 'id'>) => {
    const newPurchase: PurchaseRecord = {
      ...purchaseData,
      id: `pur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setFilaments((prev) =>
      prev.map((f) => {
        if (f.id === spoolId) {
          const addedGrams = purchaseData.unit === 'kg' ? purchaseData.quantity * 1000 : purchaseData.quantity;
          const currentGrams = f.gramsRemaining;
          const newGrams = currentGrams + addedGrams;
          const totalCurrentValue = currentGrams * f.costPerGram;
          const totalNewValue = purchaseData.totalCost;
          const newCostPerGram = newGrams > 0 ? (totalCurrentValue + totalNewValue) / newGrams : f.costPerGram;
          const history = f.purchaseHistory || [];

          return {
            ...f,
            gramsRemaining: Number(newGrams.toFixed(1)),
            costPerGram: Number(newCostPerGram.toFixed(2)),
            costPerKg: Number((newCostPerGram * 1000).toFixed(2)),
            status: newGrams >= 400 ? 'optimal' : f.status,
            supplier: purchaseData.supplier || f.supplier,
            purchaseUrl: purchaseData.purchaseUrl || f.purchaseUrl,
            purchaseHistory: [newPurchase, ...history],
          };
        }
        return f;
      })
    );
    addNotification(`📦 Reabastecimiento de ${purchaseData.quantity} ${purchaseData.unit} registrado con éxito.`);
  };

  // Requirement: INVENTARIO DE FILAMENTOS -> Calibrar con Báscula
  // Calcula: Peso Bruto Báscula - Tara = Gramos Netos reales
  const calibrateSpoolWeight = (spoolId: string, grossWeightGrams: number, customTareGrams?: number) => {
    setFilaments((prev) =>
      prev.map((spool) => {
        if (spool.id === spoolId) {
          const tare = customTareGrams !== undefined ? customTareGrams : spool.spoolTareGrams;
          const netGrams = Math.max(0, grossWeightGrams - tare);
          return {
            ...spool,
            spoolTareGrams: tare,
            gramsRemaining: Number(netGrams.toFixed(1)),
            status: netGrams < 400 ? 'critical' : 'calibrated',
          };
        }
        return spool;
      })
    );
    addNotification(`⚖️ Bobina calibrada por báscula.`);
  };

  // Insumos de Ensamble y Empaque
  const addWarehouseSupply = (supplyData: Omit<WarehouseSupplyItem, 'id'>) => {
    const newSupply: WarehouseSupplyItem = {
      ...supplyData,
      id: `sup-${Date.now()}`,
    };
    setWarehouseSupplies((prev) => [newSupply, ...prev]);
    addNotification(`🧩 Insumo "${newSupply.name}" registrado en almacén.`);
  };

  const updateWarehouseSupply = (id: string, updates: Partial<WarehouseSupplyItem>) => {
    setWarehouseSupplies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    addNotification('Insumo actualizado en almacén');
  };

  const deleteWarehouseSupply = (id: string) => {
    setWarehouseSupplies((prev) => prev.filter((s) => s.id !== id));
    addNotification('Insumo eliminado del almacén');
  };

  const restockWarehouseSupply = (id: string, purchaseData: Omit<PurchaseRecord, 'id'>) => {
    const newPurchase: PurchaseRecord = {
      ...purchaseData,
      id: `pur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setWarehouseSupplies((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const addedStock = purchaseData.quantity;
          const newStock = s.stock + addedStock;
          const totalCurrentValue = s.stock * s.cost;
          const totalNewValue = purchaseData.totalCost;
          const newUnitCost = newStock > 0 ? (totalCurrentValue + totalNewValue) / newStock : s.cost;
          const history = s.purchaseHistory || [];

          return {
            ...s,
            stock: newStock,
            cost: Number(newUnitCost.toFixed(2)),
            supplier: purchaseData.supplier || s.supplier,
            purchaseUrl: purchaseData.purchaseUrl || s.purchaseUrl,
            purchaseHistory: [newPurchase, ...history],
          };
        }
        return s;
      })
    );
    addNotification(`📦 Insumo reabastecido (+${purchaseData.quantity} ${purchaseData.unit}).`);
  };

  // Catálogo de Recetas
  const addCatalogRecipe = (recipeData: Omit<CatalogRecipe, 'id'>) => {
    const newRecipe: CatalogRecipe = {
      ...recipeData,
      id: `cat-${Date.now()}`,
    };
    setCatalog((prev) => [newRecipe, ...prev]);
    addNotification(`⚡ Nueva receta "${newRecipe.title}" agregada al catálogo.`);
  };

  const updateCatalogRecipe = (id: string, updates: Partial<CatalogRecipe>) => {
    setCatalog((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    addNotification('Receta actualizada en el catálogo');
  };

  const deleteCatalogRecipe = (id: string) => {
    setCatalog((prev) => prev.filter((r) => r.id !== id));
    addNotification('Receta eliminada del catálogo');
  };

  // E-Commerce Web Store & Stripe Order Handler (REQ 3)
  const submitWebOrder = (params: {
    items: CartItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    shippingMethod: 'uber_flash' | 'paqueteria' | 'counter';
    shippingCost: number;
    subtotal: number;
    vatAmount: number;
    total: number;
    stripePaymentId: string;
  }) => {
    const webFolio = `WEB-STRIPE-${Math.floor(100 + Math.random() * 900)}`;
    const totalGrams = params.items.reduce((acc, it) => acc + (it.recipe.estimatedGrams * it.quantity), 0);
    const totalHours = params.items.reduce((acc, it) => acc + (it.recipe.estimatedHours * it.quantity), 0);
    const totalPieces = params.items.reduce((acc, it) => acc + it.quantity, 0);

    // Create models
    const orderModels: CotizadorModelItem[] = params.items.map((it, idx) => ({
      id: `mod-web-${idx + 1}`,
      pieceTitle: `${it.recipe.title} (${it.selectedMaterial || 'PETG'} - ${it.selectedColor || 'Negro'})`,
      clientQty: it.quantity,
      platesCount: Math.ceil(it.quantity / 2),
      printHours: it.recipe.estimatedHours * it.quantity,
      purgaGrams: 10 * it.quantity,
      failureRatePercent: 5,
      includeBuffer: false,
      bufferQty: 0,
      dedicatedLaborHours: (it.recipe.manualHours || 0.2) * it.quantity,
      bedType: (it.recipe.bedType as any) || 'textured_pei',
      amsSlots: it.recipe.recommendedFilaments.map((f, fIdx) => ({
        slot: fIdx + 1,
        name: f.name,
        material: f.material || 'PETG',
        colorHex: f.hex,
        grams: f.grams * it.quantity,
      })),
      bomItems: it.recipe.bomItems,
      notes: it.customNotes,
    }));

    // Deduct stock if available
    params.items.forEach((it) => {
      // Deduct filaments
      it.recipe.recommendedFilaments.forEach((rf) => {
        const matchingSpool = filaments.find(
          (s) =>
            s.material.toLowerCase() === (rf.material || 'PETG').toLowerCase() ||
            s.name.toLowerCase().includes(rf.name.toLowerCase())
        );
        if (matchingSpool) {
          const usedGrams = rf.grams * it.quantity;
          updateFilament(matchingSpool.id, {
            gramsRemaining: Math.max(0, matchingSpool.gramsRemaining - usedGrams),
            lastUsageGrams: usedGrams,
            lastUsageNote: `Venta Web #${webFolio} - ${it.recipe.title}`,
          });
        }
      });
      // Deduct BOM items
      if (it.recipe.bomItems) {
        it.recipe.bomItems.forEach((bi) => {
          const matchingSupply = warehouseSupplies.find(
            (s) => s.id === bi.id || s.name.toLowerCase() === bi.name.toLowerCase()
          );
          if (matchingSupply) {
            updateWarehouseSupply(matchingSupply.id, {
              stock: Math.max(0, matchingSupply.stock - (bi.quantity * it.quantity)),
            });
          }
        });
      }
    });

    const newOrder: KanbanOrder = {
      id: `order-web-${Date.now()}`,
      folio: webFolio,
      clientName: params.customerName,
      contactPerson: params.customerPhone,
      clientEmail: params.customerEmail,
      clientPhone: params.customerPhone,
      title: params.items.length === 1 ? params.items[0].recipe.title : `Pedido Web (${params.items.length} productos)`,
      category: '3d_print',
      status: 'queue',
      source: 'tienda_web',
      isStripePaid: true,
      shippingAddress: params.shippingAddress,
      assignedPrinter: 'IMP-3D-BAM-01',
      deliveryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
      progressPercent: 0,
      filamentUsedGrams: totalGrams,
      filamentSpoolIds: [],
      filamentColors: Array.from(new Set(params.items.flatMap((i) => i.recipe.recommendedFilaments.map((f) => f.hex)))),
      printHours: totalHours,
      totalPrice: params.total,
      pendingBalance: 0,
      isPaid: true,
      paymentScheme: '100_cash',
      paymentMethod: `Stripe Card (${params.stripePaymentId})`,
      deliveryType: params.shippingMethod,
      deliveryCost: params.shippingCost,
      piecesCount: totalPieces,
      bufferPieces: 0,
      models: orderModels,
      createdAtDate: new Date().toISOString(),
      notes: `Venta Tienda Web Stripe • Envío: ${params.shippingAddress || 'Mostrador / Taller'}`,
      workshopNotes: `Pedido pagado con tarjeta vía Stripe. Producir con receta estándar y empaque premium.`,
    };

    setOrders((prev) => [newOrder, ...prev]);
    addNotification(`🛍️ ¡Nueva Venta en Tienda Web! Folio ${webFolio} por $${params.total.toFixed(2)} MXN ingresó a En Cola (Stripe Pagado)`);
    return newOrder;
  };

  // Custom 3D Design Request Handler (REQ 3 Módulo 3)
  const submitCustomWebQuote = (data: CustomQuoteSubmission) => {
    const webFolio = `SOL-WEB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const baseGrams = 80 * (data.quantity || 1);
    const baseHours = 3.5 * (data.quantity || 1);
    const basePrice = baseHours * 45 + baseGrams * 0.45 + 120;

    const newQuoteDraft: CotizadorDraftData = {
      ...defaultDraft,
      folio: webFolio,
      clientName: data.clientName,
      clientContact: `${data.clientPhone} • ${data.clientEmail}`,
      projectName: `Diseño Personalizado Web (${data.fileName || 'Pieza 3D'})`,
      pieceTitle: data.fileName ? data.fileName.replace(/\.[^/.]+$/, '') : 'Modelo Personalizado Web',
      clientQty: data.quantity || 1,
      printHours: baseHours,
      amsSlots: [
        {
          slot: 1,
          name: `${data.material} ${data.color}`,
          material: data.material || 'PETG',
          colorHex: '#350463',
          grams: baseGrams,
        },
      ],
      notes: `Solicitud Web recibida desde el portal público • Material: ${data.material} • Color: ${data.color} • Instrucciones: ${data.specialInstructions || 'N/A'} • Ciudad: ${data.city || 'CDMX'}`,
      workshopNotes: `Cliente solicitó cotización con archivo ${data.fileName || '3D'}. Contactar vía WhatsApp a ${data.clientPhone}.`,
    };

    const newSavedQuote: SavedQuotation = {
      id: `quote-web-${Date.now()}`,
      folio: webFolio,
      clientName: data.clientName,
      clientContact: `${data.clientPhone} • ${data.clientEmail}`,
      projectName: `Diseño Personalizado Web (${data.fileName || 'Pieza 3D'})`,
      date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      status: 'Nueva Solicitud Web (Por Revisar)',
      models: [
        {
          id: `mod-sol-1`,
          pieceTitle: data.fileName || 'Pieza 3D Personalizada',
          clientQty: data.quantity || 1,
          platesCount: 1,
          printHours: baseHours,
          purgaGrams: 10,
          failureRatePercent: 8,
          includeBuffer: false,
          bufferQty: 0,
          dedicatedLaborHours: 0.5,
          bedType: 'textured_pei',
          amsSlots: [
            {
              slot: 1,
              name: `${data.material} ${data.color}`,
              material: data.material || 'PETG',
              colorHex: '#350463',
              grams: baseGrams,
            },
          ],
          notes: data.specialInstructions,
        },
      ],
      deliveryType: 'uber_flash',
      deliveryCost: 85,
      paymentMethod: 'stripe',
      transferPaymentFeeToClient: false,
      requireInvoice: false,
      subtotal: basePrice,
      total: basePrice + 85,
      totalHours: baseHours,
      totalPieces: data.quantity || 1,
      notes: `Solicitud Web: ${data.specialInstructions || 'Sin notas especiales'}`,
      workshopNotes: `Archivo: ${data.fileName || 'Adjunto'} • WhatsApp: ${data.clientPhone} • Email: ${data.clientEmail}`,
      draftData: newQuoteDraft,
      customRequestData: {
        fileUrl: data.fileDataUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        requestedMaterial: data.material,
        requestedColor: data.color,
        requestedQuantity: data.quantity,
        specialInstructions: data.specialInstructions,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        city: data.city,
      },
    };

    setSavedQuotations((prev) => [newSavedQuote, ...prev]);
    addNotification(
      `📥 ¡Nueva Solicitud de Cotización Web! Folio ${webFolio} (${data.clientName}) esperando revisión`
    );
    return newSavedQuote;
  };
  const createEcoBatch = (data: {
    siloIndex: number;
    productTitle: string;
    processType: EcoProcessItem['processType'];
    gramsUsed: number;
    unitsToProduce: number;
    unitPrice: number;
    operatingCost: number;
    description: string;
  }) => {
    // 1. Descontar gramos del Silo de Acopio
    setEcoSilos((prev) =>
      prev.map((silo, idx) =>
        idx === data.siloIndex
          ? { ...silo, currentGrams: Math.max(0, silo.currentGrams - data.gramsUsed) }
          : silo
      )
    );

    // 2. Crear el lote activo en "Procesos Secundarios Activos"
    const newProcess: EcoProcessItem = {
      id: `proc-${Date.now()}`,
      title: data.productTitle,
      processType: data.processType,
      description: data.description,
      yieldText: `${data.unitsToProduce} unidades listas`,
      units: data.unitsToProduce,
      status: 'Activo',
      materialGramsUsed: data.gramsUsed,
    };
    setEcoProcesses((prev) => [newProcess, ...prev]);

    // 3. Añadir el producto al Catálogo & Ventas KiMO Eco
    const newProduct: EcoProductSale = {
      id: `eco-${Date.now()}`,
      name: data.productTitle,
      description: `${data.description} • Costo materia prima: $0.00 MXN`,
      price: data.unitPrice,
      unitsSold: 0,
      unitsInStock: data.unitsToProduce,
      materialRecoveredType: ecoSilos[data.siloIndex]?.material || 'Scrap Recuperado',
    };
    setEcoProducts((prev) => [newProduct, ...prev]);

    addNotification(`♻️ Lote "${data.productTitle}" creado: ${data.gramsUsed}g de scrap reciclados.`);
  };

  const sellEcoProduct = (productId: string, units: number = 1) => {
    setEcoProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const qty = Math.min(p.unitsInStock, units);
          return {
            ...p,
            unitsSold: p.unitsSold + qty,
            unitsInStock: Math.max(0, p.unitsInStock - qty),
          };
        }
        return p;
      })
    );
    addNotification(`💰 Venta registrada en Catálogo KiMO Eco!`);
  };

  // Persistencia de Impresoras y Mantenimientos
  useEffect(() => {
    try {
      localStorage.setItem('kimo_printers', JSON.stringify(printers));
    } catch (e) {
      console.warn('Could not cache printers in localStorage', e);
    }
  }, [printers]);

  useEffect(() => {
    try {
      localStorage.setItem('kimo_maintenance_logs', JSON.stringify(maintenanceLogs));
    } catch (e) {
      console.warn('Could not cache maintenance_logs in localStorage', e);
    }
  }, [maintenanceLogs]);

  const addPrinter = (printerData: Omit<PrinterDevice, 'id'>) => {
    const newPrinter: PrinterDevice = {
      ...printerData,
      id: `IMP-3D-${Date.now().toString(36).toUpperCase()}`,
    };
    setPrinters((prev) => [newPrinter, ...prev]);
    addNotification(`🖨️ Nueva impresora dada de alta: ${newPrinter.alias} (${newPrinter.marca} ${newPrinter.modelo})`);
    try {
      setDoc(doc(db, 'printers', newPrinter.id), newPrinter, { merge: true });
    } catch (e) {
      console.warn('Firestore offline printer save:', e);
    }
  };

  const updatePrinter = (id: string, updates: Partial<PrinterDevice>) => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    addNotification(`✏️ Datos de impresora actualizados (${id})`);
    try {
      setDoc(doc(db, 'printers', id), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore offline printer update:', e);
    }
  };

  const retirePrinter = (id: string, reason: string) => {
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, estado: 'baja', motivoBaja: reason }
          : p
      )
    );
    addNotification(`🔴 Impresora ${id} dada de baja de la flota: ${reason}`);
    try {
      setDoc(doc(db, 'printers', id), { estado: 'baja', motivoBaja: reason }, { merge: true });
    } catch (e) {
      console.warn('Firestore offline printer retire:', e);
    }
  };

  const deletePrinterPermanently = (id: string) => {
    const printerToDelete = printers.find((p) => p.id === id);
    setPrinters((prev) => prev.filter((p) => p.id !== id));
    setMaintenanceLogs((prev) => prev.filter((log) => log.printerId !== id));
    addNotification(`🗑️ Impresora ${printerToDelete?.alias || id} y sus registros eliminados.`);
    try {
      deleteDoc(doc(db, 'printers', id));
    } catch (e) {
      console.warn('Firestore offline printer delete:', e);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('kimo_spare_parts', JSON.stringify(spareParts));
    } catch (e) {
      console.warn('Could not cache spare_parts in localStorage', e);
    }
  }, [spareParts]);

  const addSparePart = (partData: Omit<PrinterSparePart, 'id'>) => {
    const newPart: PrinterSparePart = {
      ...partData,
      id: `sp-${Date.now().toString(36)}`,
    };
    setSpareParts((prev) => [newPart, ...prev]);
    addNotification(`🔩 Nueva refacción registrada: ${newPart.nombreRefaccion} (${newPart.printerModelCompatible})`);
    try {
      setDoc(doc(db, 'spare_parts', newPart.id), newPart, { merge: true });
    } catch (e) {
      console.warn('Firestore offline spare part save:', e);
    }
  };

  const updateSparePart = (id: string, updates: Partial<PrinterSparePart>) => {
    setSpareParts((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp))
    );
    addNotification(`✏️ Refacción actualizada (${id})`);
    try {
      setDoc(doc(db, 'spare_parts', id), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore offline spare part update:', e);
    }
  };

  const deleteSparePart = (id: string) => {
    setSpareParts((prev) => prev.filter((sp) => sp.id !== id));
    addNotification(`🗑️ Refacción eliminada del almacén`);
    try {
      deleteDoc(doc(db, 'spare_parts', id));
    } catch (e) {
      console.warn('Firestore offline spare part delete:', e);
    }
  };

  const consumeSparePart = (id: string, qty: number = 1) => {
    setSpareParts((prev) =>
      prev.map((sp) => {
        if (sp.id === id) {
          const newStock = Math.max(0, sp.stockActual - qty);
          if (newStock <= sp.stockMinimo) {
            addNotification(`⚠️ Stock crítico de refacción: ${sp.nombreRefaccion} (${newStock} dispon. en almacén)`);
          }
          return { ...sp, stockActual: newStock };
        }
        return sp;
      })
    );
  };

  const addMaintenanceLog = (logData: Omit<MaintenanceLog, 'id'>) => {
    // Si se usó una refacción del catálogo, descontar stock de refacción automáticamente (REQ 3)
    let extraPartCost = 0;
    let partName = logData.refaccionesReemplazadas;

    if (logData.sparePartIdUsed) {
      const sp = spareParts.find((item) => item.id === logData.sparePartIdUsed);
      if (sp) {
        const qtyUsed = logData.sparePartQtyUsed || 1;
        extraPartCost = sp.costoUnitarioMXN * qtyUsed;
        partName = `${qtyUsed}x ${sp.nombreRefaccion}`;
        consumeSparePart(sp.id, qtyUsed);
      }
    }

    const finalCost = logData.costoTotalRefacciones > 0 ? logData.costoTotalRefacciones : extraPartCost;

    const newLog: MaintenanceLog = {
      ...logData,
      refaccionesReemplazadas: partName || logData.refaccionesReemplazadas || 'Sin refacciones',
      costoTotalRefacciones: finalCost,
      id: `MTTO-${Date.now()}`,
    };
    setMaintenanceLogs((prev) => [newLog, ...prev]);

    // Al guardar mantenimiento:
    // 1. Reinicia el aviso/estado de la impresora (de "mantenimiento" a "disponible")
    // 2. Actualiza la fecha de último mantenimiento a la fecha registrada
    setPrinters((prev) =>
      prev.map((p) => {
        if (p.id === logData.printerId) {
          return {
            ...p,
            estado: p.estado === 'mantenimiento' ? 'disponible' : p.estado,
            fechaUltimoMtto: logData.fecha || new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );

    addNotification(`🛠️ Mantenimiento ${logData.tipo} registrado para ${logData.printerAlias || logData.printerId}`);
    try {
      setDoc(doc(db, 'maintenance_logs', newLog.id), newLog, { merge: true });
    } catch (e) {
      console.warn('Firestore offline maintenance log:', e);
    }
  };

  const updateSettings = (newSettings: Partial<WorkshopSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('kimo_workshop_settings', JSON.stringify(updated));
        setDoc(doc(db, 'settings', 'workshop'), updated, { merge: true }).catch(() => {});
      } catch {}
      return updated;
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const loggedUser = await signInWithGoogle();
      setUser(loggedUser);
      addNotification(`Sesión iniciada como ${loggedUser.displayName || 'Operador'}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      addNotification('Sesión cerrada');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <WorkshopContext.Provider
      value={{
        capexAssets,
        addCapexAsset,
        deleteCapexAsset,
        opexFixedCosts,
        addOpexFixedCost,
        deleteOpexFixedCost,
        hourlyConsumables,
        addHourlyConsumable,
        deleteHourlyConsumable,
        targetProductiveHoursPerMonth,
        setTargetProductiveHoursPerMonth,
        calculateTotalOverheadPerHour,

        activeTab,
        setActiveTab,
        filaments,
        orders,
        failures,
        catalog,
        printers,
        maintenanceLogs,
        spareParts,
        addPrinter,
        updatePrinter,
        retirePrinter,
        deletePrinterPermanently,
        addMaintenanceLog,
        addSparePart,
        updateSparePart,
        deleteSparePart,
        consumeSparePart,
        settings,
        ecoSilos,
        ecoProcesses,
        ecoProducts,
        user,
        cotizadorDraft,
        setCotizadorDraft,
        savedQuotations,
        getNextQuotationFolio,
        saveQuotation,
        loadQuotationIntoCotizador,
        launchQuotationToWorkshop,
        deleteSavedQuotation,
        duplicateQuotation,
        addOrderFromCotizador,
        loadRecipeIntoCotizador,
        addCatalogRecipe,
        updateCatalogRecipe,
        deleteCatalogRecipe,
        submitWebOrder,
        submitCustomWebQuote,
        finishOrder,
        reportFailure,
        createEcoBatch,
        sellEcoProduct,
        liquidateBalance,
        moveOrderStatus,
        updateOrder,
        registerNewSpool,
        updateFilament,
        deleteFilament,
        addFilamentPurchase,
        calibrateSpoolWeight,
        warehouseSupplies,
        addWarehouseSupply,
        updateWarehouseSupply,
        deleteWarehouseSupply,
        restockWarehouseSupply,
        updateSettings,
        resetAllDataToZero,
        handleGoogleSignIn,
        handleSignOut,
        notifications,
        addNotification,
        dismissNotification,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
};
