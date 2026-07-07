const fs = require('fs');

const files = [
  'src/pages/ProjetosDeLei.tsx',
  'src/pages/TemasRepetitivos.tsx',
  'src/pages/ControversiasSTJ.tsx',
  'src/pages/RepercussaoGeralSTF.tsx'
];

const formatTip = `
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex gap-2 items-start mt-2">
                <Info size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-grafite leading-relaxed">
                  <strong>Dica de formatação:</strong> Você pode adicionar links personalizados usando o formato <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">[Texto](https://...)</code> e deixar o texto em negrito usando <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">**texto**</code>.
                </p>
              </div>
`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Add Info to imports if not present
  if (content.includes('lucide-react') && !content.includes('Info,')) {
    content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
      return `import {${p1}, Info} from 'lucide-react';`;
    });
  }

  // Insert formatTip after <form onSubmit={handleSave}...>
  // using regex to match any attributes of the form
  const formRegex = /(<form\s+onSubmit=\{handleSave\}[^>]*>)/;
  if (formRegex.test(content) && !content.includes('Dica de formatação')) {
    content = content.replace(formRegex, `$1\n${formatTip}`);
  }

  fs.writeFileSync(file, content);
});
console.log('Done!');
