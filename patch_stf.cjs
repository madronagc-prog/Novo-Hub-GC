const fs = require('fs');
let content = fs.readFileSync('src/pages/RepercussaoGeralSTF.tsx', 'utf8');

const varsToRender = ['descricao'];

varsToRender.forEach(v => {
  let r2 = new RegExp(`\\{${v}\\s*\\|\\|\\s*['"]-['"]\\}`, 'g');
  content = content.replace(r2, `{${v} ? renderMarkdown(${v}) : '-'}`);
});

fs.writeFileSync('src/pages/RepercussaoGeralSTF.tsx', content);
