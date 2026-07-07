const fs = require('fs');

let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

// Imports
content = content.replace("import { servicesGCData, ServiceItem, CATEGORIES } from '../data/servicesGCData';", "import { madronaLabData, MadronaLabItem } from '../data/madronaLabData';");

// Function name
content = content.replace(/export default function ServicosGC\(\) \{/, 'export default function MadronaLab() {');

// Remove normalizeCategories
content = content.replace(/function normalizeCategories[\s\S]*?\}\n/, '');
content = content.replace(/import \{ renderMarkdown \} from '\.\.\/utils\/renderMarkdown';/, "import { renderMarkdown } from '../utils/renderMarkdown';");

// Replace types
content = content.replace(/type ServiceOverride = Pick<ServiceItem, 'name' \| 'description' \| 'accessInfo' \| 'areas' \| 'featureGroups' \| 'category'>;/, "type ServiceOverride = Pick<MadronaLabItem, 'name' | 'description' | 'accessInfo' | 'areas' | 'featureGroups'>;");
content = content.replace(/ServiceItem/g, 'MadronaLabItem');

// Replace state
content = content.replace(/const \[services, setServices\]\s*=\s*useState<MadronaLabItem\[\]>\(servicesGCData\);/, 'const [services, setServices] = useState<MadronaLabItem[]>(madronaLabData);');

