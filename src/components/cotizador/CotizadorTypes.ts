import { CotizadorModelItem, BedPlateType, AmsSlotItem } from '../../types';

export const QUICK_COLORS = [
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Negro', hex: '#1C1C18' },
  { name: 'Morado KiMO', hex: '#4C237A' },
  { name: 'Lavanda Pastel', hex: '#C3B1E1' },
  { name: 'Verde Oliva', hex: '#556B2F' },
  { name: 'Rojo Carmesí', hex: '#DC2626' },
  { name: 'Azul Eléctrico', hex: '#2563EB' },
  { name: 'Ámbar / Oro', hex: '#F59E0B' },
  { name: 'Gris Texturado', hex: '#64748B' },
];

export const MATERIAL_OPTIONS = [
  'PETG',
  'PLA',
  'PLA+',
  'TPU',
  'ABS',
  'ASA',
  'PC',
  'Resina',
  'Otro',
];

export const BED_PLATE_OPTIONS: { id: BedPlateType; label: string; desc: string }[] = [
  {
    id: 'textured_pei',
    label: 'Placa PEI Texturizada (Estándar)',
    desc: 'Acabado rugoso mate, máxima adherencia para PETG y PLA',
  },
  {
    id: 'smooth_pei',
    label: 'Placa PEI Lisa (Smooth)',
    desc: 'Acabado inferior brillante y totalmente plano',
  },
  {
    id: 'high_temp',
    label: 'Placa de Alta Temperatura',
    desc: 'Para filamentos técnicos (ABS/ASA/PC @ 80-100°C)',
  },
  {
    id: 'engineering_cold',
    label: 'Placa de Ingeniería / Fría',
    desc: 'Para materiales especiales y tolerancias mecánicas',
  },
];

export const WAREHOUSE_BOM_CATALOG: { id: string; sku: string; name: string; unitCost: number; category: string }[] = [];

export function createNewModelItem(index: number): CotizadorModelItem {
  return {
    id: `mod-${Date.now()}-${index}`,
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
    assignedPrinter: 'Bambu Lab A1 Combo',
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
    bomItems: [],
    customServices: [],
    desiredMarginPercent: 25,
    notes: '',
  };
}
