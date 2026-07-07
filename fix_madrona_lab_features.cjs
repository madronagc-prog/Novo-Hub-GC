const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

const regex = /\{service\.featureGroups && service\.featureGroups\.length > 0 && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const replacement = `{service.featureGroups && service.featureGroups.some(g => g.title.trim() || g.items.some(i => i.trim() !== '')) && (
                        <div className="mb-6">
                          <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-3">Principais informações</p>
                          <div className="space-y-4">
                            {service.featureGroups.map((group, gi) => {
                              const validItems = group.items.filter(i => i.trim() !== '');
                              if (!group.title.trim() && validItems.length === 0) return null;
                              return (
                                <div key={gi}>
                                  {group.title.trim() && (
                                    <p className="text-base font-semibold text-brand-grafite mb-2">{group.title}</p>
                                  )}
                                  {validItems.length > 0 && (
                                    <ul className="space-y-2">
                                      {validItems.map((item, ii) => (
                                        <li key={ii} className="flex items-start gap-2.5 text-base text-gray-600 leading-relaxed">
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
                      )}`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed MadronaLab features');
