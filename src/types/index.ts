export interface PurchaseRecord {
  id: string;
  date: string;
  quantity: number;
  unit: 'kg' | 'g' | 'piezas' | 'unidades' | 'pliegos' | 'packs' | string;
  totalCost: number; // in MXN
  unitCost: number; // in $/g or $/pza
  supplier?: string;
  purchaseUrl?: string;
  notes?: string;
}

export interface FilamentSpool {
  id: string;
  sku: string;
  name: string;
  brand: string;
  material: string; // PLA, PETG, TPU, ABS, ASA, Nylon, Resina, PC, etc.
  colorName: string;
  colorHex: string;
  gramsRemaining: number;
  capacityGrams: number;
  costPerGram: number; // in MXN
  costPerKg: number;
  spoolTareGrams: number;
  amsSlot?: number | null; // legacy
  status: 'optimal' | 'critical' | 'calibrated';
  finish?: string;
  humidity?: string;
  lot?: string;
  lastUsageGrams?: number;
  lastUsageNote?: string;
  imageUrl?: string;
  supplier?: string;
  purchaseUrl?: string;
  purchaseHistory?: PurchaseRecord[];
  // Spanish property aliases
  nombreColor?: string;
  capacidadGramos?: number;
  gramosRestantes?: number;
  taraGramos?: number;
  costoPorGramo?: number;
  costoBobina?: number;
  estadoStock?: string;
}

export interface WarehouseSupplyItem {
  id: string;
  sku: string;
  name: string;
  spec?: string;
  category: string; // Herrajes, Electrónica, Embalaje, Láminas Maquila, etc.
  stock: number;
  unit: string; // piezas, pliegos, unidades, etc.
  cost: number; // unit cost
  totalCost?: number;
  supplier?: string;
  purchaseUrl?: string;
  imageUrl?: string;
  minAlertStock?: number;
  purchaseHistory?: PurchaseRecord[];
  // Spanish property aliases
  nombre?: string;
  categoria?: string;
  stockActual?: number;
  costoUnitario?: number;
  estado?: string;
}

export interface ChecklistTask {
  id: string;
  text: string;
  done: boolean;
  assignedTo?: string;
}

export interface KanbanOrder {
  id: string;
  folio: string;
  clientName: string;
  contactPerson?: string;
  title: string;
  category: '3d_print' | 'laser_maquila' | 'vinil' | 'biomedical';
  status: 'queue' | 'manufacturing' | 'postprocess' | 'logistics' | 'delivered';
  assignedPrinter: string;
  deliveryDate: string;
  progressPercent: number;
  remainingTimeText?: string;
  filamentUsedGrams: number;
  filamentSpoolIds: string[];
  filamentColors: string[];
  printHours: number;
  totalPrice: number;
  pendingBalance: number;
  isPaid: boolean;
  paymentScheme: '50_deposit' | '100_cash';
  platesCount?: number;
  bomItems?: BomItem[];
  customServices?: CustomServiceItem[];
  imageUrl?: string;
  piecesCount: number;
  bufferPieces: number;
  checklist?: ChecklistTask[];
  assignedOperator?: string;
  finishLaborHours?: number;
  paymentMethod?: string;
  paymentProofName?: string;
  shippingTrackingGuide?: string;
  shippingService?: string;
  shippingProofName?: string;
  deliveredAtDate?: string;
  deliveryType: 'uber_flash' | 'counter' | 'paqueteria';
  deliveryCost: number;
  source?: 'manual' | 'cotizador' | 'tienda_web';
  isStripePaid?: boolean;
  shippingAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  workshopNotes?: string;
  models?: CotizadorModelItem[];
  createdAtDate?: string;
  costFilament?: number;
  costCfe?: number;
  costMtto?: number;
  costInsumos?: number;
  costEmpaque?: number;
  packagingCost?: number;
  ivaAmount?: number;
  costOverhead?: number;
  netProfit?: number;
  failureLoss?: number;
}

export interface FailureAudit {
  id: string;
  orderFolio: string;
  itemTitle: string;
  cause: 'Warping / Adhesión' | 'Atasco / Boquilla' | 'Capa desplazada' | 'Corte de luz / Térmico' | 'Otro';
  layerDetected?: number;
  actionTaken: string;
  gramsLost: number;
  costAbsorbed: number;
  date: string;
}

