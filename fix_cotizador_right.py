import re

with open('src/components/CotizadorView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the right column wrapper
content = content.replace('<div className="lg:w-2/3 flex flex-col gap-6 sticky top-4 self-start">', '<div className="lg:w-1/3 flex flex-col gap-0 sticky top-6 self-start bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">')

# Strip out the individual card wrappers for Descuento, Pasarela, Actions
content = re.sub(r'p-3\.5 rounded-2xl bg-white border border-\[#CDC3D2\]/40 shadow-xs flex flex-col gap-2\.5', 'p-6 border-b border-gray-100 flex flex-col gap-4', content)

# Bottom Actions Card
content = re.sub(r'p-4 rounded-3xl bg-white border border-\[#CDC3D2\]/40 shadow-xs flex flex-col gap-3', 'p-6 bg-gray-50 flex flex-col gap-4', content)

# Add profitability badge inside the bottom action block (above Total a Pagar)
# Find: "text-[#4B4450] uppercase font-bold block">Total a Pagar"
profit_badge = """
{profitPerHour >= minRatePerHour ? (
  <span className="bg-lime-400 text-purple-900 font-bold text-[10px] px-2 py-0.5 rounded-full mb-1 inline-block">Meta ${minRatePerHour.toFixed(2)}/hr ✓</span>
) : (
  <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2 py-0.5 rounded-full mb-1 inline-block">Debajo de Meta ✗</span>
)}
"""

content = content.replace(
    '<span className="text-[10px] text-[#4B4450] uppercase font-bold block">Total a Pagar</span>',
    profit_badge + '\n<span className="text-[10px] text-gray-500 uppercase font-bold block">Total a Pagar</span>'
)

# Text color fixes in the right column
content = content.replace('text-[#350463]', 'text-gray-900')
content = content.replace('text-[#4B4450]', 'text-gray-500')
content = content.replace('bg-[#FAF7F0]', 'bg-gray-50')
content = content.replace('border-[#CDC3D2]/40', 'border-gray-200')
content = content.replace('border-[#CDC3D2]/50', 'border-gray-200')
content = content.replace('border-[#F0EEE7]', 'border-gray-100')

with open('src/components/CotizadorView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

