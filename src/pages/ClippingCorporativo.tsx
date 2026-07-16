import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Calendar, ChevronRight, Search, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { defaultClippingData } from './clipping/clippingData';
import { defaultClippingMaioData } from './clipping/clippingMaioData';
import { defaultClippingJunhoData } from './clipping/clippingJunhoData';
import { defaultClippingJulhoData } from './clipping/clippingJulhoData';

export default function ClippingCorporativo() {
  const [allClippings, setAllClippings] = useState<any>({
    'abril-2026': defaultClippingData,
    'maio-2026': defaultClippingMaioData,
    'junho-2026': defaultClippingJunhoData,
    'julho-2026': defaultClippingJulhoData
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClippings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'clippings'));
        const newClippings = { ...allClippings };
        querySnapshot.forEach((doc) => {
          if (doc.id === 'marco-2026') return;
          if (doc.exists() && doc.data().data) {
            newClippings[doc.id] = doc.data().data;
          }
        });
        setAllClippings(newClippings);
      } catch (err) {
        console.error("Error fetching clippings", err);
      }
    };
    fetchClippings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const term = searchQuery.toLowerCase();
    const results: any[] = [];
    
    // helper to get a nice edition name
    const getEditionName = (id: string) => {
      if (id === 'abril-2026') return '1ª Edição — Abril 2026';
      if (id === 'maio-2026') return '2ª Edição — Maio 2026';
      if (id === 'junho-2026') return '3ª Edição — Junho 2026';
      if (id === 'julho-2026') return '4ª Edição — Julho 2026';
      return id;
    };
    
    const getSectionName = (sec: string) => {
      if (sec === 'jurisprudencia') return 'Jurisprudência Comentada';
      if (sec === 'legislacao') return 'Legislação Comentada';
      if (sec === 'doutrinas') return 'Doutrinas Selecionadas';
      if (sec === 'relatorios') return 'Relatórios';
      if (sec === 'outrosNormativos') return 'Outros Normativos';
      return sec;
    };

    Object.keys(allClippings).forEach((editionId) => {
      const data = allClippings[editionId];
      if (!data) return;

      const sections = ['jurisprudencia', 'legislacao', 'doutrinas', 'relatorios', 'outrosNormativos'];
      sections.forEach(section => {
        if (Array.isArray(data[section])) {
          data[section].forEach((item: any) => {
            const searchableText = `${item.title || ''} ${item.subtitle || ''} ${item.content || ''} ${item.author || ''} ${item.description || ''} ${(item.paragraphs || []).join(' ')}`.toLowerCase();
            if (searchableText.includes(term)) {
              results.push({
                ...item,
                editionId,
                editionName: getEditionName(editionId),
                sectionName: getSectionName(section),
                sectionType: section
              });
            }
          });
        }
      });
    });
    
    return results;
  }, [allClippings, searchQuery]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-brand-grafite mb-2">Clipping UN Corporate</h1>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-brand-grafite/70" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-grafite focus:bg-white sm:text-sm transition-all"
            placeholder="Buscar em todos os clippings (ex: CVM, M&A, STJ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {searchQuery && (
          <div className="w-full mt-4 pt-4 border-t border-gray-50 flex justify-end">
            <button 
              onClick={() => setSearchQuery('')}
              className="text-sm font-bold text-brand-grafite hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {!searchQuery.trim() ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Edition Card Julho 2026 */}
          <Link 
            to="/clipping-corporativo/julho-2026"
            className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:border-brand-grafite/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-100 p-2.5 rounded-xl text-brand-grafite group-hover:bg-brand-grafite group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-grafite leading-tight">4ª Edição — Julho 2026</h3>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="font-semibold text-brand-grafite group-hover:text-brand-grafite/80">Ler edição</span>
              <ChevronRight size={18} className="text-brand-grafite/70 group-hover:text-brand-grafite transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Edition Card Junho 2026 */}
          <Link 
            to="/clipping-corporativo/junho-2026"
            className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:border-brand-grafite/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-100 p-2.5 rounded-xl text-brand-grafite group-hover:bg-brand-grafite group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-grafite leading-tight">3ª Edição — Junho 2026</h3>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="font-semibold text-brand-grafite group-hover:text-brand-grafite/80">Ler edição</span>
              <ChevronRight size={18} className="text-brand-grafite/70 group-hover:text-brand-grafite transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Edition Card Maio 2026 */}
          <Link 
            to="/clipping-corporativo/maio-2026"
            className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:border-brand-grafite/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-100 p-2.5 rounded-xl text-brand-grafite group-hover:bg-brand-grafite group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-grafite leading-tight">2ª Edição — Maio 2026</h3>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="font-semibold text-brand-grafite group-hover:text-brand-grafite/80">Ler edição</span>
              <ChevronRight size={18} className="text-brand-grafite/70 group-hover:text-brand-grafite transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Edition Card Abril 2026 */}
          <Link 
            to="/clipping-corporativo/abril-2026"
            className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:border-brand-grafite/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-100 p-2.5 rounded-xl text-brand-grafite group-hover:bg-brand-grafite group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-grafite leading-tight">1ª Edição — Abril 2026</h3>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="font-semibold text-brand-grafite group-hover:text-brand-grafite/80">Ler edição</span>
              <ChevronRight size={18} className="text-brand-grafite/70 group-hover:text-brand-grafite transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-brand-grafite mb-4">
            Resultados da busca ({searchResults.length})
          </h2>
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-brand-grafite">Nenhum resultado encontrado para "{searchQuery}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 max-w-4xl gap-6">
              {searchResults.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="bg-white rounded-xl shadow-sm border border-brand-grafite/20 p-6 sm:p-8 relative">
                  <Link to={`/clipping-corporativo/${item.editionId}`} className="absolute top-4 right-4 text-xs font-bold bg-slate-100 text-brand-grafite px-3 py-1 rounded-full hover:bg-brand-grafite hover:text-white transition-colors">
                    {item.editionName}
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 mb-4 pr-32">
                    <span className="bg-slate-100 text-brand-grafite text-xs font-bold px-2.5 py-1 rounded">{item.sectionName}</span>
                    {item.tag && <span className={`bg-${item.tagColor || 'gray'}-100 text-${item.tagColor || 'gray'}-800 text-xs font-bold px-2.5 py-1 rounded`}>{item.tag}</span>}
                    {item.subtitle && <span className="text-sm font-bold font-serif text-brand-grafite">{item.subtitle}</span>}
                  </div>
                  
                  <h3 className="text-xl font-bold text-brand-grafite mb-4 leading-tight">{item.title}</h3>
                  {item.author && <p className="text-sm font-medium text-brand-grafite mb-4">{item.author}</p>}

                  {item.sectionType === 'outrosNormativos' ? (
                    <div className="mb-4">
                      <p className="text-sm text-brand-grafite">{item.description}</p>
                    </div>
                  ) : item.sectionType === 'doutrinas' ? (
                    <div className="mb-4">
                      <p className="text-sm text-brand-grafite">
                        <span className="font-bold">Resumo: </span>{item.content}
                      </p>
                    </div>
                  ) : (
                    <div className="prose prose-sm text-brand-grafite mb-6 space-y-4">
                      {item.paragraphs?.length ? (
                        item.paragraphs.map((p: string, i: number) => (
                          <p key={i}>
                            {(i === 0 && !item.hideCommentLabel && item.sectionType !== 'relatorios') && <span className="font-bold">Comentário: </span>}
                            {p}
                          </p>
                        ))
                      ) : (
                        item.content && <p><span className="font-bold">Comentário: </span>{item.content}</p>
                      )}
                    </div>
                  )}

                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-brand-grafite text-brand-grafite hover:text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
                      Acessar íntegra
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
