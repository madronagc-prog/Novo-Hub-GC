const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// We need to import CATEGORIES
layout = layout.replace(
  "import {",
  "import { CATEGORIES } from '../data/servicesGCData';\nimport {"
);

const navItemsStr = `  const navItems = [
    { path: '/sobre', label: 'Sobre o Hub', icon: Info },
    {
      label: 'Serviços de GC',
      icon: Briefcase,
      path: '/servicos-gc', // we need to handle this because clicking the icon/label should probably go to /servicos-gc
      subItems: CATEGORIES.map(cat => ({
        path: '/servicos-gc#cat-' + cat.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: cat
      }))
    },
    {
      label: 'Jurisprudência',`;

layout = layout.replace(
  /  const navItems = \[\s*\{\s*path:\s*'\/sobre',\s*label:\s*'Sobre o Hub',\s*icon:\s*Info\s*\},[\s\S]*?\{\s*label:\s*'Jurisprudência',/,
  navItemsStr
);

fs.writeFileSync('src/components/Layout.tsx', layout);
