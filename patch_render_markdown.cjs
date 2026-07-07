const fs = require('fs');

let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

const regex = /\/\/ Função auxiliar para renderizar \*\*negrito\*\*.*?function renderMarkdown\(text: string \| undefined\) \{[\s\S]*?\}\n/g;

if (regex.test(content)) {
  content = content.replace(regex, '');
  content = "import { renderMarkdown } from '../utils/renderMarkdown';\n" + content;
  fs.writeFileSync('src/pages/ServicosGC.tsx', content);
}
console.log('ServicosGC patched');
