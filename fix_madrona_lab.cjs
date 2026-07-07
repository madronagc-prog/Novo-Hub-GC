const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

// 1. Fix the header
const headerRegex = /<div className="flex flex-col gap-8 mb-10">[\s\S]*? Nova Iniciativa\s*<\/button>\s*\)}\s*<\/div>/;
const newHeader = `<div className="flex flex-col gap-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1e3f] tracking-tight">Madrona Lab</h1>
            <p className="text-brand-grafite mt-1 max-w-3xl">
              Iniciativas e programas estruturados de Inovação e Gestão do Conhecimento.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openEdit(null)}
              className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Nova Iniciativa
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar iniciativas por nome, área ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-brand-grafite shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all"
            />
          </div>
        </div>`;
content = content.replace(headerRegex, newHeader);

// 2. Fix the grid to 1 column
content = content.replace(
  '<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">',
  '<div className="flex flex-col gap-4">'
);

// 3. Hide description when empty
const descRegex = /<div className="mt-5 mb-6">\s*<p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">O que é<\/p>\s*<p className="text-base text-brand-grafite leading-relaxed whitespace-pre-wrap">\s*\{renderMarkdown\(service\.description\)\}\s*<\/p>\s*<\/div>/;
const newDesc = `{service.description && (
                        <div className="mt-5 mb-6">
                          <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">O que é</p>
                          <p className="text-base text-brand-grafite leading-relaxed whitespace-pre-wrap">
                            {renderMarkdown(service.description)}
                          </p>
                        </div>
                      )}`;
content = content.replace(descRegex, newDesc);

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed MadronaLab.tsx');
