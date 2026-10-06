import re

with open('src/components/cotizador/ModelCard.tsx', 'r', encoding='utf-8') as f:
    mc = f.read()

# First replace all '#350463', '#6D3ACD', '#4B4450' with standard gray
mc = mc.replace('text-[#350463]', 'text-gray-900')
mc = mc.replace('text-[#6D3ACD]', 'text-purple-600')
mc = mc.replace('text-[#4B4450]', 'text-gray-500')
mc = mc.replace('text-[#1C1C18]', 'text-gray-900')
mc = mc.replace('bg-[#FAF7F0]', 'bg-gray-50')
mc = mc.replace('bg-[#F3EEFA]', 'bg-purple-50')
mc = mc.replace('border-[#CDC3D2]', 'border-gray-200')
mc = mc.replace('border-[#E5E2DB]', 'border-gray-200')

# Button ghost outlines
mc = mc.replace('bg-[#6D3ACD] hover:bg-[#5A2CBA] text-white', 'border border-purple-200 text-purple-700 hover:bg-purple-50 bg-white')
mc = mc.replace('bg-white hover:bg-[#FAF7F0] border border-[#CDC3D2] text-[#350463]', 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')

# Change accordion headers
mc = mc.replace('w-full py-3 flex items-center justify-between text-left cursor-pointer transition-colors', 'w-full py-3 flex items-center justify-between text-left cursor-pointer transition-colors font-semibold text-gray-900')

with open('src/components/cotizador/ModelCard.tsx', 'w', encoding='utf-8') as f:
    f.write(mc)
