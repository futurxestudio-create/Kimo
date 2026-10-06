import React, { useState, useMemo } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { KanbanOrder, ChecklistTask } from '../types';
import {
  Search,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Layers,
  Wrench,
  Send,
  Package,
  Receipt,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  Edit3,
  Camera,
  Upload,
  User,
  Plus,
  Trash2,
  Printer,
  X,
  Copy,
  FileText,
  Check,
  Truck,
  FileCheck,
  ChevronDown,
  Folder,
  Calendar,
  Paperclip,
} from 'lucide-react';

interface KanbanViewProps {
  onOpenFailureModal: (order?: KanbanOrder) => void;
  onOpenLiquidationModal: (order: KanbanOrder) => void;
}

interface FleetMachine {
  id: string;
  name: string;
  model: string;
  status: 'en_uso' | 'disponible' | 'pausa_mtto';
  statusLabel: string;
  currentJob: string;
  remainingMinutes: number;
  endTimeText: string;
  progressPercent: number;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  onOpenFailureModal,
  onOpenLiquidationModal,
}) => {
  const {
    orders,
    printers,
    finishOrder,
    moveOrderStatus,
    updateOrder,
    liquidateBalance,
    settings,
    updateSettings,
    setActiveTab,
    addNotification,
  } = useWorkshop();

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | '3d' | 'maquila'>('all');
  const [showDeliveredHistory, setShowDeliveredHistory] = useState(false);

  // Floating Toast State
  const [toastMessage, setToastMessage] = useState<{
    id: number;
    title: string;
    description: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (title: string, description: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setToastMessage({ id, title, description, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.id === id ? null : current));
    }, 4000);
  };

  // ========================================================
  // 1. COMPACT FLEET MACHINES STATE & ACTIONS
  // ========================================================
  const [machines, setMachines] = useState<Record<string, FleetMachine>>({});

  const [activeMachineMenu, setActiveMachineMenu] = useState<string | null>(null);
  const [adjustingMachineId, setAdjustingMachineId] = useState<string | null>(null);
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(30);
  const [customEndTimeInput, setCustomEndTimeInput] = useState<string>('4:30 PM');
  const [showNozzleModal, setShowNozzleModal] = useState(false);

  const handleAdjustMachineTime = (machineId: string, deltaMinutes: number) => {
    setMachines((prev) => {
      const m = prev[machineId];
      if (!m) return prev;
      const newMinutes = Math.max(5, m.remainingMinutes + deltaMinutes);
      const hours = Math.floor(newMinutes / 60);
      const mins = newMinutes % 60;
      return {
        ...prev,
        [machineId]: {
          ...m,
          remainingMinutes: newMinutes,
          endTimeText: `Restan ~${hours > 0 ? `${hours}h ` : ''}${mins}m`,
        },
      };
    });
    showToast('Tiempo Ajustado', `Se ajustó el tiempo restante para ${machineId}`, 'info');
  };

  const handleApplyCustomMachineTime = (machineId: string) => {
    setMachines((prev) => {
      const m = prev[machineId];
      if (!m) return prev;
      return {
        ...prev,
        [machineId]: {
          ...m,
          remainingMinutes: customMinutesInput,
          endTimeText: customEndTimeInput || `Restan ~${customMinutesInput}m`,
        },
      };
    });
    setAdjustingMachineId(null);
    showToast('Tiempo Actualizado', `Estimación guardada para ${machineId}`, 'success');
  };

  const handleRestartMachineCycle = (machineId: string) => {
    setMachines((prev) => {
      const m = prev[machineId];
      if (!m) return prev;
      return {
        ...prev,
        [machineId]: {
          ...m,
          progressPercent: 2,
          remainingMinutes: 120,
          endTimeText: 'Reinicio: ~2h 00m',
          status: 'en_uso',
          statusLabel: 'En Uso (Reiniciado)',
        },
      };
    });
    setActiveMachineMenu(null);
    showToast('Ciclo Reiniciado', `Se reinició el ciclo de impresión en ${machineId} desde 0%`, 'warning');
  };

  const handleToggleMaintenance = (machineId: string) => {
    setMachines((prev) => {
      const m = prev[machineId];
      if (!m) return prev;
      const willBeMaintenance = m.status !== 'pausa_mtto';
      return {
        ...prev,
        [machineId]: {
          ...m,
          status: willBeMaintenance ? 'pausa_mtto' : 'disponible',
          statusLabel: willBeMaintenance ? 'Pausa / Mantenimiento' : 'Disponible',
        },
      };
    });
    setActiveMachineMenu(null);
    const m = machines[machineId];
    if (m?.status !== 'pausa_mtto') {
      showToast('Máquina en Pausa', `${machineId} declarada en pausa / mantenimiento para boquilla o lubricación`, 'warning');
    } else {
      showToast('Máquina Lista', `${machineId} reactivada como disponible para producción`, 'success');
    }
  };

  // ========================================================
  // 2. QUEUE COLUMN PRINTER SELECTION, AVAILABILITY & SUGGESTIONS
  // ========================================================
  const [selectedQueuePrinters, setSelectedQueuePrinters] = useState<Record<string, string>>({
    'ord-1': 'IMP-01 (Bambu A1 Combo)',
    'ord-2': 'IMP-02 (FDM)',
    'ord-3': 'Impresora Resina SLA',
  });

  // Dynamic detection of occupied vs available machines in manufacturing
  const getPrinterAvailability = (printerKey: string) => {
    // Check if printer is in maintenance or retired in global printers fleet
    const matchedDevice = printers.find(
      (p) =>
        printerKey.includes(p.alias) ||
        p.id === printerKey ||
        printerKey.includes(p.modelo)
    );

    if (matchedDevice) {
      if (matchedDevice.estado === 'mantenimiento') {
        return { isBusy: true, label: `🔴 ${matchedDevice.alias} - EN MANTENIMIENTO` };
      }
      if (matchedDevice.estado === 'fuera_de_servicio') {
        return { isBusy: true, label: `🔴 ${matchedDevice.alias} - FUERA DE SERVICIO` };
      }
      if (matchedDevice.estado === 'baja') {
        return { isBusy: true, label: `📁 ${matchedDevice.alias} - DADA DE BAJA` };
      }
    }

    if (printerKey.includes('IMP-01') || printerKey.includes('Bambu')) {
      const activeOrder = orders.find(
        (o) =>
          o.status === 'manufacturing' &&
          (o.assignedPrinter.includes('BAM') ||
            o.assignedPrinter.includes('A1') ||
            o.assignedPrinter.includes('IMP-01') ||
            o.assignedPrinter.includes('Bambu'))
      );
      if (activeOrder || machines['IMP-01'].status === 'en_uso') {
        const remainingStr = machines['IMP-01'].endTimeText.includes('Restan')
          ? machines['IMP-01'].endTimeText
          : 'Libre en ~1h 40m';
        return {
          isBusy: true,
          label: `🔴 IMP-01 (Bambu A1) - OCUPADA (${remainingStr})`,
        };
      }
      return { isBusy: false, label: '🟢 IMP-01 (Bambu A1) - DISPONIBLE' };
    }
    if (printerKey.includes('IMP-02') || printerKey.includes('FDM')) {
      const activeOrder = orders.find(
        (o) => o.status === 'manufacturing' && (o.assignedPrinter.includes('IMP-02') || o.assignedPrinter.includes('X1'))
      );
      if (activeOrder || machines['IMP-02'].status === 'en_uso') {
        return { isBusy: true, label: '🔴 IMP-02 Flota Secundaria - OCUPADA (Libre en ~45m)' };
      }
      return { isBusy: false, label: '🟢 IMP-02 Flota Secundaria - DISPONIBLE' };
    }
    if (printerKey.includes('Resina')) {
      const activeOrder = orders.find(
        (o) => o.status === 'manufacturing' && o.assignedPrinter.toLowerCase().includes('resina')
      );
      if (activeOrder) {
        return { isBusy: true, label: '🔴 Impresora Resina - OCUPADA' };
      }
      return { isBusy: false, label: '🟢 Impresora Resina - DISPONIBLE' };
    }
    // Maquila externa
    return { isBusy: false, label: '🟢 Maquila Externa - DISPONIBLE' };
  };

  const getRecommendedPrinter = (order: KanbanOrder): { printer: string; badgeText: string } => {
    if (order.folio === 'COTZ-0021' || (order.filamentColors && order.filamentColors.length > 1)) {
      return {
        printer: 'IMP-01 (Bambu A1 Combo)',
        badgeText: '💡 Recomendada: Bambu A1 (AMS Multicolor)',
      };
    }
    if (order.folio === 'COTZ-0024' || order.category === 'biomedical' || order.title.toLowerCase().includes('quirúrgico')) {
      return {
        printer: 'Impresora Resina SLA',
        badgeText: '💡 Recomendada: Resina SLA Alta Definición',
      };
    }
    if (order.category === 'laser_maquila' || order.category === 'vinil') {
      return {
        printer: 'Maquila Externa',
        badgeText: '💡 Recomendada: Maquila Externa',
      };
    }
    return {
      printer: 'IMP-02 (FDM)',
      badgeText: '💡 Recomendada: IMP-02 (FDM Rápida)',
    };
  };

  const handleSendToManufacturing = (order: KanbanOrder) => {
    const chosenPrinter = selectedQueuePrinters[order.id] || getRecommendedPrinter(order).printer;
    const availability = getPrinterAvailability(chosenPrinter);
    if (availability.isBusy) {
      showToast('Máquina Ocupada', 'Por favor selecciona una impresora libre para lanzar la orden', 'warning');
      return;
    }
    updateOrder(order.id, {
      status: 'manufacturing',
      assignedPrinter: chosenPrinter,
      progressPercent: 5,
      remainingTimeText: 'Iniciando primer capa...',
    });
    showToast('Orden en Fabricación', `Orden ${order.folio} enviada a ${chosenPrinter}`, 'success');
  };

  // Collaborators with real names & custom input modal
  const [collaborators, setCollaborators] = useState<string[]>([
    'Carlos R.',
    'Fernanda M.',
    'Operador Principal',
  ]);
  const [customCollaboratorModal, setCustomCollaboratorModal] = useState<{
    orderId?: string;
    taskId?: string;
  } | null>(null);
  const [newCollaboratorName, setNewCollaboratorName] = useState('');

  const handleAddCustomCollaborator = () => {
    if (!newCollaboratorName.trim()) return;
    const name = newCollaboratorName.trim();
    if (!collaborators.includes(name)) {
      setCollaborators((prev) => [...prev, name]);
    }
    if (customCollaboratorModal?.orderId && !customCollaboratorModal.taskId) {
      updateOrder(customCollaboratorModal.orderId, { assignedOperator: name });
      showToast('Responsable Asignado', `${name} asignado a la orden`, 'info');
    }
    if (customCollaboratorModal?.orderId && customCollaboratorModal.taskId) {
      const orderId = customCollaboratorModal.orderId;
      const taskId = customCollaboratorModal.taskId;
      setOrderTasks((prev) => ({
        ...prev,
        [orderId]: (prev[orderId] || []).map((t) => (t.id === taskId ? { ...t, assignedTo: name } : t)),
      }));
      showToast('Tarea Asignada', `Tarea asignada a ${name}`, 'info');
    }
    setNewCollaboratorName('');
    setCustomCollaboratorModal(null);
  };

  // ========================================================
  // 3. MANUFACTURING COLUMN: IMAGE & DETAILS MODALS
  // ========================================================
  const [editingImageOrder, setEditingImageOrder] = useState<KanbanOrder | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedOrderForFinish, setSelectedOrderForFinish] = useState<KanbanOrder | null>(null);

  const [editingDetailsOrder, setEditingDetailsOrder] = useState<KanbanOrder | null>(null);
  const [detailsNotes, setDetailsNotes] = useState('');
  const [detailsWorkshopNotes, setDetailsWorkshopNotes] = useState('');
  const [detailsPrinter, setDetailsPrinter] = useState('');
  const [detailsProgress, setDetailsProgress] = useState(0);
  const [detailsPieces, setDetailsPieces] = useState(1);
  const [detailsPlates, setDetailsPlates] = useState(1);
  const [detailsPrintHours, setDetailsPrintHours] = useState(1);

  const handleOpenEditDetails = (order: KanbanOrder) => {
    setEditingDetailsOrder(order);
    setDetailsNotes(order.notes || '');
    setDetailsWorkshopNotes(order.workshopNotes || order.notes || '');
    setDetailsPrinter(order.assignedPrinter);
    setDetailsProgress(order.progressPercent);
    setDetailsPieces(order.piecesCount || 1);
    setDetailsPlates(order.platesCount || 1);
    setDetailsPrintHours(order.printHours || 1);
  };

  const handleSaveEditDetails = () => {
    if (!editingDetailsOrder) return;
    updateOrder(editingDetailsOrder.id, {
      notes: detailsNotes,
      workshopNotes: detailsWorkshopNotes,
      assignedPrinter: detailsPrinter,
      progressPercent: detailsProgress,
      piecesCount: detailsPieces,
      platesCount: detailsPlates,
      printHours: detailsPrintHours,
    });
    showToast('Detalles Actualizados', `Orden ${editingDetailsOrder.folio} actualizada correctamente`, 'success');
    setEditingDetailsOrder(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingImageOrder) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        updateOrder(editingImageOrder.id, { imageUrl: resultUrl });
        showToast('Foto Actualizada', `Nueva imagen guardada para ${editingImageOrder.folio}`, 'success');
        setEditingImageOrder(null);
        setCustomImageUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImageUrl = () => {
    if (editingImageOrder && customImageUrl.trim()) {
      updateOrder(editingImageOrder.id, { imageUrl: customImageUrl.trim() });
      showToast('Foto Actualizada', `Imagen enlazada para ${editingImageOrder.folio}`, 'success');
      setEditingImageOrder(null);
      setCustomImageUrl('');
    }
  };

  // ========================================================
  // 4. POST-PROCESS COLUMN: OPERATOR, CHECKLIST & LABOR HOURS
  // ========================================================
  const defaultChecklistByOrder: Record<string, ChecklistTask[]> = {
    'ord-6': [
      { id: 'c1', text: 'Retirar soportes de árbol', done: true, assignedTo: 'Operador Principal' },
      { id: 'c2', text: 'Depilar vinil / Acabado fino', done: true, assignedTo: 'Auxiliar de Taller' },
      { id: 'c3', text: 'Limpieza con alcohol isopropílico', done: false, assignedTo: 'Operador Principal' },
    ],
    'ord-7': [
      { id: 'c1', text: 'Inspección de roscas y ensamble de base LED', done: true, assignedTo: 'Operador Principal' },
      { id: 'c2', text: 'Prueba de encendido y difusor translúcido', done: true, assignedTo: 'Operador Principal' },
      { id: 'c3', text: 'Limpieza superficial con aire comprimido', done: false, assignedTo: 'Auxiliar de Taller' },
    ],
  };

  const [orderTasks, setOrderTasks] = useState<Record<string, ChecklistTask[]>>(defaultChecklistByOrder);
  const [newActivityInputs, setNewActivityInputs] = useState<Record<string, { text: string; assignee: string }>>({});
  const [showNewTaskForm, setShowNewTaskForm] = useState<Record<string, boolean>>({});

  const toggleCheckItem = (orderId: string, taskId: string) => {
    setOrderTasks((prev) => {
      const tasks = prev[orderId] || [
        { id: 'c1', text: 'Retirar soportes de árbol', done: false, assignedTo: 'General' },
        { id: 'c2', text: 'Depilar vinil / Acabado fino', done: false, assignedTo: 'General' },
        { id: 'c3', text: 'Limpieza con alcohol isopropílico', done: false, assignedTo: 'General' },
      ];
      return {
        ...prev,
        [orderId]: tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      };
    });
  };

  const handleAddNewTask = (orderId: string) => {
    const input = newActivityInputs[orderId];
    if (!input || !input.text.trim()) return;

    const newTask: ChecklistTask = {
      id: `task-${Date.now()}`,
      text: input.text.trim(),
      done: false,
      assignedTo: input.assignee || 'Operador Principal',
    };

    setOrderTasks((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newTask],
    }));

    setNewActivityInputs((prev) => ({
      ...prev,
      [orderId]: { text: '', assignee: 'Operador Principal' },
    }));
    setShowNewTaskForm((prev) => ({ ...prev, [orderId]: false }));
    showToast('Tarea Agregada', `Actividad asignada a ${newTask.assignedTo}`, 'info');
  };

  const handleDeleteTask = (orderId: string, taskId: string) => {
    setOrderTasks((prev) => ({
      ...prev,
      [orderId]: (prev[orderId] || []).filter((t) => t.id !== taskId),
    }));
  };

  const handleUpdateLaborHours = (order: KanbanOrder, newHours: number) => {
    const clampedHours = Math.max(0.1, Number(newHours.toFixed(1)));
    const laborHourlyRate = settings.laborRatePerHour || 50.0;
    const additionalLaborCost = clampedHours * laborHourlyRate;
    const baseInsumos = order.costInsumos || 30.0;
    const updatedInsumos = baseInsumos + additionalLaborCost;
    const updatedProfit = Math.max(0, order.totalPrice - ((order.costFilament || 0) + (order.costCfe || 0) + (order.costMtto || 0) + updatedInsumos));

    updateOrder(order.id, {
      finishLaborHours: clampedHours,
      costInsumos: Number(updatedInsumos.toFixed(2)),
      netProfit: Number(updatedProfit.toFixed(2)),
    });
    showToast('Mano de Obra Guardada', `${clampedHours} hrs registradas ($${additionalLaborCost.toFixed(2)} MXN impacto)`, 'info');
  };

  // ========================================================
  // 5. LOGISTICS & CLOSING COLUMN: DISPATCH MODAL, GUIDES & DISMISS
  // ========================================================
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);

  // Complete Dispatch Modal (Pestaña 1: Guía de Envío, Pestaña 2: Ticket de Empaque)
  const [dispatchModalOrder, setDispatchModalOrder] = useState<KanbanOrder | null>(null);
  const [dispatchTab, setDispatchTab] = useState<'guia' | 'ticket'>('guia');
  const [shippingServiceInput, setShippingServiceInput] = useState('Uber Flash');
  const [trackingGuideInput, setTrackingGuideInput] = useState('');
  const [guideProofFileName, setGuideProofFileName] = useState('');

  // 6. HISTÓRICO DE ÓRDENES ARCHIVADAS DEDICADO
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateRange, setHistoryDateRange] = useState<'todos' | 'hoy' | 'esta_semana' | 'este_mes'>('todos');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'todas' | '3d' | 'maquila'>('todas');
  const [viewingHistoricalOrder, setViewingHistoricalOrder] = useState<KanbanOrder | null>(null);

  const allDeliveredOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'delivered');
  }, [orders]);

  const filteredHistoryOrders = useMemo(() => {
    return allDeliveredOrders.filter((o) => {
      const matchSearch =
        o.folio.toLowerCase().includes(historySearch.toLowerCase()) ||
        o.clientName.toLowerCase().includes(historySearch.toLowerCase()) ||
        o.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        (o.assignedOperator && o.assignedOperator.toLowerCase().includes(historySearch.toLowerCase()));

      if (!matchSearch) return false;

      if (historyTypeFilter === '3d' && o.category !== '3d_print') return false;
      if (historyTypeFilter === 'maquila' && o.category !== 'laser_maquila' && o.category !== 'vinil') return false;

      const dateStr = o.deliveredAtDate || o.createdAtDate || '2026-10-02';
      if (historyDateRange === 'hoy') {
        return dateStr.startsWith('2026-10-03') || dateStr.startsWith('2026-10-02');
      }
      if (historyDateRange === 'esta_semana') {
        return dateStr >= '2026-09-28';
      }
      if (historyDateRange === 'este_mes') {
        return dateStr.startsWith('2026-10');
      }
      return true;
    });
  }, [allDeliveredOrders, historySearch, historyDateRange, historyTypeFilter]);

  const totalDeliveredRevenue = useMemo(() => {
    return allDeliveredOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  }, [allDeliveredOrders]);

  const handleOpenDispatchModal = (order: KanbanOrder, initialTab: 'guia' | 'ticket' = 'guia') => {
    setDispatchModalOrder(order);
    setDispatchTab(initialTab);
    setShippingServiceInput(order.shippingService || (order.deliveryType === 'uber_flash' ? 'Uber Flash' : 'Recolección en Mostrador'));
    setTrackingGuideInput(order.shippingTrackingGuide || '');
    setGuideProofFileName(order.shippingProofName || '');
  };

  const handleSaveDispatchGuide = () => {
    if (!dispatchModalOrder) return;
    updateOrder(dispatchModalOrder.id, {
      shippingService: shippingServiceInput,
      shippingTrackingGuide: trackingGuideInput.trim(),
      shippingProofName: guideProofFileName,
      deliveryType: shippingServiceInput === 'Uber Flash' ? 'uber_flash' : shippingServiceInput === 'Recolección en Mostrador' ? 'counter' : 'paqueteria',
    });
    showToast('Guía Guardada', `Datos de envío actualizados para ${dispatchModalOrder.folio}`, 'success');
    setDispatchModalOrder(null);
  };

  // CRITICAL FIX: "Marcar como Entregado y Cerrar"
  const handleDeliverAndClose = (order: KanbanOrder) => {
    setClosingOrderId(order.id);

    // Smooth transition removal
    setTimeout(() => {
      moveOrderStatus(order.id, 'delivered');
      updateOrder(order.id, {
        isPaid: true,
        pendingBalance: 0,
        progressPercent: 100,
        deliveredAtDate: new Date().toISOString().split('T')[0],
      });
      setClosingOrderId(null);
      showToast('Orden Entregada', `Orden ${order.folio} cerrada y entregada exitosamente.`);
      addNotification(`📦 Orden ${order.folio} cerrada y entregada exitosamente.`);
    }, 320);
  };

  // Filtering orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.title.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterType === '3d') return order.category === '3d_print';
      if (filterType === 'maquila') return order.category === 'laser_maquila' || order.category === 'vinil';
      return true;
    });
  }, [orders, searchTerm, filterType]);

  const queueOrders = filteredOrders.filter((o) => o.status === 'queue');
  const manufacturingOrders = filteredOrders.filter((o) => o.status === 'manufacturing');
  const postprocessOrders = filteredOrders.filter((o) => o.status === 'postprocess');
  // CRITICAL: active logistics column ONLY shows orders in 'logistics' status
  const activeLogisticsOrders = filteredOrders.filter((o) => o.status === 'logistics');
  const deliveredHistoryOrders = filteredOrders.filter((o) => o.status === 'delivered');

  return (
    <div className="w-full flex flex-col gap-6 py-4 max-w-[1720px] mx-auto relative">
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-[#350463] text-white shadow-2xl border border-[#C0F441]/40 animate-in slide-in-from-bottom-5 fade-in">
          <div className="w-8 h-8 rounded-xl bg-[#C0F441] text-[#2E3F00] flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs text-[#C0F441]">{toastMessage.title}</span>
            <span className="text-xs text-white/90">{toastMessage.description}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HEADER SECTION & SEARCH (REQ 1: TERMINOLOGÍA LIMPIA) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] font-bold uppercase tracking-wider">
              Piso de Producción Activo
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#2E3F00] animate-pulse" />
              4 Fases de Producción • {orders.filter((o) => o.status !== 'delivered').length} Órdenes Activas
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#350463] tracking-tight">
            Centro de Operaciones & Taller
          </h1>
          <p className="text-xs lg:text-sm text-[#4B4450]">
            Supervisión rápida de flota de impresión 3D, maquilas activas y supervisión de flujo continuo de taller.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 text-[#4B4450]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente o COTZ..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#CDC3D2]/40 rounded-xl text-xs text-[#1C1C18] focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/40 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#F0EEE7] p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white text-[#350463] shadow-xs' : 'text-[#4B4450] hover:text-[#1C1C18]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === '3d' ? 'bg-white text-[#350463] shadow-xs' : 'text-[#4B4450] hover:text-[#1C1C18]'
              }`}
            >
              Solo 3D
            </button>
            <button
              onClick={() => setFilterType('maquila')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'maquila' ? 'bg-white text-[#350463] shadow-xs' : 'text-[#4B4450] hover:text-[#1C1C18]'
              }`}
            >
              Maquila / Vinil
            </button>
          </div>

          {/* BOTÓN DEDICADO HISTÓRICO DE ÓRDENES (REQ 4) */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EADDFB] hover:bg-[#D2BCFF] text-[#350463] text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#6D3ACD]/30"
          >
            <Folder className="w-4 h-4 text-[#350463]" />
            <span>📁 Histórico de Órdenes ({allDeliveredOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cotizador')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-bold shadow-[0_3px_0_#86B100] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nueva Orden</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. FRANJA DE MÁQUINAS DINÁMICA (DESDE INVENTARIO/FLOTA)  */}
      {/* ======================================================== */}
      <div className="w-full bg-white rounded-2xl border border-[#CDC3D2]/40 px-4 py-2.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {printers.length === 0 ? (
            <div className="flex items-center justify-between w-full p-2.5 bg-[#FAF7F0] rounded-xl border border-dashed border-[#CDC3D2] text-xs">
              <div className="flex items-center gap-2 text-[#4B4450]">
                <Printer className="w-4 h-4 text-[#6D3ACD]" />
                <span className="font-medium">Sin impresoras registradas en el taller.</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('flota')}
                className="px-3 py-1 rounded-xl bg-[#EADDFB] hover:bg-[#D2BCFF] text-[#350463] font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Impresora en Flota</span>
              </button>
            </div>
          ) : (
            printers.map((p) => {
              const machineKey = p.id;
              const machineState = machines[machineKey] || {
                id: p.id,
                name: p.alias || p.id,
                model: `${p.marca} ${p.modelo}`,
                status: p.estado === 'mantenimiento' ? 'pausa_mtto' : (p.estado === 'en_impresion' ? 'en_uso' : 'disponible'),
                statusLabel: p.estado === 'mantenimiento' ? 'Mantenimiento' : (p.estado === 'en_impresion' ? 'En Uso' : 'Disponible'),
                currentJob: p.estado === 'en_impresion' ? 'Imprimiendo orden...' : 'Sin trabajo activo',
                remainingMinutes: 0,
                endTimeText: '--',
                progressPercent: 0,
              };

              return (
                <div key={p.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#CDC3D2]/30 shadow-xs relative">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {machineState.status === 'en_uso' && (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BA1A1A] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#BA1A1A]" />
                      </>
                    )}
                    {machineState.status === 'disponible' && (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#86B100]" />
                    )}
                    {machineState.status === 'pausa_mtto' && (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E65100]" />
                    )}
                  </span>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#350463]">{p.alias || p.id}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          machineState.status === 'en_uso'
                            ? 'bg-[#FFDAD6] text-[#BA1A1A]'
                            : machineState.status === 'pausa_mtto'
                            ? 'bg-[#FFF3E0] text-[#E65100]'
                            : 'bg-[#C0F441] text-[#2E3F00]'
                        }`}
                      >
                        {machineState.statusLabel}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#4B4450] font-mono">
                      {p.boquillaInstalada ? `Boquilla ${p.boquillaInstalada}` : 'Boquilla 0.4mm'} • {machineState.endTimeText}
                    </span>
                  </div>

                  {/* 3-DOT QUICK ACTION BUTTON */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMachineMenu(activeMachineMenu === p.id ? null : p.id)
                      }
                      className="w-6 h-6 rounded-lg hover:bg-[#E5E2DB] flex items-center justify-center text-[#4B4450] hover:text-[#350463] transition-colors"
                      title="Acciones de máquina"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMachineMenu === p.id && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-[#CDC3D2]/40 p-2 z-30 flex flex-col gap-1 animate-in zoom-in-95">
                        <div className="px-2 py-1 border-b border-[#F0EEE7] text-[10px] uppercase font-bold text-[#4B4450]">
                          Gestión {p.alias || p.id}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingMachineId(p.id);
                            setActiveMachineMenu(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#1C1C18] hover:bg-[#FAF7F0] flex items-center gap-2 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#6D3ACD]" />
                          <span>Ajustar tiempo restante</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMaintenance(p.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#BA1A1A] hover:bg-[#FFDAD6] flex items-center gap-2 cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5 text-[#BA1A1A]" />
                          <span>
                            {machineState.status === 'pausa_mtto'
                              ? 'Reanudar / Marcar Operativa'
                              : 'Pausa / Mantenimiento'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Preventive Maintenance Badge */}
        <div className="flex items-center gap-2 self-end md:self-center bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#CDC3D2]/30 shrink-0">
          <Wrench className="w-4 h-4 text-[#6D3ACD]" />
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#4B4450]">
            {printers.length === 0 ? (
              <span>Boquillas en taller: <strong className="text-[#350463] font-bold">Sin registrar</strong></span>
            ) : (
              <span>
                Boquilla {settings.activePrinter.id}:{' '}
                <strong className="text-[#350463] font-bold">
                  {Math.round(
                    (settings.activePrinter.nozzleWearHours / settings.activePrinter.nozzleMaxHours) * 100
                  )}%
                </strong>{' '}
                ({settings.activePrinter.nozzleWearHours}/{settings.activePrinter.nozzleMaxHours} hrs)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (printers.length === 0) {
                setActiveTab('flota');
              } else {
                setShowNozzleModal(true);
              }
            }}
            className="w-5 h-5 rounded-full bg-[#EADDFB] text-[#350463] flex items-center justify-center hover:bg-[#6D3ACD] hover:text-white transition-colors text-xs font-bold ml-1 cursor-pointer"
            title={printers.length === 0 ? "Ir a Flota para añadir impresora y boquillas" : "Registrar mantenimiento o cambio de boquilla"}
          >
            +
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TABLERO DE PRODUCCIÓN (4 FASES)                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start pb-8">
        {/* ======================================================== */}
        {/* COLUMNA 1: En Cola / Por Iniciar (REQ 3)                 */}
        {/* ======================================================== */}
        <div className="flex flex-col gap-3 bg-[#FAF7F0] p-3 rounded-2xl border border-[#CDC3D2]/30 min-h-[500px]">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6D3ACD]" />
              <h2 className="text-sm font-bold text-[#350463]">En Cola / Por Iniciar</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#EADDFB] text-[#350463] text-xs font-bold">
              {queueOrders.length} {queueOrders.length === 1 ? 'orden' : 'órdenes'}
            </span>
          </div>

          {queueOrders.map((order) => {
            const recommendation = getRecommendedPrinter(order);
            const currentSelectedPrinter = selectedQueuePrinters[order.id] || recommendation.printer;

            return (
              <div
                key={order.id}
                className="bg-white p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col gap-2.5 border border-[#CDC3D2]/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F0EEE7] text-[#1C1C18] font-bold">
                      {order.folio}
                    </span>
                    {(order.source === 'tienda_web' || order.isStripePaid) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2E3F00] text-[#C0F441] font-black tracking-wide border border-[#86B100]">
                        🌐 Stripe Pagado
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold">
                    <Clock className="w-3 h-3" /> Entrega: {order.deliveryDate}
                  </span>
                </div>

                {(order.source === 'tienda_web' || order.isStripePaid) && (
                  <div className="px-2.5 py-1 rounded-xl bg-[#C0F441]/20 border border-[#86B100]/40 text-[#2E3F00] text-[11px] font-extrabold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#2E3F00]" />
                    <span>🌐 Venta Tienda Web (Stripe Pagado)</span>
                  </div>
                )}

                <div className="flex flex-col">
                  <span className="text-[11px] text-[#4B4450] uppercase tracking-wider font-semibold">
                    {order.clientName}
                  </span>
                  <h3 className="text-sm font-bold text-[#1C1C18] leading-snug">{order.title}</h3>
                </div>

                <div className="flex items-center justify-between py-0.5 text-xs text-[#4B4450]">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium mr-1">Filamentos:</span>
                    {order.filamentColors.map((col, idx) => (
                      <span
                        key={idx}
                        className="w-3.5 h-3.5 rounded-full border border-[#CDC3D2]"
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[11px]">{order.piecesCount} piezas</span>
                </div>

                {order.notes && (
                  <div className="p-2 rounded-xl bg-[#FAF7F0] text-[11px] text-[#4B4450] border border-[#E5E2DB]">
                    {order.notes}
                  </div>
                )}

                {/* BADGE INTELIGENTE DE SUGERENCIA TÉCNICA */}
                <div className="p-2 rounded-xl bg-[#EADDFB]/70 border border-[#6D3ACD]/30 flex items-center gap-1.5 text-[11px] font-bold text-[#350463]">
                  <span>{recommendation.badgeText}</span>
                </div>

                {/* SELECTOR DESPLEGABLE DE MÁQUINA CON VALIDACIÓN DE DISPONIBILIDAD (REQ 1) */}
                {(() => {
                  const imp1 = getPrinterAvailability('IMP-01');
                  const imp2 = getPrinterAvailability('IMP-02');
                  const resina = getPrinterAvailability('Resina');
                  const maquila = getPrinterAvailability('Maquila');

                  const isBusy =
                    (currentSelectedPrinter.includes('IMP-01') && imp1.isBusy) ||
                    (currentSelectedPrinter.includes('IMP-02') && imp2.isBusy) ||
                    (currentSelectedPrinter.includes('Resina') && resina.isBusy);

                  return (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-[#4B4450] tracking-wider">
                          Asignar máquina de producción:
                        </label>
                        <select
                          value={currentSelectedPrinter}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedQueuePrinters((prev) => ({ ...prev, [order.id]: val }));
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/40 ${
                            isBusy
                              ? 'border-[#BA1A1A]/40 bg-[#FFF3E0] text-[#93000A]'
                              : 'border-[#CDC3D2]/60 bg-white text-[#1C1C18]'
                          }`}
                        >
                          {printers.length === 0 ? (
                            <option value="">⚠️ Registra impresoras en el módulo Flota</option>
                          ) : (
                            printers.map((p) => {
                              const busy = p.estado !== 'disponible';
                              let statusLabel = '🟢 DISPONIBLE';
                              if (p.estado === 'en_impresion') statusLabel = '🔴 OCUPADA';
                              else if (p.estado === 'mantenimiento') statusLabel = '🛠️ EN MANTENIMIENTO';
                              else if (p.estado === 'fuera_de_servicio') statusLabel = '🔴 FUERA DE SERVICIO';
                              else if (p.estado === 'baja') statusLabel = '📁 DADA DE BAJA';

                              return (
                                <option
                                  key={p.id}
                                  value={`${p.alias} (${p.marca} ${p.modelo})`}
                                  disabled={busy}
                                  className={busy ? 'text-gray-400 bg-gray-100 font-normal' : 'text-emerald-700 font-bold'}
                                >
                                  {p.alias} - {p.modelo} [{statusLabel}]
                                </option>
                              );
                            })
                          )}
                          <option value="Maquila Externa" className="text-emerald-700 font-bold">
                            🟢 Maquila Externa / Servicio Externo
                          </option>
                        </select>
                      </div>

                      {/* BOTÓN PRINCIPAL: DESHABILITADO SI LA MÁQUINA ESTÁ OCUPADA (REQ 1) */}
                      {isBusy ? (
                        <button
                          disabled={true}
                          className="w-full py-2 px-3 rounded-xl bg-[#F0EEE7] text-[#4B4450]/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#CDC3D2] cursor-not-allowed shadow-none"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-[#BA1A1A]" />
                          <span>Máquina ocupada. Selecciona una impresora libre</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendToManufacturing(order)}
                          className="w-full py-2 px-3 rounded-xl bg-[#6D3ACD] hover:bg-[#350463] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs active:translate-y-0.5 cursor-pointer"
                        >
                          <span>Mandar a {currentSelectedPrinter.split(' ')[0]}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* COLUMNA 2: En Fabricación (REQ 4)                        */}
        {/* ======================================================== */}
        <div className="flex flex-col gap-3 bg-[#FAF7F0] p-3 rounded-2xl border border-[#CDC3D2]/30 min-h-[500px]">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#86B100] animate-pulse" />
              <h2 className="text-sm font-bold text-[#350463]">En Fabricación</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] text-xs font-bold">
              {manufacturingOrders.length} {manufacturingOrders.length === 1 ? 'orden' : 'órdenes'}
            </span>
          </div>

          {manufacturingOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col gap-2.5 border-2 border-[#6D3ACD]/30 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#350463] text-white font-bold">
                  {order.folio}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E3F00] bg-[#C0F441] px-2 py-0.5 rounded-full">
                  <RotateCcw className="w-3 h-3 animate-spin" />
                  {order.assignedPrinter.includes('Bambu') || order.assignedPrinter.includes('IMP-01')
                    ? 'En IMP-01'
                    : order.assignedPrinter.includes('IMP-02')
                    ? 'En IMP-02'
                    : order.assignedPrinter.includes('Resina')
                    ? 'En Resina'
                    : 'En Maquila'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] text-[#4B4450] uppercase tracking-wider font-semibold">
                  {order.clientName}
                </span>
                <h3 className="text-sm font-bold text-[#1C1C18] leading-snug">{order.title}</h3>
              </div>

              {/* CONTENEDOR VISUAL CON BOTÓN FLOTANTE O BOTÓN DE ADJUNTAR (REQ 4) */}
              {order.imageUrl ? (
                <div className="w-full h-32 rounded-xl overflow-hidden relative group bg-[#F0EEE7]">
                  <img src={order.imageUrl} alt={order.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-[#350463]/80 backdrop-blur-xs text-white font-mono text-[10px]">
                    PLA / PETG Lote
                  </div>

                  {/* BOTÓN FLOTANTE TIPO LÁPIZ SOBRE LA IMAGEN */}
                  <button
                    onClick={() => {
                      setEditingImageOrder(order);
                      setCustomImageUrl(order.imageUrl || '');
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-white/95 text-[#350463] text-[11px] font-bold shadow-md hover:bg-[#350463] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Cambiar Foto / Subir Render</span>
                  </button>
                </div>
              ) : (
                <div className="w-full py-4 border-2 border-dashed border-[#CDC3D2] rounded-xl bg-[#FAF7F0] flex flex-col items-center justify-center gap-1 text-center p-2">
                  <span className="text-[11px] text-[#4B4450]">Orden sin render o maquila</span>
                  <button
                    onClick={() => {
                      setEditingImageOrder(order);
                      setCustomImageUrl('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#EADDFB] hover:bg-[#D2BCFF] text-[#350463] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adjuntar Foto de Referencia</span>
                  </button>
                </div>
              )}

              {/* Progress Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#4B4450] font-medium">{order.progressPercent}% completado</span>
                  <span className="font-bold text-[#350463] font-mono">
                    {order.remainingTimeText || 'Restan ~1h 40m'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F0EEE7] overflow-hidden">
                  <div
                    className="h-full bg-[#86B100] rounded-full transition-all duration-500"
                    style={{ width: `${order.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* BOTÓN DE EDITAR DETALLES (REQ 4) */}
              <div className="flex items-center justify-between pt-0.5">
                <button
                  onClick={() => handleOpenEditDetails(order)}
                  className="px-2.5 py-1 rounded-lg border border-[#CDC3D2] hover:border-[#6D3ACD] text-[11px] font-bold text-[#4B4450] hover:text-[#350463] hover:bg-[#FAF7F0] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-[#6D3ACD]" />
                  <span>✏️ Editar Detalles</span>
                </button>
                <span className="text-[10px] text-[#4B4450] font-mono">
                  {order.filamentUsedGrams}g estim.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  onClick={() => setSelectedOrderForFinish(order)}
                  className="w-full py-2 px-3 rounded-xl bg-[#350463] hover:bg-[#4C237A] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ring-2 ring-[#6D3ACD]/20 active:translate-y-0.5"
                >
                  <Package className="w-4 h-4 text-[#C0F441]" />
                  <span>Finalizar e Impactar Inventario</span>
                </button>

                <button
                  onClick={() => onOpenFailureModal(order)}
                  className="w-full py-1.5 px-2 rounded-lg bg-[#FAF7F0] hover:bg-[#FFDAD6] text-[#4B4450] hover:text-[#BA1A1A] text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Reportar Falla / Merma</span>
                </button>
              </div>

              {/* MICRO-MODAL OVERLAY (Inventory sync confirmation) */}
              {selectedOrderForFinish?.id === order.id && (
                <div className="mt-2 bg-white rounded-2xl border-2 border-[#6D3ACD] p-3.5 shadow-xl flex flex-col gap-2.5 z-20 animate-in fade-in zoom-in-95">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EADDFB] text-[#350463] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-bold text-[#350463]">
                        Confirmar Finalización de {order.folio}
                      </span>
                      <span className="text-[10px] text-[#4B4450]">
                        Sincronización automática de inventario
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FAF7F0] text-[11px] text-[#1C1C18] border border-[#E5E2DB] leading-snug">
                    📦 <strong>Impacto:</strong> Se descontarán{' '}
                    <strong>{order.filamentUsedGrams}g de filamento</strong> del inventario y se sumarán{' '}
                    <strong>{order.printHours} hrs</strong> al odómetro de {order.assignedPrinter}.
                  </div>

                  <div className="flex flex-col sm:flex-row gap-1.5 pt-0.5">
                    <button
                      onClick={() => {
                        finishOrder(order.id);
                        setSelectedOrderForFinish(null);
                        showToast('Impresión Exitosa', `Orden ${order.folio} pasó a fase de Post-Proceso`, 'success');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Sí, Impresión Exitosa</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedOrderForFinish(null);
                        onOpenFailureModal(order);
                      }}
                      className="py-1.5 px-2 rounded-xl border border-[#CDC3D2] hover:bg-[#F0EEE7] text-[#1C1C18] text-xs font-semibold transition-all flex items-center justify-center cursor-pointer"
                    >
                      <span>Hubo Error / Merma</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ======================================================== */}
        {/* COLUMNA 3: Post-Proceso (REQ 5)                          */}
        {/* ======================================================== */}
        <div className="flex flex-col gap-3 bg-[#FAF7F0] p-3 rounded-2xl border border-[#CDC3D2]/30 min-h-[500px]">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8656E8]" />
              <h2 className="text-sm font-bold text-[#350463]">Post-Proceso</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#E5E2DB] text-[#1C1C18] text-xs font-bold">
              {postprocessOrders.length} {postprocessOrders.length === 1 ? 'orden' : 'órdenes'}
            </span>
          </div>

          {postprocessOrders.map((order) => {
            const currentTasks = orderTasks[order.id] || [
              { id: 'c1', text: 'Retirar soportes de árbol', done: false, assignedTo: 'Operador Principal' },
              { id: 'c2', text: 'Depilar vinil / Acabado fino', done: false, assignedTo: 'Auxiliar de Taller' },
              { id: 'c3', text: 'Limpieza con alcohol isopropílico', done: false, assignedTo: 'Operador Principal' },
            ];

            const currentOperator = order.assignedOperator || 'Operador Principal';
            const finishHours = order.finishLaborHours ?? 0.5;

            return (
              <div
                key={order.id}
                className="bg-white p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col gap-2.5 border border-[#CDC3D2]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F0EEE7] text-[#1C1C18] font-bold">
                    {order.folio}
                  </span>

                  {/* ASIGNACIÓN DE RESPONSABLE CON NOMBRE Y APELLIDO (REQ 2) */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EADDFB]/70 border border-[#6D3ACD]/30 text-[11px] font-bold text-[#350463]">
                      <User className="w-3 h-3 text-[#6D3ACD]" />
                      <span>{currentOperator}</span>
                    </div>
                    <select
                      value={currentOperator}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM_NAME') {
                          setCustomCollaboratorModal({ orderId: order.id });
                        } else {
                          updateOrder(order.id, { assignedOperator: val });
                          showToast('Responsable Asignado', `${val} asignado a ${order.folio}`, 'info');
                        }
                      }}
                      className="text-[11px] font-bold text-[#350463] bg-white hover:bg-[#FAF7F0] p-0.5 rounded border border-[#CDC3D2]/40 focus:outline-none cursor-pointer"
                      title="Cambiar responsable"
                    >
                      {collaborators.map((c) => (
                        <option key={c} value={c}>
                          👤 {c}
                        </option>
                      ))}
                      <option value="CUSTOM_NAME">✍️ Asignar otro nombre...</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] text-[#4B4450] uppercase tracking-wider font-semibold">
                    {order.clientName}
                  </span>
                  <h3 className="text-sm font-bold text-[#1C1C18] leading-snug">{order.title}</h3>
                </div>

                {order.imageUrl && (
                  <div className="w-full h-20 rounded-xl overflow-hidden relative">
                    <img src={order.imageUrl} alt={order.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* TAREAS DINÁMICAS Y PERSONALIZADAS (REQ 5) */}
                <div className="flex flex-col gap-1.5 py-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-[#4B4450] tracking-wider">
                    Checklist de Acabado:
                  </span>

                  {currentTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-1 group">
                      <label
                        onClick={() => toggleCheckItem(order.id, t.id)}
                        className="flex items-center gap-2 cursor-pointer select-none flex-1"
                      >
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                            t.done ? 'bg-[#350463] text-[#C0F441]' : 'border border-[#CDC3D2]'
                          }`}
                        >
                          {t.done && <CheckCircle className="w-3.5 h-3.5" />}
                        </span>
                        <span className={`text-xs ${t.done ? 'line-through text-[#4B4450]/70' : 'text-[#1C1C18]'}`}>
                          {t.text}
                        </span>
                      </label>

                      {/* Selector individual de responsable por tarea (REQ 2) */}
                      <select
                        value={t.assignedTo || currentOperator}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'CUSTOM_TASK_NAME') {
                            setCustomCollaboratorModal({ orderId: order.id, taskId: t.id });
                          } else {
                            setOrderTasks((prev) => ({
                              ...prev,
                              [order.id]: (prev[order.id] || []).map((task) =>
                                task.id === t.id ? { ...task, assignedTo: val } : task
                              ),
                            }));
                          }
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#F0EEE7] hover:bg-[#EADDFB]/60 text-[#4B4450] font-semibold border border-[#CDC3D2]/40 focus:outline-none cursor-pointer"
                        title="Asignar responsable a esta tarea"
                      >
                        {collaborators.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="General">General</option>
                        <option value="CUSTOM_TASK_NAME">✍️ Otro...</option>
                      </select>

                      {/* Remove custom task if added */}
                      {t.id.startsWith('task-') && (
                        <button
                          onClick={() => handleDeleteTask(order.id, t.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded transition-opacity"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* FORMULARIO AGREGAR NUEVA TAREA */}
                  {showNewTaskForm[order.id] ? (
                    <div className="mt-1 p-2 rounded-xl bg-[#FAF7F0] border border-[#E5E2DB] flex flex-col gap-1.5">
                      <input
                        type="text"
                        placeholder="Ej. Soldar tira LED USB, Pegar imanes 6x3mm..."
                        value={newActivityInputs[order.id]?.text || ''}
                        onChange={(e) =>
                          setNewActivityInputs((prev) => ({
                            ...prev,
                            [order.id]: {
                              text: e.target.value,
                              assignee: prev[order.id]?.assignee || 'Carlos R.',
                            },
                          }))
                        }
                        className="w-full px-2 py-1 bg-white border border-[#CDC3D2] rounded-lg text-xs"
                      />
                      <div className="flex items-center justify-between gap-1">
                        <select
                          value={newActivityInputs[order.id]?.assignee || 'Carlos R.'}
                          onChange={(e) =>
                            setNewActivityInputs((prev) => ({
                              ...prev,
                              [order.id]: {
                                text: prev[order.id]?.text || '',
                                assignee: e.target.value,
                              },
                            }))
                          }
                          className="text-[10px] p-1 rounded-lg border border-[#CDC3D2] bg-white font-semibold"
                        >
                          {collaborators.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="General">General</option>
                        </select>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setShowNewTaskForm((prev) => ({ ...prev, [order.id]: false }))}
                            className="px-2 py-1 text-[10px] text-[#4B4450] hover:bg-[#E5E2DB] rounded-lg font-bold"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleAddNewTask(order.id)}
                            className="px-2 py-1 text-[10px] bg-[#350463] text-white rounded-lg font-bold"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewTaskForm((prev) => ({ ...prev, [order.id]: true }))}
                      className="mt-1 py-1 px-2 rounded-lg border border-dashed border-[#CDC3D2] hover:border-[#6D3ACD] text-[11px] font-bold text-[#6D3ACD] hover:bg-[#EADDFB]/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Nueva Tarea / Ensamble</span>
                    </button>
                  )}
                </div>

                {/* REGISTRO DE HORAS DE MANO DE OBRA (REQ 5) */}
                <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5E2DB] flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#4B4450]">Tiempo invertido en acabado:</span>
                    <span className="text-[10px] text-[#86B100] font-semibold">Impacta costo operativo real</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateLaborHours(order, finishHours - 0.5)}
                      className="w-6 h-6 rounded-lg bg-white border border-[#CDC3D2] font-bold text-xs hover:bg-[#E5E2DB] flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="40"
                      value={finishHours}
                      onChange={(e) => handleUpdateLaborHours(order, parseFloat(e.target.value) || 0.1)}
                      className="w-12 text-center py-0.5 bg-white border border-[#CDC3D2] rounded-lg text-xs font-mono font-bold text-[#350463]"
                    />
                    <span className="text-xs text-[#4B4450] font-bold">hrs</span>
                    <button
                      onClick={() => handleUpdateLaborHours(order, finishHours + 0.5)}
                      className="w-6 h-6 rounded-lg bg-white border border-[#CDC3D2] font-bold text-xs hover:bg-[#E5E2DB] flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Botón avanzar a logística */}
                <button
                  onClick={() => {
                    moveOrderStatus(order.id, 'logistics');
                    showToast('Fase Completada', `Orden ${order.folio} enviada a Logística y Cobranza`, 'success');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#6D3ACD] hover:bg-[#350463] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:translate-y-0.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Pasar a Empaque y Envío</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* COLUMNA 4: Logística y Cobranza (REQ 6)                  */}
        {/* ======================================================== */}
        <div className="flex flex-col gap-3 bg-[#FAF7F0] p-3 rounded-2xl border border-[#CDC3D2]/30 min-h-[500px]">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E3F00]" />
              <h2 className="text-sm font-bold text-[#350463]">Logística y Cobranza</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#E5E2DB] text-[#1C1C18] text-xs font-bold">
              {activeLogisticsOrders.length} {activeLogisticsOrders.length === 1 ? 'orden' : 'órdenes'}
            </span>
          </div>

          {activeLogisticsOrders.length === 0 && (
            <div className="p-6 text-center text-xs text-[#4B4450] bg-white rounded-2xl border border-dashed border-[#CDC3D2] flex flex-col items-center gap-2">
              <CheckCircle className="w-6 h-6 text-[#86B100]" />
              <span className="font-semibold">No hay órdenes pendientes de despacho</span>
              <span className="text-[11px] text-[#4B4450]/80">Todas las entregas han sido cerradas satisfactoriamente</span>
            </div>
          )}

          {activeLogisticsOrders.map((order) => {
            const hasPending = order.pendingBalance > 0;
            const isClosing = closingOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col gap-2.5 border border-[#CDC3D2]/30 duration-300 ${
                  isClosing ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F0EEE7] text-[#1C1C18] font-bold">
                    {order.folio}
                  </span>
                  <span className="text-[11px] text-[#6D3ACD] font-bold">
                    {order.deliveryType === 'uber_flash'
                      ? 'Envío Local Uber Flash'
                      : 'Recolección en Taller'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] text-[#4B4450] uppercase tracking-wider font-semibold">
                    {order.clientName}
                  </span>
                  <h3 className="text-sm font-bold text-[#1C1C18] leading-snug">{order.title}</h3>
                </div>

                {/* GUÍA DE ENVÍO VINCULADA O BOTÓN ADJUNTAR (REQ 3) */}
                {order.shippingTrackingGuide ? (
                  <div className="p-2 rounded-xl bg-[#EADDFB]/50 border border-[#6D3ACD]/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[#350463] min-w-0 pr-1">
                      <Truck className="w-3.5 h-3.5 text-[#6D3ACD] shrink-0" />
                      <span className="font-bold truncate">Guía: {order.shippingTrackingGuide}</span>
                    </div>
                    <button
                      onClick={() => handleOpenDispatchModal(order, 'guia')}
                      className="text-[10px] text-[#6D3ACD] font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      Editar / Ver
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenDispatchModal(order, 'guia')}
                    className="py-1 px-2 rounded-lg border border-dashed border-[#CDC3D2] hover:border-[#6D3ACD] text-[11px] font-bold text-[#4B4450] hover:text-[#350463] hover:bg-[#FAF7F0] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Package className="w-3 h-3 text-[#6D3ACD]" />
                    <span>📦 Pegar / Subir Guía de Envío</span>
                  </button>
                )}

                {/* SEMÁFORO DE SALDO O BADGE VERDE 100% PAGADO */}
                {hasPending ? (
                  <div className="p-2.5 rounded-xl bg-[#FFE4DE] text-[#93000A] flex flex-col gap-0.5 border border-[#FFCDD2]">
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Saldo Pendiente: ${order.pendingBalance.toFixed(2)} MXN</span>
                    </div>
                    <span className="text-[10px] text-[#93000A]/80">
                      Liquidar previo a entrega con mensajero
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C0F441] text-[#2E3F00] text-xs font-bold self-start shadow-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>✔️ 100% Pagado</span>
                  </div>
                )}

                {/* ACCIONES: REGISTRAR PAGO, TICKET Y MARCAR ENTREGADO */}
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {hasPending ? (
                      <button
                        onClick={() => onOpenLiquidationModal(order)}
                        className="py-2 px-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E5E2DB] text-[#1C1C18] text-xs font-bold transition-all flex items-center justify-center gap-1 border border-[#CDC3D2]/40 cursor-pointer"
                      >
                        <span>Registrar Pago</span>
                      </button>
                    ) : (
                      <div className="py-2 px-2 rounded-xl bg-[#F0EEE7] text-[#2E3F00] text-xs font-bold flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 text-[#86B100]" />
                        <span>Liquidado</span>
                      </div>
                    )}

                    {/* BOTÓN TICKET / REMISIÓN (REQ 3: ABRE MODAL DESPACHO EN PESTAÑA TICKET) */}
                    <button
                      onClick={() => handleOpenDispatchModal(order, 'ticket')}
                      className="py-2 px-2 rounded-xl bg-[#350463] hover:bg-[#4C237A] text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#C0F441]" />
                      <span>🏷️ Ticket / Remisión</span>
                    </button>
                  </div>

                  {/* REPARACIÓN CRÍTICA: BOTÓN MARCAR COMO ENTREGADO Y CERRAR */}
                  <button
                    onClick={() => handleDeliverAndClose(order)}
                    disabled={isClosing}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-bold shadow-[0_3px_0_#86B100] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar como Entregado y Cerrar</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* HISTÓRICO DE ENTREGADAS TOGGLE */}
          {deliveredHistoryOrders.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#CDC3D2]/30">
              <button
                onClick={() => setShowDeliveredHistory(!showDeliveredHistory)}
                className="w-full py-1.5 px-2 rounded-xl bg-[#F0EEE7] hover:bg-[#E5E2DB] text-[#4B4450] text-xs font-bold flex items-center justify-between transition-colors"
              >
                <span>📦 Histórico de Órdenes Entregadas ({deliveredHistoryOrders.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDeliveredHistory ? 'rotate-180' : ''}`} />
              </button>

              {showDeliveredHistory && (
                <div className="mt-2 flex flex-col gap-1.5 animate-in fade-in">
                  {deliveredHistoryOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-2 rounded-xl bg-white border border-[#E5E2DB] text-[11px] flex items-center justify-between text-[#4B4450]"
                    >
                      <div>
                        <strong className="text-[#350463] font-mono mr-1.5">{o.folio}</strong>
                        <span>{o.clientName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#C0F441] text-[#2E3F00] font-bold text-[10px]">
                        Entregado
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DRAWER 1: AJUSTAR TIEMPO DE MÁQUINA (REQ 2)              */}
      {/* ======================================================== */}
      {adjustingMachineId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            <div>
              <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#6D3ACD]" />
                  <h3 className="font-extrabold text-base text-[#350463]">
                    Ajustar Tiempo: {adjustingMachineId}
                  </h3>
                </div>
                <button
                  onClick={() => setAdjustingMachineId(null)}
                  className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs text-[#4B4450] leading-relaxed">
                  Modifica la estimación de tiempo restante o la hora prevista de entrega del lote en curso:
                </p>

                {/* Quick buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[-30, -15, 15, 30].map((delta) => (
                    <button
                      key={delta}
                      onClick={() => handleAdjustMachineTime(adjustingMachineId, delta)}
                      className="py-2 px-1 rounded-xl bg-[#FAF7F0] hover:bg-[#EADDFB] border border-[#CDC3D2]/40 text-xs font-bold text-[#350463] text-center cursor-pointer transition-colors"
                    >
                      {delta > 0 ? `+${delta}m` : `${delta}m`}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-[#1C1C18] block">Hora Estimada de Finalización</label>
                  <input
                    type="text"
                    value={customEndTimeInput}
                    onChange={(e) => setCustomEndTimeInput(e.target.value)}
                    placeholder="Ej. 3:45 PM o Fin: 5:10 PM"
                    className="w-full px-3 py-2 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex gap-2 shrink-0">
              <button
                onClick={() => setAdjustingMachineId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#FAF7F0] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleApplyCustomMachineTime(adjustingMachineId)}
                className="flex-1 py-2.5 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-xs font-bold text-[#2E3F00] cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER 2: GESTIÓN DE FOTO / SUBIR RENDER (REQ 4)         */}
      {/* ======================================================== */}
      {editingImageOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            <div>
              <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#6D3ACD]" />
                  <h3 className="font-extrabold text-base text-[#350463]">
                    Foto de Orden {editingImageOrder.folio}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingImageOrder(null)}
                  className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs text-[#4B4450]">
                  Carga una fotografía local de la pieza en la cama o pega el enlace URL directo del render:
                </p>

                <div className="space-y-3">
                  {/* Opción A: Archivo local */}
                  <div className="p-4 border-2 border-dashed border-[#CDC3D2] hover:border-[#6D3ACD] rounded-2xl text-center bg-[#FAF7F0] relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                      <Upload className="w-6 h-6 text-[#6D3ACD]" />
                      <span className="text-xs font-bold text-[#350463]">Seleccionar Foto desde el Dispositivo</span>
                      <span className="text-[10px] text-[#4B4450]">JPG, PNG, WebP o captura de taller</span>
                    </div>
                  </div>

                  {/* Opción B: URL */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-bold text-[#1C1C18]">O Pegar URL de Imagen / Render:</label>
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/render.jpg"
                      className="w-full px-3 py-2 bg-white border border-[#CDC3D2] rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex gap-2 shrink-0">
              <button
                onClick={() => setEditingImageOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#FAF7F0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveImageUrl}
                className="flex-1 py-2.5 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-bold shadow-xs cursor-pointer"
              >
                Guardar Imagen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER 3: EDITAR DETALLES TÉCNICOS (REQ 4)               */}
      {/* ======================================================== */}
      {editingDetailsOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#6D3ACD]" />
                <h3 className="font-extrabold text-base text-[#350463]">
                  Editar Detalles: {editingDetailsOrder.folio}
                </h3>
              </div>
              <button
                onClick={() => setEditingDetailsOrder(null)}
                className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1C1C18]">Máquina Asignada</label>
                <select
                  value={detailsPrinter}
                  onChange={(e) => setDetailsPrinter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CDC3D2] rounded-xl text-xs font-semibold"
                >
                  <option value="IMP-01 (Bambu A1 Combo)">IMP-01 (Bambu A1 Combo)</option>
                  <option value="IMP-02 (FDM)">IMP-02 (FDM)</option>
                  <option value="Impresora Resina SLA">Impresora Resina SLA</option>
                  <option value="Maquila Externa">Maquila Externa</option>
                </select>
              </div>

              {/* Parámetros de Ficha Técnica (REQ 4) */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#1C1C18]">Piezas</label>
                  <input
                    type="number"
                    min={1}
                    value={detailsPieces}
                    onChange={(e) => setDetailsPieces(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#1C1C18]">Placas</label>
                  <input
                    type="number"
                    min={1}
                    value={detailsPlates}
                    onChange={(e) => setDetailsPlates(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#1C1C18]">Horas</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.5}
                    value={detailsPrintHours}
                    onChange={(e) => setDetailsPrintHours(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-[#1C1C18]">Progreso de Impresión</label>
                  <span className="font-mono font-bold text-[#350463]">{detailsProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={detailsProgress}
                  onChange={(e) => setDetailsProgress(parseInt(e.target.value))}
                  className="w-full accent-[#350463]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1C1C18]">Instrucciones Especiales de Taller (Ficha Técnica)</label>
                <textarea
                  rows={2}
                  value={detailsWorkshopNotes}
                  onChange={(e) => setDetailsWorkshopNotes(e.target.value)}
                  placeholder="Costura alineada, orientación en cama, desprendimiento..."
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1C1C18]">Notas Técnicas Generales</label>
                <textarea
                  rows={2}
                  value={detailsNotes}
                  onChange={(e) => setDetailsNotes(e.target.value)}
                  placeholder="Ajustes de boquilla, retracción, temperatura..."
                  className="w-full p-2.5 bg-white border border-[#CDC3D2] rounded-xl text-xs text-[#1C1C18]"
                />
              </div>
            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex gap-2 shrink-0">
              <button
                onClick={() => setEditingDetailsOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#FAF7F0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditDetails}
                className="flex-1 py-2.5 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-bold shadow-xs cursor-pointer active:translate-y-0.5 transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: DESPACHO, GUÍA DE ENVÍO Y TICKET (REQ 3)         */}
      {/* ======================================================== */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-purple-100 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            {/* Header Maestro Estandarizado */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center shadow-xs">
                  <Truck className="w-5 h-5 text-[#6D3ACD]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#350463]">
                    Despacho, Guía de Envío y Ticket
                  </h3>
                  <span className="text-[11px] text-[#4B4450] font-mono">
                    Folio {dispatchModalOrder.folio} • {dispatchModalOrder.clientName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="p-2 hover:bg-[#E5E2DB] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pestañas de Navegación del Drawer */}
            <div className="px-5 pt-3 pb-2 border-b border-[#F0EEE7] bg-white flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDispatchTab('guia')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dispatchTab === 'guia'
                    ? 'bg-[#350463] text-white shadow-xs'
                    : 'bg-[#FAF7F0] text-[#4B4450] hover:text-[#1C1C18] border border-[#CDC3D2]/40'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Guía de Envío</span>
              </button>

              <button
                type="button"
                onClick={() => setDispatchTab('ticket')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dispatchTab === 'ticket'
                    ? 'bg-[#350463] text-white shadow-xs'
                    : 'bg-[#FAF7F0] text-[#4B4450] hover:text-[#1C1C18] border border-[#CDC3D2]/40'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Ticket / Packing Slip</span>
              </button>
            </div>

            {/* CUERPO DEL DRAWER CON SCROLL */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {dispatchTab === 'guia' ? (
                <>
                  {/* Selector de Servicio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1C1C18]">
                      Servicio de Mensajería / Despacho:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'Uber Flash', label: 'Uber Flash', icon: '🚗' },
                        { id: 'Mercado Envíos', label: 'Mercado Envíos', icon: '📦' },
                        { id: 'Amazon Logistics', label: 'Amazon Logistics', icon: '🛒' },
                        { id: 'DHL / Estafeta', label: 'DHL / Estafeta', icon: '✈️' },
                        { id: 'Recolección en Mostrador', label: 'Recolección Mostrador', icon: '🏪' },
                      ].map((svc) => (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => setShippingServiceInput(svc.id)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                            shippingServiceInput === svc.id
                              ? 'bg-[#EADDFB] border-[#6D3ACD] text-[#350463] font-bold shadow-xs'
                              : 'bg-white border-[#CDC3D2]/50 text-[#4B4450] hover:bg-[#FAF7F0]'
                          }`}
                        >
                          <span className="text-sm">{svc.icon}</span>
                          <span className="truncate leading-tight">{svc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input de Guía / Código / Enlace */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1C1C18] flex items-center justify-between">
                      <span>Número de Guía / Código de Rastreo / Enlace Uber:</span>
                      {trackingGuideInput && (
                        <button
                          type="button"
                          onClick={() => {
                            if (trackingGuideInput.startsWith('http')) {
                              window.open(trackingGuideInput, '_blank');
                            } else {
                              window.open(
                                `https://www.google.com/search?q=rastreo+${encodeURIComponent(
                                  trackingGuideInput
                                )}`,
                                '_blank'
                              );
                            }
                          }}
                          className="text-[11px] text-[#6D3ACD] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir Rastreo en Pestaña Nueva</span>
                        </button>
                      )}
                    </label>
                    <input
                      type="text"
                      value={trackingGuideInput}
                      onChange={(e) => setTrackingGuideInput(e.target.value)}
                      placeholder="Ej. UBER-FL-930281, ML-74920199 o https://..."
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CDC3D2] rounded-xl text-xs font-mono font-bold text-[#350463] focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/30"
                    />
                  </div>

                  {/* Zona de Carga de Archivo (PDF o Imagen de la Guía) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1C1C18] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-[#6D3ACD]" />
                        <span>Subir PDF o Imagen de la Guía de Envío:</span>
                      </span>
                      {guideProofFileName && (
                        <span className="text-[11px] font-bold text-[#86B100] flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {guideProofFileName}
                        </span>
                      )}
                    </label>

                    <div className="relative border-2 border-dashed border-[#CDC3D2] hover:border-[#6D3ACD] rounded-2xl p-4 text-center bg-[#FAF7F0]/70 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setGuideProofFileName(f.name);
                            showToast('Guía Cargada', `${f.name} adjuntada al despacho`, 'info');
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                        <div className="w-9 h-9 rounded-xl bg-[#EADDFB] text-[#350463] flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-[#350463]">
                          {guideProofFileName
                            ? `Archivo actual: ${guideProofFileName}`
                            : 'Haz clic o arrastra la etiqueta / guía aquí'}
                        </span>
                        <span className="text-[10px] text-[#4B4450]">
                          Formatos aceptados: PDF, JPG, PNG de Mercado Envíos, DHL, Uber o guía impresa
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Entrega */}
                  <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] text-xs text-[#4B4450] space-y-1">
                    <div className="flex justify-between">
                      <span>Destino del Pedido:</span>
                      <strong className="text-[#1C1C18]">CDMX (Área Metropolitana)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Estatus Cobro:</span>
                      <strong className={dispatchModalOrder.pendingBalance === 0 ? 'text-[#2E3F00]' : 'text-[#BA1A1A]'}>
                        {dispatchModalOrder.pendingBalance === 0 ? '✔️ 100% Pagado' : `Saldo Pendiente: $${dispatchModalOrder.pendingBalance.toFixed(2)}`}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDispatchModalOrder(null)}
                      className="flex-1 py-2.5 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#FAF7F0]"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDispatchGuide}
                      className="flex-1 py-2.5 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-[#2E3F00] text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar Datos de Guía</span>
                    </button>
                  </div>
                </>
              ) : (
                /* PESTAÑA 2: TICKET DE EMPAQUE / REMISIÓN TÉRMICA */
                <>
                  {/* Previsualización del Ticket Térmico 80mm */}
                  <div className="p-5 font-mono text-[11px] text-[#1C1C18] space-y-2.5 bg-white border border-dashed border-[#CDC3D2] rounded-2xl shadow-inner">
                    <div className="text-center pb-2 border-b border-[#E5E2DB]">
                      <strong className="text-sm tracking-tight block text-[#350463]">KiMO 3D STUDIO</strong>
                      <span className="text-[10px] text-[#4B4450] block">Taller de Impresión 3D & Prototipado</span>
                      <span className="text-[10px] text-[#4B4450] block">CDMX, México • RFC: K3D-240115-AA1</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Folio:</span>
                        <strong>{dispatchModalOrder.folio}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span>{new Date().toLocaleDateString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cliente CDMX:</span>
                        <span className="truncate max-w-[200px] font-bold">{dispatchModalOrder.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modalidad Despacho:</span>
                        <span>{shippingServiceInput || dispatchModalOrder.shippingService || 'Mostrador Taller'}</span>
                      </div>
                      {trackingGuideInput && (
                        <div className="flex justify-between text-[#6D3ACD] font-bold">
                          <span>No. Rastreo:</span>
                          <span>{trackingGuideInput}</span>
                        </div>
                      )}
                    </div>

                    <div className="py-2 border-t border-b border-[#E5E2DB] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Cant: {dispatchModalOrder.piecesCount}x Piezas</span>
                        <strong>${dispatchModalOrder.totalPrice.toFixed(2)} MXN</strong>
                      </div>
                      <div className="text-[10px] text-[#4B4450]">
                        {dispatchModalOrder.title}
                      </div>
                      {dispatchModalOrder.assignedOperator && (
                        <div className="text-[10px] text-[#350463]">
                          Operador Calidad: {dispatchModalOrder.assignedOperator}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between font-bold text-xs">
                        <span>Total Pedido:</span>
                        <strong>${dispatchModalOrder.totalPrice.toFixed(2)} MXN</strong>
                      </div>
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>Estatus Cobro:</span>
                        <span className={dispatchModalOrder.pendingBalance === 0 ? 'text-[#2E3F00]' : 'text-[#BA1A1A]'}>
                          {dispatchModalOrder.pendingBalance === 0 ? '✔️ 100% LIQUIDADO' : `SALDO: $${dispatchModalOrder.pendingBalance.toFixed(2)} MXN`}
                        </span>
                      </div>
                    </div>

                    {/* Simulación Gráfica de Código de Barras */}
                    <div className="pt-2 text-center flex flex-col items-center">
                      <div className="flex items-center gap-0.5 h-8">
                        {[...Array(32)].map((_, i) => (
                          <div
                            key={i}
                            className="bg-[#1C1C18] h-full"
                            style={{ width: `${(i % 3) + 1}px`, margin: '0 0.5px' }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] tracking-widest text-[#4B4450] mt-1 font-mono">
                        *{dispatchModalOrder.folio}*
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDispatchModalOrder(null)}
                      className="flex-1 py-2.5 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#FAF7F0]"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showToast('Imprimiendo Ticket', `Ticket de empaque enviado a impresora térmica 80mm`, 'success');
                        setDispatchModalOrder(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#350463] hover:bg-[#4C237A] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:translate-y-0.5"
                    >
                      <Printer className="w-4 h-4 text-[#C0F441]" />
                      <span>🖨️ Imprimir Ticket / Packing Slip</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: ASIGNACIÓN PERSONALIZADA DE RESPONSABLE (REQ 2)  */}
      {/* ======================================================== */}
      {customCollaboratorModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            <div>
              <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#6D3ACD]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#350463]">
                      Asignar Responsable
                    </h3>
                    <span className="text-[11px] text-[#4B4450]">Nombre de colaborador real</span>
                  </div>
                </div>
                <button
                  onClick={() => setCustomCollaboratorModal(null)}
                  className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-3">
                <label className="text-xs font-bold text-[#1C1C18] block">
                  Escribe el nombre y apellido del colaborador:
                </label>
                <input
                  type="text"
                  value={newCollaboratorName}
                  onChange={(e) => setNewCollaboratorName(e.target.value)}
                  placeholder="Ej. Roberto S., Valeria M., Mario G."
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CDC3D2] rounded-xl text-xs font-bold text-[#350463] focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomCollaborator();
                    }
                  }}
                />
                <span className="text-[11px] text-[#4B4450] block">
                  Se integrará al selector rápido de operadores del taller.
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCustomCollaboratorModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#FAF7F0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomCollaborator}
                className="flex-1 py-2.5 rounded-xl bg-[#C0F441] hover:bg-[#A5D721] text-xs font-bold text-[#2E3F00] shadow-xs cursor-pointer"
              >
                Guardar y Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: HISTÓRICO DE ÓRDENES ARCHIVADAS DEDICADO (REQ 4) */}
      {/* ======================================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-full shadow-2xl border-l border-purple-100 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            {/* Encabezado Maestro Estandarizado */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EADDFB] text-[#350463] flex items-center justify-center shadow-xs">
                  <Folder className="w-5 h-5 text-[#6D3ACD]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base lg:text-lg text-[#350463]">
                    Histórico de Órdenes Entregadas & Facturadas
                  </h3>
                  <span className="text-xs text-[#4B4450]">
                    Registro histórico y trazabilidad de despachos cerrados satisfactoriamente
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-[#E5E2DB] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CUERPO DEL DRAWER CON SCROLL */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Tarjetas KPI Superiores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] flex flex-col">
                  <span className="text-[10px] text-[#4B4450] uppercase font-bold tracking-wider">
                    Total Entregadas
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-extrabold text-[#350463]">
                      {allDeliveredOrders.length}
                    </span>
                    <span className="text-xs font-semibold text-[#4B4450]">órdenes</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#C0F441]/25 border border-[#C0F441]/50 flex flex-col">
                  <span className="text-[10px] text-[#2E3F00] uppercase font-bold tracking-wider">
                    Facturación Histórica
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-extrabold text-[#2E3F00]">
                      ${totalDeliveredRevenue.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-xs font-semibold text-[#2E3F00]">MXN</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#EADDFB]/50 border border-[#6D3ACD]/30 flex flex-col">
                  <span className="text-[10px] text-[#350463] uppercase font-bold tracking-wider">
                    Tiempo Promedio Entrega
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-extrabold text-[#350463]">
                      1.8
                    </span>
                    <span className="text-xs font-semibold text-[#350463]">días por orden</span>
                  </div>
                </div>
              </div>

              {/* Barra de Herramientas: Búsqueda y Filtros */}
              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#CDC3D2]/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B4450]" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="🔍 Buscar por cliente, folio COTZ o producto..."
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs text-[#1C1C18] border border-[#CDC3D2]/40 focus:outline-none focus:ring-2 focus:ring-[#6D3ACD]/30"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filtro por Fechas */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#CDC3D2]/40">
                    <span className="text-[11px] font-bold text-[#350463] px-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#6D3ACD]" />
                      <span>Rango:</span>
                    </span>
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'hoy', label: 'Hoy' },
                      { id: 'esta_semana', label: 'Esta Semana' },
                      { id: 'este_mes', label: 'Este Mes' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setHistoryDateRange(f.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          historyDateRange === f.id
                            ? 'bg-[#350463] text-white shadow-2xs'
                            : 'text-[#4B4450] hover:text-[#1C1C18]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Filtro por Tipo */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#CDC3D2]/40">
                    {[
                      { id: 'todas', label: 'Todas' },
                      { id: '3d', label: 'Impresión 3D' },
                      { id: 'maquila', label: 'Maquila' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setHistoryTypeFilter(t.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          historyTypeFilter === t.id
                            ? 'bg-[#C0F441] text-[#2E3F00] shadow-2xs'
                            : 'text-[#4B4450] hover:text-[#1C1C18]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TABLA DE REGISTROS HISTÓRICOS */}
              <div className="overflow-x-auto rounded-2xl border border-[#CDC3D2]/40 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F0] text-[#4B4450] text-[10px] uppercase font-bold tracking-wider border-b border-[#CDC3D2]/30">
                      <th className="py-2.5 px-3">Folio</th>
                      <th className="py-2.5 px-3">Fecha Entrega</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3">Responsable</th>
                      <th className="py-2.5 px-3 text-right">Total ($ MXN)</th>
                      <th className="py-2.5 px-3">Método / Guía</th>
                      <th className="py-2.5 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEE7]">
                    {filteredHistoryOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[#4B4450]">
                          No se encontraron órdenes entregadas coincidentes con los filtros.
                        </td>
                      </tr>
                    ) : (
                      filteredHistoryOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#350463]">
                            <span className="px-2 py-0.5 rounded bg-[#F0EEE7] border border-[#CDC3D2]/40">
                              {ord.folio}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#4B4450] font-mono text-[11px]">
                            {ord.deliveredAtDate || ord.deliveryDate || 'Reciente'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#1C1C18]">{ord.clientName}</span>
                              {ord.contactPerson && (
                                <span className="text-[10px] text-[#4B4450]">{ord.contactPerson}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col max-w-[200px]">
                              <span className="font-semibold text-[#1C1C18] truncate">{ord.title}</span>
                              <span className="text-[10px] text-[#4B4450] font-mono">
                                {ord.piecesCount} pz • {ord.category === '3d_print' ? '3D' : 'Maquila'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#350463] bg-[#EADDFB]/70 px-2 py-0.5 rounded-lg border border-[#6D3ACD]/20">
                              <User className="w-3 h-3 text-[#6D3ACD]" />
                              {ord.assignedOperator || 'Carlos R.'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-bold font-mono text-sm text-[#2E3F00]">
                              ${ord.totalPrice.toFixed(2)}
                            </span>
                            <span className="block text-[9px] text-[#86B100] font-bold">100% Pagado</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col text-[11px]">
                              <span className="font-semibold text-[#1C1C18]">
                                {ord.shippingService || (ord.deliveryType === 'uber_flash' ? 'Uber Flash' : 'Mostrador')}
                              </span>
                              {ord.shippingTrackingGuide && (
                                <span className="font-mono text-[10px] text-[#6D3ACD] font-bold truncate max-w-[130px]">
                                  {ord.shippingTrackingGuide}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setViewingHistoricalOrder(ord)}
                                className="px-2 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#EADDFB] text-[#350463] border border-[#CDC3D2]/40 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Ver detalles y cotización"
                              >
                                <FileText className="w-3 h-3 text-[#6D3ACD]" />
                                <span>Ver Cotización</span>
                              </button>

                              <button
                                onClick={() => handleOpenDispatchModal(ord, 'ticket')}
                                className="px-2 py-1 rounded-lg bg-[#350463] hover:bg-[#4C237A] text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Reimprimir ticket de entrega"
                              >
                                <Printer className="w-3 h-3 text-[#C0F441]" />
                                <span>Reimprimir Ticket</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Barra Inferior del Histórico */}
            <div className="px-6 py-3 border-t border-[#F0EEE7] bg-[#FAF7F0] flex items-center justify-between text-xs text-[#4B4450] shrink-0">
              <span>
                Mostrando <strong>{filteredHistoryOrders.length}</strong> de{' '}
                <strong>{allDeliveredOrders.length}</strong> órdenes entregadas archivadas
              </span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-[#350463] text-white font-bold text-xs hover:bg-[#4C237A] cursor-pointer"
              >
                Cerrar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: VER DETALLE / COTIZACIÓN DE ORDEN HISTÓRICA      */}
      {/* ======================================================== */}
      {viewingHistoricalOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-purple-100 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#C0F441] text-[#2E3F00] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#350463]">
                    Detalle de Cotización: {viewingHistoricalOrder.folio}
                  </h3>
                  <span className="text-[11px] text-[#4B4450]">{viewingHistoricalOrder.title}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingHistoricalOrder(null)}
                className="p-1.5 hover:bg-[#F0EEE7] rounded-xl text-[#4B4450] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Cliente */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4B4450]">Cliente:</span>
                  <strong className="text-[#1C1C18]">{viewingHistoricalOrder.clientName}</strong>
                </div>
                {viewingHistoricalOrder.contactPerson && (
                  <div className="flex justify-between">
                    <span className="text-[#4B4450]">Atención:</span>
                    <span>{viewingHistoricalOrder.contactPerson}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#4B4450]">Responsable de Taller:</span>
                  <strong className="text-[#350463]">{viewingHistoricalOrder.assignedOperator || 'Carlos R.'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4B4450]">Fecha de Entrega:</span>
                  <span>{viewingHistoricalOrder.deliveredAtDate || viewingHistoricalOrder.deliveryDate}</span>
                </div>
              </div>

              {/* Parámetros Técnicos */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E5E2DB] space-y-1 text-xs">
                <span className="font-bold text-[#350463] block">Especificaciones Técnicas:</span>
                <div className="flex justify-between">
                  <span>Impresora / Máquina:</span>
                  <strong>{viewingHistoricalOrder.assignedPrinter}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Horas de Impresión:</span>
                  <strong>{viewingHistoricalOrder.printHours} hrs</strong>
                </div>
                <div className="flex justify-between">
                  <span>Filamento Consumido:</span>
                  <strong>{viewingHistoricalOrder.filamentUsedGrams} g</strong>
                </div>
                <div className="flex justify-between">
                  <span>Piezas Fabricadas:</span>
                  <strong>{viewingHistoricalOrder.piecesCount} unidades</strong>
                </div>
              </div>

              {/* Desglose Económico */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2] space-y-1.5 text-xs">
                <span className="font-bold text-[#350463] block pb-1 border-b border-[#F0EEE7]">
                  Desglose Económico & Ganancia Neta:
                </span>
                <div className="flex justify-between text-[#4B4450]">
                  <span>Costo Filamento:</span>
                  <span>${(viewingHistoricalOrder.costFilament || 0).toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-[#4B4450]">
                  <span>Costo Energía CFE:</span>
                  <span>${(viewingHistoricalOrder.costCfe || 0).toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-[#4B4450]">
                  <span>Amortización Mantenimiento:</span>
                  <span>${(viewingHistoricalOrder.costMtto || 0).toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-[#4B4450]">
                  <span>Insumos y Mano de Obra:</span>
                  <span>${(viewingHistoricalOrder.costInsumos || 0).toFixed(2)} MXN</span>
                </div>
                <div className="pt-1 border-t border-[#F0EEE7] flex justify-between font-bold text-sm">
                  <span className="text-[#350463]">Total Cobrado:</span>
                  <span className="text-[#2E3F00] font-mono">${viewingHistoricalOrder.totalPrice.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-[#86B100]">
                  <span>Ganancia Neta Calculada:</span>
                  <span className="font-mono">+${(viewingHistoricalOrder.netProfit || 0).toFixed(2)} MXN</span>
                </div>
              </div>
            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => setViewingHistoricalOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-[#CDC3D2] text-xs font-bold text-[#4B4450] hover:bg-[#FAF7F0] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const ord = viewingHistoricalOrder;
                  setViewingHistoricalOrder(null);
                  handleOpenDispatchModal(ord, 'ticket');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#350463] hover:bg-[#4C237A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#C0F441]" />
                <span>Reimprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER 6: NOZZLE WEAR MAINTENANCE                        */}
      {/* ======================================================== */}
      {showNozzleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl border-l border-purple-100 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            <div>
              <div className="p-5 sm:p-6 border-b border-[#F0EEE7] flex items-center justify-between">
                <h3 className="text-base font-bold text-[#350463] flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#6D3ACD]" />
                  <span>Boquilla 0.4mm</span>
                </h3>
                <button
                  onClick={() => setShowNozzleModal(false)}
                  className="p-1.5 rounded-xl hover:bg-[#F0EEE7] text-[#4B4450] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-3 text-xs text-[#4B4450]">
                <p>
                  Uso acumulado: <strong>{settings.activePrinter.nozzleWearHours}</strong> de{' '}
                  <strong>{settings.activePrinter.nozzleMaxHours}</strong> horas recomendadas.
                </p>
                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#CDC3D2]/40 space-y-1">
                  <span className="font-bold text-[#350463] block">Estado de Desgaste</span>
                  <div className="w-full bg-[#E5E2DB] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        settings.activePrinter.nozzleWearHours / settings.activePrinter.nozzleMaxHours > 0.8
                          ? 'bg-[#BA1A1A]'
                          : 'bg-[#86B100]'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (settings.activePrinter.nozzleWearHours / settings.activePrinter.nozzleMaxHours) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-[#F0EEE7] bg-white space-y-2 shrink-0">
              <button
                onClick={() => {
                  updateSettings({
                    activePrinter: {
                      ...settings.activePrinter,
                      nozzleWearHours: 0,
                    },
                  });
                  setShowNozzleModal(false);
                  showToast('Boquilla Reiniciada', 'Odómetro de boquilla reseteado a 0h', 'success');
                }}
                className="w-full py-2.5 rounded-xl bg-[#C0F441] text-[#2E3F00] text-xs font-bold cursor-pointer hover:bg-[#A5D721] transition-all"
              >
                Registrar Boquilla Nueva (Reset a 0h)
              </button>
              <button
                onClick={() => setShowNozzleModal(false)}
                className="w-full py-2 rounded-xl border border-[#CDC3D2] text-xs text-[#4B4450] hover:bg-[#F0EEE7]"
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
