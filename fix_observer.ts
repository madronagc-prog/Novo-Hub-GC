import fs from 'fs';

let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

const effect = `
  // IntersectionObserver — destaca seção ativa na nav
  useEffect(() => {
    if (loadingData) return;
    const observers: IntersectionObserver[] = [];
    import('../data/servicesGCData').then(({ CATEGORIES }) => {
      CATEGORIES.forEach(cat => {
        const catSlug = cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const el = document.getElementById(\`cat-\${catSlug}\`);
        if (!el) return;
        const obs = new IntersectionObserver(
          ([entry]) => { if (entry.isIntersecting) setActiveSection(catSlug); },
          { rootMargin: '-160px 0px -60% 0px', threshold: 0 }
        );
        obs.observe(el);
        observers.push(obs);
      });
    });
    return () => observers.forEach(o => o.disconnect());
  }, [loadingData, services]); // added services to deps because categories are rendered only if they have services
`;

content = content.replace(/  \/\/ IntersectionObserver — destaca seção ativa na nav[\s\S]*?\}, \[services, loadingData\]\);/, effect.trim());

fs.writeFileSync('src/pages/ServicosGC.tsx', content);