// Firestore collections
content = content.replace(/collection\(db, 'services'\)/g, "collection(db, 'madronaLab')");
content = content.replace(/doc\(db, 'services'/g, "doc(db, 'madronaLab'");

// Edit Form mapping - remove category
content = content.replace(/category:\s*service\.category \|\| \[\],\n?/g, '');
content = content.replace(/category:\s*\[CATEGORIES\[0\]\],\n?/g, '');
content = content.replace(/category:\s*\[\],\n?/g, '');
content = content.replace(/category:\s*\[CATEGORIES\[0\]\]\n?/g, '');
content = content.replace(/category:\s*\[\]\n?/g, '');

// Remove category checkboxes block in edit modal
content = content.replace(/<div>\s*<label className="block text-\[10px\] font-bold text-brand-grafite uppercase tracking-widest mb-1\.5">\s*Categorias[\s\S]*?<\/label>\s*<div className="flex flex-wrap gap-x-4 gap-y-2">[\s\S]*?<\/div>\s*<\/div>/g, '');
content = content.replace(/<div>\s*<label className="block text-\[10px\] font-bold text-brand-grafite uppercase tracking-widest mb-1\.5">\s*Categoria[\s\S]*?<\/select>\s*<\/div>/g, '');

// Removing the sticky navigation of CATEGORIES
const stickyNavRegex = /\{\/\* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\s*NAVEGAÇÃO INTERNA \(sticky abaixo do header\)\s*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ \*\/\}\s*<div className="sticky top-20 bg-gray-50 z-40 mb-6">[\s\S]*?<\/div>\s*<\/div>/;
content = content.replace(stickyNavRegex, '');

// Rewrite the list rendering
// From: {CATEGORIES.map(cat => { ... return (<div key={cat} ...> ... </div>); })}
// To: just render services

const mapRegex = /\{CATEGORIES\.map\(cat => \{[\s\S]*?const catServices = \[\.\.\.services\][\s\S]*?\.filter\(s => \{[\s\S]*?\}\)[\s\S]*?\.sort\(\(a, b\) => \{[\s\S]*?\}\);[\s\S]*?if \(catServices\.length === 0 && !isAdmin\) return null;[\s\S]*?return \([\s\S]*?<div key=\{cat\} id=\{`cat-\$\{catSlug\}`\} className="scroll-mt-\[160px\]">[\s\S]*?\{catServices\.length > 0 && \([\s\S]*?<h2 className="text-xl font-bold text-\[\#0a1e3f\] mb-4 pl-2 border-l-4 border-brand-blue">[\s\S]*?\{cat\}[\s\S]*?<\/h2>[\s\S]*?\)\}*[\s\S]*?<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">[\s\S]*?\{catServices\.map\(service => \([\s\S]*?const isOpen = expandedId === service\.id;[\s\S]*?return \([\s\S]*?\{!isAdmin && !service\.description && !service\.accessInfo && \(!service\.featureGroups \|\| service\.featureGroups\.length === 0\) \? \([\s\S]*?\) : \([\s\S]*?<div[\s\S]*?onClick=\{[\s\S]*?\}\s*className=\{`bg-white border rounded-2xl overflow-hidden transition-all duration-300 \$\{[\s\S]*?isOpen \? 'border-brand-blue shadow-md' : 'border-gray-200 hover:border-brand-blue\/50 hover:shadow-sm'[\s\S]*?\}\`\}>([\s\S]*?)<\/div>[\s\S]*?\)[\s\S]*?\)\}\}*[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}\)\}/g;

const filteredServicesStr = `
          {(() => {
            const filtered = [...services].filter(s => {
              if (!searchTerm) return true;
              const term = searchTerm.toLowerCase();
              return (
                s.name.toLowerCase().includes(term) ||
                (s.description && s.description.toLowerCase().includes(term)) ||
                (s.areas && s.areas.toLowerCase().includes(term))
              );
            }).sort((a, b) => a.name.localeCompare(b.name));
            
            if (filtered.length === 0 && !isAdmin) return null;

            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(service => {
                  const isOpen = expandedId === service.id;
                  const isEmpty = !service.description && !service.accessInfo && (!service.featureGroups || service.featureGroups.length === 0);
                  
                  if (!isAdmin && isEmpty) return null;

                  if (isEmpty) {
                    return (
                      <div key={service.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between opacity-60">
                        <span className="font-bold text-brand-blue text-xl">{service.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Vazio</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(service); }}
                            className="p-2 rounded-xl text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                            title="Editar informações"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={service.id}
                      onClick={() => setExpandedId(isOpen ? null : service.id)}
                      className={\`bg-white border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer \${
                        isOpen ? 'border-brand-blue shadow-md' : 'border-gray-200 hover:border-brand-blue/50 hover:shadow-sm'
                      }\`}
                    >
                      {/* Header do Card */}
                      <div className="p-5 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-3">
                            <span className="font-bold text-brand-blue text-xl">
                              {service.name}
                            </span>
                            {service.fullName && (
                              <span className="text-sm text-gray-500 hidden sm:inline">
                                {service.fullName}
                              </span>
                            )}
                          </div>
                          {!isOpen && service.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                              {service.description.replace(/\\*\\*/g, '')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isAdmin && (
                            <button
                              onClick={e => { e.stopPropagation(); openEdit(service); }}
                              className="p-2 rounded-xl text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                              title="Editar informações do serviço"
                            >
                              <Pencil size={18} />
                            </button>
                          )}
                          <div className="p-2 text-gray-400">
                            <ChevronDown
                              size={20}
                              className={\`transition-transform duration-200 \${isOpen ? 'rotate-180' : ''}\`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Expandido */}
                      {isOpen && (
                        <div className="px-6 pb-6 border-t border-gray-100 animate-[fadeIn_0.15s_ease-out] cursor-default" onClick={e => e.stopPropagation()}>
                          <div className="mt-5 mb-6">
                            <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">
                              O que é
                            </p>
                            <p className="text-base text-brand-grafite leading-relaxed whitespace-pre-wrap">
                              {renderMarkdown(service.description)}
                            </p>
                          </div>

                          {service.featureGroups && service.featureGroups.some(g => g.title.trim() || g.items.some(i => i.trim() !== '')) && (
                            <div className="mb-6">
                              <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-3">
                                Principais funcionalidades
                              </p>
                              <div className="space-y-4">
                                {service.featureGroups.map((group, gi) => {
                                  const validItems = group.items.filter(i => i.trim() !== '');
                                  if (!group.title.trim() && validItems.length === 0) return null;
                                  return (
                                    <div key={gi}>
                                      {group.title.trim() && (
                                        <p className="text-base font-semibold text-brand-grafite mb-2">
                                          {group.title}
                                        </p>
                                      )}
                                      {validItems.length > 0 && (
                                        <ul className="space-y-2">
                                          {validItems.map((item, ii) => (
                                            <li
                                              key={ii}
                                              className="flex items-start gap-2.5 text-base text-gray-600 leading-relaxed"
                                            >
                                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                                              {renderMarkdown(item)}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div
                            className={\`grid gap-6 mt-2 pt-5 border-t border-gray-100 \${
                              service.areas ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                            }\`}
                          >
                            {service.areas && (
                              <div>
                                <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">
                                  Áreas cobertas
                                </p>
                                <p className="text-base text-brand-grafite">{renderMarkdown(service.areas)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">
                                Como acessar
                              </p>
                              {service.accessInfo ? (
                                <p className="text-base text-brand-grafite whitespace-pre-wrap">
                                  {renderMarkdown(service.accessInfo)}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400 italic">Informação não disponível.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
`;

// Replace the original map code with the new filtered mapping
// Since regex matching the whole block is error prone, I will slice it.
const startIdx = content.indexOf('{CATEGORIES.map(cat => {');
if (startIdx !== -1) {
  // Find the end of CATEGORIES.map block.
  // It ends before `{/* Overlay do Modal */}` or `    </div>\n    </div>\n  );\n}`
  const endMarker = '{/* Modal de Edição */';
  const endIdx = content.indexOf(endMarker);
  
  if (endIdx !== -1) {
    const beforeMap = content.substring(0, startIdx);
    const afterMap = content.substring(endIdx);
    content = beforeMap + filteredServicesStr + '\n\n        ' + afterMap;
  }
}

content = content.replace(/LISTA DE SERVIÇOS AGRUPADOS POR CATEGORIA/g, 'LISTA DE INICIATIVAS');

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Done rewriting MadronaLab.tsx');