export interface CatalogRecipe {
  id: string;
  sku: string;
  title: string;
  subtitle: string;
  category: 'Decoración' | 'Iluminación' | 'Corporativo' | 'Mecánico / Funcional' | 'Médico';
  description: string;
  estimatedHours: number;
  estimatedGrams: number;
  suggestedPrice: number;
  marginPercent: number;
  materials: string[];
  recommendedFilaments: { name: string; hex: string; grams: number; material?: string }[];
  imageUrl: string;
  salesCount: number;
  tags: string[];
  layerHeight: string;
  infill: string;
  infillPattern?: string;
  nozzleTemp: string;
  bedTemp: string;
  bedType?: 'PEI Texturizada' | 'PEI Lisa' | 'Placa Alta Temperatura' | 'Placa Satinada' | 'Placa Ingeniería' | string;
  bomItems?: BomItem[];
  manualHours?: number;
  laborRate?: number;
  directCost?: number;
  isPublishedInStore?: boolean;
  dimensions?: string;
  packagingType?: string;
  packagingCost?: number;
  // Spanish property aliases
  nombre?: string;
  categoria?: string;
  tiempoHoras?: number;
  gramosTotales?: number;
  camaPEI?: string;
  precioSugerido?: number;
  margenEstimado?: number;
  insumosBOM?: any[];
}

export interface PrinterDevice {
  id: string;
  alias: string; // ej. "IMP-3D-BAM-01"
  marca: string; // ej. "Bambu Lab", "Creality", "Prusa", "Elegoo"
  modelo: string; // ej. "A1 Combo", "P1S", "Ender 3 V3"
  tipoExtrusion: 'FDM' | 'Resina';
  boquillaInstalada: '0.4mm' | '0.2mm' | '0.6mm' | '0.8mm' | string;
  tamanoCama: { x: number; y: number; z: number }; // mm
  tarifaHoraBase: number; // MXN/hr
  odometroHoras: number; // Horas acumuladas de trabajo
  fechaAdquisicion: string; // YYYY-MM-DD
  estado: 'disponible' | 'en_impresion' | 'mantenimiento' | 'fuera_de_servicio' | 'baja';
  fechaUltimoMtto: string; // YYYY-MM-DD
  proximoMttoHoras: number; // Umbral de servicio preventivo, ej. cada 250h
  notas?: string;
  motivoBaja?: string;
  currentFolio?: string;
  activeOrderTitle?: string;
  // Registro de Inventario & Adquisición de Activo
  costoCompra?: number; // Inversión inicial en MXN
  proveedorCompra?: string; // Dónde fue comprada (ej. 3D Market, Amazon, Bambu Lab Store)
  numeroSerie?: string; // Número de serie de fábrica
  numeroFactura?: string; // Factura o comprobante de compra
  garantiaVencimiento?: string; // Fecha de fin de garantía
}

export interface MaintenanceLog {
  id: string;
  printerId: string;
  printerAlias?: string;
  fecha: string; // YYYY-MM-DD
  tipo: 'preventivo' | 'correctivo' | 'calibracion';
  tecnicoResponsable: string;
  descripcion: string;
  refaccionesReemplazadas: string;
  costoTotalRefacciones: number; // MXN
  notasSeguridadAceptadas: boolean; // confirmación de desenergizado eléctrico
  sparePartIdUsed?: string;
  sparePartQtyUsed?: number;
}

export interface PrinterSparePart {
  id: string;
  printerModelCompatible: string; // ej. "Bambu Lab A1 Series", "Bambu Lab P1/X1 Series", "Creality Ender 3 Series", "Universal"
  nombreRefaccion: string; // ej. "Hotend Completo 0.4mm Acero Endurecido", "Calcetín de silicón", "Termistor"
  categoria:
    | 'Extrusor / Hotend'
    | 'Cama & Superficie PEI'
    | 'Mecánica & Correas'
    | 'Electrónica & Sensores'
    | 'Consumibles Mtto (Grasa/Alcohol)';
  stockActual: number;
  stockMinimo: number; // Umbral de alerta
  costoUnitarioMXN: number;
  proveedorNombre: string; // ej. "3D Market", "Inovamarket", "Bambu Lab Store"
  urlCompra: string; // Enlace directo
  ubicacionTaller: string; // ej. "Gaveta A3", "Caja Refacciones Bambu"
  imageUrl?: string;
  sku?: string;
}

export interface WorkshopOperatingBudget {
  // Horas mensuales productivas estimadas del taller para absorción de gastos fijos
  estimatedMonthlyHours: number; // Por defecto: 160 hrs/mes

