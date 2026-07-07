const fs = require('fs');
let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

const regex = /\{\/\* Descrição \*\/\}\s*<div className="mb-6">\s*<p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">\s*O que é\s*<\/p>\s*<p className="text-base text-brand-grafite leading-relaxed whitespace-pre-wrap">\s*\{renderMarkdown\(service\.description\)\}\s*<\/p>\s*<\/div>/;

const replacement = `{/* Descrição */}
                  {service.description && (
                    <div className="mb-6">
                      <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">
                        O que é
                      </p>
                      <p className="text-base text-brand-grafite leading-relaxed whitespace-pre-wrap">
                          {renderMarkdown(service.description)}
                      </p>
                    </div>
                  )}`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/pages/ServicosGC.tsx', content);
console.log('Fixed ServicosGC description field');
