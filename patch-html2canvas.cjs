const fs = require('fs');
const files = [
  './node_modules/html2canvas/dist/html2canvas.esm.js',
  './node_modules/html2canvas/dist/html2canvas.js',
];

files.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    const target = 'throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");';
    if (content.includes(target)) {
      content = content.replace(target, 'return 0x00000000;');
      fs.writeFileSync(file, content, 'utf-8');
      console.log('[patch-html2canvas] Patched unsupported color error in:', file);
    }
  }
});
