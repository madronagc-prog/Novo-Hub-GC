const fs = require('fs');
let content = fs.readFileSync('src/pages/ProjetosDeLei.tsx', 'utf8');

// Add import
if (!content.includes('renderMarkdown')) {
  content = "import { renderMarkdown } from '../utils/renderMarkdown';\n" + content;
}

// Replace {pl.ementa} with {renderMarkdown(pl.ementa)}
content = content.replace(/\{pl\.ementa\}/g, '{renderMarkdown(pl.ementa)}');

fs.writeFileSync('src/pages/ProjetosDeLei.tsx', content);
console.log('ProjetosDeLei patched');
