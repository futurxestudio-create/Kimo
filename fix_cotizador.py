import re

with open('src/components/CotizadorView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Paleta Global
content = content.replace('w-full flex flex-col gap-6 py-4 pb-28 max-w-[1740px] mx-auto', 'max-w-7xl mx-auto flex flex-col gap-6 p-6 min-h-screen bg-slate-50')
content = content.replace('grid grid-cols-1 lg:grid-cols-12 gap-6 items-start', 'flex flex-col lg:flex-row gap-6 items-start w-full')
content = content.replace('lg:col-span-6 flex flex-col gap-4', 'lg:w-2/3 flex flex-col gap-6')
content = content.replace('lg:col-span-6 flex flex-col gap-4 sticky top-4 self-start', 'lg:w-1/3 flex flex-col gap-6 sticky top-6 self-start')

# Limpieza Header Ribbon
content = content.replace('w-full px-5 py-3.5 bg-[#FAF7F0] rounded-3xl border border-[#CDC3D2]/40 shadow-xs flex flex-wrap items-center justify-between gap-3', 'w-full px-6 py-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4')

# Limpieza de Tarjetas Acordeones
content = re.sub(r'rounded-2xl bg-white border-2 border-purple-100 shadow-sm overflow-hidden mb-4 transition-all hover:border-purple-200', r'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4', content)
content = re.sub(r'w-full p-4 bg-\[#F3EEFA\] hover:bg-\[#EADDFB\]/70 flex items-center justify-between text-left cursor-pointer transition-colors border-b border-purple-100/60', r'w-full p-6 bg-white hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer transition-colors border-b border-gray-100', content)

# Quitar circulos (1,2,3)
content = re.sub(r'<span className="w-7 h-7 rounded-full bg-\[#4C237A\] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">\s*\d+\s*</span>', '', content)

# Encabezados
content = content.replace('font-extrabold text-sm text-[#4C237A]', 'text-lg font-semibold text-gray-900 flex items-center gap-2')

# Inputs Sutiles
content = re.sub(r'bg-\[#FAF7F0\] border border-\[#CDC3D2\] rounded-xl', r'bg-gray-50 border border-gray-200 rounded-lg', content)
content = content.replace('focus:ring-[#6D3ACD]', 'focus:ring-purple-600 focus:border-transparent')

with open('src/components/CotizadorView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/cotizador/ModelCard.tsx', 'r', encoding='utf-8') as f:
    mc = f.read()

# ACORDEONES DENTRO DE LA PARTIDA (BOM y Servicios)
mc = re.sub(r'rounded-2xl border border-purple-200 bg-white overflow-hidden shadow-2xs transition-all', r'border-t border-gray-100 pt-4 mt-4 overflow-hidden', mc)
mc = re.sub(r'w-full p-3 bg-\[#FAF7F0\] hover:bg-\[#F3EEFA\] flex items-center justify-between text-left cursor-pointer transition-colors border-b border-purple-100/60', r'w-full py-3 flex items-center justify-between text-left cursor-pointer transition-colors', mc)

mc = re.sub(r'bg-\[#FAF7F0\] border border-\[#CDC3D2\]', r'bg-gray-50 border border-gray-200', mc)

with open('src/components/cotizador/ModelCard.tsx', 'w', encoding='utf-8') as f:
    f.write(mc)

