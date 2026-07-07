const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!content.includes('FlaskConical')) {
  content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
    return `import {${p1}, FlaskConical} from 'lucide-react';`;
  });
  fs.writeFileSync('src/components/Layout.tsx', content);
}
console.log('Fixed Layout import');
