const fs = require('fs');

let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

const regex = /\/\/ Monitorar scroll para atualizar tag ativa[\s\S]*?import\('\.\.\/data\/servicesGCData'\)[\s\S]*?\}\);/g;
content = content.replace(regex, '');

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Observer fixed');