  // Gastos Fijos Mensuales (OPEX / Infraestructura / Activos fijos)
  rentaTallerMensual: number; // ej. 3000 MXN
  amortizacionComputadoraMensual: number; // ej. 600 MXN (computadora diseño, slicing, CAD)
  amortizacionEscritorioMobiliarioMensual: number; // ej. 250 MXN (escritorio, estantes, sillas)
  herramientasTallerMensual: number; // ej. 200 MXN (herramientas menores, alicates, dremel, calibrador)
  movilidadTransporteMensual: number; // ej. 800 MXN (combustible, traslados de filamento, paquetería interna)
  marketingPublicidadContenidoMensual: number; // ej. 1200 MXN (creación de contenido, redes, fotos, pauta)
  softwareLicenciasInternetMensual: number; // ej. 500 MXN (internet, Fusion360, nube, Canva)
  otrosGastosFijosMensual: number; // ej. 250 MXN (fondo contingencias e imprevistos)

  // Insumos Directos de Impresión & Taller (Variables por hora de máquina)
  lacaAdhesivoPorHora: number; // ej. 2.00 MXN/hr (laca, pegamento en barra, fijador de cama)
  consumiblesMttoMenorPorHora: number; // ej. 2.00 MXN/hr (lubricante ejes, alcohol IPA, toallas, navajas, lijas)

  // Insumos de Packaging & Experiencia de Marca (Valores base por pedido)
  empaqueBaseCosto: number; // ej. 25.00 MXN (cajas corrugadas, bolsas herméticas, burbuja)
  tarjetaPresentacionCosto: number; // ej. 3.50 MXN (tarjeta de presentación / agradecimiento)
  stickersCosto: number; // ej. 4.00 MXN (stickers promocionales KiMO)
  souvenirCosto: number; // ej. 8.00 MXN (souvenir / llavero de cortesía)
}

export interface WorkshopSettings {
  cfeRatePerKwh: number; // MXN
  printerWatts: number;
  laborRatePerHour: number; // MXN
  maintenanceFundPercent: number;
  defaultMarginPercent: number;
  volumeDiscountPercent: number;
  defaultPackagingCost?: number;
  vatRatePercent: number;
  includeVat: boolean;
  operatingBudget?: WorkshopOperatingBudget;
  catalogCategories?: string[];
  inventoryCategories?: string[];
  activePrinter: {
    id: string;
    model: string;
    hourlyRate: number;
    hoursThisMonth: number;
    totalHours: number;
    status: 'disponible' | 'operativa' | 'mantenimiento' | 'ocupada' | 'en_impresion';
    nozzleWearHours: number;
    nozzleMaxHours: number;
  };
}

export interface EcoLoopSilo {
  id?: string;
  material: string;
  colorType: string;
  currentGrams: number;
  targetGrams: number;
}

export interface EcoProcessItem {
  id: string;
  title: string;
  processType: 'prensado' | 'moldeo' | 'triturado' | 'acabado';
  description: string;
  yieldText: string;
  units: number;
  status: 'Activo' | 'Completado';
  materialGramsUsed: number;
}

export interface EcoProductSale {
  id: string;
  name: string;
  description: string;
  price: number;
  unitsSold: number;
  unitsInStock: number;
  materialRecoveredType: string;
}

export interface BomItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  category?: string;
  sku?: string;
}

