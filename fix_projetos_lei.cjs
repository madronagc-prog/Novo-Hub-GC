const fs = require('fs');
let content = fs.readFileSync('src/pages/ProjetosDeLei.tsx', 'utf8');

// The title attribute cannot receive JSX elements.
content = content.replace(/title=\{renderMarkdown\(pl\.ementa\)\}/g, 'title={pl.ementa}');

fs.writeFileSync('src/pages/ProjetosDeLei.tsx', content);
console.log('Fixed ProjetosDeLei.tsx');
