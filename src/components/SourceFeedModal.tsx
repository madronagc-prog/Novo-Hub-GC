import { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2, Calendar, AlertCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Source } from '../data/sources';

interface SourceFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: Source | null;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  source?: string;
}

export default function SourceFeedModal({ isOpen, onClose, source }: SourceFeedModalProps) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !source) return;

    const fetchFeed = async () => {
      setLoading(true);
      setError(null);
      setFeed([]);

      try {
        // Usando o Google News RSS como um proxy de busca para a fonte
        // Adicionamos o nome da fonte para buscar notícias relacionadas a ela
        let hostname = '';
        try {
          hostname = new URL(source.link).hostname;
        } catch (e) {
          // Ignora erro de URL inválida
        }
        
        const queryFragment = hostname ? `"${source.nome}" OR site:${hostname}` : `"${source.nome}"`;
        const query = encodeURIComponent(queryFragment);
        const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        
        // rss2json converte o XML do RSS em JSON de forma fácil e contorna problemas de CORS
        const apiKey = import.meta.env.VITE_RSS2JSON_KEY || '';
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=${apiKey}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Falha ao carregar o feed');
        
        const data = await response.json();
        
        if (data.status === 'ok') {
          setFeed(data.items || []);
        } else {
          throw new Error(data.message || 'Erro ao processar o feed');
        }
      } catch (err) {
        console.error('Erro ao buscar feed:', err);
        setError('Não foi possível carregar as últimas publicações no momento. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [isOpen, source]);

  if (!isOpen || !source) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-brand-grafite">
                {source.tema}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-brand-grafite">{source.nome}</h2>
            <a 
              href={source.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-brand-grafite hover:text-brand-grafite/80 flex items-center gap-1 mt-1 w-fit"
            >
              Visitar site original <ExternalLink size={14} />
            </a>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-brand-grafite/70 hover:text-brand-grafite hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-brand-grafite">
              <Loader2 className="w-8 h-8 animate-spin text-brand-grafite mb-4" />
              <p>Buscando últimas publicações...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500 text-center">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="max-w-md">{error}</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-brand-grafite text-center">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>Nenhuma publicação recente encontrada para esta fonte.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feed.map((item, index) => (
                <a 
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group bg-white border border-gray-100 rounded-xl p-5 hover:border-brand-grafite/30 hover:shadow-md transition-all"
                >
                  <h3 className="text-lg font-bold text-brand-grafite mb-2 group-hover:text-brand-grafite transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-brand-grafite mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(item.pubDate)}
                    </span>
                  </div>
                  <p className="text-sm text-brand-grafite line-clamp-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.contentSnippet || '') }} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
