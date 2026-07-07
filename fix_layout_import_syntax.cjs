const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Replace the broken import
content = content.replace(
  "  ChevronDown, LogIn, LogOut, User, BookOpen, Briefcase,   // ← Briefcase adicionado, FlaskConical\n} from 'lucide-react';",
  "  ChevronDown, LogIn, LogOut, User, BookOpen, Briefcase, FlaskConical\n} from 'lucide-react';"
);

fs.writeFileSync('src/components/Layout.tsx', content);
console.log('Fixed Layout import syntax');
