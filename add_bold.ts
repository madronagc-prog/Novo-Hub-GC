import fs from 'fs';

let content = fs.readFileSync('src/pages/ServicosGC.tsx', 'utf8');

const renderMarkdown = `
// Função auxiliar para renderizar **negrito** e suporte a múltiplas linhas
function renderMarkdown(text: string | undefined) {
  if (!text) return null;
  const parts = text.split(/(\\*\\*.*?\\*\\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
`;

content = content.replace(
  "type ServiceOverride = Pick<ServiceItem, 'name' | 'description' | 'accessInfo' | 'areas' | 'featureGroups' | 'category'>;",
  "type ServiceOverride = Pick<ServiceItem, 'name' | 'description' | 'accessInfo' | 'areas' | 'featureGroups' | 'category'>;\n\n" + renderMarkdown
);

content = content.replace("{service.description}", "{renderMarkdown(service.description)}");
content = content.replace("{service.description}", "{renderMarkdown(service.description)}");
content = content.replace("{service.areas}", "{renderMarkdown(service.areas)}");
content = content.replace("{service.accessInfo}", "{renderMarkdown(service.accessInfo)}");
content = content.replace("{item}", "{renderMarkdown(item)}");

fs.writeFileSync('src/pages/ServicosGC.tsx', content);
