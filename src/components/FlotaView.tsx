import React, { useState, useMemo } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { PrinterDevice, MaintenanceLog, PrinterSparePart } from '../types';
import {
  Printer,
  Cpu,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  X,
  ShieldAlert,
  History,
  Trash2,
  Calendar,
  DollarSign,
  Info,
  Maximize2,
  Activity,
  Layers,
  Settings,
  Zap,
  PowerOff,
  Check,
  Package,
  ShoppingCart,
  ExternalLink,
  Tag,
  MapPin,
  Box,
  Edit3,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Archive,
} from 'lucide-react';

export const FlotaView: React.FC = () => {
  const {
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
    orders,
  } = useWorkshop();

  // Tab principal de Flota: 'impresoras' | 'refacciones' | 'bitacora'
  const [activeFlotaTab, setActiveFlotaTab] = useState<'impresoras' | 'refacciones' | 'bitacora'>('impresoras');

  // Drawers state
  const [isPrinterDrawerOpen, setIsPrinterDrawerOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterDevice | null>(null);

  const [isMaintenanceDrawerOpen, setIsMaintenanceDrawerOpen] = useState(false);
  const [selectedPrinterForMtto, setSelectedPrinterForMtto] = useState<PrinterDevice | null>(null);

  const [isRetireDrawerOpen, setIsRetireDrawerOpen] = useState(false);
  const [selectedPrinterForRetire, setSelectedPrinterForRetire] = useState<PrinterDevice | null>(null);

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyPrinterFilter, setHistoryPrinterFilter] = useState<string>('all');

  const [isSparePartDrawerOpen, setIsSparePartDrawerOpen] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<PrinterSparePart | null>(null);

  // Filter and search state - Impresoras
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter and search state - Refacciones
  const [spareSearchTerm, setSpareSearchTerm] = useState('');
  const [spareModelFilter, setSpareSearchTermModelFilter] = useState<string>('all');
  const [spareCategoryFilter, setSpareCategoryFilter] = useState<string>('all');

  // Form states - Printer Form
  const [printerAlias, setPrinterAlias] = useState('');
  const [printerMarca, setPrinterMarca] = useState('Bambu Lab');
  const [printerModelo, setPrinterModelo] = useState('');
  const [printerTipoExtrusion, setPrinterTipoExtrusion] = useState<'FDM' | 'Resina'>('FDM');
  const [printerBoquilla, setPrinterBoquilla] = useState('0.4mm');
  const [printerCamaX, setPrinterCamaX] = useState(256);
  const [printerCamaY, setPrinterCamaY] = useState(256);
  const [printerCamaZ, setPrinterCamaZ] = useState(256);
  const [printerTarifa, setPrinterTarifa] = useState<number | string>(45.0);
  const [printerOdometro, setPrinterOdometro] = useState(0);
  const [printerProximoMtto, setPrinterProximoMtto] = useState(250);
  const [printerFechaAdquisicion, setPrinterFechaAdquisicion] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [printerEstado, setPrinterEstado] = useState<PrinterDevice['estado']>('disponible');
  const [printerNotas, setPrinterNotas] = useState('');

  // Estados de Inventario y Adquisición de Activo
  const [printerCostoCompra, setPrinterCostoCompra] = useState<number | string>('');
  const [printerProveedorCompra, setPrinterProveedorCompra] = useState('3D Market CDMX');
  const [printerNumeroSerie, setPrinterNumeroSerie] = useState('');
  const [printerNumeroFactura, setPrinterNumeroFactura] = useState('');
  const [printerGarantiaVencimiento, setPrinterGarantiaVencimiento] = useState('');
  const [printerToDelete, setPrinterToDelete] = useState<PrinterDevice | null>(null);
  const [showArchivedSection, setShowArchivedSection] = useState(false);

  // Form states - Maintenance Form
  const [mttoPrinterId, setMttoPrinterId] = useState('');
  const [mttoTipo, setMttoTipo] = useState<'preventivo' | 'correctivo' | 'calibracion'>('preventivo');
  const [mttoTecnico, setMttoTecnico] = useState('');
  const [mttoFecha, setMttoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [mttoDescripcion, setMttoDescripcion] = useState('');
  const [mttoRefacciones, setMttoRefacciones] = useState('');
  const [mttoCostoRefacciones, setMttoCostoRefacciones] = useState(0);
  const [mttoSeguridadAceptada, setMttoSeguridadAceptada] = useState(false);
  const [mttoSparePartIdUsed, setMttoSparePartIdUsed] = useState<string>('');
  const [mttoSparePartQtyUsed, setMttoSparePartQtyUsed] = useState<number>(1);

  // Form states - Retire Form
  const [retireReasonCategory, setRetireReasonCategory] = useState('Venta de equipo');
  const [retireReasonDetails, setRetireReasonDetails] = useState('');

  // Form states - Spare Part Form
  const [spNombre, setSpNombre] = useState('');
  const [spModeloCompatible, setSpModeloCompatible] = useState('Bambu Lab A1 Series');
  const [spCategoria, setSpCategoria] = useState<PrinterSparePart['categoria']>('Extrusor / Hotend');
  const [spStockActual, setSpStockActual] = useState(1);
  const [spStockMinimo, setSpStockMinimo] = useState(1);
  const [spCostoUnitario, setSpCostoUnitario] = useState(150.0);
  const [spProveedorNombre, setSpProveedorNombre] = useState('3D Market CDMX');
  const [spUrlCompra, setSpUrlCompra] = useState('https://3dmarket.mx');
  const [spUbicacionTaller, setSpUbicacionTaller] = useState('Gaveta A1 - Bambu');
  const [spSku, setSpSku] = useState('');

  // Handlers for Printer Drawer (A)
  const handleOpenAddPrinter = () => {
    setEditingPrinter(null);
    setPrinterAlias(`IMP-3D-BAM-0${printers.length + 1}`);
    setPrinterMarca('Bambu Lab');
    setPrinterModelo('A1 Combo');
    setPrinterTipoExtrusion('FDM');
    setPrinterBoquilla('0.4mm');
    setPrinterCamaX(256);
    setPrinterCamaY(256);
    setPrinterCamaZ(256);
    setPrinterTarifa(45.0);
    setPrinterOdometro(0);
    setPrinterProximoMtto(250);
    setPrinterFechaAdquisicion(new Date().toISOString().split('T')[0]);
    setPrinterEstado('disponible');
    setPrinterNotas('');
    setPrinterCostoCompra('');
    setPrinterProveedorCompra('3D Market CDMX');
    setPrinterNumeroSerie('');
    setPrinterNumeroFactura('');
    setPrinterGarantiaVencimiento('');
    setIsPrinterDrawerOpen(true);
  };

  const handleOpenEditPrinter = (printer: PrinterDevice) => {
    setEditingPrinter(printer);
    setPrinterAlias(printer.alias);
    setPrinterMarca(printer.marca);
    setPrinterModelo(printer.modelo);
    setPrinterTipoExtrusion(printer.tipoExtrusion);
    setPrinterBoquilla(printer.boquillaInstalada);
    setPrinterCamaX(printer.tamanoCama?.x || 256);
    setPrinterCamaY(printer.tamanoCama?.y || 256);
    setPrinterCamaZ(printer.tamanoCama?.z || 256);
    setPrinterTarifa(printer.tarifaHoraBase || 45.0);
    setPrinterOdometro(printer.odometroHoras || 0);
    setPrinterProximoMtto(printer.proximoMttoHoras || 250);
    setPrinterFechaAdquisicion(printer.fechaAdquisicion || new Date().toISOString().split('T')[0]);
    setPrinterEstado(printer.estado);
    setPrinterNotas(printer.notas || '');
    setPrinterCostoCompra(printer.costoCompra !== undefined ? printer.costoCompra : '');
    setPrinterProveedorCompra(printer.proveedorCompra || '');
    setPrinterNumeroSerie(printer.numeroSerie || '');
    setPrinterNumeroFactura(printer.numeroFactura || '');
    setPrinterGarantiaVencimiento(printer.garantiaVencimiento || '');
    setIsPrinterDrawerOpen(true);
    setActiveMenuId(null);
  };

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerAlias.trim() || !printerModelo.trim()) return;

    const printerData = {
      alias: printerAlias.trim(),
      marca: printerMarca.trim(),
      modelo: printerModelo.trim(),
      tipoExtrusion: printerTipoExtrusion,
      boquillaInstalada: printerBoquilla,
      tamanoCama: { x: Number(printerCamaX), y: Number(printerCamaY), z: Number(printerCamaZ) },
      tarifaHoraBase: Math.max(0, parseFloat(String(printerTarifa)) || 0),
      odometroHoras: Number(printerOdometro),
      fechaAdquisicion: printerFechaAdquisicion,
      estado: printerEstado,
      fechaUltimoMtto: editingPrinter?.fechaUltimoMtto || new Date().toISOString().split('T')[0],
      proximoMttoHoras: Number(printerProximoMtto),
      notas: printerNotas.trim(),
      costoCompra: printerCostoCompra !== '' ? Math.max(0, parseFloat(String(printerCostoCompra)) || 0) : undefined,
      proveedorCompra: printerProveedorCompra.trim() || undefined,
      numeroSerie: printerNumeroSerie.trim() || undefined,
      numeroFactura: printerNumeroFactura.trim() || undefined,
      garantiaVencimiento: printerGarantiaVencimiento || undefined,
    };

    if (editingPrinter) {
      updatePrinter(editingPrinter.id, printerData);
    } else {
      addPrinter(printerData);
    }

    setIsPrinterDrawerOpen(false);
  };

  // Handlers for Maintenance Drawer (B)
  const handleOpenMaintenance = (printer?: PrinterDevice) => {
    const p = printer || printers.find((item) => item.estado !== 'baja') || printers[0];
    setSelectedPrinterForMtto(p || null);
    setMttoPrinterId(p?.id || '');
    setMttoTipo('preventivo');
    setMttoTecnico('Ing. Carlos Mendoza');
    setMttoFecha(new Date().toISOString().split('T')[0]);
    setMttoDescripcion('');
    setMttoRefacciones('');
    setMttoCostoRefacciones(0);
    setMttoSeguridadAceptada(false);
    setMttoSparePartIdUsed('');
    setMttoSparePartQtyUsed(1);
    setIsMaintenanceDrawerOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mttoSeguridadAceptada || !mttoPrinterId) return;

    const targetPrinter = printers.find((p) => p.id === mttoPrinterId);

    addMaintenanceLog({
      printerId: mttoPrinterId,
      printerAlias: targetPrinter?.alias || mttoPrinterId,
      fecha: mttoFecha,
      tipo: mttoTipo,
      tecnicoResponsable: mttoTecnico.trim() || 'Operador de Taller',
      descripcion: mttoDescripcion.trim() || 'Mantenimiento de rutina completado.',
      refaccionesReemplazadas: mttoRefacciones.trim() || 'Sin refacciones',
      costoTotalRefacciones: Number(mttoCostoRefacciones),
      notasSeguridadAceptadas: true,
      sparePartIdUsed: mttoSparePartIdUsed || undefined,
      sparePartQtyUsed: mttoSparePartQtyUsed || 1,
    });

    setIsMaintenanceDrawerOpen(false);
  };

  // Handlers for Retire Drawer (C)
  const handleOpenRetire = (printer: PrinterDevice) => {
    setSelectedPrinterForRetire(printer);
    setRetireReasonCategory('Venta de equipo');
    setRetireReasonDetails('');
    setIsRetireDrawerOpen(true);
    setActiveMenuId(null);
  };

  const handleConfirmRetire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrinterForRetire) return;

    const fullReason = `${retireReasonCategory}${
      retireReasonDetails.trim() ? `: ${retireReasonDetails.trim()}` : ''
    }`;

    retirePrinter(selectedPrinterForRetire.id, fullReason);
    setIsRetireDrawerOpen(false);
  };

  // Handlers for History Drawer (D)
  const handleOpenHistory = (printerId: string = 'all') => {
    setHistoryPrinterFilter(printerId);
    setIsHistoryDrawerOpen(true);
    setActiveMenuId(null);
  };

  // Handlers for Spare Part Drawer
  const handleOpenAddSparePart = () => {
    setEditingSparePart(null);
    setSpNombre('');
    setSpModeloCompatible('Bambu Lab A1 Series');
    setSpCategoria('Extrusor / Hotend');
    setSpStockActual(2);
    setSpStockMinimo(1);
    setSpCostoUnitario(250.0);
    setSpProveedorNombre('3D Market CDMX');
    setSpUrlCompra('https://3dmarket.mx');
    setSpUbicacionTaller('Gaveta A1 - Bambu');
    setSpSku(`REF-BAM-${Date.now().toString().slice(-4)}`);
    setIsSparePartDrawerOpen(true);
  };

  const handleOpenEditSparePart = (sp: PrinterSparePart) => {
    setEditingSparePart(sp);
    setSpNombre(sp.nombreRefaccion);
    setSpModeloCompatible(sp.printerModelCompatible);
    setSpCategoria(sp.categoria);
    setSpStockActual(sp.stockActual);
    setSpStockMinimo(sp.stockMinimo);
    setSpCostoUnitario(sp.costoUnitarioMXN);
    setSpProveedorNombre(sp.proveedorNombre);
    setSpUrlCompra(sp.urlCompra);
    setSpUbicacionTaller(sp.ubicacionTaller);
    setSpSku(sp.sku || '');
    setIsSparePartDrawerOpen(true);
  };

  const handleSaveSparePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spNombre.trim()) return;

    const partData = {
      nombreRefaccion: spNombre.trim(),
      printerModelCompatible: spModeloCompatible,
      categoria: spCategoria,
      stockActual: Number(spStockActual),
      stockMinimo: Number(spStockMinimo),
      costoUnitarioMXN: Number(spCostoUnitario),
      proveedorNombre: spProveedorNombre.trim(),
      urlCompra: spUrlCompra.trim() || 'https://3dmarket.mx',
      ubicacionTaller: spUbicacionTaller.trim() || 'Almacén Taller',
      sku: spSku.trim() || `REF-${Date.now().toString().slice(-4)}`,
    };

    if (editingSparePart) {
      updateSparePart(editingSparePart.id, partData);
    } else {
      addSparePart(partData);
    }

    setIsSparePartDrawerOpen(false);
  };

  // Toggle Maintenance mode directly from contextual menu
  const handleToggleMaintenanceStatus = (printer: PrinterDevice) => {
    const newStatus: PrinterDevice['estado'] =
      printer.estado === 'mantenimiento' ? 'disponible' : 'mantenimiento';
    updatePrinter(printer.id, { estado: newStatus });
    setActiveMenuId(null);
  };

  // Calculate KPIs - Impresoras
  const activePrinters = printers.filter((p) => p.estado !== 'baja');
  const archivedPrinters = printers.filter((p) => p.estado === 'baja');
  const totalPrintersCount = activePrinters.length;
  const totalFleetInvestment = activePrinters.reduce((acc, p) => acc + (p.costoCompra || 0), 0);
  const totalOdometroHours = activePrinters.reduce((acc, p) => acc + (p.odometroHoras || 0), 0);
  const runningPrintersCount = activePrinters.filter((p) => p.estado === 'en_impresion').length;
  const maintenanceAlertsCount = activePrinters.filter(
    (p) => p.estado === 'mantenimiento' || p.odometroHoras >= p.proximoMttoHoras
  ).length;

  // Filter printers list (las archivadas quedan ocultas en vista general)
  const filteredPrinters = printers.filter((p) => {
    const matchesSearch =
      p.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.numeroSerie && p.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.proveedorCompra && p.proveedorCompra.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // En 'all', solo mostramos máquinas activas para mantener la flota limpia
    if (statusFilter === 'all') return p.estado !== 'baja';
    return p.estado === statusFilter;
  });

  // Filter spare parts list
  const filteredSpareParts = spareParts.filter((sp) => {
    const matchesSearch =
      sp.nombreRefaccion.toLowerCase().includes(spareSearchTerm.toLowerCase()) ||
      sp.proveedorNombre.toLowerCase().includes(spareSearchTerm.toLowerCase()) ||
      sp.ubicacionTaller.toLowerCase().includes(spareSearchTerm.toLowerCase()) ||
      (sp.sku && sp.sku.toLowerCase().includes(spareSearchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    const matchesModel =
      spareModelFilter === 'all' ||
      sp.printerModelCompatible.toLowerCase().includes(spareModelFilter.toLowerCase()) ||
      sp.printerModelCompatible === 'Universal';

    if (!matchesModel) return false;

    const matchesCategory =
      spareCategoryFilter === 'all' || sp.categoria === spareCategoryFilter;

    return matchesCategory;
  });

  // Calculate Spare Parts KPIs
  const totalSparePartsCount = spareParts.length;
  const totalSpareStockUnits = spareParts.reduce((acc, sp) => acc + sp.stockActual, 0);
  const criticalSpareAlerts = spareParts.filter((sp) => sp.stockActual <= sp.stockMinimo);
  const totalSpareInventoryValue = spareParts.reduce(
    (acc, sp) => acc + sp.stockActual * sp.costoUnitarioMXN,
    0
  );

  // Available spare parts for maintenance drawer based on chosen printer
  const availableSparePartsForMtto = useMemo(() => {
    if (!mttoPrinterId) return spareParts;
    const targetPrinter = printers.find((p) => p.id === mttoPrinterId);
    if (!targetPrinter) return spareParts;

    return spareParts.filter((sp) => {
      if (sp.printerModelCompatible === 'Universal') return true;
      const modelLower = targetPrinter.modelo.toLowerCase();
      const marcaLower = targetPrinter.marca.toLowerCase();
      const compLower = sp.printerModelCompatible.toLowerCase();
      return modelLower.includes(compLower) || compLower.includes(modelLower) || marcaLower.includes(compLower);
    });
  }, [mttoPrinterId, printers, spareParts]);

  return (
    <div className="w-full max-w-[1740px] mx-auto py-4 space-y-6 animate-in fade-in duration-200">
      {/* 1. CABECERA & PESTAÑAS PRINCIPALES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-[#EADDFB] text-[#350463]">
              <Printer className="w-6 h-6 text-[#6D3ACD]" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#350463] tracking-tight">
                Control de Flota, Mantenimiento & Repuestos
              </h1>
              <p className="text-xs text-[#4B4450]">
                Gestión centralizada del parque de impresoras, odómetros, refacciones de almacén y bitácora técnica.
              </p>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#FAF7F0] rounded-2xl border border-[#CDC3D2]/40">
          <button
            type="button"
            onClick={() => setActiveFlotaTab('impresoras')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeFlotaTab === 'impresoras'
                ? 'bg-[#350463] text-white shadow-xs'
                : 'text-[#4B4450] hover:bg-[#EADDFB]/50'
            }`}
          >
            <Printer className="w-4 h-4 text-[#C0F441]" />
            <span>🖨️ Flota de Impresoras ({totalPrintersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFlotaTab('refacciones')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeFlotaTab === 'refacciones'
                ? 'bg-[#350463] text-white shadow-xs'
                : 'text-[#4B4450] hover:bg-[#EADDFB]/50'
            }`}
          >
            <Package className="w-4 h-4 text-[#C0F441]" />
            <span>🔩 Almacén de Refacciones ({totalSparePartsCount})</span>
            {criticalSpareAlerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#FF5252] animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenHistory('all')}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 text-[#350463] hover:bg-[#EADDFB]/50"
          >
            <History className="w-4 h-4 text-[#6D3ACD]" />
            <span>📋 Bitácora Técnica ({maintenanceLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: FLOTA DE IMPRESORAS                             */}
      {/* ======================================================== */}
      {activeFlotaTab === 'impresoras' && (
        <div className="space-y-6">
          {/* TARJETAS DE KPIS SUPERIORES - IMPRESORAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="p-5 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider block">
                  Flota Activa de Taller
                </span>
                <div className="text-2xl font-black font-mono text-[#350463]">
                  {totalPrintersCount} <span className="text-xs font-sans text-[#4B4450]">máquinas</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[#2E3F00] font-semibold bg-[#C0F441]/30 px-2 py-0.5 rounded-full inline-block">
                    {activePrinters.filter((p) => p.tipoExtrusion === 'FDM').length} FDM • {activePrinters.filter((p) => p.tipoExtrusion === 'Resina').length} Resina
                  </span>
                  {totalFleetInvestment > 0 && (
                    <span className="text-[10px] text-[#350463] font-bold bg-[#EADDFB] px-2 py-0.5 rounded-full inline-block">
                      Inv: ${totalFleetInvestment.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#F3EEFA] border border-[#6D3ACD]/20 flex items-center justify-center text-[#6D3ACD] shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-5 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider block">
                  Horas Odómetro Acumuladas
                </span>
                <div className="text-2xl font-black font-mono text-[#350463]">
                  {totalOdometroHours.toFixed(1)} <span className="text-xs font-sans text-[#4B4450]">hrs</span>
                </div>
                <span className="text-[10px] text-[#4B4450]">
                  Tiempo total de extrusión registrado
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#EADDFB] border border-[#6D3ACD]/20 flex items-center justify-center text-[#350463] shrink-0">
                <Clock className="w-6 h-6 text-[#6D3ACD]" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-5 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider block">
                  En Operación Activa
                </span>
                <div className="text-2xl font-black font-mono text-[#2E3F00]">
                  {runningPrintersCount} <span className="text-xs font-sans text-[#4B4450]">imprimiendo</span>
                </div>
                <span className="text-[10px] text-[#2E3F00] font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#86B100] animate-pulse" />
                  Sincronizado con Kanban
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#C0F441]/30 border border-[#86B100]/40 flex items-center justify-center text-[#2E3F00] shrink-0">
                <Zap className="w-6 h-6 text-[#2E3F00]" />
              </div>
            </div>

            {/* KPI 4 */}
            <div
              className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between ${
                maintenanceAlertsCount > 0
                  ? 'bg-[#FFF3E0] border-[#FFB74D]'
                  : 'bg-white border-[#CDC3D2]/40'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider block">
                  Servicios Preventivos
                </span>
                <div
                  className={`text-2xl font-black font-mono ${
                    maintenanceAlertsCount > 0 ? 'text-[#E65100]' : 'text-[#350463]'
                  }`}
                >
                  {maintenanceAlertsCount} <span className="text-xs font-sans text-[#4B4450]">alertas</span>
                </div>
                <span className="text-[10px] text-[#4B4450]">
                  {maintenanceAlertsCount > 0
                    ? '⚠️ Requiere revisión técnica'
                    : '✓ Todos los equipos al día'}
                </span>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  maintenanceAlertsCount > 0
                    ? 'bg-[#FFE0B2] text-[#E65100]'
                    : 'bg-[#F3EEFA] text-[#6D3ACD]'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="p-4 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#4B4450] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por alias, marca o modelo..."
                className="w-full pl-9 pr-4 py-2 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18] focus:outline-none focus:ring-1 focus:ring-[#6D3ACD]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              {[
                { id: 'all', label: 'Todas las Máquinas' },
                { id: 'disponible', label: '🟢 Disponibles' },
                { id: 'en_impresion', label: '⚡ En Impresión' },
                { id: 'mantenimiento', label: '🛠️ En Mantenimiento' },
                { id: 'fuera_de_servicio', label: '🔴 Fuera de Servicio' },
                { id: 'baja', label: '📁 Archivo Oculto' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-[#350463] text-white shadow-xs'
                      : tab.id === 'baja'
                      ? 'bg-transparent text-gray-400 hover:text-gray-600 border border-transparent hover:bg-gray-100'
                      : 'bg-[#FAF7F0] text-[#4B4450] hover:bg-[#F0EEE7] border border-[#CDC3D2]/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleOpenAddPrinter}
                className="px-4 py-1.5 rounded-xl bg-[#350463] hover:bg-[#240A44] text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#C0F441]" />
                <span>+ Nueva Impresora</span>
              </button>
            </div>
          </div>

          {/* GRID DE TARJETAS DE IMPRESORAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredPrinters.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-[#CDC3D2]/40 space-y-3">
                <Printer className="w-10 h-10 text-[#CDC3D2] mx-auto" />
                <h3 className="text-sm font-bold text-[#350463]">No se encontraron impresoras</h3>
                <p className="text-xs text-[#4B4450]">
                  Ajusta los filtros de búsqueda o da de alta un nuevo equipo para tu taller.
                </p>
              </div>
            ) : (
              filteredPrinters.map((printer) => {
                const odometro = printer.odometroHoras || 0;
                const proximo = printer.proximoMttoHoras || 250;
                const progressPercent = Math.min(100, Math.round((odometro / proximo) * 100));
                const isOverdue = odometro >= proximo || printer.estado === 'mantenimiento';

                const activeOrder = orders.find(
                  (o) =>
                    o.status === 'manufacturing' &&
                    (o.assignedPrinter?.includes(printer.alias) ||
                      o.assignedPrinter?.includes(printer.id))
                );

                return (
                  <div
                    key={printer.id}
                    className={`p-5 rounded-3xl bg-white border-2 transition-all shadow-xs hover:shadow-md flex flex-col justify-between relative ${
                      printer.estado === 'baja'
                        ? 'border-[#CDC3D2]/40 bg-gray-50/70 opacity-75'
                        : isOverdue
                        ? 'border-[#FFB74D] bg-[#FFF3E0]/20'
                        : 'border-[#CDC3D2]/50 hover:border-[#6D3ACD]/40'
                    }`}
                  >
                    <div>
                      {/* CABECERA TARJETA */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          {printer.estado === 'disponible' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                              🟢 Disponible
                            </span>
                          )}
                          {printer.estado === 'en_impresion' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#F3EEFA] text-[#6D3ACD] border border-[#6D3ACD]/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#C0F441] animate-ping" />
                              ⚡ En Impresión
                            </span>
                          )}
                          {printer.estado === 'mantenimiento' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] border border-[#FFB74D] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              <Wrench className="w-3 h-3 text-[#E65100]" />
                              🛠️ En Mantenimiento
                            </span>
                          )}
                          {printer.estado === 'fuera_de_servicio' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              <PowerOff className="w-3 h-3 text-[#C62828]" />
                              🔴 Fuera de Servicio
                            </span>
                          )}
                          {printer.estado === 'baja' && (
                            <span className="px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 border border-gray-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              📁 Dada de Baja
                            </span>
                          )}
                        </div>

                        {/* Menú Contextual */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === printer.id ? null : printer.id)
                            }
                            className="p-1.5 rounded-xl hover:bg-[#F0EEE7] text-[#4B4450] transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === printer.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-[#CDC3D2]/50 p-1.5 z-30 space-y-1 text-xs">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPrinter(printer)}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F3EEFA] text-[#350463] font-bold flex items-center gap-2 cursor-pointer"
                              >
                                <span>✏️ Editar Datos Técnicos</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleMaintenanceStatus(printer)}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF3E0] text-[#E65100] font-bold flex items-center gap-2 cursor-pointer"
                              >
                                <span>
                                  {printer.estado === 'mantenimiento'
                                    ? '🟢 Reactivar / Disponible'
                                    : '⏸️ Pausar por Mantenimiento'}
                                </span>
                              </button>

                              {printer.estado !== 'baja' ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRetire(printer)}
                                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF3E0] text-[#E65100] font-bold flex items-center gap-2 cursor-pointer border-t border-[#F0EEE7] mt-1 pt-1.5"
                                >
                                  <Archive className="w-3.5 h-3.5 text-[#E65100]" />
                                  <span>📁 Archivar (Ocultar)</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updatePrinter(printer.id, { estado: 'disponible' });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#E8F5E9] text-[#2E7D32] font-bold flex items-center gap-2 cursor-pointer border-t border-[#F0EEE7] mt-1 pt-1.5"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-[#2E7D32]" />
                                  <span>🟢 Reactivar en Flota</span>
                                </button>
                              )}

                              {/* Botón Eliminar Permanente */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPrinterToDelete(printer);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFEBEE] text-[#C62828] font-bold flex items-center gap-2 cursor-pointer border-t border-[#F0EEE7] mt-1 pt-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#C62828]" />
                                <span>🗑️ Eliminar por Completo</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* IDENTIFICACIÓN DE EQUIPO */}
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-[#6D3ACD] bg-[#F3EEFA] px-2 py-0.5 rounded-lg border border-[#6D3ACD]/20">
                            {printer.alias}
                          </span>
                          <span className="text-xs font-bold text-[#4B4450]">{printer.marca}</span>
                        </div>
                        <h3 className="text-base font-black text-[#350463] leading-snug">
                          {printer.modelo}
                        </h3>
                      </div>

                      {/* DATOS TÉCNICOS */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                        <div className="p-2.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/30 space-y-0.5">
                          <span className="text-[10px] text-[#4B4450] block">Tecnología:</span>
                          <span className="font-bold text-[#1C1C18] block truncate">
                            {printer.tipoExtrusion} • {printer.boquillaInstalada}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/30 space-y-0.5">
                          <span className="text-[10px] text-[#4B4450] block">Volumen Cama:</span>
                          <span className="font-mono font-bold text-[#1C1C18] block truncate">
                            {printer.tamanoCama?.x}×{printer.tamanoCama?.y}×{printer.tamanoCama?.z} mm
                          </span>
                        </div>
                      </div>

                      {/* ODÓMETRO & MANTENIMIENTO */}
                      <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#350463] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#6D3ACD]" />
                            <span>Odómetro:</span>
                          </span>
                          <span className="font-mono font-black text-[#1C1C18]">
                            {odometro.toFixed(1)} / {proximo} hrs
                          </span>
                        </div>

                        <div className="w-full bg-[#E5E2DB] h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              progressPercent >= 100 || printer.estado === 'mantenimiento'
                                ? 'bg-[#BA1A1A]'
                                : progressPercent >= 80
                                ? 'bg-[#FF9800]'
                                : 'bg-[#86B100]'
                            }`}
                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                          />
                        </div>

                        {isOverdue && printer.estado !== 'baja' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#E65100] pt-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
                            <span>⚠ Servicio preventivo requerido (Umbral alcanzado)</span>
                          </div>
                        )}
                      </div>

                      {/* CONTROL DE ACTIVO / INVENTARIO DE COMPRA */}
                      {(printer.costoCompra !== undefined || printer.proveedorCompra || printer.numeroSerie) && (
                        <div className="p-2.5 rounded-2xl bg-[#F7F4FA] border border-[#6D3ACD]/20 space-y-1 mb-3 text-[11px]">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#6D3ACD] uppercase tracking-wider">
                            <span>📋 Control de Activo</span>
                            {printer.garantiaVencimiento && (
                              <span className="text-gray-500 font-mono font-normal lowercase">Gta: {printer.garantiaVencimiento}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[#1C1C18]">
                            {printer.costoCompra !== undefined && (
                              <div>
                                <span className="text-[#4B4450]">Inversión: </span>
                                <strong className="font-mono font-black text-[#350463]">
                                  ${printer.costoCompra.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                                </strong>
                              </div>
                            )}
                            {printer.proveedorCompra && (
                              <div className="truncate">
                                <span className="text-[#4B4450]">Comprada en: </span>
                                <strong className="font-bold text-[#1C1C18]">{printer.proveedorCompra}</strong>
                              </div>
                            )}
                          </div>
                          {(printer.numeroSerie || printer.numeroFactura) && (
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#4B4450] pt-1 border-t border-[#CDC3D2]/30">
                              {printer.numeroSerie && (
                                <span>S/N: <strong className="font-mono text-[#350463]">{printer.numeroSerie}</strong></span>
                              )}
                              {printer.numeroFactura && (
                                <span>Doc: <strong className="font-mono text-[#4B4450]">{printer.numeroFactura}</strong></span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* PIE DE TARJETA */}
                    <div className="pt-3 border-t border-[#F0EEE7] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#4B4450]">Tarifa Base:</span>
                        <span className="font-mono font-black text-[#350463]">
                          ${(printer.tarifaHoraBase || 45).toFixed(2)} MXN/hr
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenMaintenance(printer)}
                          className="px-2.5 py-2 rounded-xl bg-[#EADDFB] hover:bg-[#d8c5f5] text-[#350463] font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#6D3ACD]/30"
                        >
                          <Wrench className="w-3.5 h-3.5 text-[#6D3ACD]" />
                          <span>🛠️ Mantenimiento</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenHistory(printer.id)}
                          className="px-2.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F0EEE7] text-[#4B4450] font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#CDC3D2]/40"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>📋 Bitácora</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SECCIÓN PLEGABLE DE ARCHIVO DE MÁQUINAS DADAS DE BAJA (OCULTA POR DEFECTO) */}
          {statusFilter === 'all' && archivedPrinters.length > 0 && (
            <div className="mt-8 border border-[#CDC3D2]/50 rounded-3xl bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowArchivedSection(!showArchivedSection)}
                className="w-full flex items-center justify-between p-4 px-6 text-left cursor-pointer hover:bg-[#FAF7F0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-gray-100 text-gray-600 border border-gray-200">
                    <Archive className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#350463] flex items-center gap-2">
                      <span>Máquinas en Archivo / Dadas de Baja</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono font-bold border border-gray-200">
                        {archivedPrinters.length} en resguardo
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#4B4450]">
                      Equipos retirados del servicio activo que se mantienen archivados para no saturar tu flota principal.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6D3ACD] bg-[#F3EEFA] px-3 py-1.5 rounded-xl border border-[#6D3ACD]/20">
                  <span>{showArchivedSection ? 'Ocultar archivo' : 'Desplegar archivo'}</span>
                  {showArchivedSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showArchivedSection && (
                <div className="p-6 pt-3 border-t border-[#F0EEE7] bg-[#FAF7F0]/40 space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {archivedPrinters.map((archived) => (
                      <div
                        key={archived.id}
                        className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3 opacity-90 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300 text-[10px] font-bold">
                            📁 Archivada
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {archived.alias}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-gray-800">{archived.modelo}</h4>
                          <span className="text-xs text-gray-500 font-medium">{archived.marca} • {archived.tipoExtrusion}</span>
                        </div>

                        {archived.motivoBaja && (
                          <div className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                            <span className="font-bold text-gray-700">Motivo de baja: </span>
                            {archived.motivoBaja}
                          </div>
                        )}

                        {(archived.costoCompra !== undefined || archived.proveedorCompra) && (
                          <div className="text-[10px] text-gray-500 flex justify-between">
                            {archived.costoCompra !== undefined && (
                              <span>Inv: <strong>${archived.costoCompra.toLocaleString('es-MX')} MXN</strong></span>
                            )}
                            {archived.proveedorCompra && (
                              <span>Comprada: <strong>{archived.proveedorCompra}</strong></span>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => updatePrinter(archived.id, { estado: 'disponible' })}
                            className="px-2.5 py-1.5 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reactivar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrinterToDelete(archived)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#C62828] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: ALMACÉN DE REFACCIONES & REPUESTOS              */}
      {/* ======================================================== */}
      {activeFlotaTab === 'refacciones' && (
        <div className="space-y-6">
          {/* TARJETAS DE KPIS SUPERIORES - REFACCIONES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="p-5 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider block">
                  Total Refacciones en Catálogo
                </span>
                <div className="text-2xl font-black font-mono text-[#350463]">
                  {totalSparePartsCount} <span className="text-xs font-sans text-[#4B4450]">skus</span>
                </div>
                <span className="text-[10px] text-[#4B4450]">Piezas y repuestos de taller</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#F3EEFA] border border-[#6D3ACD]/20 flex items-center justify-center text-[#6D3ACD] shrink-0">
                <Package className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-5 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider block">
                  Stock Total de Piezas
                </span>
                <div className="text-2xl font-black font-mono text-[#350463]">
                  {totalSpareStockUnits} <span className="text-xs font-sans text-[#4B4450]">unidades</span>
                </div>
                <span className="text-[10px] text-[#2E3F00] font-semibold bg-[#C0F441]/30 px-2 py-0.5 rounded-full inline-block">
                  Disponibles físicamente
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#EADDFB] border border-[#6D3ACD]/20 flex items-center justify-center text-[#350463] shrink-0">
                <Box className="w-6 h-6 text-[#6D3ACD]" />
              </div>
            </div>

            {/* KPI 3 */}
            <div
              className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between ${
                criticalSpareAlerts.length > 0
                  ? 'bg-[#FFEBEE] border-[#FFCDD2]'
                  : 'bg-white border-[#CDC3D2]/40'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider block">
                  Reabastecimiento Crítico
                </span>
                <div
                  className={`text-2xl font-black font-mono ${
                    criticalSpareAlerts.length > 0 ? 'text-[#C62828]' : 'text-[#350463]'
                  }`}
                >
                  {criticalSpareAlerts.length}{' '}
                  <span className="text-xs font-sans text-[#4B4450]">skus bajo mínimo</span>
                </div>
                <span className="text-[10px] text-[#4B4450]">
                  {criticalSpareAlerts.length > 0
                    ? '⚠️ Requiere compra inmediata'
                    : '✓ Stock suficiente en almacén'}
                </span>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  criticalSpareAlerts.length > 0
                    ? 'bg-[#FFCDD2] text-[#C62828]'
                    : 'bg-[#F3EEFA] text-[#6D3ACD]'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-5 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider block">
                  Valor Inventario Refacciones
                </span>
                <div className="text-2xl font-black font-mono text-[#2E3F00]">
                  ${totalSpareInventoryValue.toFixed(2)}{' '}
                  <span className="text-xs font-sans text-[#4B4450]">MXN</span>
                </div>
                <span className="text-[10px] text-[#4B4450]">Inversión en repuestos</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#C0F441]/30 border border-[#86B100]/40 flex items-center justify-center text-[#2E3F00] shrink-0">
                <DollarSign className="w-6 h-6 text-[#2E3F00]" />
              </div>
            </div>
          </div>

          {/* BARRA DE FILTROS & BÚSQUEDA - REFACCIONES */}
          <div className="p-4 rounded-3xl bg-white border border-[#CDC3D2]/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#4B4450] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={spareSearchTerm}
                onChange={(e) => setSpareSearchTerm(e.target.value)}
                placeholder="Buscar refacción, proveedor o ubicación..."
                className="w-full pl-9 pr-4 py-2 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18] focus:outline-none focus:ring-1 focus:ring-[#6D3ACD]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={spareModelFilter}
                onChange={(e) => setSpareSearchTermModelFilter(e.target.value)}
                className="px-3 py-2 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-bold text-[#350463]"
              >
                <option value="all">Todas las Máquinas / Compatibilidad</option>
                <option value="Bambu Lab A1 Series">Bambu Lab A1 Series</option>
                <option value="Bambu Lab P1/X1 Series">Bambu Lab P1/X1 Series</option>
                <option value="Creality Ender 3 Series">Creality Ender 3 Series</option>
                <option value="Elegoo Saturn Series">Elegoo Saturn / Resina</option>
                <option value="Universal">Universales</option>
              </select>

              <select
                value={spareCategoryFilter}
                onChange={(e) => setSpareCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-bold text-[#350463]"
              >
                <option value="all">Todas las Categorías</option>
                <option value="Extrusor / Hotend">Extrusor / Hotend</option>
                <option value="Cama & Superficie PEI">Cama & Superficie PEI</option>
                <option value="Mecánica & Correas">Mecánica & Correas</option>
                <option value="Electrónica & Sensores">Electrónica & Sensores</option>
                <option value="Consumibles Mtto (Grasa/Alcohol)">Consumibles Mtto</option>
              </select>

              <button
                type="button"
                onClick={handleOpenAddSparePart}
                className="px-4 py-2 rounded-xl bg-[#350463] hover:bg-[#240A44] text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#C0F441]" />
                <span>+ Alta Refacción</span>
              </button>
            </div>
          </div>

          {/* GRID DE TARJETAS DE REFACCIONES */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSpareParts.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-[#CDC3D2]/40 space-y-3">
                <Package className="w-10 h-10 text-[#CDC3D2] mx-auto" />
                <h3 className="text-sm font-bold text-[#350463]">No hay refacciones registradas</h3>
                <p className="text-xs text-[#4B4450]">
                  Registra repuestos como boquillas, termistores o camas PEI para darles seguimiento.
                </p>
              </div>
            ) : (
              filteredSpareParts.map((sp) => {
                const isCritical = sp.stockActual <= sp.stockMinimo;

                return (
                  <div
                    key={sp.id}
                    className={`p-5 rounded-3xl bg-white border-2 transition-all shadow-xs flex flex-col justify-between ${
                      isCritical
                        ? 'border-[#FF5252] bg-[#FFEBEE]/30'
                        : 'border-[#CDC3D2]/50 hover:border-[#6D3ACD]/40'
                    }`}
                  >
                    <div>
                      {/* Cabecera Tarjeta Refacción */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] text-[10px] font-bold border border-[#6D3ACD]/20">
                          {sp.categoria}
                        </span>

                        {isCritical ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FFCDD2] text-[#C62828] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-[#C62828]" />
                            ⚠️ Requiere Compra
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold">
                            ✓ Stock Óptimo
                          </span>
                        )}
                      </div>

                      {/* Título & SKU */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[#6D3ACD] bg-[#F3EEFA] px-2 py-0.5 rounded">
                            {sp.sku || 'SKU-REF'}
                          </span>
                          <span className="text-[10px] font-bold text-[#4B4450]">
                            📍 {sp.ubicacionTaller}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-[#350463] leading-snug">
                          {sp.nombreRefaccion}
                        </h3>
                      </div>

                      {/* COMPATIBILIDAD */}
                      <div className="p-2.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/30 space-y-1 mb-3 text-xs">
                        <span className="text-[10px] text-[#4B4450] block font-semibold">
                          Compatibilidad de Máquina:
                        </span>
                        <span className="font-bold text-[#350463] flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5 text-[#6D3ACD]" />
                          {sp.printerModelCompatible}
                        </span>
                      </div>

                      {/* DATOS DE STOCK & COSTO */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="p-2.5 rounded-2xl bg-white border border-[#CDC3D2]/40">
                          <span className="text-[10px] text-[#4B4450] block">Stock Disponible:</span>
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`text-base font-black font-mono ${
                                isCritical ? 'text-[#C62828]' : 'text-[#2E3F00]'
                              }`}
                            >
                              {sp.stockActual}
                            </span>
                            <span className="text-[10px] text-[#4B4450]">/ min {sp.stockMinimo}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-white border border-[#CDC3D2]/40">
                          <span className="text-[10px] text-[#4B4450] block">Costo Unitario:</span>
                          <span className="text-base font-black font-mono text-[#350463]">
                            ${sp.costoUnitarioMXN.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#4B4450] flex items-center justify-between mb-4">
                        <span>Proveedor: <strong>{sp.proveedorNombre}</strong></span>
                      </div>
                    </div>

                    {/* PIE DE TARJETA & BOTONES */}
                    <div className="pt-3 border-t border-[#F0EEE7] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {/* Control rápido de Stock (+ / -) */}
                        <div className="flex items-center gap-1 bg-[#FAF7F0] p-1 rounded-xl border border-[#CDC3D2]/40">
                          <button
                            type="button"
                            onClick={() => consumeSparePart(sp.id, 1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-[#FFEBEE] text-[#C62828] font-bold text-xs flex items-center justify-center cursor-pointer border border-[#CDC3D2]/30"
                            title="Descontar 1 pieza"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-xs px-2 text-[#350463]">
                            {sp.stockActual}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateSparePart(sp.id, { stockActual: sp.stockActual + 1 })}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-[#E8F5E9] text-[#2E7D32] font-bold text-xs flex items-center justify-center cursor-pointer border border-[#CDC3D2]/30"
                            title="Añadir 1 pieza"
                          >
                            +
                          </button>
                        </div>

                        {/* Botón Editar / Eliminar */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSparePart(sp)}
                            className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F0EEE7] text-[#350463] cursor-pointer"
                            title="Editar Refacción"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteSparePart(sp.id)}
                            className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#FFEBEE] text-[#C62828] cursor-pointer"
                            title="Eliminar Refacción"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Botón Primario de Reabastecimiento Crítico */}
                      {isCritical && (
                        <a
                          href={sp.urlCompra}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-[#C62828] hover:bg-[#B71C1C] text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-[#C0F441]" />
                          <span>🛒 Comprar en Proveedor ({sp.proveedorNombre})</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER A: ALTA / EDICIÓN DE IMPRESORA (SLIDE-OVER DERECHO) */}
      {/* ======================================================== */}
      {isPrinterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-5 border-b border-[#CDC3D2]/40 bg-[#FAF7F0] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] flex items-center justify-center text-[#350463]">
                  <Printer className="w-5 h-5 text-[#6D3ACD]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#350463]">
                    {editingPrinter ? 'Editar Impresora 3D' : 'Alta de Nueva Impresora 3D'}
                  </h2>
                  <p className="text-[11px] text-[#4B4450]">
                    Configuración técnica, dimensiones de volumen y tarifa por hora.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrinterDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-[#F0EEE7] text-[#4B4450] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrinter} className="p-6 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Alias Interno equipo:</label>
                  <input
                    type="text"
                    required
                    value={printerAlias}
                    onChange={(e) => setPrinterAlias(e.target.value)}
                    placeholder="Ej. IMP-3D-BAM-03"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Marca del Fabricante:</label>
                  <select
                    value={printerMarca}
                    onChange={(e) => setPrinterMarca(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  >
                    <option value="Bambu Lab">Bambu Lab</option>
                    <option value="Creality">Creality</option>
                    <option value="Prusa Research">Prusa Research</option>
                    <option value="Elegoo">Elegoo</option>
                    <option value="Anycubic">Anycubic</option>
                    <option value="Formlabs">Formlabs</option>
                    <option value="Voron / Custom">Voron / Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Modelo del equipo:</label>
                  <input
                    type="text"
                    required
                    value={printerModelo}
                    onChange={(e) => setPrinterModelo(e.target.value)}
                    placeholder="Ej. A1 Combo, P1S, Ender 3 V3"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Tecnología Extrusión:</label>
                  <select
                    value={printerTipoExtrusion}
                    onChange={(e) => setPrinterTipoExtrusion(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  >
                    <option value="FDM">FDM (Deposición Fundida)</option>
                    <option value="Resina">Resina SLA / MSLA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Boquilla / LCD Instalado:</label>
                  <select
                    value={printerBoquilla}
                    onChange={(e) => setPrinterBoquilla(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  >
                    <option value="0.4mm">0.4mm (Estándar Versátil)</option>
                    <option value="0.2mm">0.2mm (Detalle Fino)</option>
                    <option value="0.6mm">0.6mm (Alta Velocidad)</option>
                    <option value="0.8mm">0.8mm (Piezas Grandes)</option>
                    <option value="0.05mm LCD">0.05mm LCD (Resina High-Res)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#350463]">Tarifa Base ($ MXN/hr):</label>
                    <span className="text-[10px] text-[#6D3ACD] font-bold">Totalmente Editable</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={printerTarifa}
                    onChange={(e) => setPrinterTarifa(e.target.value)}
                    placeholder="Ej. 10.0, 25.0, 45.0"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463] focus:border-[#6D3ACD] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#4B4450]">
                    Esta tarifa regirá los costos y ganancias por hora de máquina en tus cotizaciones.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-2">
                <span className="text-xs font-bold text-[#350463] block">
                  Volumen Útil de Cama (X × Y × Z mm):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-[#4B4450]">Eje X (mm):</span>
                    <input
                      type="number"
                      required
                      value={printerCamaX}
                      onChange={(e) => setPrinterCamaX(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono text-[#1C1C18]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4B4450]">Eje Y (mm):</span>
                    <input
                      type="number"
                      required
                      value={printerCamaY}
                      onChange={(e) => setPrinterCamaY(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono text-[#1C1C18]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4B4450]">Eje Z (mm):</span>
                    <input
                      type="number"
                      required
                      value={printerCamaZ}
                      onChange={(e) => setPrinterCamaZ(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono text-[#1C1C18]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Odómetro Actual (hrs):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={printerOdometro}
                    onChange={(e) => setPrinterOdometro(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono text-[#1C1C18]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Umbral Alerta Mtto (hrs):</label>
                  <input
                    type="number"
                    step="10"
                    min="50"
                    value={printerProximoMtto}
                    onChange={(e) => setPrinterProximoMtto(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono text-[#1C1C18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Fecha Adquisición:</label>
                  <input
                    type="date"
                    value={printerFechaAdquisicion}
                    onChange={(e) => setPrinterFechaAdquisicion(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Estatus Inicial:</label>
                  <select
                    value={printerEstado}
                    onChange={(e) => setPrinterEstado(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  >
                    <option value="disponible">🟢 Disponible</option>
                    <option value="en_impresion">⚡ En Impresión</option>
                    <option value="mantenimiento">🛠️ En Mantenimiento</option>
                    <option value="fuera_de_servicio">🔴 Fuera de Servicio</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN INVENTARIO & CONTROL PATRIMONIAL DE ACTIVO */}
              <div className="p-4 rounded-2xl bg-[#F7F4FA] border border-[#6D3ACD]/25 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#EADDFB] text-[#6D3ACD]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#350463]">
                      Control de Activo & Inversión de Compra
                    </h4>
                    <p className="text-[10px] text-[#4B4450]">
                      Registro para inventario, amortización de equipo y control contable del taller.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#350463]">Inversión / Costo de Compra ($ MXN):</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={printerCostoCompra}
                      onChange={(e) => setPrinterCostoCompra(e.target.value)}
                      placeholder="Ej. 13999.00"
                      className="w-full p-2.5 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463] focus:border-[#6D3ACD] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#350463]">Proveedor / Tienda de compra:</label>
                    <input
                      type="text"
                      value={printerProveedorCompra}
                      onChange={(e) => setPrinterProveedorCompra(e.target.value)}
                      placeholder="Ej. 3D Market, Amazon, Bambu Lab Oficial"
                      className="w-full p-2.5 bg-white border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#350463]">Número de Serie (S/N):</label>
                    <input
                      type="text"
                      value={printerNumeroSerie}
                      onChange={(e) => setPrinterNumeroSerie(e.target.value)}
                      placeholder="Ej. 01S00A23..."
                      className="w-full p-2 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono text-[#1C1C18]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#350463]">Factura / Ticket #:</label>
                    <input
                      type="text"
                      value={printerNumeroFactura}
                      onChange={(e) => setPrinterNumeroFactura(e.target.value)}
                      placeholder="Ej. FAC-48201"
                      className="w-full p-2 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono text-[#1C1C18]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#350463]">Vencimiento Garantía:</label>
                    <input
                      type="date"
                      value={printerGarantiaVencimiento}
                      onChange={(e) => setPrinterGarantiaVencimiento(e.target.value)}
                      className="w-full p-2 bg-white border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Notas / Observaciones del Equipo:</label>
                  <textarea
                    rows={2}
                    value={printerNotas}
                    onChange={(e) => setPrinterNotas(e.target.value)}
                    placeholder="Accesorios incluidos, condiciones físicas o ubicación en el taller..."
                    className="w-full p-2.5 bg-white border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrinterDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F0EEE7] hover:bg-[#E5E2DB] text-[#4B4450] font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#350463] hover:bg-[#240A44] text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  💾 {editingPrinter ? 'Guardar Cambios' : 'Registrar Impresora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER B: REGISTRAR MANTENIMIENTO TÉCNICO (SLIDE-OVER DERECHO) */}
      {/* ======================================================== */}
      {isMaintenanceDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-5 border-b border-[#CDC3D2]/40 bg-[#FAF7F0] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE0B2] flex items-center justify-center text-[#E65100]">
                  <Wrench className="w-5 h-5 text-[#E65100]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#350463]">
                    Registrar Mantenimiento Técnico
                  </h2>
                  <p className="text-[11px] text-[#4B4450]">
                    Intervención técnica vinculada al catálogo de refacciones con descuento automático de stock.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMaintenanceDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-[#F0EEE7] text-[#4B4450] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#350463]">Impresora a intervenir:</label>
                <select
                  value={mttoPrinterId}
                  onChange={(e) => {
                    setMttoPrinterId(e.target.value);
                    const p = printers.find((item) => item.id === e.target.value);
                    setSelectedPrinterForMtto(p || null);
                  }}
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-bold text-[#350463]"
                >
                  {printers
                    .filter((p) => p.estado !== 'baja')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.alias} ({p.marca} {p.modelo}) — {p.odometroHoras}h
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#350463]">Tipo de Intervención:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'preventivo', label: '🛠️ Preventivo', desc: 'Lubricación, correas, limpieza' },
                    { id: 'correctivo', label: '🔧 Correctivo', desc: 'Desatasco, cambio de piezas' },
                    { id: 'calibracion', label: '⚖️ Calibración', desc: 'Autonivelación, PID' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMttoTipo(t.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        mttoTipo === t.id
                          ? 'bg-[#EADDFB] border-[#6D3ACD] text-[#350463] font-bold shadow-xs'
                          : 'bg-white border-[#CDC3D2]/40 text-[#4B4450]'
                      }`}
                    >
                      <span className="block text-xs">{t.label}</span>
                      <span className="block text-[9px] opacity-80 leading-tight mt-0.5">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CHECKLIST OBLIGATORIO DE SEGURIDAD ELECTRICA */}
              <div className="p-4 rounded-2xl bg-[#FFF3E0] border-2 border-[#FFB74D] space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#E65100] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-[#E65100] uppercase tracking-wider">
                      Protocolo de Seguridad Industrial OBLIGATORIO
                    </h4>
                    <p className="text-[11px] text-[#E65100] opacity-90 leading-snug mt-0.5">
                      Confirmar que la impresora fue desconectada de la red eléctrica y desenergizada antes de desarmar o intervenir mecánicamente.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#FFB74D]/60 cursor-pointer hover:bg-[#FFF8E1]">
                  <input
                    type="checkbox"
                    checked={mttoSeguridadAceptada}
                    onChange={(e) => setMttoSeguridadAceptada(e.target.checked)}
                    className="w-4 h-4 accent-[#E65100] rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#E65100]">
                    ⚠ Confirmo que la impresora está DESENERGIZADA y desconectada de la luz.
                  </span>
                </label>
              </div>

              {/* INTEGRACIÓN VINCULADA DE REFACCIONES DESDE INVENTARIO (REQ 3) */}
              <div className="p-3.5 rounded-2xl bg-[#F3EEFA] border border-[#6D3ACD]/30 space-y-2">
                <label className="text-xs font-black text-[#350463] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#6D3ACD]" />
                    <span>Seleccionar Refacción de Almacén:</span>
                  </span>
                  <span className="text-[10px] text-[#6D3ACD]">Descuento automático de stock</span>
                </label>

                <select
                  value={mttoSparePartIdUsed}
                  onChange={(e) => {
                    const spId = e.target.value;
                    setMttoSparePartIdUsed(spId);
                    if (spId) {
                      const sp = spareParts.find((item) => item.id === spId);
                      if (sp) {
                        setMttoRefacciones(`${sp.nombreRefaccion} (${sp.sku || 'SKU'})`);
                        setMttoCostoRefacciones(sp.costoUnitarioMXN * mttoSparePartQtyUsed);
                      }
                    } else {
                      setMttoRefacciones('');
                      setMttoCostoRefacciones(0);
                    }
                  }}
                  className="w-full p-2.5 bg-white border border-[#CDC3D2] rounded-xl text-xs font-bold text-[#350463]"
                >
                  <option value="">-- Ninguna / Servicio de Rutina (Sin Piezas) --</option>
                  {availableSparePartsForMtto.map((sp) => (
                    <option key={sp.id} value={sp.id} disabled={sp.stockActual <= 0}>
                      {sp.nombreRefaccion} — Stock: {sp.stockActual} disp. (${sp.costoUnitarioMXN} MXN)
                      {sp.stockActual <= 0 ? ' [AGOTADO]' : ''}
                    </option>
                  ))}
                </select>

                {mttoSparePartIdUsed && (
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span className="text-[#4B4450]">Cantidad a utilizar:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={mttoSparePartQtyUsed}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value));
                        setMttoSparePartQtyUsed(qty);
                        const sp = spareParts.find((item) => item.id === mttoSparePartIdUsed);
                        if (sp) {
                          setMttoCostoRefacciones(sp.costoUnitarioMXN * qty);
                        }
                      }}
                      className="w-20 p-1.5 bg-white border border-[#CDC3D2] rounded-lg text-center font-mono font-bold text-[#350463]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Técnico Responsable:</label>
                  <input
                    type="text"
                    required
                    value={mttoTecnico}
                    onChange={(e) => setMttoTecnico(e.target.value)}
                    placeholder="Ej. Ing. Carlos Mendoza"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Fecha de Servicio:</label>
                  <input
                    type="date"
                    required
                    value={mttoFecha}
                    onChange={(e) => setMttoFecha(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#350463]">Descripción de Actividades:</label>
                <textarea
                  rows={3}
                  required
                  value={mttoDescripcion}
                  onChange={(e) => setMttoDescripcion(e.target.value)}
                  placeholder="Ej. Se limpiaron guías lineales, ajustó tensión de correas X/Y y realizó prueba de autonivelación."
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Refacción Reemplazada (Texto):</label>
                  <input
                    type="text"
                    value={mttoRefacciones}
                    onChange={(e) => setMttoRefacciones(e.target.value)}
                    placeholder="Ej. Boquilla 0.4mm + Tubo PTFE"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Costo Total ($):</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={mttoCostoRefacciones}
                    onChange={(e) => setMttoCostoRefacciones(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F0EEE7] hover:bg-[#E5E2DB] text-[#4B4450] font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!mttoSeguridadAceptada}
                  className="px-5 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#BF360C] text-white font-extrabold text-xs shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🛠️ Guardar Mantenimiento & Descontar Refacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER C: DAR DE BAJA IMPRESORA (SLIDE-OVER DERECHO)     */}
      {/* ======================================================== */}
      {isRetireDrawerOpen && selectedPrinterForRetire && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-5 border-b border-[#CDC3D2]/40 bg-[#FFEBEE] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FFCDD2] flex items-center justify-center text-[#C62828]">
                  <Trash2 className="w-5 h-5 text-[#C62828]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#C62828]">
                    Dar de Baja / Retirar de Flota
                  </h2>
                  <p className="text-[11px] text-[#B71C1C]">
                    Retiro definitivo de máquina de las opciones del Cotizador y Kanban.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRetireDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-[#FFCDD2]/50 text-[#C62828] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRetire} className="p-6 space-y-4 flex-1">
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#4B4450] block">Equipo Seleccionado:</span>
                <div className="text-sm font-black text-[#350463]">
                  {selectedPrinterForRetire.alias} — {selectedPrinterForRetire.marca} {selectedPrinterForRetire.modelo}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#350463]">Motivo Principal de Baja:</label>
                <select
                  value={retireReasonCategory}
                  onChange={(e) => setRetireReasonCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                >
                  <option value="Venta de equipo">Venta de equipo a tercero</option>
                  <option value="Despiece por refacciones">Despiece por refacciones internas</option>
                  <option value="Avería irreparable">Avería irreparable / Falla grave</option>
                  <option value="Obsolescencia tecnológica">Obsolescencia tecnológica / Renovación</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#350463]">Detalles del Retiro (Obligatorio):</label>
                <textarea
                  rows={3}
                  required
                  value={retireReasonDetails}
                  onChange={(e) => setRetireReasonDetails(e.target.value)}
                  placeholder="Ej. Vendida a cliente con comprobante..."
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                />
              </div>

              <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRetireDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F0EEE7] hover:bg-[#E5E2DB] text-[#4B4450] font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C62828] hover:bg-[#B71C1C] text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  🔴 Confirmar Baja Definitiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER E: ALTA / EDICIÓN DE REFACCIÓN (SLIDE-OVER DERECHO) */}
      {/* ======================================================== */}
      {isSparePartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-5 border-b border-[#CDC3D2]/40 bg-[#FAF7F0] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] flex items-center justify-center text-[#350463]">
                  <Package className="w-5 h-5 text-[#6D3ACD]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#350463]">
                    {editingSparePart ? 'Editar Refacción' : 'Alta de Nueva Refacción'}
                  </h2>
                  <p className="text-[11px] text-[#4B4450]">
                    Registro en catálogo de repuestos de taller con enlace a proveedor.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSparePartDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-[#F0EEE7] text-[#4B4450] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSparePart} className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#350463]">Nombre de la Refacción:</label>
                <input
                  type="text"
                  required
                  value={spNombre}
                  onChange={(e) => setSpNombre(e.target.value)}
                  placeholder="Ej. Hotend Completo 0.4mm Acero Endurecido"
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Modelo Compatible:</label>
                  <select
                    value={spModeloCompatible}
                    onChange={(e) => setSpModeloCompatible(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  >
                    <option value="Bambu Lab A1 Series">Bambu Lab A1 Series</option>
                    <option value="Bambu Lab P1/X1 Series">Bambu Lab P1/X1 Series</option>
                    <option value="Creality Ender 3 Series">Creality Ender 3 Series</option>
                    <option value="Elegoo Saturn Series">Elegoo Saturn / Resina</option>
                    <option value="Universal">Universal (Todas las impresoras)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Categoría:</label>
                  <select
                    value={spCategoria}
                    onChange={(e) => setSpCategoria(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  >
                    <option value="Extrusor / Hotend">Extrusor / Hotend</option>
                    <option value="Cama & Superficie PEI">Cama & Superficie PEI</option>
                    <option value="Mecánica & Correas">Mecánica & Correas</option>
                    <option value="Electrónica & Sensores">Electrónica & Sensores</option>
                    <option value="Consumibles Mtto (Grasa/Alcohol)">Consumibles Mtto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Stock Actual:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={spStockActual}
                    onChange={(e) => setSpStockActual(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Stock Mínimo Alerta:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={spStockMinimo}
                    onChange={(e) => setSpStockMinimo(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono text-[#1C1C18]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Costo Unit. ($ MXN):</label>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    required
                    value={spCostoUnitario}
                    onChange={(e) => setSpCostoUnitario(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Nombre del Proveedor:</label>
                  <input
                    type="text"
                    required
                    value={spProveedorNombre}
                    onChange={(e) => setSpProveedorNombre(e.target.value)}
                    placeholder="Ej. 3D Market CDMX"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#350463]">Ubicación en Taller:</label>
                  <input
                    type="text"
                    value={spUbicacionTaller}
                    onChange={(e) => setSpUbicacionTaller(e.target.value)}
                    placeholder="Ej. Gaveta A1 - Bambu"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#350463]">URL Directa de Compra:</label>
                <input
                  type="url"
                  required
                  value={spUrlCompra}
                  onChange={(e) => setSpUrlCompra(e.target.value)}
                  placeholder="https://3dmarket.mx/products/..."
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#350463]">SKU / Código Interno:</label>
                <input
                  type="text"
                  value={spSku}
                  onChange={(e) => setSpSku(e.target.value)}
                  placeholder="Ej. REF-BAM-A1-04"
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                />
              </div>

              <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSparePartDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F0EEE7] hover:bg-[#E5E2DB] text-[#4B4450] font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#350463] hover:bg-[#240A44] text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  💾 {editingSparePart ? 'Guardar Cambios' : 'Registrar Refacción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER D: BITÁCORA DE MANTENIMIENTOS (SLIDE-OVER DERECHO) */}
      {/* ======================================================== */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-5 border-b border-[#CDC3D2]/40 bg-[#FAF7F0] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] flex items-center justify-center text-[#350463]">
                  <History className="w-5 h-5 text-[#6D3ACD]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#350463]">
                    Bitácora Histórica de Mantenimientos
                  </h2>
                  <p className="text-[11px] text-[#4B4450]">
                    Registro cronológico de servicios preventivos, correctivos y refacciones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-[#F0EEE7] text-[#4B4450] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-[#350463]">Filtrar por equipo:</label>
                <select
                  value={historyPrinterFilter}
                  onChange={(e) => setHistoryPrinterFilter(e.target.value)}
                  className="p-2 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-bold text-[#350463]"
                >
                  <option value="all">Todas las impresoras</option>
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.alias} ({p.marca})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const logs = maintenanceLogs.filter(
                  (log) =>
                    historyPrinterFilter === 'all' || log.printerId === historyPrinterFilter
                );

                if (logs.length === 0) {
                  return (
                    <div className="p-8 text-center bg-[#FAF7F0] rounded-2xl border border-[#CDC3D2]/30 text-xs text-[#4B4450]">
                      No hay registros de mantenimiento registrados para esta máquina.
                    </div>
                  );
                }

                return logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs space-y-2 hover:border-[#6D3ACD]/30 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#6D3ACD] bg-[#F3EEFA] px-2 py-0.5 rounded-lg border border-[#6D3ACD]/20">
                          {log.printerAlias || log.printerId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.tipo === 'preventivo'
                              ? 'bg-[#E8F5E9] text-[#2E7D32]'
                              : log.tipo === 'correctivo'
                              ? 'bg-[#FFF3E0] text-[#E65100]'
                              : 'bg-[#EADDFB] text-[#350463]'
                          }`}
                        >
                          {log.tipo.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#4B4450] font-mono">{log.fecha}</span>
                    </div>

                    <p className="text-xs text-[#1C1C18] leading-relaxed font-medium">
                      {log.descripcion}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#F0EEE7]">
                      <div>
                        <span className="text-[#4B4450]">Técnico:</span>{' '}
                        <strong className="text-[#350463]">{log.tecnicoResponsable}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[#4B4450]">Refacciones:</span>{' '}
                        <strong className="text-[#1C1C18]">${log.costoTotalRefacciones.toFixed(2)} MXN</strong>
                      </div>
                    </div>

                    {log.refaccionesReemplazadas && (
                      <div className="text-[10px] text-[#4B4450] bg-[#FAF7F0] p-2 rounded-xl">
                        <strong>Piezas / Refacciones:</strong> {log.refaccionesReemplazadas}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN PERMANENTE */}
      {/* ======================================================== */}
      {printerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  ¿Eliminar impresora por completo?
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Esta acción es destructiva e irreversible.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>Equipo a eliminar del sistema:</span>
              </div>
              <div className="pl-5 space-y-0.5">
                <div><strong>Alias:</strong> {printerToDelete.alias}</div>
                <div><strong>Modelo:</strong> {printerToDelete.modelo} ({printerToDelete.marca})</div>
                {printerToDelete.costoCompra !== undefined && (
                  <div><strong>Inversión registrada:</strong> ${printerToDelete.costoCompra.toLocaleString('es-MX')} MXN</div>
                )}
              </div>
              <p className="text-[11px] text-red-700 pt-1 border-t border-red-200/60">
                Se borrará completamente de la base de datos y de la flota. Si solo deseas que no aparezca en el día a día, te recomendamos <strong>dejarla en archivo</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrinterToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              
              {printerToDelete.estado !== 'baja' && (
                <button
                  type="button"
                  onClick={() => {
                    retirePrinter(printerToDelete.id, 'Archivada desde diálogo de eliminación');
                    setPrinterToDelete(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs cursor-pointer transition-colors"
                >
                  Solo Archivar
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  deletePrinterPermanently(printerToDelete.id);
                  setPrinterToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar por Completo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
