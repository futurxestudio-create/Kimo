import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Calculator, Plus, Trash2, TrendingUp, Building, Wrench, Droplets, HelpCircle } from 'lucide-react';
import { CapexAsset, OpexFixedCost, HourlyConsumable } from '../types';

export const FinanzasView: React.FC = () => {
  const {
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
  } = useWorkshop();

  const [isAddingCapex, setIsAddingCapex] = useState(false);
  const [newCapex, setNewCapex] = useState<Partial<CapexAsset>>({ categoria: 'Hardware' });

  const [isAddingOpex, setIsAddingOpex] = useState(false);
  const [newOpex, setNewOpex] = useState<Partial<OpexFixedCost>>({ categoria: 'Renta' });

  const [isAddingConsumable, setIsAddingConsumable] = useState(false);
  const [newConsumable, setNewConsumable] = useState<Partial<HourlyConsumable>>({ categoria: 'Laca' });

  const capexMonthlyTotal = capexAssets.reduce((acc, curr) => acc + (curr.costoTotal / (curr.vidaUtilMeses || 1)), 0);
  const opexMonthlyTotal = opexFixedCosts.reduce((acc, curr) => acc + curr.costoMensual, 0);
  const totalMonthlyBudgetToRecover = capexMonthlyTotal + opexMonthlyTotal;

  const masterOverheadRate = calculateTotalOverheadPerHour();

  const handleAddCapex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapex.nombre || !newCapex.costoTotal || !newCapex.vidaUtilMeses) return;
    addCapexAsset(newCapex as Omit<CapexAsset, 'id'>);
    setNewCapex({ categoria: 'Hardware' });
    setIsAddingCapex(false);
  };

  const handleAddOpex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpex.nombre || !newOpex.costoMensual) return;
    addOpexFixedCost(newOpex as Omit<OpexFixedCost, 'id'>);
    setNewOpex({ categoria: 'Renta' });
    setIsAddingOpex(false);
  };

  const handleAddConsumable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsumable.nombre || !newConsumable.costoPorHora) return;
    addHourlyConsumable(newConsumable as Omit<HourlyConsumable, 'id'>);
    setNewConsumable({ categoria: 'Laca' });
    setIsAddingConsumable(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-['Poppins'] pb-28">
      <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">

        {/* ENCABEZADO Y KPIs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-purple-900 text-lime-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Control Financiero de Manufactura</h1>
              <p className="text-sm text-gray-500">Modelo de Absorción: CAPEX, OPEX e Insumos por Hora</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1 */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-1.5 relative group">
                <span className="text-xs font-bold text-gray-500 uppercase">Horas Productivas Meta (Mes)</span>
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute top-full left-0 mt-2 w-64 p-2 bg-gray-800 text-white text-[11px] rounded shadow-lg invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-10">
                  Meta de horas que tus impresoras estarán trabajando al mes.
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={targetProductiveHoursPerMonth}
                  onChange={(e) => setTargetProductiveHoursPerMonth(parseInt(e.target.value, 10) || 160)}
                  className="w-24 text-2xl font-black text-gray-900 bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <span className="text-gray-500 font-medium">hrs</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <span className="text-xs font-bold text-gray-500 uppercase">Presupuesto Mensual a Recuperar</span>
              <div className="mt-2 text-2xl font-black text-gray-900">
                ${totalMonthlyBudgetToRecover.toFixed(2)} <span className="text-sm font-medium text-gray-500">MXN</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Suma de OPEX Fijo + Cuotas de Amortización CAPEX</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-purple-900 rounded-lg border border-purple-800 p-4 shadow-md">
              <span className="text-xs font-bold text-purple-200 uppercase">Tasa Maestra de Absorción</span>
              <div className="mt-2 text-3xl font-black text-lime-400">
                ${masterOverheadRate.toFixed(2)} <span className="text-sm font-bold text-lime-200">MXN/hr</span>
              </div>
              <p className="text-[10px] text-purple-200 mt-1">Monto sumado automáticamente a cada hora en el cotizador</p>
            </div>
          </div>
        </div>

        {/* 3 COLUMNAS DE GESTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* COL A: OPEX */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 relative group">
                <Building className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">Gastos Fijos (OPEX)</h2>
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-10 leading-relaxed font-normal">
                  <strong>¿Qué es esto?</strong> Gastos que debes pagar cada mes sin importar si imprimes 1 o 100 piezas (Renta, Internet, Publicidad, Software). El sistema los suma y los divide entre tus horas productivas para cobrarlos en fracciones.
                </div>
              </div>
              <button onClick={() => setIsAddingOpex(!isAddingOpex)} className="p-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isAddingOpex && (
              <form onSubmit={handleAddOpex} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col gap-2">
                <input type="text" placeholder="Nombre (Ej. Renta Taller)" required className="w-full text-sm p-2 border border-gray-300 rounded" value={newOpex.nombre || ''} onChange={e => setNewOpex({ ...newOpex, nombre: e.target.value })} />
                <div className="flex gap-2">
                  <input type="number" step="0.01" placeholder="Costo Mensual $" required className="w-1/2 text-sm p-2 border border-gray-300 rounded" value={newOpex.costoMensual || ''} onChange={e => setNewOpex({ ...newOpex, costoMensual: parseFloat(e.target.value) })} />
                  <select className="w-1/2 text-sm p-2 border border-gray-300 rounded" value={newOpex.categoria} onChange={e => setNewOpex({ ...newOpex, categoria: e.target.value as any })}>
                    <option value="Renta">Renta</option>
                    <option value="Software">Software</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Servicios">Servicios</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white font-bold py-1.5 rounded mt-1">Guardar</button>
              </form>
            )}

            <div className="flex flex-col gap-2">
              {opexFixedCosts.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50 text-sm">
                  <div>
                    <span className="font-bold text-gray-900 block">{item.nombre}</span>
                    <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-600">{item.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-purple-700 font-bold">${item.costoMensual.toFixed(2)}</span>
                    <button onClick={() => deleteOpexFixedCost(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {opexFixedCosts.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin gastos fijos registrados</p>}
            </div>
            <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center font-bold text-sm">
              <span className="text-gray-500">Total Mensual OPEX:</span>
              <span className="text-gray-900">${opexMonthlyTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* COL B: CAPEX */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 relative group">
                <Wrench className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">Amortización (CAPEX)</h2>
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-10 leading-relaxed font-normal">
                  <strong>¿Qué es esto?</strong> Compras mayores que duran años (Impresoras, Computadoras, Herramientas caras). No se cobran en un solo mes; se divide su costo total entre los meses que estimas que te durarán (Vida útil).
                </div>
              </div>
              <button onClick={() => setIsAddingCapex(!isAddingCapex)} className="p-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isAddingCapex && (
              <form onSubmit={handleAddCapex} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col gap-2">
                <input type="text" placeholder="Activo (Ej. Bambu X1C)" required className="w-full text-sm p-2 border border-gray-300 rounded" value={newCapex.nombre || ''} onChange={e => setNewCapex({ ...newCapex, nombre: e.target.value })} />
                <div className="flex gap-2">
                  <input type="number" step="0.01" placeholder="Costo Total $" required className="w-1/2 text-sm p-2 border border-gray-300 rounded" value={newCapex.costoTotal || ''} onChange={e => setNewCapex({ ...newCapex, costoTotal: parseFloat(e.target.value) })} />
                  <input type="number" placeholder="Vida útil (Meses)" required className="w-1/2 text-sm p-2 border border-gray-300 rounded" value={newCapex.vidaUtilMeses || ''} onChange={e => setNewCapex({ ...newCapex, vidaUtilMeses: parseInt(e.target.value, 10) })} />
                </div>
                <div className="flex gap-2">
                  <input type="month" required className="w-1/2 text-sm p-2 border border-gray-300 rounded" value={newCapex.mesRegistro || ''} onChange={e => setNewCapex({ ...newCapex, mesRegistro: e.target.value })} />
                  <select className="w-1/2 text-sm p-2 border border-gray-300 rounded" value={newCapex.categoria} onChange={e => setNewCapex({ ...newCapex, categoria: e.target.value as any })}>
                    <option value="Hardware">Hardware</option>
                    <option value="Mobiliario">Mobiliario</option>
                    <option value="Herramientas">Herramientas</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white font-bold py-1.5 rounded mt-1">Guardar</button>
              </form>
            )}

            <div className="flex flex-col gap-2">
              {capexAssets.map(item => {
                const cuotaMensual = item.costoTotal / (item.vidaUtilMeses || 1);
                return (
                  <div key={item.id} className="flex flex-col gap-1 p-2 rounded-lg border border-gray-100 bg-gray-50 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{item.nombre}</span>
                      <button onClick={() => deleteCapexAsset(item.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Total: ${item.costoTotal}</span>
                      <span>{item.vidaUtilMeses} meses</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold mt-1 bg-white border border-gray-200 p-1 rounded">
                      <span className="text-purple-600">Cuota Recuperada:</span>
                      <span className="font-mono text-gray-900">${cuotaMensual.toFixed(2)}/mes</span>
                    </div>
                  </div>
                );
              })}
              {capexAssets.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin activos en amortización</p>}
            </div>
            <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center font-bold text-sm">
              <span className="text-gray-500">Total Mensual CAPEX:</span>
              <span className="text-gray-900">${capexMonthlyTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* COL C: INSUMOS HORA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 relative group">
                <Droplets className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">Insumos Taller / Hr</h2>
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-10 leading-relaxed font-normal">
                  <strong>¿Qué es esto?</strong> Consumibles que no se pueden medir por pieza, sino por el tiempo que la máquina está encendida (Laca, Alcohol Isopropílico, Lubricantes, Desgaste de boquillas).
                </div>
              </div>
              <button onClick={() => setIsAddingConsumable(!isAddingConsumable)} className="p-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isAddingConsumable && (
              <form onSubmit={handleAddConsumable} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col gap-2">
                <input type="text" placeholder="Insumo (Ej. Laca Magigoo)" required className="w-full text-sm p-2 border border-gray-300 rounded" value={newConsumable.nombre || ''} onChange={e => setNewConsumable({ ...newConsumable, nombre: e.target.value })} />
                <div className="flex gap-2">
                  <input type="number" step="0.01" placeholder="Costo x Hora $" required className="w-1/2 text-sm p-2 border border-gray-300 rounded" value={newConsumable.costoPorHora || ''} onChange={e => setNewConsumable({ ...newConsumable, costoPorHora: parseFloat(e.target.value) })} />
                  <select className="w-1/2 text-sm p-2 border border-gray-300 rounded" value={newConsumable.categoria} onChange={e => setNewConsumable({ ...newConsumable, categoria: e.target.value as any })}>
                    <option value="Laca">Laca/Pegamento</option>
                    <option value="Alcohol">Alcohol/Limpieza</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white font-bold py-1.5 rounded mt-1">Guardar</button>
              </form>
            )}

            <div className="flex flex-col gap-2">
              {hourlyConsumables.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50 text-sm">
                  <div>
                    <span className="font-bold text-gray-900 block">{item.nombre}</span>
                    <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-600">{item.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lime-600 font-bold">${item.costoPorHora.toFixed(2)}/hr</span>
                    <button onClick={() => deleteHourlyConsumable(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {hourlyConsumables.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin insumos variables registrados</p>}
            </div>
            <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center font-bold text-sm">
              <span className="text-gray-500">Tasa Variable Total:</span>
              <span className="text-lime-600">${hourlyConsumables.reduce((a, b) => a + b.costoPorHora, 0).toFixed(2)}/hr</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
