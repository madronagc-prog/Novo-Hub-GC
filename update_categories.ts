import fs from 'fs';

let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

// Helper to normalize categories
const normalizeHelper = `
function normalizeCategories(cat: string | string[] | undefined): string[] {
  if (!cat) return [];
  if (Array.isArray(cat)) return cat;
  return [cat];
}
`;
content = content.replace('export default function ServicosGC() {', normalizeHelper + '\nexport default function ServicosGC() {');

// 1. Update hasServices
content = content.replace(
  'const hasServices = services.some(s => s.category === cat);',
  'const hasServices = services.some(s => normalizeCategories(s.category).includes(cat));'
);

// 2. Update catServices filter
content = content.replace(
  '.filter(s => s.category === cat)',
  '.filter(s => normalizeCategories(s.category).includes(cat))'
);

// 3. Update Edit form inputs
const oldSelect = `<select
                  value={editForm.category ?? CATEGORIES[0]}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>`;

const newCheckboxes = `<div className="flex flex-wrap gap-x-4 gap-y-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = normalizeCategories(editForm.category).includes(cat);
                    return (
                      <label key={cat} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            const currentCats = normalizeCategories(editForm.category);
                            let newCats;
                            if (e.target.checked) {
                              newCats = [...currentCats, cat];
                            } else {
                              newCats = currentCats.filter(c => c !== cat);
                            }
                            setEditForm(f => ({ ...f, category: newCats }));
                          }}
                          className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue h-4 w-4"
                        />
                        {cat}
                      </label>
                    );
                  })}
                </div>`;

content = content.replace(oldSelect, newCheckboxes);

// 4. Update new service init
content = content.replace(
  'category: CATEGORIES[0]',
  'category: [CATEGORIES[0]]'
);
content = content.replace(
  'category: CATEGORIES[0]',
  'category: [CATEGORIES[0]]'
);

fs.writeFileSync('src/pages/ServicosGC.tsx', content);
