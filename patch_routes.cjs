const fs = require('fs');

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  "import ServicosGC from './pages/ServicosGC';",
  "import ServicosGC from './pages/ServicosGC';\nimport MadronaLab from './pages/MadronaLab';"
);
appContent = appContent.replace(
  '<Route path="/sobre" element={<Sobre />} />',
  '<Route path="/sobre" element={<Sobre />} />\n              <Route path="/madrona-lab" element={<MadronaLab />} />'
);
fs.writeFileSync('src/App.tsx', appContent);

// Patch Layout.tsx
let layoutContent = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layoutContent = layoutContent.replace(
  "import { Briefcase, BookOpen, Menu, X, ChevronDown, LayoutDashboard, Scale, Info, User, LogOut, LogIn } from 'lucide-react';",
  "import { Briefcase, BookOpen, Menu, X, ChevronDown, LayoutDashboard, Scale, Info, User, LogOut, LogIn, FlaskConical } from 'lucide-react';"
);
const newNavItem = `
    {
      label: 'Madrona Lab',
      path: '/madrona-lab',
      icon: FlaskConical,
    },
`;
layoutContent = layoutContent.replace(
  /\{\s*label:\s*'Serviços de GC'/,
  newNavItem + "    {\n      label: 'Serviços de GC'"
);

fs.writeFileSync('src/components/Layout.tsx', layoutContent);
console.log('Routes and Layout patched');
