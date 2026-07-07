const fs = require('fs');

const files = [
  'src/pages/TemasRepetitivos.tsx',
  'src/pages/ControversiasSTJ.tsx',
  'src/pages/RepercussaoGeralSTF.tsx',
  'src/pages/ProjetosDeLei.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Add import if missing
  if (!content.includes('renderMarkdown')) {
    content = "import { renderMarkdown } from '../utils/renderMarkdown';\n" + content;
  }

  // Common replacements for {<var>} to {renderMarkdown(<var>)}
  const replacements = [
    /\{questao\}/g,
    /\{tese\}/g,
    /\{delimitacao\}/g,
    /\{anotacoes\}/g,
    /\{repercussao\}/g,
    /\{comentariosEscritorio\}/g,
    /\{controversia\}/g,
    /\{situacao\}/g
  ];

  // Also in some files they might use it differently, but the direct bracket notation is the most common for rendering text
  // Let's just do it string-based where it is not already renderMarkdown(...)
  
  // Actually, some might be {questao || '-'} 
  const varsToRender = ['questao', 'tese', 'delimitacao', 'anotacoes', 'repercussao', 'comentariosEscritorio', 'controversia'];

  varsToRender.forEach(v => {
    // Replace `{v}` with `{renderMarkdown(v)}`
    let r1 = new RegExp(`\\{${v}\\}`, 'g');
    content = content.replace(r1, `{renderMarkdown(${v})}`);
    
    // Replace `{v || '-'}` with `{v ? renderMarkdown(v) : '-'}`
    let r2 = new RegExp(`\\{${v}\\s*\\|\\|\\s*['"]-['"]\\}`, 'g');
    content = content.replace(r2, `{${v} ? renderMarkdown(${v}) : '-'}`);
  });

  fs.writeFileSync(file, content);
  console.log('Patched', file);
});
