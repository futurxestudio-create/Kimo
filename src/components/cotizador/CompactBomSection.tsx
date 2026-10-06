import React, { useState } from 'react';
import { BomItem } from '../../types';
import { useWorkshop } from '../../context/WorkshopContext';
import { Package, Plus, Trash2, X, PlusCircle, Check } from 'lucide-react';

interface CompactBomSectionProps {
  bomItems: BomItem[];
  onChange: (items: BomItem[]) => void;
}

export const CompactBomSection: React.FC<CompactBomSectionProps> = ({ bomItems, onChange }) => {
  const { warehouseSupplies } = useWorkshop();
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(warehouseSupplies[0]?.id || '');
  const [insertQuantity, setInsertQuantity] = useState<number>(1);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual creation state
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualCost, setManualCost] = useState(5.0);

  const handleAddFromCatalog = () => {
    const catalogItem = warehouseSupplies.find((item) => item.id === selectedCatalogId);
    if (!catalogItem) return;

    const existingIndex = bomItems.findIndex((b) => b.name === catalogItem.name);
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...bomItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + insertQuantity,
      };
      onChange(updated);
    } else {
      const newItem: BomItem = {
        id: `bom-${Date.now()}`,
        name: catalogItem.name,
        quantity: Math.max(1, insertQuantity),
        unitCost: catalogItem.cost,
      };
      onChange([...bomItems, newItem]);
    }
  };

  const handleAddManual = () => {
    if (!manualName.trim()) return;
    const newItem: BomItem = {
      id: `bom-${Date.now()}`,
      name: manualName.trim(),
      quantity: Math.max(1, manualQty),
      unitCost: Math.max(0.1, manualCost),
    };
    onChange([...bomItems, newItem]);
    setManualName('');
    setManualQty(10);
    setManualCost(3.5);
    setShowManualForm(false);
  };

  const handleRemove = (id: string) => {
    onChange(bomItems.filter((b) => b.id !== id));
  };

  const handleUpdateQty = (id: string, newQty: number) => {
    onChange(
      bomItems.map((b) => (b.id === id ? { ...b, quantity: Math.max(1, newQty) } : b))
    );
  };

  const totalBomCost = bomItems.reduce((sum, b) => sum + b.quantity * b.unitCost, 0);

  return (
    <div className="flex flex-col gap-3.5">
      {/* BARRA COMPACTA DE INSERCIÓN RÁPIDA (REQ 6) */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Selector Desplegable con Catálogo del Almacén */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-[#4B4450] uppercase tracking-wider block mb-1">
            Insumo del Almacén
          </label>
          <select
            value={selectedCatalogId}
            onChange={(e) => setSelectedCatalogId(e.target.value)}
            disabled={warehouseSupplies.length === 0}
            className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#CDC3D2]/60 rounded-xl text-xs font-bold text-[#350463] focus:outline-none focus:ring-1 focus:ring-[#6D3ACD] disabled:opacity-50"
          >
            {warehouseSupplies.length === 0 ? (
              <option value="">Sin insumos registrados en almacén</option>
            ) : (
              warehouseSupplies.map((item) => (
                <option key={item.id} value={item.id}>
                  📦 {item.name} (${item.cost.toFixed(2)} MXN c/u) • {item.category}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Input numérico de cantidad */}
        <div className="w-full sm:w-28">
          <label className="text-[10px] font-bold text-[#4B4450] uppercase tracking-wider block mb-1">
            Cantidad a Usar
          </label>
          <input
            type="number"
            min={1}
            value={insertQuantity}
            onChange={(e) => setInsertQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#CDC3D2]/60 rounded-xl text-xs font-black font-mono text-[#350463] text-center focus:outline-none focus:ring-1 focus:ring-[#6D3ACD]"
          />
        </div>

        {/* Botón primario: Agregar Insumo */}
        <div className="sm:self-end">
          <button
            type="button"
            onClick={handleAddFromCatalog}
            className="w-full sm:w-auto px-4 py-2 bg-[#350463] hover:bg-[#4C237A] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-[#C0F441]" />
            <span>+ Agregar Insumo</span>
          </button>
        </div>

        {/* Botón secundario: Crear Insumo Manual */}
        <div className="sm:self-end">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full sm:w-auto px-3 py-2 bg-[#EADDFB] hover:bg-[#D2BCFF] text-[#350463] text-xs font-bold rounded-xl transition-all border border-[#6D3ACD]/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#6D3ACD]" />
            <span>+ Crear Manual</span>
          </button>
        </div>
      </div>

      {/* Formulario desplegable para insumo manual */}
      {showManualForm && (
        <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#6D3ACD]/30 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 text-xs animate-in fade-in">
          <div className="flex-1">
            <label className="text-[11px] font-bold text-[#1C1C18] block mb-0.5">
              Nombre / Descripción del Insumo Especial:
            </label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Ej. Balero cerámico 608RS, Bisagra mini latón..."
              className="w-full px-3 py-1.5 bg-white border border-[#CDC3D2] rounded-xl text-xs font-semibold text-[#1C1C18]"
            />
          </div>
          <div className="w-24">
            <label className="text-[11px] font-bold text-[#1C1C18] block mb-0.5">Cant:</label>
            <input
              type="number"
              min={1}
              value={manualQty}
              onChange={(e) => setManualQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-1.5 bg-white border border-[#CDC3D2] rounded-xl text-xs font-black font-mono text-[#350463] text-center"
            />
          </div>
          <div className="w-28">
            <label className="text-[11px] font-bold text-[#1C1C18] block mb-0.5">Costo Unit ($):</label>
            <input
              type="number"
              step="0.5"
              min={0.1}
              value={manualCost}
              onChange={(e) => setManualCost(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              className="w-full px-3 py-1.5 bg-white border border-[#CDC3D2] rounded-xl text-xs font-black font-mono text-[#350463] text-right"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-3 py-1.5 rounded-xl border border-[#CDC3D2] text-[#4B4450] font-bold hover:bg-[#E5E2DB]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddManual}
              className="px-4 py-1.5 rounded-xl bg-[#6D3ACD] text-white font-bold hover:bg-[#350463]"
            >
              Guardar Insumo
            </button>
          </div>
        </div>
      )}

      {/* LISTA DINÁMICA: ÚNICAMENTE INSUMOS AGREGADOS A LA COTIZACIÓN */}
      {bomItems.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-dashed border-[#CDC3D2]/60 text-center text-xs text-[#4B4450]">
          Sin insumos BOM agregados a esta cotización. Usa la barra superior para insertar herrajes, imanes o tornillería.
        </div>
      ) : (
        <div className="space-y-2">
          {bomItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-white border border-[#CDC3D2]/40 shadow-2xs flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-[#EADDFB] text-[#350463] flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <span className="font-extrabold text-[#350463] block truncate text-xs">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-[#4B4450]">
                    Costo unitario: <strong>${item.unitCost.toFixed(2)} MXN</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Modificador rápido de cantidad */}
                <div className="flex items-center bg-[#FAF7F0] rounded-xl p-0.5 border border-[#CDC3D2]/40">
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-[#350463] font-bold hover:bg-white rounded-lg"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono font-bold text-xs text-[#350463]">
                    {item.quantity} pzs
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center text-[#350463] font-bold hover:bg-white rounded-lg"
                  >
                    +
                  </button>
                </div>

                <div className="text-right font-mono min-w-[70px]">
                  <span className="font-black text-[#350463] text-xs">
                    ${(item.quantity * item.unitCost).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#4B4450] block">MXN</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded-xl transition-colors cursor-pointer"
                  title="Remover insumo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Subtotal BOM */}
          <div className="flex justify-between items-center px-4 py-2 bg-[#FAF7F0] rounded-xl border border-[#CDC3D2]/30 text-xs font-bold text-[#350463]">
            <span>Subtotal Insumos de Ensamble ({bomItems.length} tipos):</span>
            <span className="font-mono text-sm font-black">${totalBomCost.toFixed(2)} MXN</span>
          </div>
        </div>
      )}
    </div>
  );
};
