import fs from 'fs';

let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

const searchHtml = `
        {/* Caixa de Busca */}
        <div className="mb-6 relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar serviços..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue/30 focus:border-brand-blue/50 transition-all placeholder:text-gray-400 shadow-sm"
          />
        </div>
`;

// Insert the search box after the sticky div
const target = '          </div>\n        </div>';
if (content.includes(target) && !content.includes('Caixa de Busca')) {
    content = content.replace(target, target + '\\n' + searchHtml);
}

fs.writeFileSync('src/pages/ServicosGC.tsx', content);
