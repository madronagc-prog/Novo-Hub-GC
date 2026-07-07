const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Replace the entire import from lucide-react with a clean version
const regex = /import \{[\s\S]*?\} from 'lucide-react';/;
const newImport = `import {
  Search, LayoutDashboard, Info, Menu, X, FileText, Scale,
  ChevronDown, LogIn, LogOut, User, BookOpen, Briefcase, FlaskConical
} from 'lucide-react';`;

content = content.replace(regex, newImport);

fs.writeFileSync('src/components/Layout.tsx', content);
console.log('Fixed Layout import fully');
