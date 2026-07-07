const fs = require('fs');
let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

if (!content.includes('import { useLocation }')) {
  content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useLocation } from 'react-router-dom';");
}

const effect = `
  const location = useLocation();

  useEffect(() => {
    if (!loadingData && location.hash) {
      setTimeout(() => {
        const id = location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [loadingData, location.hash]);
`;

content = content.replace(/  useEffect\(\(\) => \{\s*if \(!loadingData && window\.location\.hash\) \{[\s\S]*?\}, \[loadingData\]\);/, effect.trim());

// Also need to fix the useLocation hook inside the component
if (!content.includes('const location = useLocation();')) {
    content = content.replace("  const isAdmin        = checkIsAdmin(user);", "  const location = useLocation();\n  const isAdmin        = checkIsAdmin(user);");
    // Remove the extra one from our replace
    content = content.replace("  const location = useLocation();\n\n  useEffect(() => {", "  useEffect(() => {");
}

fs.writeFileSync('src/pages/ServicosGC.tsx', content);
