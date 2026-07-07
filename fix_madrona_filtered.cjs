const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

const regex = /const filteredServices = services[\s\S]*?\.sort\(\(a, b\) => a\.name\.localeCompare\(b\.name\)\);/;
content = content.replace(regex, 'const filteredServices = [...services].sort((a, b) => a.name.localeCompare(b.name));');

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed MadronaLab filteredServices');
