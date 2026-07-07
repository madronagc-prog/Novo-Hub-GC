const fs = require('fs');

let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

// Update imports
content = content.replace(
  "import { servicesGCData, ServiceItem, CATEGORIES } from '../data/servicesGCData';",
  "import { madronaLabData, MadronaLabItem } from '../data/madronaLabData';"
);

// Rename component
content = content.replace(/export default function ServicosGC\(\) \{/, 'export default function MadronaLab() {');

// Remove normalizeCategories
content = content.replace(/function normalizeCategories[\s\S]*?\}\n/, '');

// Replace ServiceItem and ServiceOverride with MadronaLabItem and MadronaLabOverride
content = content.replace(/type ServiceOverride = Pick<ServiceItem, 'name' \| 'description' \| 'accessInfo' \| 'areas' \| 'featureGroups' \| 'category'>;/, "type MadronaLabOverride = Pick<MadronaLabItem, 'name' | 'description' | 'accessInfo' | 'areas' | 'featureGroups'>;");
content = content.replace(/ServiceOverride/g, 'MadronaLabOverride');
content = content.replace(/ServiceItem/g, 'MadronaLabItem');

// Replace services with madronaLab
content = content.replace(/const \[services, setServices\]\s*=\s*useState<MadronaLabItem\[\]>\(servicesGCData\);/, 'const [services, setServices] = useState<MadronaLabItem[]>(madronaLabData);');

content = content.replace(/collection\(db, 'services'\)/g, "collection(db, 'madronaLab')");
content = content.replace(/doc\(db, 'services', editingId\)/g, "doc(db, 'madronaLab', editingId)");
content = content.replace(/doc\(db, 'services', id\)/g, "doc(db, 'madronaLab', id)");
content = content.replace(/'services'/g, "'madronaLab'");

// Update edit form initialization - no category
content = content.replace(/category:\s*service\.category \|\| '',/g, '');
content = content.replace(/category:\s*\[CATEGORIES\[0\]\],/g, '');
content = content.replace(/category:\s*\[CATEGORIES\[0\]\],/g, '');

// Remove category checkboxes
const checkboxesRegex = /<div>\s*<label className="block text-\[10px\] font-bold text-brand-grafite uppercase tracking-widest mb-1\.5">\s*Categorias\s*<\/label>[\s\S]*?<\/div>\s*<\/div>/g;
content = content.replace(checkboxesRegex, '');

// The previous version of ServicosGC might have checkboxes or select for category. Let's just remove anything with `CATEGORIES` entirely
content = content.replace(/\{CATEGORIES\.map[\s\S]*?\}\s*<\/div>/g, '');
content = content.replace(/const catServices = \[\.\.\.services\][\s\S]*?\.filter\(s => normalizeCategories\(s\.category\)\.includes\(cat\)\)/g, 'const catServices = [...services]');

// Instead of mapping CATEGORIES, we will just render `services` directly where it previously mapped CATEGORIES
const renderServicesRegex = /\{CATEGORIES\.map\(cat => \{[\s\S]*?const catServices = \[\.\.\.services\][\s\S]*?\.filter\(s => normalizeCategories\(s\.category\)\.includes\(cat\)\)[\s\S]*?const catSlug = cat\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\/g, '-'\);[\s\S]*?return \([\s\S]*?<div key=\{cat\} id=\{`cat-\$\{catSlug\}`\} className="scroll-mt-\[160px\]">/g;

// Actually it's complex to regex replace the entire map function block. Let's write a smaller JS script to rewrite the render section.
