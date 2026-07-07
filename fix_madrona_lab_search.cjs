const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

const regex = /<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">\s*<div className="relative flex-1 max-w-xl">\s*<Search className="absolute left-4 top-1\/2 -translate-y-1\/2 text-gray-400" size=\{20\} \/>\s*<input\s*type="text"\s*placeholder="Buscar iniciativas por nome, área ou descrição\.\.\."\s*value=\{searchTerm\}\s*onChange=\{\(e\) => setSearchTerm\(e\.target\.value\)\}\s*className="w-full pl-11 pr-4 py-3\.5 bg-white border border-gray-200 rounded-2xl text-brand-grafite shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue\/50 focus:border-brand-blue transition-all"\s*\/>\s*<\/div>\s*<\/div>/;

const replacement = `<div className="mb-6 relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar iniciativas..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue/30 focus:border-brand-blue/50 transition-all placeholder:text-gray-400 shadow-sm"
          />
        </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed MadronaLab search bar');
