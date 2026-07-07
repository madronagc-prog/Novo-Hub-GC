import fs from 'fs';

let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

const effect = `
  useEffect(() => {
    if (!loadingData && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView();
      }, 100);
    }
  }, [loadingData]);
`;

content = content.replace("  // IntersectionObserver — destaca seção", effect + "\n  // IntersectionObserver — destaca seção");

fs.writeFileSync('src/pages/ServicosGC.tsx', content);
