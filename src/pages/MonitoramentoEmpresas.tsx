import { useState, useEffect } from 'react';
import { Search, ExternalLink, Calendar, Building2, Filter, Loader2, ChevronLeft, ChevronRight, FileText, RefreshCw, Briefcase } from 'lucide-react';

interface Noticia {
  id: string;
  titulo: string;
  link: string;
  data: string;
  empresa: string;
  setor: string;
}

export default function MonitoramentoEmpresas() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const fetchData = async () => {
    try {
      setLoading(true);
      const cacheBuster = new Date().getTime();
      const res = await fetch(`https://docs.google.com/spreadsheets/d/e/2PACX-1vRrUzIEIpHleGQobVkJ10bPs-nrni3GqUYGmZjkjrECyaQfLQvy12C7ywGM_n7W97lGRbEBTiMdSUaL/pubhtml/sheet?headers=false&gid=0&cb=${cacheBuster}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Falha ao carregar dados da planilha.');
      
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const rows = doc.querySelectorAll('tbody tr');
      const parsedData: Noticia[] = [];
      
      rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          const titulo = cells[0]?.textContent?.trim() || '';
          let link = cells[1]?.querySelector('a')?.getAttribute('href') || '';
          const data = cells[2]?.textContent?.trim() || '';
          const setor = cells[3]?.textContent?.trim() || '';
          const empresa = cells[4]?.textContent?.trim() || '';
          
          if (link.includes('google.com/url?q=')) {
            try {
              const urlParams = new URLSearchParams(link.split('?')[1]);
              link = urlParams.get('q') || link;
            } catch (e) {
              // Ignore parsing errors
            }
          }

          if (titulo && titulo.toLowerCase() !== 'título' && titulo !== 'TÍTULO DA NOTÍCIA') {
            parsedData.push({
              id: `noticia-${index}`,
              titulo,
              link,
              data,
              setor,
              empresa
            });
          }
        }
      });
      
      // Sort by date descending
      parsedData.sort((a, b) => {
        const parseDate = (d: string) => {
          if (!d) return 0;
          const parts = d.split('/');
          if (parts.length === 3) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
          }
          return 0;
        };
        return parseDate(b.data) - parseDate(a.data);
      });
      
      setNoticias(parsedData);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uniqueEmpresas = Array.from(new Set(noticias.map(n => n.empresa))).filter(Boolean).sort();
  const uniqueSetores = Array.from(new Set(noticias.map(n => n.setor))).filter(Boolean).sort();

  const filteredNoticias = noticias.filter(noticia => {
    const matchesSearch = 
      noticia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      noticia.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      noticia.setor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmpresa = filterEmpresa ? noticia.empresa === filterEmpresa : true;
    const matchesSetor = filterSetor ? noticia.setor === filterSetor : true;

    return matchesSearch && matchesEmpresa && matchesSetor;
  });

  const totalPages = Math.ceil(filteredNoticias.length / itemsPerPage);
  const paginatedNoticias = filteredNoticias.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEmpresa, filterSetor]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-brand-grafite mb-2">Monitoramento de Empresas</h1>
          <p className="text-brand-grafite">
            Acompanhamento dinâmico das publicações na mídia sobre as empresas monitoradas.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-brand-grafite px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Atualizando...' : 'Atualizar Dados'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-brand-grafite/70" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título, empresa ou setor..."
              className="block w-full pl-11 pr-4 py-3 text-base border-gray-200 focus:outline-none focus:ring-brand-grafite focus:border-brand-grafite sm:text-sm rounded-xl bg-gray-50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="block w-full pl-4 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-brand-grafite focus:border-brand-grafite sm:text-sm rounded-xl bg-gray-50 appearance-none transition-colors"
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
            >
              <option value="">Todas as Empresas</option>
              {uniqueEmpresas.map(empresa => (
                <option key={empresa} value={empresa}>{empresa}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-grafite">
              <Filter size={16} />
            </div>
          </div>
          
          <div className="relative">
            <select
              className="block w-full pl-4 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-brand-grafite focus:border-brand-grafite sm:text-sm rounded-xl bg-gray-50 appearance-none transition-colors"
              value={filterSetor}
              onChange={(e) => setFilterSetor(e.target.value)}
            >
              <option value="">Todos os Setores</option>
              {uniqueSetores.map(setor => (
                <option key={setor} value={setor}>{setor}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-grafite">
              <Filter size={16} />
            </div>
          </div>
        </div>
        {(searchTerm || filterEmpresa || filterSetor) && (
          <div className="w-full mt-4 pt-4 border-t border-gray-50 flex justify-end">
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterEmpresa('');
                setFilterSetor('');
              }}
              className="text-sm font-bold text-brand-grafite hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center justify-center font-medium">
          {error}
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 min-h-[400px]">
          <Loader2 className="w-8 h-8 text-brand-grafite animate-spin mb-4" />
          <p className="text-brand-grafite font-medium">Sincronizando dados...</p>
        </div>
      ) : (
        <>
          <div className="flex-1">
            {paginatedNoticias.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-brand-grafite">Nenhuma notícia encontrada</h3>
                <p className="mt-1 text-sm text-brand-grafite">Tente ajustar os filtros da busca.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {paginatedNoticias.map((noticia) => (
                  <div 
                    key={noticia.id} 
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-brand-grafite/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      {noticia.link ? (
                        <a 
                          href={noticia.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-lg font-bold text-brand-grafite hover:text-brand-grafite transition-colors line-clamp-2 md:line-clamp-1 mb-2 group-hover:underline decoration-brand-blue/30 underline-offset-4"
                        >
                          {noticia.titulo}
                        </a>
                      ) : (
                        <h3 className="text-lg font-bold text-brand-grafite line-clamp-2 md:line-clamp-1 mb-2">
                          {noticia.titulo}
                        </h3>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-brand-grafite">
                        {noticia.empresa && (
                          <button 
                            onClick={() => setFilterEmpresa(noticia.empresa)}
                            className="flex items-center gap-1.5 font-bold text-white bg-brand-blue hover:opacity-90 shadow-sm px-2.5 py-1 rounded-lg transition-opacity cursor-pointer"
                          >
                            <Building2 size={14} className="text-white/90" />
                            {noticia.empresa}
                          </button>
                        )}
                        {noticia.setor && (
                          <button 
                            onClick={() => setFilterSetor(noticia.setor)}
                            className="flex items-center gap-1.5 font-medium text-brand-grafite bg-gray-50 hover:bg-brand-blue/10 hover:text-brand-grafite hover:border-brand-grafite/30 px-2.5 py-1 rounded-lg border border-gray-200/60 transition-colors cursor-pointer"
                          >
                            <Briefcase size={14} className={filterSetor === noticia.setor ? "text-brand-grafite" : "text-brand-grafite/70"} />
                            {noticia.setor}
                          </button>
                        )}
                        {noticia.data && (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {noticia.data}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {noticia.link && (
                      <div className="sm:pl-4 sm:border-l border-gray-100 hidden sm:flex flex-shrink-0">
                        <a 
                          href={noticia.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-brand-blue/10 text-brand-grafite hover:text-brand-grafite font-medium rounded-xl transition-colors"
                        >
                          Acessar
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && totalPages > 1 && (
            <div className="mt-8 mb-4 flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-grafite hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-grafite hover:bg-gray-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-brand-grafite">
                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredNoticias.length)}</span> de <span className="font-medium">{filteredNoticias.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-xl px-2 py-2 text-brand-grafite/70 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, array) => {
                        if (index > 0 && page - array[index - 1] > 1) {
                          return (
                            <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-brand-grafite ring-1 ring-inset ring-gray-200 focus:outline-offset-0">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                              page === currentPage
                                ? 'z-10 bg-brand-blue text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue'
                                : 'text-brand-grafite ring-1 ring-inset ring-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-xl px-2 py-2 text-brand-grafite/70 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Próxima</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
