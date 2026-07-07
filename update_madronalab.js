const fs = require('fs');
const filePath = 'src/pages/MadronaLab.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Search import
content = content.replace("Info, Search,", "Info,");
content = content.replace("Info, Search", "Info");
content = content.replace("Search,", "");

// 2. Remove searchTerm state
content = content.replace(/const \[searchTerm, setSearchTerm\] = useState\(''\);\n?/, "");

// 3. Remove filteredServices logic
const filteredServicesRegex = /const filteredServices = services\s*\.filter\(s => \{\s*const term = searchTerm\.toLowerCase\(\);\s*return \(\s*s\.name\.toLowerCase\(\)\.includes\(term\) \|\|\s*\(s\.description && s\.description\.toLowerCase\(\)\.includes\(term\)\) \|\|\s*\(s\.areas && s\.areas\.toLowerCase\(\)\.includes\(term\)\)\s*\);\s*\}\)\s*\.sort\(\(a, b\) => a\.name\.localeCompare\(b\.name\)\);/;
content = content.replace(filteredServicesRegex, "const filteredServices = [...services].sort((a, b) => a.name.localeCompare(b.name));");

// 4. Update the text
const oldText = "Iniciativas e programas estruturados de Inovação e Gestão do Conhecimento.";
const newText = "Iniciativa de Gestão do Conhecimento, o Madrona Lab é o programa interno de desenvolvimento profissional, disseminação de conhecimento e padronização do escritório. Seus objetivos são capacitar os profissionais do escritório, incentivar a pesquisa jurídica e técnica, disseminar conhecimento entre as equipes e unidades de negócio, padronizar procedimentos e documentos internos e gerar oportunidades de negócios para os clientes do escritório, inclusive antecipando tendências.";
content = content.replace(oldText, newText);

// 5. Remove search bar
const searchBarRegex = /<div className="mb-6 relative max-w-sm">[\s\S]*?<\/div>\s*<\/div>\s*<div className="min-h-\[400px\]">/;
content = content.replace(searchBarRegex, `</div>\n      <div className="min-h-[400px]">`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("MadronaLab updated successfully");
