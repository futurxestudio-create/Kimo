import React, { useState, useMemo, useCallback } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { KanbanOrder, FailureAudit, EcoProcessItem, CatalogRecipe } from '../types';
import { downloadElementAsPDF } from '../utils/pdfExport';
import {
  TrendingUp,
  AlertTriangle,
  Recycle,
  Layers,
  ArrowRight,
  PlusCircle,
  FileDown,
  Calendar,
  DollarSign,
  Scale,
  Factory,
  Sparkles,
  Zap,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  X,
  Search,
  CheckCircle,
  ClipboardList,
  Flame,
  BadgeDollarSign,
  ShoppingBag,
  History,
  Clock,
  Filter,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenFailureModal: () => void;
  onOpenManualTransactionModal?: () => void;
}

type DateRangeOption =
  | 'semana'
  | 'semana_pasada'
  | 'semana_hace_un_ano'
  | 'mensual'
  | 'mes_pasado'
  | 'mes_hace_un_ano'
  | 'anual'
  | 'ano_pasado'
  | 'personalizado'
  | 'todo';

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenFailureModal }) => {
  const {
    failures,
    orders,
    filaments,
    catalog,
    ecoSilos,
    ecoProcesses,
    ecoProducts,
    createEcoBatch,
    sellEcoProduct,
    settings,
    setActiveTab,
    printers,
    warehouseSupplies,
    savedQuotations,
    maintenanceLogs,
  } = useWorkshop();

  // 1. DATE FILTER STATE & LOGIC
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('mensual');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const dateRangeLabels: Record<DateRangeOption, string> = {
    semana: 'Esta Semana (Últimos 7 días)',
    semana_pasada: 'Semana Pasada',
    semana_hace_un_ano: 'Esta Semana (Hace 1 Año)',
    mensual: 'Este Mes (En curso)',
    mes_pasado: 'Mes Pasado',
    mes_hace_un_ano: 'Este Mes (Hace 1 Año)',
    anual: 'Este Año (En curso)',
    ano_pasado: 'Año Anterior',
    personalizado: 'Rango Personalizado...',
    todo: 'Histórico General (Todo)',
  };

  const getDateBoundaries = useCallback(
    (range: DateRangeOption) => {
      const now = new Date();
      const format = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      if (range === 'todo') {
        return { start: '', end: '', label: 'Histórico General (Todo el tiempo)' };
      }
      if (range === 'personalizado') {
        return {
          start: customStartDate,
          end: customEndDate,
          label: `Personalizado (${customStartDate} a ${customEndDate})`,
        };
      }
      if (range === 'semana') {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        return { start: format(start), end: format(now), label: `Esta Semana (${format(start)} al ${format(now)})` };
      }
      if (range === 'semana_pasada') {
        const start = new Date(now);
        start.setDate(start.getDate() - 14);
        const end = new Date(now);
        end.setDate(end.getDate() - 7);
        return { start: format(start), end: format(end), label: `Semana Pasada (${format(start)} al ${format(end)})` };
      }
      if (range === 'semana_hace_un_ano') {
        const start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        start.setDate(start.getDate() - 7);
        const end = new Date(now);
        end.setFullYear(end.getFullYear() - 1);
        return {
          start: format(start),
          end: format(end),
          label: `Esta Semana Hace 1 Año (${format(start)} al ${format(end)})`,
        };
      }
      if (range === 'mensual') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: format(start), end: format(now), label: `Este Mes (${format(start)} al ${format(now)})` };
      }
      if (range === 'mes_pasado') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: format(start), end: format(end), label: `Mes Pasado (${format(start)} al ${format(end)})` };
      }
      if (range === 'mes_hace_un_ano') {
        const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const end = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
        return {
          start: format(start),
          end: format(end),
          label: `Mismo Mes Hace 1 Año (${format(start)} al ${format(end)})`,
        };
      }
      if (range === 'anual') {
        const start = new Date(now.getFullYear(), 0, 1);
        return { start: format(start), end: format(now), label: `Año ${now.getFullYear()} (${format(start)} al ${format(now)})` };
      }
      if (range === 'ano_pasado') {
        const prevYear = now.getFullYear() - 1;
        const start = new Date(prevYear, 0, 1);
        const end = new Date(prevYear, 11, 31);
        return {
          start: format(start),
          end: format(end),
          label: `Año Anterior ${prevYear} (${format(start)} al ${format(end)})`,
        };
      }
      return { start: '', end: '', label: 'Histórico General' };
    },
    [customStartDate, customEndDate]
  );

  const isDateInRange = useCallback(
    (dateStr?: string) => {
      if (!dateStr) return true;
      const { start, end } = getDateBoundaries(selectedDateRange);
      if (start && dateStr < start) return false;
      if (end && dateStr > end) return false;
      return true;
    },
    [selectedDateRange, getDateBoundaries]
  );

  // Filter orders by dynamic date boundaries
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => isDateInRange(o.createdAtDate));
  }, [orders, isDateInRange]);

  // Filter failures by dynamic date boundaries
  const filteredFailures = useMemo(() => {
    return failures.filter((f) => isDateInRange(f.date));
  }, [failures, isDateInRange]);

  // Dynamic metrics calculated from filtered data
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + o.totalPrice, 0);
  }, [filteredOrders]);

  const totalFilamentCost = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (o.costFilament ?? (o.totalPrice * 0.28)), 0);
  }, [filteredOrders]);

  const totalCfeCost = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (o.costCfe ?? (o.printHours * 3.5)), 0);
  }, [filteredOrders]);

  const totalMttoCost = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (o.costMtto ?? (o.totalPrice * 0.08)), 0);
  }, [filteredOrders]);

  const totalInsumosCost = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (o.costInsumos ?? (o.totalPrice * 0.2)), 0);
  }, [filteredOrders]);

  const totalDirectCost = totalFilamentCost + totalCfeCost + totalMttoCost + totalInsumosCost;
  const netProfit = totalRevenue - totalDirectCost;
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0.0;
  const amortizationPct = totalRevenue > 0 ? (totalMttoCost / totalRevenue) * 100 : 0.0;

  const totalCapitalLibre = useMemo(() => {
    return filteredOrders
      .filter(o => o.status === 'delivered' || o.isPaid)
      .reduce((acc, o) => acc + (o.costOverhead || 0), 0);
  }, [filteredOrders]);

  const totalPendingBalance = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + o.pendingBalance, 0);
  }, [filteredOrders]);

  const totalMermaAbsorbed = useMemo(() => {
    return filteredFailures.reduce((acc, f) => acc + f.costAbsorbed, 0);
  }, [filteredFailures]);

  const totalMermaGrams = useMemo(() => {
    return filteredFailures.reduce((acc, f) => acc + f.gramsLost, 0);
  }, [filteredFailures]);

  const totalHoursPrintedInPeriod = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + o.printHours, 0);
  }, [filteredOrders]);

  // Dynamic ranking of top products from actual orders
  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; count: number; totalRevenue: number; netMargin: number }>();
    filteredOrders.forEach((o) => {
      const key = o.title || 'Pieza 3D General';
      const existing = map.get(key) || { title: key, count: 0, totalRevenue: 0, netMargin: 25 };
      const orderCost = (o.costFilament ?? 0) + (o.costCfe ?? 0) + (o.costMtto ?? 0) + (o.costInsumos ?? 0);
      const orderNet = o.totalPrice - orderCost;
      const margin = o.totalPrice > 0 ? Math.round((orderNet / o.totalPrice) * 100) : 25;
      map.set(key, {
        title: key,
        count: existing.count + (o.piecesCount || 1),
        totalRevenue: existing.totalRevenue + o.totalPrice,
        netMargin: margin,
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 4);
  }, [filteredOrders]);

  // Dynamic rotation of filaments from actual filaments inventory
  const filamentRotation = useMemo(() => {
    return filaments.map((f) => {
      const usedGrams = Math.max(0, (f.capacityGrams || 1000) - (f.gramsRemaining || 0));
      const usedCost = usedGrams * (f.costPerGram || 0.3);
      const pct = (f.capacityGrams || 1000) > 0 ? Math.min(100, Math.round((usedGrams / f.capacityGrams) * 100)) : 0;
      return {
        id: f.id,
        name: `${f.brand || ''} ${f.material || ''} ${f.colorName || ''}`.trim() || 'Bobina de Filamento',
        sku: f.sku || f.id,
        usedGrams,
        cost: usedCost,
        color: f.colorHex || '#6D3ACD',
        pct,
      };
    }).sort((a, b) => b.usedGrams - a.usedGrams).slice(0, 4);
  }, [filaments]);

  const totalFilamentExtrudedGrams = useMemo(() => {
    return filaments.reduce((acc, f) => acc + Math.max(0, (f.capacityGrams || 1000) - (f.gramsRemaining || 0)), 0);
  }, [filaments]);

  // Dynamic Quality Audit Metrics
  const qualityAuditMetrics = useMemo(() => {
    const totalPieces = filteredOrders.reduce((acc, o) => acc + (o.piecesCount || 1), 0);
    const totalFailures = filteredFailures.length;
    const failedPieces = filteredFailures.length;
    const successfulPieces = Math.max(0, totalPieces - failedPieces);
    const successRate = totalPieces > 0 ? ((successfulPieces / totalPieces) * 100) : (totalFailures === 0 ? 100 : 0);

    const causeCounts = new Map<string, number>();
    filteredFailures.forEach((f) => {
      const c = f.cause || 'General';
      causeCounts.set(c, (causeCounts.get(c) || 0) + 1);
    });

    return {
      totalPieces,
      totalFailures,
      successfulPieces,
      successRate,
      causeCounts,
    };
  }, [filteredOrders, filteredFailures]);

  // 2. CHART VIEW TOGGLE STATE
  const [chartView, setChartView] = useState<'semanal' | 'mensual' | 'anual'>('semanal');

  // 3. EXPORT MODAL STATE
  const [showExportModal, setShowExportModal] = useState(false);

  // 4. BITÁCORA EXTENDIDA DRAWER/MODAL STATE & DATE FILTER
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [auditFilterCause, setAuditFilterCause] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');
  type AuditDateRangeOption = 'hoy' | '7dias' | 'este_mes' | 'personalizado' | 'todos';
  const [auditDateRange, setAuditDateRange] = useState<AuditDateRangeOption>('este_mes');
  const [auditCustomStartDate, setAuditCustomStartDate] = useState('2026-10-01');
  const [auditCustomEndDate, setAuditCustomEndDate] = useState('2026-10-31');

  // 5. ECONOMÍA CIRCULAR CREATOR MODAL STATE & CUSTOM PRODUCT
  const [showEcoModal, setShowEcoModal] = useState(false);
  const [selectedEcoProductType, setSelectedEcoProductType] = useState<number>(0);
  const [isCustomEcoProduct, setIsCustomEcoProduct] = useState(true);
  const [customEcoTitle, setCustomEcoTitle] = useState('');
  const [customEcoProcessType, setCustomEcoProcessType] = useState<EcoProcessItem['processType']>('prensado');
  const [customEcoGramsPerUnit, setCustomEcoGramsPerUnit] = useState<number>(50);
  const [customEcoDescription, setCustomEcoDescription] = useState('');

  const [selectedSiloIndex, setSelectedSiloIndex] = useState<number>(0);
  const [unitsToProduce, setUnitsToProduce] = useState<number>(10);
  const [unitSalePrice, setUnitSalePrice] = useState<number>(50.0);
  const [operatingCost, setOperatingCost] = useState<number>(15.0);
  const [ecoSuccessFeedback, setEcoSuccessFeedback] = useState(false);

  // Dynamic products from user's real catalog
  const ecoProductPresets = (catalog || []).map((cat: CatalogRecipe) => ({
    title: cat.title,
    processType: 'prensado' as const,
    gramsPerUnit: cat.estimatedGrams || cat.gramosTotales || 100,
    defaultPrice: cat.suggestedPrice || 100,
    defaultOperatingCost: cat.directCost || 30,
    description: cat.description || 'Pieza del catálogo del taller',
  }));

  const availableSiloGrams = ecoSilos[selectedSiloIndex]?.currentGrams ?? 0;
  const activeGramsPerUnit = isCustomEcoProduct
    ? Math.max(1, customEcoGramsPerUnit)
    : (ecoProductPresets[selectedEcoProductType]?.gramsPerUnit || 120);

  // Auto calculate units when product preset changes
  const handleSelectEcoPreset = (index: number) => {
    setIsCustomEcoProduct(false);
    setSelectedEcoProductType(index);
    const preset = ecoProductPresets[index];
    const possibleUnits = Math.max(1, Math.floor(availableSiloGrams / preset.gramsPerUnit));
    setUnitsToProduce(possibleUnits);
    setUnitSalePrice(preset.defaultPrice);
    setOperatingCost(preset.defaultOperatingCost);
  };

  const handleSelectCustomEco = () => {
    setIsCustomEcoProduct(true);
    const possibleUnits = Math.max(1, Math.floor(availableSiloGrams / Math.max(1, customEcoGramsPerUnit)));
    setUnitsToProduce(possibleUnits);
    setUnitSalePrice(75.0);
    setOperatingCost(18.0);
  };

  const handleCustomGramsChange = (newGrams: number) => {
    const valid = Math.max(1, newGrams || 1);
    setCustomEcoGramsPerUnit(valid);
    const possibleUnits = Math.max(1, Math.floor(availableSiloGrams / valid));
    setUnitsToProduce(possibleUnits);
  };

  const handleSiloChange = (newIndex: number) => {
    setSelectedSiloIndex(newIndex);
    const newAvailable = ecoSilos[newIndex]?.currentGrams || 1200;
    const grams = isCustomEcoProduct ? customEcoGramsPerUnit : (ecoProductPresets[selectedEcoProductType]?.gramsPerUnit || 120);
    const possibleUnits = Math.max(1, Math.floor(newAvailable / Math.max(1, grams)));
    setUnitsToProduce(possibleUnits);
  };

  const calculatedTotalGramsUsed = activeGramsPerUnit * unitsToProduce;
  const calculatedGrossRevenue = unitsToProduce * unitSalePrice;
  const calculatedNetRecovered = calculatedGrossRevenue - operatingCost;

  const handleOpenEcoModal = () => {
    setIsCustomEcoProduct(true);
    setCustomEcoTitle('');
    setCustomEcoDescription('');
    setCustomEcoGramsPerUnit(50);
    setUnitsToProduce(10);
    setUnitSalePrice(50.0);
    setOperatingCost(15.0);
    setShowEcoModal(true);
  };

  const handleStartEcoProduction = () => {
    const preset = ecoProductPresets[selectedEcoProductType];
    const title = isCustomEcoProduct ? (customEcoTitle || 'Lote Reciclado Manual') : (preset?.title || 'Lote Reciclado');
    const pType = isCustomEcoProduct ? customEcoProcessType : (preset?.processType || 'prensado');
    const desc = isCustomEcoProduct ? (customEcoDescription || 'Transformación manual de scrap de taller') : (preset?.description || '');

    createEcoBatch({
      siloIndex: selectedSiloIndex,
      productTitle: title,
      processType: pType,
      gramsUsed: calculatedTotalGramsUsed,
      unitsToProduce: unitsToProduce,
      unitPrice: unitSalePrice,
      operatingCost: operatingCost,
      description: desc,
    });
    setEcoSuccessFeedback(true);
    setTimeout(() => {
      setEcoSuccessFeedback(false);
      setShowEcoModal(false);
    }, 900);
  };

  // Executive PDF Exporter
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportExecutivePDF = async () => {
    setIsExportingPDF(true);
    setTimeout(async () => {
      const periodTag =
        selectedDateRange === 'personalizado'
          ? `${customStartDate}_al_${customEndDate}`
          : selectedDateRange;
      const success = await downloadElementAsPDF(
        'dashboard-kpi-summary-container',
        `Reporte_Ejecutivo_KiMO_${periodTag}.pdf`
      );
      setIsExportingPDF(false);
      if (success) {
        setShowExportModal(false);
      }
    }, 200);
  };

  // CSV Exporter function for SAT / Excel accounting - REPORTE COMPLETO (LIBRO MAYOR)
  const handleExportCSV = () => {
    const headers = [
      'Fecha',
      'Tipo de Movimiento',
      'Folio / Referencia',
      'Concepto',
      'Ingreso ($ MXN)',
      'Egreso ($ MXN)',
      'Detalles / Notas',
    ];

    const rows: string[] = [];

    // 1. Órdenes (Ingresos y Costos Directos Asociados)
    filteredOrders.forEach((o) => {
      const date = o.createdAtDate || '2026-10-02';
      const rev = o.totalPrice.toFixed(2);
      const cost = ((o.costFilament ?? 0) + (o.costCfe ?? 0) + (o.costMtto ?? 0) + (o.costInsumos ?? 0)).toFixed(2);
      rows.push(`"${date}","Venta (Orden)","${o.folio}","${o.title.replace(/"/g, '""')} Cliente: ${o.clientName}","${rev}","${cost}","Estado: ${o.status}"`);
    });

    // 2. Cotizaciones Aceptadas (En Producción / Enviada a Taller) no duplicadas en órdenes
    savedQuotations.forEach((q) => {
      if ((q.status === 'En Producción' || q.status === 'Enviada a Taller') && isDateInRange(q.date)) {
        const exists = orders.some((o) => o.folio === q.folio);
        if (!exists) {
          rows.push(`"${q.date}","Venta (Cotización)","${q.folio}","${q.projectName.replace(/"/g, '""')}","${q.total.toFixed(2)}","0.00","Status: ${q.status}"`);
        }
      }
    });

    // 3. Compras de Filamentos (Insumos)
    filaments.forEach((f) => {
      if (f.purchaseHistory && f.purchaseHistory.length > 0) {
        f.purchaseHistory.forEach((p) => {
          if (isDateInRange(p.date)) {
            rows.push(`"${p.date}","Compra (Filamento)","${p.id}","${f.brand} ${f.material} ${f.colorName}","0.00","${p.totalCost.toFixed(2)}","Proveedor: ${p.supplier || 'N/A'}"`);
          }
        });
      } else if (selectedDateRange === 'todo' || selectedDateRange === 'anual') {
        const estCost = (f.capacityGrams || 1000) * (f.costPerGram || 0.3);
        rows.push(`"2026-01-01","Compra Inicial (Filamento)","${f.id}","${f.brand} ${f.material} ${f.colorName}","0.00","${estCost.toFixed(2)}","Inventario Inicial"`);
      }
    });

    // 4. Compras de Insumos Extra / Refacciones
    warehouseSupplies.forEach((s) => {
      if (s.purchaseHistory && s.purchaseHistory.length > 0) {
        s.purchaseHistory.forEach((p) => {
          if (isDateInRange(p.date)) {
            rows.push(`"${p.date}","Compra (Insumo/Refacción)","${p.id}","${s.name.replace(/"/g, '""')}","0.00","${p.totalCost.toFixed(2)}","Proveedor: ${p.supplier || 'N/A'}"`);
          }
        });
      } else if (selectedDateRange === 'todo' || selectedDateRange === 'anual') {
        const estCost = s.stock * s.cost;
        rows.push(`"2026-01-01","Compra Inicial (Insumo)","${s.id}","${s.name.replace(/"/g, '""')}","0.00","${estCost.toFixed(2)}","Inventario Inicial"`);
      }
    });

    // 5. Máquinas / Impresoras (Activos Fijos)
    printers.forEach((p) => {
      if (p.fechaAdquisicion && isDateInRange(p.fechaAdquisicion)) {
        let cost = 10000;
        if (p.modelo.includes('X1')) cost = 30000;
        else if (p.modelo.includes('P1')) cost = 15000;
        else if (p.modelo.includes('A1')) cost = 8000;

        rows.push(`"${p.fechaAdquisicion}","Activo Fijo (Máquina)","${p.id}","${p.marca} ${p.modelo}","0.00","${cost.toFixed(2)}","Adquisición de equipo"`);
      }
    });

    // 6. Gastos de Mantenimiento
    maintenanceLogs.forEach((m) => {
      if (isDateInRange(m.fecha)) {
        rows.push(`"${m.fecha}","Gasto Mantenimiento","${m.id}","Mtto ${m.tipo} - Impresora: ${m.printerAlias || m.printerId}","0.00","${m.costoTotalRefacciones.toFixed(2)}","${m.descripcion.replace(/"/g, '""')}"`);
      }
    });

    // 7. Pérdidas y Mermas (Failures)
    filteredFailures.forEach((f) => {
      rows.push(`"${f.date}","Pérdida (Merma)","${f.orderFolio}","Falla: ${f.cause} en ${f.itemTitle.replace(/"/g, '""')}","0.00","${f.costAbsorbed.toFixed(2)}","Gramos Perdidos: ${f.gramsLost}"`);
    });

    // Ordenar por fecha desc si es posible
    rows.sort((a, b) => {
      const dateA = a.split(',')[0].replace(/"/g, '');
      const dateB = b.split(',')[0].replace(/"/g, '');
      return dateB.localeCompare(dateA);
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileTag =
      selectedDateRange === 'personalizado'
        ? `${customStartDate}_al_${customEndDate}`
        : selectedDateRange;
    link.setAttribute('download', `KiMO_Libro_Mayor_Completo_${fileTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // Filtered bitácora list with date range, search query and cause
  const filteredBitacora = useMemo(() => {
    return failures.filter((f) => {
      const matchSearch =
        f.orderFolio.toLowerCase().includes(auditSearch.toLowerCase()) ||
        f.itemTitle.toLowerCase().includes(auditSearch.toLowerCase()) ||
        f.actionTaken.toLowerCase().includes(auditSearch.toLowerCase());
      if (!matchSearch) return false;
      if (auditFilterCause !== 'all' && f.cause !== auditFilterCause) return false;

      const d = f.date || '2026-10-02';
      if (auditDateRange === 'hoy') return d === '2026-10-03';
      if (auditDateRange === '7dias') return d >= '2026-09-26';
      if (auditDateRange === 'este_mes') return d.startsWith('2026-10');
      if (auditDateRange === 'personalizado') {
        return d >= auditCustomStartDate && d <= auditCustomEndDate;
      }
      return true;
    });
  }, [failures, auditSearch, auditFilterCause, auditDateRange, auditCustomStartDate, auditCustomEndDate]);

  // Recalculated metrics for Bitácora top strip
  const bitacoraTotalFallas = filteredBitacora.length;
  const bitacoraCostoAbsorbido = useMemo(() => {
    return filteredBitacora.reduce((acc, f) => acc + f.costAbsorbed, 0);
  }, [filteredBitacora]);
  const bitacoraScrapAcopiado = useMemo(() => {
    return filteredBitacora.reduce((acc, f) => acc + f.gramsLost, 0);
  }, [filteredBitacora]);

  return (
    <div className="w-full flex flex-col gap-6 py-4 max-w-[1720px] mx-auto">
      {/* ======================================================== */}
      {/* 1. ENCABEZADO Y SELECTOR INTERACTIVO DE FECHAS / EXPORT  */}
      {/* ======================================================== */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl shadow-[0_4px_20px_-2px_rgba(76,35,122,0.06)] border border-[#E5E2DB] relative">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0EEE7] text-xs font-bold tracking-wider uppercase text-[#350463]">
              <span className="w-2 h-2 rounded-full bg-[#C0F441] shadow-[0_0_6px_#C0F441]" />
              BALANCE FINANCIERO CDMX • MÉTRICAS Y COSTOS REALES
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#350463] tracking-tight">
            Dashboard Financiero & Métricas de Taller
          </h1>
          <p className="text-xs lg:text-sm text-[#4B4450] flex items-center gap-1.5 flex-wrap">
            <span>Auditoría en tiempo real:</span>
            <span className="font-extrabold text-[#6D3ACD] bg-[#EADDFB]/60 px-2 py-0.5 rounded-full text-xs">
              {getDateBoundaries(selectedDateRange).label}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* SELECTOR DE FECHAS POPOVER / DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0EEE7] hover:bg-[#E5E2DB] transition-all text-xs font-bold text-[#1C1C18] border border-[#CDC3D2]/40 shadow-xs cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#350463]" />
              <span>{dateRangeLabels[selectedDateRange]}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#4B4450] transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl p-2 shadow-2xl border border-[#E5E2DB] z-50 animate-in fade-in zoom-in-95 max-h-[460px] overflow-y-auto">
                {/* Categoría 1: Histórico General */}
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#350463] bg-[#EADDFB]/50 rounded-lg flex items-center gap-1 mb-1">
                  <History className="w-3 h-3 text-[#350463]" />
                  <span>Histórico & Alcance Global</span>
                </div>
                {(['todo', 'personalizado'] as DateRangeOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedDateRange(opt);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedDateRange === opt
                        ? 'bg-[#EADDFB] text-[#350463] font-bold'
                        : 'text-[#1C1C18] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <span>{dateRangeLabels[opt]}</span>
                    {selectedDateRange === opt && <CheckCircle className="w-3.5 h-3.5 text-[#6D3ACD]" />}
                  </button>
                ))}

                {/* Categoría 2: Frecuentes Actuales */}
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#4B4450] bg-[#FAF7F0] rounded-lg flex items-center gap-1 mt-2 mb-1">
                  <Clock className="w-3 h-3 text-[#4B4450]" />
                  <span>Períodos en Curso</span>
                </div>
                {(['semana', 'mensual', 'anual'] as DateRangeOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedDateRange(opt);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedDateRange === opt
                        ? 'bg-[#EADDFB] text-[#350463] font-bold'
                        : 'text-[#1C1C18] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <span>{dateRangeLabels[opt]}</span>
                    {selectedDateRange === opt && <CheckCircle className="w-3.5 h-3.5 text-[#6D3ACD]" />}
                  </button>
                ))}

                {/* Categoría 3: Comparativa Histórica */}
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#6D3ACD] bg-[#FAF7F0] rounded-lg flex items-center gap-1 mt-2 mb-1">
                  <Filter className="w-3 h-3 text-[#6D3ACD]" />
                  <span>Comparativa Histórica (Hace 1 Año / Previo)</span>
                </div>
                {(['semana_pasada', 'semana_hace_un_ano', 'mes_pasado', 'mes_hace_un_ano', 'ano_pasado'] as DateRangeOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedDateRange(opt);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedDateRange === opt
                        ? 'bg-[#EADDFB] text-[#350463] font-bold'
                        : 'text-[#1C1C18] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <span>{dateRangeLabels[opt]}</span>
                    {selectedDateRange === opt && <CheckCircle className="w-3.5 h-3.5 text-[#6D3ACD]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INPUTS DE FECHA PERSONALIZADA INLINE */}
          {selectedDateRange === 'personalizado' && (
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] px-3 py-1.5 rounded-full border border-[#CDC3D2]/60 text-xs shadow-xs animate-in fade-in">
              <span className="text-[10px] uppercase font-bold text-[#4B4450]">Desde:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-[#CDC3D2]/40 rounded-lg px-2 py-0.5 text-xs text-[#350463] font-bold focus:outline-none focus:ring-1 focus:ring-[#350463] cursor-pointer"
              />
              <span className="text-[10px] uppercase font-bold text-[#4B4450]">Hasta:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-[#CDC3D2]/40 rounded-lg px-2 py-0.5 text-xs text-[#350463] font-bold focus:outline-none focus:ring-1 focus:ring-[#350463] cursor-pointer"
              />
            </div>
          )}

          {/* EXPORTAR REPORTE SAT / PDF BUTTON */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#E5E2DB] hover:bg-[#DCDAD3] transition-all text-xs font-bold text-[#350463] shadow-xs cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#350463]" />
            <span>Exportar Reporte SAT / PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('cotizador')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-extrabold shadow-[0_4px_16px_rgba(192,244,65,0.4)] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 font-bold" />
            <span>+ Nueva Cotización Activa</span>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. FILA 1: 5 KPIS FINANCIEROS DINÁMICOS CON FILTRO FECHA */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {/* KPI 1: Ingresos Totales */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DB] flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider">
              INGRESOS TOTALES (VENTAS)
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EADDFB] flex items-center justify-center text-[#350463]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#350463] tracking-tight">
              ${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-[#4B4450] font-normal">MXN</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0EEE7] text-xs">
              <span className="text-[#4B4450]">{filteredOrders.length} pedidos en período</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#C0F441]/40 text-[#2E3F00] font-bold text-[10px]">
                <TrendingUp className="w-3 h-3" /> +14.2%
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Costo Directo de Taller */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider">
              COSTO DIRECTO DE TALLER
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EADDFB] flex items-center justify-center text-[#6D3ACD]">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1C1C18] tracking-tight">
              ${totalDirectCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-[#4B4450] font-normal">MXN</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[#F0EEE7]">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0EEE7] text-[#4B4450]">
                Filamento: ${totalFilamentCost.toFixed(0)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0EEE7] text-[#4B4450]">
                CFE: ${totalCfeCost.toFixed(0)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0EEE7] text-[#4B4450]">
                Mtto: ${totalMttoCost.toFixed(0)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0EEE7] text-[#4B4450]">
                Insumos: ${totalInsumosCost.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Ganancia Neta Real (En Caja) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#C0F441]/60 flex flex-col justify-between bg-gradient-to-b from-white to-[#FAF7F0] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#2E3F00] uppercase tracking-wider">
              GANANCIA NETA EN CAJA
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#C0F441] shadow-[0_0_8px_#C0F441]" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#350463] tracking-tight">
                ${netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs text-[#2E3F00] font-bold">MXN</span>
              </span>
              <span className="text-[11px] text-[#2E3F00] font-extrabold bg-[#C0F441] px-2 py-0.5 rounded-full">
                {netMarginPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-[#F0EEE7] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#A5D721] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, netMarginPercent * 2.5))}%` }}
              />
            </div>
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#F0EEE7] text-[11px] text-amber-800 bg-amber-500/15 px-2 py-1 rounded">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="truncate">${totalPendingBalance.toFixed(2)} MXN pendientes de cobro</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Merma Absorbida Taller */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#FFDAD6] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#BA1A1A] uppercase tracking-wider">
              MERMA ABSORBIDA TALLER
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FFDAD6] flex items-center justify-center text-[#BA1A1A]">
              <Recycle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#BA1A1A] tracking-tight">
              -${totalMermaAbsorbed.toFixed(2)}{' '}
              <span className="text-xs text-[#4B4450] font-normal">MXN</span>
            </div>
            <p className="text-[11px] text-[#4B4450] mt-1 pt-1 border-t border-[#F0EEE7] leading-tight">
              {filteredFailures.length} incidencias registradas • {totalMermaGrams}g no cobrados
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#C0F441]/30 text-[#2E3F00] text-[10px] font-bold">
              <Recycle className="w-3 h-3 text-[#2E3F00]" />
              <span>85% clasificado para Eco-Loop</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Amortización & Fondo */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4450] uppercase tracking-wider">
              AMORTIZACIÓN & FONDO
            </span>
            <div className="w-8 h-8 rounded-full bg-[#F0EEE7] flex items-center justify-center text-[#350463]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-[#1C1C18]">{amortizationPct.toFixed(1)}%</span>
              <span className="text-[10px] text-[#350463] font-bold bg-[#EADDFB] px-1.5 py-0.5 rounded">
                ${totalMttoCost.toFixed(0)} MXN refacc.
              </span>
            </div>
            <div className="w-full bg-[#F0EEE7] h-2 rounded-full overflow-hidden mt-1.5">
              <div className="bg-[#4C237A] h-full rounded-full" style={{ width: `${Math.min(100, amortizationPct)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0EEE7] text-[11px]">
              <span className="text-[#4B4450] truncate">{settings.activePrinter?.model || 'Taller KiMO'}</span>
              <span className="text-[#350463] font-bold">{totalHoursPrintedInPeriod}h impr.</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Capital Libre */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#350463] uppercase tracking-wider">
              FONDOS RECUPERADOS (CAPITAL LIBRE)
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#350463] tracking-tight">
              ${totalCapitalLibre.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-[#4B4450] font-normal">MXN</span>
            </div>
            <p className="text-[11px] text-[#4B4450] mt-1 pt-1 border-t border-[#F0EEE7] leading-tight">
              Capital liberado para reinversión y pago de gastos fijos (órdenes cobradas)
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. FILA 2: GRÁFICA MULTITEMPORAL Y AUDITORÍA DE FALLAS   */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL IZQUIERDO (7 COLS): GRÁFICA MULTITEMPORAL */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-[#E5E2DB] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#350463]">
                  Evolución Financiera {chartView === 'semanal' ? 'Semanal' : chartView === 'mensual' ? 'Mensual (2026)' : 'Anual Consolidada'}
                </h2>
                <p className="text-xs text-[#4B4450]">
                  Facturación bruta vs Costos directos de taller con tendencia de margen
                </p>
              </div>

              {/* 3 BUTTONS TOGGLE [ Semanal | Mensual | Anual ] */}
              <div className="inline-flex p-1 rounded-full bg-[#F0EEE7] text-xs text-[#4B4450] self-start sm:self-auto border border-[#CDC3D2]/30">
                <button
                  onClick={() => setChartView('semanal')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer font-bold ${
                    chartView === 'semanal' ? 'bg-white text-[#350463] shadow-xs' : 'hover:text-[#1C1C18]'
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setChartView('mensual')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer font-bold ${
                    chartView === 'mensual' ? 'bg-white text-[#350463] shadow-xs' : 'hover:text-[#1C1C18]'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setChartView('anual')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer font-bold ${
                    chartView === 'anual' ? 'bg-white text-[#350463] shadow-xs' : 'hover:text-[#1C1C18]'
                  }`}
                >
                  Anual 2026
                </button>
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-medium text-[#1C1C18]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#4C237A]" />
                <span>Ingresos ($ MXN)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#EADDFB]" />
                <span>Costo Directo ($ MXN)</span>
              </div>
              {chartView !== 'anual' ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-1 rounded-full bg-[#C0F441] shadow-[0_0_6px_#C0F441]" />
                  <span>Margen Neto (%)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#C0F441]" />
                  <span>Fondo Mtto / Utilidad ($ MXN)</span>
                </div>
              )}
            </div>

            {/* CHARTS CONTAINER */}
            {filteredOrders.length === 0 ? (
              <div className="relative w-full h-64 select-none flex flex-col items-center justify-center bg-[#FAF7F0] rounded-2xl border border-dashed border-[#CDC3D2]/60 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center mb-3 font-bold">
                  $0
                </div>
                <h3 className="font-extrabold text-[#350463] text-sm mb-1">
                  Sin Registros de Facturación en este Período
                </h3>
                <p className="text-xs text-[#4B4450] max-w-md">
                  No hay pedidos registrados para {dateRangeLabels[selectedDateRange]}. Crea cotizaciones o añade órdenes al taller para visualizar la gráfica financiera en tiempo real.
                </p>
              </div>
            ) : (
              <>
                {/* VISTA 1: SEMANAL */}
                {chartView === 'semanal' && (
                  <div className="relative w-full h-64 select-none">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 540 240">
                      <line x1="0" y1="20" x2="540" y2="20" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="70" x2="540" y2="70" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="120" x2="540" y2="120" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="170" x2="540" y2="170" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="220" x2="540" y2="220" stroke="#CDC3D2" strokeWidth="1.5" />

                      {/* Dynamic 5 Weeks / Buckets */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const count = filteredOrders.length;
                        const chunk = filteredOrders.filter((_, idx) => idx % 5 === i);
                        const chunkRev = chunk.reduce((acc, o) => acc + o.totalPrice, 0);
                        const chunkCost = chunk.reduce((acc, o) => acc + ((o.costFilament ?? 0) + (o.costCfe ?? 0) + (o.costMtto ?? 0) + (o.costInsumos ?? 0)), 0);
                        const maxVal = Math.max(totalRevenue, 1);
                        const hRev = Math.min(180, (chunkRev / maxVal) * 180);
                        const hCost = Math.min(180, (chunkCost / maxVal) * 180);
                        const x = 30 + i * 100;
                        return (
                          <g key={i}>
                            <rect x={x} y={220 - hRev} width="20" height={Math.max(2, hRev)} rx="4" fill="#4C237A" />
                            <rect x={x + 24} y={220 - hCost} width="20" height={Math.max(2, hCost)} rx="4" fill="#EADDFB" />
                          </g>
                        );
                      })}
                    </svg>

                    <div className="flex justify-between px-6 pt-2 text-[11px] font-semibold text-[#4B4450]">
                      <span>Semana 1</span>
                      <span>Semana 2</span>
                      <span>Semana 3</span>
                      <span>Semana 4</span>
                      <span>Actual</span>
                    </div>
                  </div>
                )}

                {/* VISTA 2: MENSUAL */}
                {chartView === 'mensual' && (
                  <div className="relative w-full h-64 select-none">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 540 240">
                      <line x1="0" y1="20" x2="540" y2="20" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="70" x2="540" y2="70" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="120" x2="540" y2="120" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="170" x2="540" y2="170" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="220" x2="540" y2="220" stroke="#CDC3D2" strokeWidth="1.5" />

                      {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => {
                        const mNum = (i + 1).toString().padStart(2, '0');
                        const mOrders = filteredOrders.filter((o) => (o.createdAtDate || '').includes(`- ${mNum}-`) || (o.createdAtDate || '').startsWith(`2026-${mNum}`));
                        const rev = mOrders.reduce((acc, o) => acc + o.totalPrice, 0);
                        const cost = mOrders.reduce((acc, o) => acc + ((o.costFilament ?? 0) + (o.costCfe ?? 0) + (o.costMtto ?? 0) + (o.costInsumos ?? 0)), 0);
                        const maxVal = Math.max(totalRevenue, 1);
                        const hRev = (rev / maxVal) * 160;
                        const hCost = (cost / maxVal) * 160;
                        const x = 15 + i * 43;
                        return (
                          <g key={i}>
                            <rect x={x} y={220 - hRev} width="14" height={Math.max(2, hRev)} rx="3" fill="#4C237A" />
                            <rect x={x + 16} y={220 - hCost} width="14" height={Math.max(2, hCost)} rx="3" fill="#EADDFB" />
                          </g>
                        );
                      })}
                    </svg>

                    <div className="flex justify-between px-2 pt-2 text-[10px] font-semibold text-[#4B4450]">
                      <span>Ene</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Abr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Ago</span>
                      <span>Sep</span>
                      <span className="font-bold text-[#6D3ACD]">Oct</span>
                      <span>Nov</span>
                      <span>Dic</span>
                    </div>
                  </div>
                )}

                {/* VISTA 3: ANUAL */}
                {chartView === 'anual' && (
                  <div className="relative w-full h-64 select-none">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 540 240">
                      <line x1="0" y1="20" x2="540" y2="20" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="70" x2="540" y2="70" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="120" x2="540" y2="120" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="170" x2="540" y2="170" stroke="#E5E2DB" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="220" x2="540" y2="220" stroke="#CDC3D2" strokeWidth="1.5" />

                      {/* 2026 YTD */}
                      <rect x="230" y={220 - Math.min(180, (totalRevenue / Math.max(1, totalRevenue)) * 180)} width="32" height={Math.max(2, (totalRevenue / Math.max(1, totalRevenue)) * 180)} rx="6" fill="#4C237A" />
                      <rect x="268" y={220 - Math.min(180, (totalDirectCost / Math.max(1, totalRevenue)) * 180)} width="32" height={Math.max(2, (totalDirectCost / Math.max(1, totalRevenue)) * 180)} rx="6" fill="#EADDFB" />
                      <rect x="306" y={220 - Math.min(180, (netProfit / Math.max(1, totalRevenue)) * 180)} width="24" height={Math.max(2, (netProfit / Math.max(1, totalRevenue)) * 180)} rx="4" fill="#C0F441" />
                    </svg>

                    <div className="flex justify-center px-8 pt-2 text-xs font-bold text-[#350463]">
                      <div className="text-center">
                        <span className="text-[#6D3ACD]">2026 (YTD Taller)</span>
                        <span className="block text-[10px] text-[#2E3F00] font-bold">${totalRevenue.toFixed(2)} MXN</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0EEE7] flex flex-col sm:flex-row items-center justify-between text-xs text-[#4B4450] gap-2">
            <span>
              Promedio por pedido: <strong className="text-[#350463] font-bold">${filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length).toFixed(2) : '0.00'} MXN</strong>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#F0EEE7] text-[#1C1C18] font-bold">
              Ratio de absorción de costos: {totalRevenue > 0 ? Math.round((totalDirectCost / totalRevenue) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* PANEL DERECHO (5 COLS): AUDITORÍA DE CALIDAD Y FALLAS CON BOTÓN BITÁCORA COMPLETA */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-[#E5E2DB] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-[#350463]">Auditoría de Calidad y Fallas</h2>
                <p className="text-xs text-[#4B4450]">Pérdidas y mermas absorbidas por taller</p>
              </div>

              {/* REQUIREMENT 3: BOTÓN [ 📋 Bitácora Completa ] */}
              <button
                onClick={() => setShowAuditDrawer(true)}
                className="px-3 py-1.5 rounded-full bg-[#EADDFB] hover:bg-[#D2BCFF] text-[#350463] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5 text-[#6D3ACD]" />
                <span>📋 Bitácora Completa</span>
              </button>
            </div>

            {/* Donut Chart Breakdown */}
            <div className="flex items-center gap-4 my-3 bg-[#FAF7F0] p-3 rounded-2xl border border-[#E5E2DB]">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E2DB" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#C0F441"
                    strokeWidth="4"
                    strokeDasharray={`${Math.round((qualityAuditMetrics.successRate / 100) * 88)} 88`}
                    strokeDashoffset="0"
                  />
                  {qualityAuditMetrics.totalFailures > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#BA1A1A"
                      strokeWidth="4"
                      strokeDasharray={`${Math.round(((100 - qualityAuditMetrics.successRate) / 100) * 88)} 88`}
                      strokeDashoffset={`-${Math.round((qualityAuditMetrics.successRate / 100) * 88)}`}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-[#350463] leading-none">
                    {qualityAuditMetrics.successRate.toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-[#4B4450]">
                    {qualityAuditMetrics.totalPieces > 0 ? '1ra pasada' : 'Sin impresiones'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C0F441]" /> Éxito
                  </span>
                  <strong className="text-[#1C1C18]">{qualityAuditMetrics.successfulPieces} pzs</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#BA1A1A]" /> Mermas / Fallas
                  </span>
                  <strong className="text-[#BA1A1A]">{qualityAuditMetrics.totalFailures} pzs</strong>
                </div>
              </div>
            </div>

            {/* Recent Failures Preview */}
            <div className="space-y-2 mt-3 max-h-40 overflow-y-auto pr-1">
              {filteredFailures.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-[#FAF7F0] border border-[#E5E2DB] text-xs text-[#4B4450]">
                  Sin mermas ni fallas registradas en este período.
                </div>
              ) : (
                filteredFailures.slice(0, 3).map((fail) => (
                  <div key={fail.id} className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5E2DB] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#350463]">
                        {fail.orderFolio} {fail.itemTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] font-bold text-[10px]">
                        {fail.cause}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#4B4450] text-[11px]">
                      <span className="truncate">{fail.actionTaken}</span>
                      <strong className="text-[#BA1A1A] shrink-0 font-bold">
                        -${fail.costAbsorbed.toFixed(2)} MXN ({fail.gramsLost}g)
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={onOpenFailureModal}
            className="w-full mt-4 py-2.5 rounded-full border border-[#6D3ACD] text-[#350463] hover:bg-[#EADDFB]/30 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-[#6D3ACD]" />
            <span>+ Registrar Falla / Merma Manual</span>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. FILA 3: ECONOMÍA CIRCULAR (KIMO ECO-LOOP) RESTRUCTURADO */}
      {/* ======================================================== */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-[#E5E2DB]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-[#F0EEE7] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#350463] text-[#C0F441] flex items-center justify-center shadow-sm shrink-0">
              <Recycle className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#350463]">
                  Economía Circular & Reprocesamiento de Merma
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] text-xs font-bold">
                  KiMO Eco-Loop
                </span>
              </div>
              <p className="text-xs text-[#4B4450]">
                Monitoreo de plástico recuperado (purgas AMS + impresiones fallidas) y conversión a productos secundarios con costeo comercial.
              </p>
            </div>
          </div>

          {/* REQUIREMENT 4: BOTÓN "+ Crear Lote de Fabricación Reciclada" */}
          <button
            onClick={handleOpenEcoModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-extrabold shadow-[0_4px_16px_rgba(192,244,65,0.4)] transition-all cursor-pointer self-start lg:self-auto"
          >
            <PlusCircle className="w-4 h-4 font-bold" />
            <span>+ Crear Lote de Fabricación Reciclada</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Silos de Acopio por Material */}
          <div className="flex flex-col gap-3 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5E2DB]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#350463]" />
                <h3 className="font-bold text-xs text-[#350463] uppercase tracking-wider">
                  Silos de Acopio por Material
                </h3>
              </div>
              <span className="text-[11px] text-[#4B4450] font-semibold">En Taller</span>
            </div>

            {ecoSilos.map((silo, idx) => {
              const pct = Math.min(100, Math.round((silo.currentGrams / silo.targetGrams) * 100));
              return (
                <div key={idx} className="p-3 rounded-xl bg-white border border-[#E5E2DB] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1C1C18] flex items-center gap-1.5 truncate">
                      <span className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-[#6D3ACD]' : 'bg-[#350463]'}`} />
                      {silo.material}
                    </span>
                    <span className="font-extrabold text-[#350463] shrink-0">
                      {silo.currentGrams.toLocaleString()} g
                    </span>
                  </div>
                  <div className="w-full bg-[#F0EEE7] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-[#6D3ACD]' : 'bg-[#350463]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#4B4450]">
                    <span>Meta: {silo.targetGrams.toLocaleString()} g</span>
                    <span className="font-bold text-[#6D3ACD]">{pct}% completado</span>
                  </div>
                </div>
              );
            })}

            <div className="mt-auto flex items-center gap-2 p-2 rounded-xl bg-[#C0F441]/20 border border-[#C0F441]/40 text-[11px] text-[#2E3F00] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#C0F441] shadow-[0_0_6px_#C0F441] shrink-0" />
              <span>Plástico libre de contaminantes, listo para triturar / fundir</span>
            </div>
          </div>

          {/* Procesos Secundarios Activos (Dinámicos) */}
          <div className="flex flex-col gap-3 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5E2DB]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-[#350463]" />
                <h3 className="font-bold text-xs text-[#350463] uppercase tracking-wider">
                  Procesos Secundarios Activos
                </h3>
              </div>
              <span className="text-[10px] text-[#2E3F00] bg-[#C0F441] px-2 py-0.5 rounded-full font-bold">
                {ecoProcesses.length} en curso
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {ecoProcesses.map((proc) => (
                <div key={proc.id} className="p-3 rounded-xl bg-white border border-[#E5E2DB] flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#350463] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#6D3ACD]" /> {proc.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#C0F441]/40 text-[#2E3F00] font-bold text-[10px]">
                      {proc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B4450]">{proc.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#4B4450] mt-1 pt-1 border-t border-[#F0EEE7]">
                    <span>Rendimiento: <strong className="text-[#1C1C18]">{proc.yieldText}</strong></span>
                    <span className="font-mono text-[10px] text-[#6D3ACD]">{proc.materialGramsUsed}g scrap</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto p-2.5 rounded-xl bg-white border border-[#E5E2DB] flex items-center justify-between text-xs">
              <span className="text-[#4B4450]">Costo de materia prima:</span>
              <span className="text-[#350463] font-extrabold bg-[#EADDFB] px-2 py-0.5 rounded">
                $0.00 MXN (100% recuperado)
              </span>
            </div>
          </div>

          {/* Catálogo & Ventas 'KiMO Eco' con botón "Registrar Venta" */}
          <div className="flex flex-col gap-3 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5E2DB]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#350463] uppercase tracking-wider">
                Catálogo & Ventas 'KiMO Eco'
              </h3>
              <span className="text-[11px] text-[#4B4450] font-semibold">Octubre 2026</span>
            </div>

            {/* Card destacada de total recuperado */}
            <div className="p-3.5 rounded-2xl bg-[#350463] text-white flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C0F441]">
                  Recuperado este mes
                </span>
                <div className="text-2xl font-black text-[#C0F441] tracking-tight">
                  +$
                  {ecoProducts
                    .reduce((acc, p) => acc + p.unitsSold * p.price, 0)
                    .toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                  <span className="text-xs text-white font-normal">MXN</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C0F441]">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Lista dinámica de productos con botón de Venta */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {ecoProducts.map((prod) => (
                <div key={prod.id} className="p-2.5 rounded-xl bg-white border border-[#E5E2DB] flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#350463] font-bold">{prod.name}</span>
                    <strong className="text-[#1C1C18] font-mono">
                      +${(prod.unitsSold * prod.price).toFixed(2)} MXN
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#4B4450]">
                    <span>
                      {prod.unitsSold} vendidos • {prod.unitsInStock} en stock
                    </span>
                    <button
                      onClick={() => sellEcoProduct(prod.id, 1)}
                      disabled={prod.unitsInStock <= 0}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        prod.unitsInStock > 0
                          ? 'bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] shadow-2xs'
                          : 'bg-[#E5E2DB] text-[#7C7481] cursor-not-allowed'
                      }`}
                    >
                      {prod.unitsInStock > 0 ? '+ Registrar Venta' : 'Agotado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto p-2.5 rounded-xl bg-[#C0F441]/30 border border-[#C0F441]/60 flex flex-col gap-0.5 text-xs">
              <span className="text-[#2E3F00] font-extrabold flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3.5 h-3.5" /> Neto de merma revertido:
              </span>
              <div className="text-[#350463] font-bold text-[11px]">
                De <span className="text-[#BA1A1A]">-${totalMermaAbsorbed.toFixed(2)} MXN</span> a{' '}
                <span className="text-[#350463] font-black bg-[#C0F441] px-1.5 py-0.5 rounded">
                  +$
                  {(
                    ecoProducts.reduce((acc, p) => acc + p.unitsSold * p.price, 0) - totalMermaAbsorbed
                  ).toFixed(2)}{' '}
                  MXN
                </span>{' '}
                de utilidad neta final
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. FILA 4: TOP PRODUCTOS Y ROTACIÓN FILAMENTO            */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E5E2DB] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#350463]">Ranking de Productos Más Vendidos</h2>
              <span className="text-xs text-[#4B4450] font-semibold">Top 4 Pedidos</span>
            </div>
            <p className="text-xs text-[#4B4450] mb-4">
              Artículos con mayor tracción comercial y margen operativo neto en CDMX
            </p>

            <div className="space-y-2.5">
              {topProducts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] text-center text-xs text-[#4B4450]">
                  No hay pedidos ni productos vendidos en este período. Al fabricar y entregar órdenes, aparecerán aquí clasificados por tracción comercial.
                </div>
              ) : (
                topProducts.map((prod, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#F0EEE7] transition-all flex items-center justify-between gap-3 border border-[#E5E2DB]/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs"
                        style={{ backgroundColor: i === 0 ? '#6D3ACD' : i === 1 ? '#9C6DFF' : '#350463' }}
                      >
                        #{i + 1}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-[#350463] truncate">{prod.title}</span>
                        <span className="text-[11px] text-[#4B4450] truncate">
                          {prod.count} {prod.count === 1 ? 'unidad fabricada' : 'unidades fabricadas'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-extrabold text-[#350463]">
                        ${prod.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold">
                        +{prod.netMargin}% neto
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0EEE7] flex items-center justify-between text-xs text-[#4B4450]">
            <span>
              Total facturado en catálogo: <strong className="text-[#350463] font-bold">${totalRevenue.toFixed(2)} MXN</strong>
            </span>
            <button
              onClick={() => setActiveTab('taller')}
              className="text-[#350463] font-bold hover:text-[#6D3ACD] flex items-center gap-1 cursor-pointer"
            >
              <span>Ver historial de órdenes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Consumo y Rotación de Filamento */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E5E2DB] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#350463]">Rotación y Consumo de Filamento</h2>
              <span className="text-xs text-[#4B4450] font-semibold">Inventario Taller</span>
            </div>
            <p className="text-xs text-[#4B4450] mb-4">
              Gramos extruidos descontados automáticamente de las bobinas registradas
            </p>

            <div className="space-y-4">
              {filamentRotation.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] text-center text-xs text-[#4B4450]">
                  No hay bobinas registradas en el almacén de filamentos. Agrega bobinas en Inventario para monitorear el consumo de plástico en tiempo real.
                </div>
              ) : (
                filamentRotation.map((sp, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-[#CDC3D2] shadow-xs"
                          style={{ backgroundColor: sp.color }}
                        />
                        <span className="font-bold text-[#1C1C18]">{sp.name}</span>
                        <span className="text-[#4B4450] font-mono text-[10px]">({sp.sku})</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-[#350463]">{sp.usedGrams.toFixed(1)} g</span>
                        <span className="text-[#4B4450] text-[11px]">(${sp.cost.toFixed(2)} MXN)</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#F0EEE7] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sp.pct}%`,
                          backgroundColor: sp.color === '#FFFFFF' ? '#8656E8' : sp.color,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C0F441] text-[#2E3F00] flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-xs">
              <span className="font-bold text-[#350463]">
                Total filamento extruido: {totalFilamentExtrudedGrams.toFixed(1)} g ({(totalFilamentExtrudedGrams / 1000).toFixed(2)} kg)
              </span>
              <span className="text-[#4B4450] text-[11px]">
                Descontado en tiempo real al finalizar órdenes o registrar mermas.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODAL 1: EXPORTADOR DE REPORTE SAT / PDF (STANDARDIZED)  */}
      {/* ======================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#350463] text-[#C0F441] flex items-center justify-center font-bold text-xs shadow-xs">
                  SAT
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#350463]">
                    Exportar Reporte Contable & Financiero
                  </h3>
                  <span className="text-[11px] text-[#4B4450]">
                    Período contable auditado: {dateRangeLabels[selectedDateRange]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Fila Superior de Métricas Rápidas (Master KPI Strip) */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB]">
                  <span className="text-[10px] text-[#4B4450] uppercase font-bold block truncate">Facturación Período</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#350463] font-mono">
                    ${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#C0F441]/30 border border-[#C0F441]/50">
                  <span className="text-[10px] text-[#2E3F00] uppercase font-bold block truncate">Margen Neto Real</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#2E3F00] font-mono">
                    {netMarginPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB]">
                  <span className="text-[10px] text-[#4B4450] uppercase font-bold block truncate">Órdenes Auditadas</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#1C1C18] font-mono">
                    {filteredOrders.length} ped.
                  </span>
                </div>
              </div>

              {/* Barra de Filtros / Selector Rápido de Período */}
              <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#4B4450] tracking-wider">
                    Período Contable a Exportar:
                  </span>
                  <span className="text-[10px] font-bold text-[#350463] bg-[#EADDFB] px-2 py-0.5 rounded-full">
                    {getDateBoundaries(selectedDateRange).label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      'todo',
                      'semana',
                      'semana_hace_un_ano',
                      'mensual',
                      'mes_pasado',
                      'mes_hace_un_ano',
                      'anual',
                      'ano_pasado',
                      'personalizado',
                    ] as DateRangeOption[]
                  ).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedDateRange(opt)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedDateRange === opt
                          ? 'bg-[#350463] text-white shadow-xs'
                          : 'bg-white text-[#4B4450] hover:bg-[#E5E2DB] border border-[#CDC3D2]/30'
                      }`}
                    >
                      {opt === 'todo'
                        ? '🌐 Histórico General'
                        : opt === 'semana'
                        ? 'Esta Semana'
                        : opt === 'semana_hace_un_ano'
                        ? 'Semana (Hace 1 Año)'
                        : opt === 'mensual'
                        ? 'Este Mes'
                        : opt === 'mes_pasado'
                        ? 'Mes Pasado'
                        : opt === 'mes_hace_un_ano'
                        ? 'Mes (Hace 1 Año)'
                        : opt === 'anual'
                        ? 'Este Año'
                        : opt === 'ano_pasado'
                        ? 'Año Pasado'
                        : '⚙️ Personalizado'}
                    </button>
                  ))}
                </div>

                {selectedDateRange === 'personalizado' && (
                  <div className="mt-1 pt-2 border-t border-[#CDC3D2]/30 flex items-center gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#4B4450]">Desde:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-white border border-[#CDC3D2]/40 rounded-lg px-2 py-1 text-xs text-[#350463] font-bold focus:outline-none focus:ring-1 focus:ring-[#350463] cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#4B4450]">Hasta:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-white border border-[#CDC3D2]/40 rounded-lg px-2 py-1 text-xs text-[#350463] font-bold focus:outline-none focus:ring-1 focus:ring-[#350463] cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cuerpo Principal: Opciones de Descarga */}
              <div className="space-y-3 text-xs">
                {/* Option A: Executive PDF Print */}
                <div
                  onClick={isExportingPDF ? undefined : handleExportExecutivePDF}
                  className={`p-4 rounded-2xl bg-[#FAF7F0] hover:bg-[#F0EEE7] border border-[#E5E2DB] transition-all group flex items-start gap-3.5 ${
                    isExportingPDF ? 'opacity-70 cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#350463] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-[#C0F441]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#350463] block">
                        {isExportingPDF
                          ? '⏳ Generando Reporte PDF membretado...'
                          : '1. Descargar Reporte Ejecutivo (PDF Imprimible)'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] font-bold">
                        {isExportingPDF ? 'Procesando...' : '.PDF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4B4450] mt-1 leading-snug">
                      Genera una vista ejecutiva membretada con los 5 KPIs, balances financieros, desglose de costos directos y mermas lista para imprimir o guardar como PDF.
                    </p>
                  </div>
                </div>

                {/* Option B: Real CSV Download */}
                <div
                  onClick={handleExportCSV}
                  className="p-4 rounded-2xl bg-[#FAF7F0] hover:bg-[#F0EEE7] border border-[#C0F441]/60 cursor-pointer transition-all group flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#C0F441] text-[#2E3F00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5 text-[#2E3F00]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#2E3F00] block">
                        2. Descargar Base Contable (CSV / Excel SAT)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold">
                        .CSV SAT
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4B4450] mt-1 leading-snug">
                      Descarga directa del archivo .CSV con todas las columnas contables reales: Folio, Fecha, Cliente, Facturación, Costo Filamento, CFE, Fondo Mtto 8%, Insumos Extra, IVA, Ganancia Neta y Pérdidas por Falla.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra Inferior Fija (Master Footer) */}
            <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-[#4B4450] font-medium hidden sm:inline">
                Cumplimiento contable SAT CDMX • 11 campos fiscales
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#F0EEE7] transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-xl bg-[#350463] hover:bg-[#28034b] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#C0F441]" />
                  <span>Exportar CSV Ahora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL 2: BITÁCORA COMPLETA DE FALLAS (REQ 1 & 3)*/}
      {/* ======================================================== */}
      {showAuditDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-3xl bg-white h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EEE7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center font-bold shadow-xs">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#350463]">
                      Bitácora Completa de Fallas & Mermas
                    </h3>
                    <span className="text-[11px] text-[#4B4450]">
                      Historial auditado de scrap, causas y acciones correctivas del taller
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuditDrawer(false)}
                  className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Fila Superior de Métricas Rápidas (Recalcula en tiempo real con fecha) */}
              <div className="grid grid-cols-3 gap-2.5 my-4">
                <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB]">
                  <span className="text-[10px] text-[#4B4450] uppercase font-bold block truncate">Total Fallas</span>
                  <span className="text-xl font-extrabold text-[#350463]">{bitacoraTotalFallas}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFDAD6]/40 border border-[#FFCDD2]">
                  <span className="text-[10px] text-[#BA1A1A] uppercase font-bold block truncate">Costo Absorbido</span>
                  <span className="text-xl font-extrabold text-[#BA1A1A]">
                    -${bitacoraCostoAbsorbido.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#C0F441]/30 border border-[#C0F441]/50">
                  <span className="text-[10px] text-[#2E3F00] uppercase font-bold block truncate">Scrap Acopiado</span>
                  <span className="text-xl font-extrabold text-[#2E3F00]">{bitacoraScrapAcopiado}g</span>
                </div>
              </div>

              {/* Barra de Filtros / Búsqueda & FILTRO POR FECHA (REQUIREMENT 3) */}
              <div className="space-y-2 mb-4 bg-[#FAF7F0] p-3 rounded-2xl border border-[#CDC3D2]/40">
                {/* SELECTOR DE RANGO DE FECHA INTERACTIVO */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#350463] font-bold">
                    <Calendar className="w-3.5 h-3.5 text-[#6D3ACD]" />
                    <span>Filtrar por Fecha:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { key: 'hoy' as const, label: 'Hoy' },
                      { key: '7dias' as const, label: 'Últimos 7 días' },
                      { key: 'este_mes' as const, label: 'Este Mes (Octubre)' },
                      { key: 'personalizado' as const, label: 'Rango personalizado ⬍' },
                      { key: 'todos' as const, label: 'Todo' },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setAuditDateRange(btn.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          auditDateRange === btn.key
                            ? 'bg-[#350463] text-white shadow-2xs'
                            : 'bg-white text-[#4B4450] hover:bg-[#E5E2DB] border border-[#CDC3D2]/30'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-inputs de rango personalizado si está activo */}
                {auditDateRange === 'personalizado' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#E5E2DB] text-xs">
                    <span className="text-[#4B4450] font-semibold">Desde:</span>
                    <input
                      type="date"
                      value={auditCustomStartDate}
                      onChange={(e) => setAuditCustomStartDate(e.target.value)}
                      className="px-2 py-1 bg-white rounded-lg border border-[#CDC3D2]/40 font-mono text-[#350463]"
                    />
                    <span className="text-[#4B4450] font-semibold">Hasta:</span>
                    <input
                      type="date"
                      value={auditCustomEndDate}
                      onChange={(e) => setAuditCustomEndDate(e.target.value)}
                      className="px-2 py-1 bg-white rounded-lg border border-[#CDC3D2]/40 font-mono text-[#350463]"
                    />
                  </div>
                )}

                {/* Búsqueda textual y selector de causas */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[#E5E2DB]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B4450]" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Buscar por folio, pieza o acción..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl text-xs text-[#1C1C18] focus:outline-none border border-[#CDC3D2]/40"
                    />
                  </div>

                  <select
                    value={auditFilterCause}
                    onChange={(e) => setAuditFilterCause(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white text-xs font-semibold text-[#350463] border border-[#CDC3D2]/40 focus:outline-none"
                  >
                    <option value="all">Todas las Causas</option>
                    <option value="Warping / Adhesión">Warping / Adhesión</option>
                    <option value="Atasco / Boquilla">Atasco / Boquilla</option>
                    <option value="Capa desplazada">Capa desplazada</option>
                    <option value="Corte de luz / Térmico">Corte de luz / Térmico</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Cuerpo Principal: Tabla Detallada */}
              <div className="overflow-x-auto rounded-2xl border border-[#CDC3D2]/40 bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F0] text-[#4B4450] text-[10px] uppercase font-bold tracking-wider border-b border-[#CDC3D2]/30">
                      <th className="py-2.5 px-3">Fecha / Folio</th>
                      <th className="py-2.5 px-3">Pieza & Causa</th>
                      <th className="py-2.5 px-3 text-right">Gramos</th>
                      <th className="py-2.5 px-3 text-right">Costo Absorbido</th>
                      <th className="py-2.5 px-3">Acción Correctiva</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEE7]">
                    {filteredBitacora.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#4B4450]">
                          No se encontraron incidencias en el rango seleccionado.
                        </td>
                      </tr>
                    ) : (
                      filteredBitacora.map((fail) => (
                        <tr key={fail.id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono">
                            <span className="font-bold text-[#350463] block">{fail.orderFolio}</span>
                            <span className="text-[10px] text-[#4B4450]">{fail.date}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-[#1C1C18] block">{fail.itemTitle}</span>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FFDAD6] text-[#BA1A1A]">
                              {fail.cause}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#4B4450]">
                            {fail.gramsLost}g
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#BA1A1A]">
                            -${fail.costAbsorbed.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#4B4450] max-w-[220px]">
                            {fail.actionTaken}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Barra Inferior Fija (Master Footer) */}
            <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-between mt-4">
              <span className="text-xs text-[#4B4450] font-medium">
                {filteredBitacora.length} registros auditados en período activo
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuditDrawer(false)}
                  className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#F0EEE7] transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowAuditDrawer(false);
                    onOpenFailureModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#BA1A1A] hover:bg-[#93000A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>+ Registrar Nueva Falla</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL 3: CREAR LOTE DE FABRICACIÓN RECICLADA    */}
      {/* ======================================================== */}
      {showEcoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-3xl bg-white h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EEE7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#350463] text-[#C0F441] flex items-center justify-center font-bold shadow-xs">
                    <Recycle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#350463]">
                      Configurar Lote de Fabricación Reciclada
                    </h3>
                    <span className="text-[11px] text-[#4B4450]">
                      Conversión de scrap KiMO Eco-Loop con costeo comercial automático
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowEcoModal(false)}
                  className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Fila Superior de Métricas Rápidas (Requirement 2 Standard KPIs) */}
              <div className="grid grid-cols-3 gap-2.5 my-4">
                <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB]">
                  <span className="text-[10px] text-[#4B4450] uppercase font-bold block truncate">Scrap Disponible</span>
                  <span className="text-xl font-extrabold text-[#350463] font-mono">
                    {availableSiloGrams.toLocaleString()}g
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#C0F441]/30 border border-[#C0F441]/50">
                  <span className="text-[10px] text-[#2E3F00] uppercase font-bold block truncate">Ganancia Proyectada</span>
                  <span className="text-xl font-extrabold text-[#2E3F00] font-mono">
                    +${calculatedNetRecovered.toFixed(2)} MXN
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#EADDFB]/40 border border-[#6D3ACD]/30">
                  <span className="text-[10px] text-[#350463] uppercase font-bold block truncate">Costo Material</span>
                  <span className="text-xl font-extrabold text-[#350463] font-mono">
                    $0.00 MXN
                  </span>
                </div>
              </div>

              {/* Barra de Filtros / Selección de Silo & Unidades Base */}
              <div className="grid grid-cols-2 gap-2.5 mb-4 p-3 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 text-xs">
                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">
                    Silo de Acopio Origen
                  </label>
                  <select
                    value={selectedSiloIndex}
                    onChange={(e) => handleSiloChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/40 font-bold text-[#350463] focus:outline-none"
                  >
                    {ecoSilos.map((silo, idx) => (
                      <option key={idx} value={idx}>
                        {silo.material} ({silo.currentGrams.toLocaleString()}g disponible)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1">
                    Unidades a Producir
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={unitsToProduce}
                    onChange={(e) => setUnitsToProduce(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDC3D2]/40 font-mono font-bold text-[#350463] focus:outline-none"
                  />
                </div>
              </div>

              {/* Cuerpo Principal: Selección de Producto Secundario (4 Presets + 5ta Tarjeta Manual) */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-[#1C1C18] block mb-1.5">
                    Seleccionar Producto Secundario a Fabricar
                  </label>
                  <div className="space-y-1.5">
                    {/* Presets de Catálogo del Taller */}
                    {ecoProductPresets.length === 0 ? (
                      <div className="p-2.5 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] text-[11px] text-[#4B4450]">
                        Sin recetas registradas en el Catálogo. Puedes definir abajo tu lote de fabricación manual.
                      </div>
                    ) : (
                      ecoProductPresets.map((preset: any, idx: number) => (
                      <label
                        key={idx}
                        onClick={() => handleSelectEcoPreset(idx)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          !isCustomEcoProduct && selectedEcoProductType === idx
                            ? 'bg-[#EADDFB]/40 border-[#6D3ACD] ring-2 ring-[#6D3ACD]/30'
                            : 'bg-[#FAF7F0] border-[#E5E2DB] hover:bg-[#F0EEE7]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-[#350463]">{preset.title}</span>
                          <span className="text-[10px] text-[#4B4450]">
                            Requiere ~{preset.gramsPerUnit}g por unidad • {preset.description}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#2E3F00] bg-[#C0F441] px-2 py-0.5 rounded-lg shrink-0">
                          ${preset.defaultPrice.toFixed(2)}
                        </span>
                      </label>
                      ))
                    )}

                    {/* 5TA TARJETA DESTACADA: PRODUCTO / PROCESO PERSONALIZADO (REQUIREMENT 2) */}
                    <div
                      onClick={handleSelectCustomEco}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                        isCustomEcoProduct
                          ? 'bg-[#EADDFB]/40 border-[#6D3ACD] ring-2 ring-[#6D3ACD]/30 shadow-xs'
                          : 'bg-[#FAF7F0] border-dashed border-[#6D3ACD]/50 hover:bg-[#EADDFB]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">✍️</span>
                          <span className="font-extrabold text-[#350463]">
                            Producto / Proceso Personalizado (Definir Manualmente)
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#350463] text-[#C0F441] font-bold">
                          Flexible
                        </span>
                      </div>
                      <span className="text-[11px] text-[#4B4450]">
                        Define libremente un nuevo artículo reciclado, técnica de moldeo, peso por pieza y costo de producción.
                      </span>

                      {/* CAMPOS ABIERTOS DESPLEGADOS SI ESTÁ SELECCIONADA LA OPCIÓN MANUAL */}
                      {isCustomEcoProduct && (
                        <div className="mt-2 pt-2 border-t border-[#6D3ACD]/20 space-y-2.5 animate-in fade-in zoom-in-95">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="font-bold text-[#1C1C18] block mb-1">
                                Nombre del Producto o Proyecto
                              </label>
                              <input
                                type="text"
                                value={customEcoTitle}
                                onChange={(e) => setCustomEcoTitle(e.target.value)}
                                placeholder="ej. Tapa personalizada para frascos"
                                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/40 font-semibold text-[#1C1C18] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-[#1C1C18] block mb-1">
                                Técnica / Método de Transformación
                              </label>
                              <select
                                value={customEcoProcessType}
                                onChange={(e) => setCustomEcoProcessType(e.target.value as any)}
                                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/40 font-bold text-[#350463] focus:outline-none"
                              >
                                <option value="prensado">Prensado térmico</option>
                                <option value="moldeo">Fundición / Moldeo</option>
                                <option value="triturado">Triturado clasificado</option>
                                <option value="acabado">Torneado / Corte láser</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="font-bold text-[#1C1C18] block mb-1">
                                Gramos de residuo requeridos por unidad
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={customEcoGramsPerUnit}
                                onChange={(e) => handleCustomGramsChange(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/40 font-mono font-bold text-[#350463] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-[#1C1C18] block mb-1">
                                Descripción / Notas de fabricación
                              </label>
                              <input
                                type="text"
                                value={customEcoDescription}
                                onChange={(e) => setCustomEcoDescription(e.target.value)}
                                placeholder="ej. Acabado marmoleado bicapa"
                                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#CDC3D2]/40 text-[#4B4450] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Precios Editables y Costos de Energía */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">
                      Precio Venta Sugerido ($ MXN)
                    </label>
                    <input
                      type="number"
                      step="5"
                      value={unitSalePrice}
                      onChange={(e) => setUnitSalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#2E3F00] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1C18] block mb-1">
                      Costo Energía / Insumos Adicionales ($ MXN)
                    </label>
                    <input
                      type="number"
                      step="5"
                      value={operatingCost}
                      onChange={(e) => setOperatingCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/40 font-mono font-bold text-[#BA1A1A] focus:outline-none"
                    />
                  </div>
                </div>

                {/* LIVE COMMERCIAL COSTING SUMMARY CARD */}
                <div className="p-4 rounded-2xl bg-[#EADDFB]/30 border border-[#6D3ACD]/30 space-y-1.5">
                  <span className="text-[10px] text-[#4B4450] uppercase tracking-wider font-bold block">
                    Resumen Comercial del Lote Reciclado en Tiempo Real
                  </span>

                  <div className="flex justify-between text-[#4B4450]">
                    <span>Scrap a descontar del Silo:</span>
                    <strong className="text-[#350463] font-mono">{calculatedTotalGramsUsed} g ({activeGramsPerUnit}g/pz)</strong>
                  </div>

                  <div className="flex justify-between text-[#4B4450]">
                    <span>Costo materia prima reciclada:</span>
                    <strong className="text-[#2E3F00]">$0.00 MXN (100% residuo taller)</strong>
                  </div>

                  <div className="flex justify-between text-[#4B4450]">
                    <span>Valor bruto de venta ({unitsToProduce} x ${unitSalePrice}):</span>
                    <strong className="text-[#1C1C18] font-mono">${calculatedGrossRevenue.toFixed(2)} MXN</strong>
                  </div>

                  <div className="flex justify-between text-[#BA1A1A]">
                    <span>Costo energía proceso térmico:</span>
                    <strong className="font-mono">-${operatingCost.toFixed(2)} MXN</strong>
                  </div>

                  <div className="pt-2 border-t border-[#6D3ACD]/20 flex items-center justify-between text-sm">
                    <span className="font-extrabold text-[#350463]">Ganancia Neta Recuperada:</span>
                    <span className="font-black font-mono text-base text-[#2E3F00] bg-[#C0F441] px-2.5 py-0.5 rounded-xl">
                      +${calculatedNetRecovered.toFixed(2)} MXN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra Inferior Fija (Master Footer) */}
            <div className="pt-4 border-t border-[#F0EEE7] flex items-center justify-between mt-4">
              <span className="text-xs text-[#4B4450] font-medium truncate max-w-[280px]">
                {unitsToProduce} unidades listas • {calculatedTotalGramsUsed}g scrap a descontar
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEcoModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#F0EEE7] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleStartEcoProduction}
                  className="px-4 py-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-black shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{ecoSuccessFeedback ? '✅ Lote Creado!' : 'Iniciar Producción y Publicar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* PLANTILLA OFICIAL DE REPORTE EJECUTIVO PARA PDF (A4)     */}
      {/* ======================================================== */}
      <div
        style={{ position: 'fixed', left: '-9999px', top: '0', width: '920px', zIndex: -100 }}
        aria-hidden="true"
      >
        <div
          id="dashboard-kpi-summary-container"
          style={{ backgroundColor: '#ffffff', color: '#1C1C18', fontFamily: 'Arial, sans-serif' }}
          className="p-8 bg-white border border-[#E5E2DB]"
        >
          {/* Encabezado Oficial Membretado */}
          <div className="flex items-start justify-between border-b-2 border-[#350463] pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 rounded-xl bg-[#350463] flex items-center justify-center text-[#C0F441] font-black text-sm">
                  K3D
                </div>
                <div>
                  <h1 className="text-xl font-black text-[#350463] tracking-tight">KiMO 3D STUDIO MÉXICO</h1>
                  <p className="text-[11px] font-bold text-[#6D3ACD]">Laboratorio de Fabricación Aditiva • Impresión 3D y Prototipado</p>
                </div>
              </div>
              <p className="text-[10px] text-[#4B4450]">
                CDMX, México • Tel: 55 7067 9725 • Correo: kimo.hace@gmail.com • Instagram: @kimo.ideas
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#350463] text-[#C0F441] text-[11px] font-black rounded-lg uppercase tracking-wider mb-1">
                Reporte Ejecutivo Financiero
              </span>
              <div className="text-[11px] text-[#4B4450]">
                <div>Fecha Emisión: <strong>{new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                <div>Período Auditado: <strong className="text-[#350463]">{getDateBoundaries(selectedDateRange).label}</strong></div>
                <div>Folio Auditoría: <strong>AUD-{selectedDateRange.toUpperCase()}-{new Date().getFullYear()}</strong></div>
              </div>
            </div>
          </div>

          {/* 5 KPIs Principales */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <div className="p-3 rounded-xl border border-[#E5E2DB] bg-[#FAF7F0]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#4B4450] block">Ventas Totales</span>
              <span className="text-base font-black text-[#350463]">${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-[#4B4450] block mt-0.5">{filteredOrders.length} pedidos</span>
            </div>

            <div className="p-3 rounded-xl border border-[#E5E2DB] bg-[#FAF7F0]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#4B4450] block">Costo Directo</span>
              <span className="text-base font-black text-[#BA1A1A]">${totalDirectCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-[#4B4450] block mt-0.5">Taller & Insumos</span>
            </div>

            <div className="p-3 rounded-xl border border-[#C0F441] bg-[#FAFDF0]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#2E3F00] block">Margen Neto Real</span>
              <span className="text-base font-black text-[#2E3F00]">{netMarginPercent.toFixed(1)}%</span>
              <span className="text-[9px] text-[#2E3F00] block mt-0.5">${netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })} util.</span>
            </div>

            <div className="p-3 rounded-xl border border-[#E5E2DB] bg-[#FAF7F0]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#4B4450] block">Mermas / Scrap</span>
              <span className="text-base font-black text-[#BA1A1A]">${totalMermaAbsorbed.toFixed(2)}</span>
              <span className="text-[9px] text-[#4B4450] block mt-0.5">{totalMermaGrams}g pérdidas</span>
            </div>

            <div className="p-3 rounded-xl border border-[#E5E2DB] bg-[#FAF7F0]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#4B4450] block">Horas Impresión</span>
              <span className="text-base font-black text-[#350463]">{totalHoursPrintedInPeriod}h</span>
              <span className="text-[9px] text-[#4B4450] block mt-0.5">Producción activa</span>
            </div>
          </div>

          {/* Desglose de Estructura de Costos de Taller */}
          <div className="mb-6 p-4 rounded-xl border border-[#E5E2DB] bg-[#FFFFFF]">
            <h3 className="text-xs font-black uppercase text-[#350463] mb-2 tracking-wider">
              Estructura de Absorción de Costos de Fabricación
            </h3>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E5E2DB]">
                <span className="text-[10px] text-[#4B4450] block font-semibold">1. Filamento / Materia Prima</span>
                <span className="font-bold text-[#1C1C18]">${totalFilamentCost.toFixed(2)} MXN</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E5E2DB]">
                <span className="text-[10px] text-[#4B4450] block font-semibold">2. Energía CFE Taller</span>
                <span className="font-bold text-[#1C1C18]">${totalCfeCost.toFixed(2)} MXN</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E5E2DB]">
                <span className="text-[10px] text-[#4B4450] block font-semibold">3. Fondo Amortización Mtto (8%)</span>
                <span className="font-bold text-[#1C1C18]">${totalMttoCost.toFixed(2)} MXN</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E5E2DB]">
                <span className="text-[10px] text-[#4B4450] block font-semibold">4. Insumos & Post-proceso</span>
                <span className="font-bold text-[#1C1C18]">${totalInsumosCost.toFixed(2)} MXN</span>
              </div>
            </div>
          </div>

          {/* Tabla Resumen de Órdenes Auditadas */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase text-[#350463] mb-2 tracking-wider">
              Partidas y Órdenes Auditadas ({filteredOrders.length} registros)
            </h3>
            {filteredOrders.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#FAF7F0] border border-[#E5E2DB] text-center text-xs text-[#4B4450]">
                Sin órdenes registradas en este período contable seleccionado.
              </div>
            ) : (
              <table className="w-full text-left text-xs border border-[#E5E2DB] rounded-lg overflow-hidden">
                <thead className="bg-[#EADDFB] text-[#350463] font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-1.5 px-2">Fecha</th>
                    <th className="py-1.5 px-2">Folio</th>
                    <th className="py-1.5 px-2">Cliente / Proyecto</th>
                    <th className="py-1.5 px-2 text-center">Horas</th>
                    <th className="py-1.5 px-2 text-right">Facturación</th>
                    <th className="py-1.5 px-2 text-right">Saldo Pend.</th>
                    <th className="py-1.5 px-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DB]">
                  {filteredOrders.slice(0, 15).map((o, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F0]'}>
                      <td className="py-1.5 px-2 font-mono text-[10px]">{o.createdAtDate || '2026-10-02'}</td>
                      <td className="py-1.5 px-2 font-bold text-[#350463]">{o.folio}</td>
                      <td className="py-1.5 px-2">
                        <div className="font-bold">{o.title}</div>
                        <div className="text-[10px] text-[#4B4450]">{o.clientName}</div>
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono">{o.printHours}h</td>
                      <td className="py-1.5 px-2 text-right font-bold text-[#2E3F00]">${o.totalPrice.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#BA1A1A]">
                        ${(o.pendingBalance ?? 0).toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-[#EADDFB] text-[#350463] font-bold">{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Resumen de Mermas y Desperdicios */}
          {filteredFailures.length > 0 && (
            <div className="mb-6 p-3 rounded-xl border border-[#BA1A1A]/30 bg-[#FFF8F8]">
              <h3 className="text-xs font-black uppercase text-[#BA1A1A] mb-1.5 tracking-wider">
                Incidencias y Mermas de Taller ({filteredFailures.length} fallas registradas)
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {filteredFailures.slice(0, 6).map((f, i) => (
                  <div key={i} className="p-2 rounded bg-white border border-[#BA1A1A]/20">
                    <span className="font-bold text-[#BA1A1A] block">{f.cause} ({f.gramsLost}g)</span>
                    <span className="text-[10px] text-[#4B4450] block truncate">{f.itemTitle}</span>
                    <span className="text-[10px] font-mono text-[#BA1A1A] font-bold">Costo: ${f.costAbsorbed.toFixed(2)} MXN</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer y Firmas de Auditoría */}
          <div className="border-t-2 border-[#E5E2DB] pt-4 mt-6 flex items-center justify-between text-xs">
            <div className="text-[10px] text-[#4B4450]">
              <div>Documento oficial de control interno y auditoría SAT generado automáticamente por ERP KiMO Studio.</div>
              <div>Taller KiMO Lab CDMX • Balance en Pesos Mexicanos (MXN) • Página 1 / 1</div>
            </div>

            <div className="flex gap-8 text-center text-[10px]">
              <div>
                <div className="w-32 border-b border-black mb-1"></div>
                <span className="text-[#4B4450] font-bold">Firma Auditor / Finanzas</span>
              </div>
              <div>
                <div className="w-32 border-b border-black mb-1"></div>
                <span className="text-[#4B4450] font-bold">Dirección General KiMO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
