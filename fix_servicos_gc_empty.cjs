const fs = require('fs');
let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

const regex = /\{service.accessInfo \? \([\s\S]*?\}\s*<\/p>\s*\)\}/;
content = content.replace(regex, `{service.accessInfo && (
                        <p className="text-base text-brand-grafite whitespace-pre-wrap">
                          {renderMarkdown(service.accessInfo)}
                        </p>
                      )}`);

// Also fix the wrapper
const wrapRegex = /<div\s*className=\{`grid gap-6 mt-2 pt-5 border-t border-gray-100 \$\{[\s\S]*?`\}\s*>[\s\S]*?Como acessar[\s\S]*?<\/div>\s*<\/div>/;
const wrapReplacement = `{(service.areas || service.accessInfo) && (
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
                    {service.accessInfo && (
                      <div>
                        <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">
                          Como acessar
                        </p>
                        <p className="text-base text-brand-grafite whitespace-pre-wrap">
                          {renderMarkdown(service.accessInfo)}
                        </p>
                      </div>
                    )}
                  </div>
                  )}`;
content = content.replace(wrapRegex, wrapReplacement);

fs.writeFileSync('src/pages/ServicosGC.tsx', content);
console.log('Fixed ServicosGC empty fields');
