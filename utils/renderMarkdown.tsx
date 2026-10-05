import React from 'react';

// Função auxiliar para renderizar **negrito**, links [texto](url) e suporte a múltiplas linhas
export function renderMarkdown(text: string | undefined) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\)|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a 
          key={i} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-brand-blue hover:underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-brand-blue hover:underline font-medium break-all"
        >
          {part}
        </a>
      );
    }
    // Suporte a múltiplas linhas (quebras de linha)
    return <span key={i}>{part.split('\n').map((line, j, arr) => (
      <React.Fragment key={j}>
        {line}
        {j < arr.length - 1 && <br />}
      </React.Fragment>
    ))}</span>;
  });
}
