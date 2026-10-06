import re

with open('src/components/cotizador/QuotationPreviewDual.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the container for pill tabs
pill_tabs = """
      <div className="flex items-center bg-gray-100 rounded-xl p-1 mb-2">
        <button
          type="button"
          onClick={() => setPreviewTab('cliente')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            previewTab === 'cliente'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          1. Vista Cliente
        </button>

        <button
          type="button"
          onClick={() => setPreviewTab('taller')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            previewTab === 'taller'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Printer className="w-4 h-4" />
          2. Ficha Taller
        </button>
      </div>
"""

content = re.sub(
    r'<div className="flex items-center justify-between px-3\.5 py-2\.5 rounded-2xl bg-white shadow-xs border border-\[#CDC3D2\]/30">.*?</div>',
    pill_tabs,
    content,
    flags=re.DOTALL
)

# Remove the text `#350463` and `#FAF7F0` in preview
content = content.replace('text-[#350463]', 'text-gray-900')
content = content.replace('bg-[#FAF7F0]', 'bg-gray-50')
content = content.replace('bg-[#EADDFB]', 'bg-purple-50')
content = content.replace('text-[#4C237A]', 'text-purple-700')
content = content.replace('text-[#6D3ACD]', 'text-purple-600')
content = content.replace('border-[#CDC3D2]/40', 'border-gray-200')
content = content.replace('border-[#CDC3D2]/30', 'border-gray-200')
content = content.replace('border-[#E5E2DB]', 'border-gray-200')
content = content.replace('text-[#4B4450]', 'text-gray-500')
content = content.replace('bg-[#350463]', 'bg-purple-900')
content = content.replace('text-[#C0F441]', 'text-lime-400')

with open('src/components/cotizador/QuotationPreviewDual.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