export interface CustomServiceItem {
  id: string;
  concept?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

export interface AmsSlotItem {
  slot: number;
  name: string;
  material: string;
  colorHex: string;
  grams: number;
  costPerGram?: number;
  spoolId?: string;
}

export type BedPlateType = 'textured_pei' | 'smooth_pei' | 'high_temp' | 'engineering_cold';

export interface CopilotUpsellItem {
  title: string;
  description: string;
  suggestedAddonPrice: number;
  type?: 'bom' | 'service';
  bomName?: string;
  serviceConcept?: string;
}

export interface CopilotAuditData {
  technical: {
    orientationAndAdhesion: string;
    structuralStrength: string;
    supportManagement: string;
    hardwareCompatibility: string;
    suggestedInfill?: string;
    suggestedWalls?: number;
    suggestedBed?: BedPlateType;
  };
  commercial: {
    suggestedPriceRange: string;
    perceivedValueExplanation: string;
    upsellingOpportunities: CopilotUpsellItem[];
    targetNiche: string;
    salesPitch: string;
  };
}

export interface CotizadorModelItem {
  id: string;
  pieceTitle: string;
  clientQty: number;
  platesCount: number;
  printHours: number;
  printMinutes?: number;
  purgaGrams: number;
  failureRatePercent: number;
  includeBuffer: boolean;
  bufferQty: number;
  dedicatedLaborHours: number;
  bedType: BedPlateType;
  modelUrl?: string;
  localPath?: string;
  amsSlots: AmsSlotItem[];
  bomItems?: BomItem[];
  customServices?: CustomServiceItem[];
  desiredMarginPercent?: number;
  copilotAudit?: CopilotAuditData;
  packagingType?: string;
  packagingCost?: number;
  assignedPrinter?: string;
  notes?: string;
}

export interface UnboxingItem {
  id: string;
  name: string;
  cost: number;
  chargeToClient: boolean;
}

export interface CotizadorDraftData {
  folio: string;
  clientName: string;
  clientContact: string;
  projectName: string;
  pieceTitle: string;
  clientQty: number;
  platesCount: number;
  includeBuffer: boolean;
  bufferQty: number;
  printHours: number;
  purgaGrams: number;
  failureRatePercent: number;
  amsSlots: AmsSlotItem[];
  models?: CotizadorModelItem[];
  copilotAudit?: CopilotAuditData;
  bomItems: BomItem[];
  customServices: CustomServiceItem[];
  packagingType?: string;
  packagingCost?: number;
  includeBusinessCard?: boolean;
  businessCardCost?: number;
  includeSouvenir?: boolean;
  souvenirCost?: number;
  includeStickers?: boolean;
  stickersCost?: number;
  packagingItems?: UnboxingItem[];
  extraItems?: UnboxingItem[];
  chargePackagingToClient?: boolean;
  includeOverheadAbsorption?: boolean; // Si absorbe costos fijos prorrateados (renta, computadora, marketing, etc.)
  includeWorkshopSupplies?: boolean; // Si absorbe insumos directos (laca/adhesivo, lubricante, IPA)
  services: {
    laserEngraving: boolean;
    vinylApp: boolean;
    ledHardware: boolean;
  };
  deliveryType: 'uber_flash' | 'counter' | 'paqueteria' | 'custom';
  deliveryCost: number;
  requireInvoice: boolean;
  rfc: string;
  razonSocial: string;
  cfdiUsage: string;
  taxRegime: string;
  paymentMethod: 'spei' | 'clip' | 'stripe' | 'mercadolibre' | 'cash';
  transferPaymentFeeToClient: boolean;
  paymentScheme: '50_deposit' | '100_cash';
  notes: string;
  workshopNotes?: string;
}

export type QuotationStatus = 'Borrador' | 'Enviada' | 'Enviada a Taller' | 'En Producción' | 'Nueva Solicitud Web (Por Revisar)';

export interface SavedQuotation {
  id: string;
  folio: string;
  clientName: string;
  clientContact?: string;
  projectName: string;
  date: string;
  createdAt?: string;
  status: QuotationStatus;
  models: CotizadorModelItem[];
  bomItems?: BomItem[];
  customServices?: CustomServiceItem[];
  deliveryType: string;
  deliveryCost: number;
  paymentMethod: string;
  transferPaymentFeeToClient: boolean;
  requireInvoice: boolean;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  vatAmount?: number;
  total: number;
  totalHours: number;
  totalPieces: number;
  notes?: string;
  workshopNotes?: string;
  draftData: CotizadorDraftData;
  customRequestData?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    requestedMaterial?: string;
    requestedColor?: string;
    requestedQuantity?: number;
    specialInstructions?: string;
    clientEmail?: string;
    clientPhone?: string;
    city?: string;
  };
}

export interface CartItem {
  id: string;
  recipe: CatalogRecipe;
  quantity: number;
  selectedColor?: string;
  selectedMaterial?: string;
  customNotes?: string;
  unitPrice: number;
}

export interface CustomQuoteSubmission {
  fileName?: string;
  fileSize?: string;
  fileDataUrl?: string;
  material: string;
  color: string;
  quantity: number;
  specialInstructions: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  city: string;
}

export interface CapexAsset {
  id: string;
  nombre: string;
  costoTotal: number;
  vidaUtilMeses: number;
  mesRegistro: string; // YYYY-MM
  categoria: 'Hardware' | 'Mobiliario' | 'Herramientas';
}

export interface OpexFixedCost {
  id: string;
  nombre: string;
  costoMensual: number;
  categoria: 'Renta' | 'Software' | 'Marketing' | 'Servicios';
}

export interface HourlyConsumable {
  id: string;
  nombre: string;
  costoPorHora: number;
  categoria: 'Laca' | 'Alcohol' | 'Mantenimiento';
}
