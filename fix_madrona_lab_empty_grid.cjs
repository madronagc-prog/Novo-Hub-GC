const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

const regex = /<div className=\{`grid gap-6 mt-2 pt-5 border-t border-gray-100 \$\{service.areas \? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'\}`\}>[\s\S]*?<\/div>\s*<\/div>\s*\)}/;

const replacement = `{(service.areas || service.accessInfo) && (
                        <div className={\`grid gap-6 mt-2 pt-5 border-t border-gray-100 \${service.areas ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}\`}>
                          {service.areas && (
                            <div>
                              <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">Áreas envolvidas</p>
                              <p className="text-base text-brand-grafite">{renderMarkdown(service.areas)}</p>
                            </div>
                          )}
                          {service.accessInfo && (
                            <div>
                              <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">Como acessar</p>
                              <p className="text-base text-brand-grafite whitespace-pre-wrap">{renderMarkdown(service.accessInfo)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}`;
content = content.replace(regex, replacement);

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed MadronaLab empty grid');
