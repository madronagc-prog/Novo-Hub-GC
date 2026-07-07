const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

const regex = /<div>\s*<label className="block text-\[10px\] font-bold text-brand-grafite uppercase tracking-widest mb-1\.5">\s*Categoria\s*<\/label>\s*<div className="flex flex-wrap gap-x-4 gap-y-2">[\s\S]*?<\/div>\s*<\/div>/g;

content = content.replace(regex, '');

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed category select');
