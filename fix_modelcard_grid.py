import re

with open('src/components/cotizador/ModelCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the two rows with the new requested layout
new_layout = """
      {/* FILA 1: Grid Compacto Numérico (Piezas, Impresión, Mano de Obra, Merma) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Piezas Solicitadas */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-900 flex items-center justify-between">
            <span>Piezas:</span>
          </label>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
            <input
              type="number"
              min={1}
              value={model.clientQty}
              onChange={(e) => handleClientQtyChange(parseInt(e.target.value, 10) || 1)}
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Horas Impresión */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 flex items-center justify-between">
            <span>Horas Impresión:</span>
          </label>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={model.printHours}
              onChange={(e) =>
                onUpdate({
                  ...model,
                  printHours: Math.max(0.1, parseFloat(e.target.value) || 0.1),
                })
              }
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Horas Mano Obra */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 flex items-center justify-between">
            <span>Horas Mano Obra:</span>
          </label>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
            <input
              type="number"
              step="0.25"
              min="0"
              value={model.dedicatedLaborHours ?? 0}
              onChange={(e) =>
                onUpdate({
                  ...model,
                  dedicatedLaborHours: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Merma g */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 flex items-center justify-between">
            <span>Merma (g):</span>
          </label>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
            <input
              type="number"
              min="0"
              value={model.purgaGrams || 0}
              onChange={(e) =>
                onUpdate({
                  ...model,
                  purgaGrams: Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* FILA 2: Placas & Buffer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
        {/* Campo 2: Placas / Camas */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-900 flex items-center justify-between">
            <span>Placas / Camas:</span>
            <span className="text-[10px] text-[#2E3F00] bg-[#C0F441] px-1.5 py-0.5 rounded font-mono font-bold">
              ~{(model.clientQty / model.platesCount).toFixed(1)} pzs/cama
            </span>
          </label>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 focus-within:border-[#6D3ACD]">
            <input
              type="number"
              min={1}
              value={model.platesCount}
              onChange={(e) =>
                onUpdate({ ...model, platesCount: Math.max(1, parseInt(e.target.value, 10) || 1) })
              }
              className="w-full text-sm font-black text-gray-900 bg-transparent focus:outline-none font-mono"
            />
            <span className="text-xs font-bold text-purple-600">placas</span>
          </div>
        </div>

        {/* Campo 3: Buffer de Respaldo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-900 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={model.includeBuffer}
                onChange={(e) =>
                  onUpdate({
                    ...model,
                    includeBuffer: e.target.checked,
                    bufferQty: e.target.checked
                      ? Math.max(1, model.bufferQty || Math.round(model.clientQty * 0.08))
                      : 0,
                  })
                }
                className="accent-[#6D3ACD] w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span>Buffer de Falla:</span>
            </span>
            <span className="text-[10px] text-gray-900 font-mono font-bold">
              Total taller: {bufferTotalWorkshopQty} pzs
            </span>
          </label>
          <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-gray-200">
            <button
              type="button"
              disabled={!model.includeBuffer}
              onClick={() =>
                onUpdate({
                  ...model,
                  bufferQty: Math.max(1, model.bufferQty - 1),
                })
              }
              className="w-6 h-6 flex items-center justify-center text-gray-900 font-bold hover:bg-gray-50 rounded disabled:opacity-30 cursor-pointer"
            >
              -
            </button>
            <span className="font-mono font-black text-sm text-gray-900">
              {model.includeBuffer ? `+${model.bufferQty} pzs` : '0 pzs'}
            </span>
            <button
              type="button"
              disabled={!model.includeBuffer}
              onClick={() =>
                onUpdate({
                  ...model,
                  bufferQty: model.bufferQty + 1,
                })
              }
              className="w-6 h-6 flex items-center justify-center text-gray-900 font-bold hover:bg-gray-50 rounded disabled:opacity-30 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>
"""

pattern = r'\{\/\* FILA 1: PIEZAS SOLICITADAS VS\. PLACAS & BUFFER \*\/\}.*?\{\/\* FILA 3: ASIGNACIÓN DE IMPRESORA, CAMA & RUTAS DE FABRICACIÓN \*\/\}'

content = re.sub(pattern, new_layout + '\n      {/* FILA 3: ASIGNACIÓN DE IMPRESORA, CAMA & RUTAS DE FABRICACIÓN */}', content, flags=re.DOTALL)

with open('src/components/cotizador/ModelCard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

