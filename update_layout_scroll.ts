import fs from 'fs';

let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// We want to add a manual scroll trigger for hash links to guarantee it works.
const replacement = `
                              <Link
                                key={sub.path}
                                to={sub.path}
                                onClick={(e) => {
                                  setOpenDropdown(null);
                                  if (location.pathname === subPathname) {
                                    e.preventDefault();
                                    window.history.pushState(null, '', sub.path);
                                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                                    setTimeout(() => {
                                      const el = document.getElementById(subHash.substring(1));
                                      if (el) {
                                        const y = el.getBoundingClientRect().top + window.scrollY - 160;
                                        window.scrollTo({ top: y, behavior: 'smooth' });
                                      }
                                    }, 50);
                                  }
                                }}
                                className={\`block px-4 py-2 text-sm \${
                                  location.pathname === subPathname && location.hash === subHash
                                    ? 'bg-gray-100 text-brand-grafite font-medium'
                                    : 'text-brand-grafite hover:bg-gray-50'
                                }\`}
                              >
`;

content = content.replace(/<Link\s+key=\{sub\.path\}\s+to=\{sub\.path\}\s+onClick=\{\(\) => setOpenDropdown\(null\)\}\s+className=\{`block px-4 py-2 text-sm \$\{\s*location\.pathname === subPathname && location\.hash === subHash\s*\?\s*'bg-gray-100 text-brand-grafite font-medium'\s*:\s*'text-brand-grafite hover:bg-gray-50'\s*\}`\}\s*>/, replacement.trim());

const mobileReplacement = `
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={(e) => {
                              setIsMenuOpen(false);
                              if (location.pathname === subPathname) {
                                e.preventDefault();
                                window.history.pushState(null, '', sub.path);
                                window.dispatchEvent(new HashChangeEvent('hashchange'));
                                setTimeout(() => {
                                  const el = document.getElementById(subHash.substring(1));
                                  if (el) {
                                    const y = el.getBoundingClientRect().top + window.scrollY - 160;
                                    window.scrollTo({ top: y, behavior: 'smooth' });
                                  }
                                }, 50);
                              }
                            }}
                            className={\`block px-3 py-2 rounded-md text-sm font-medium \${
                              location.pathname === subPathname && location.hash === subHash
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }\`}
                          >
`;

content = content.replace(/<Link\s+key=\{sub\.path\}\s+to=\{sub\.path\}\s+onClick=\{\(\) => setIsMenuOpen\(false\)\}\s+className=\{`block px-3 py-2 rounded-md text-sm font-medium \$\{\s*location\.pathname === subPathname && location\.hash === subHash\s*\?\s*'bg-white\/20 text-white'\s*:\s*'text-white\/70 hover:bg-white\/10 hover:text-white'\s*\}`\}\s*>/, mobileReplacement.trim());


fs.writeFileSync('src/components/Layout.tsx', content);
