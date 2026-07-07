// src/pages/ServicosGC.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Pencil, ChevronDown, X, Save, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Info, Search,
} from 'lucide-react';
import { servicesGCData, ServiceItem, CATEGORIES } from '../data/servicesGCData';
import { db, auth } from '../firebase';
import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// ──────────────────────────────────────────────────────────────────────────
// Emails com permissão de edição — mantidos em sincronia com firestore.rules
// ──────────────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  'carnivalofdisgustblog@gmail.com',
  'gc.madronafialho@gmail.com',
  'andrezzasoares08@gmail.com',
  'amandacarvaleite@gmail.com',
  'madrona.gc@gmail.com',
];

function checkIsAdmin(user: User | null): boolean {
  return !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

type ServiceOverride = Pick<ServiceItem, 'name' | 'description' | 'accessInfo' | 'areas' | 'featureGroups' | 'category'>;


// Função auxiliar para renderizar **negrito**, links [texto](url) e suporte a múltiplas linhas
function renderMarkdown(text: string | undefined) {
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
    return <span key={i}>{part}</span>;
  });
}


// ──────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────

function normalizeCategories(cat: string | string[] | undefined): string[] {
  if (!cat) return [];
  if (Array.isArray(cat)) return cat;
  return [cat];
}

export default function ServicosGC() {
  const [services, setServices]           = useState<ServiceItem[]>(servicesGCData);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editForm, setEditForm]           = useState<Partial<ServiceOverride>>({});
  const [saving, setSaving]               = useState(false);
  const [saveStatus, setSaveStatus]       = useState<'idle' | 'success' | 'error'>('idle');
  const [user, setUser]                   = useState<User | null>(null);
  const [loadingData, setLoadingData]     = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Monitorar estado de autenticação
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Carregar overrides do Firestore e sobrescrever dados base
  useEffect(() => {
    const loadServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'services'));
        const firestoreData: Record<string, Partial<ServiceOverride>> = {};
        querySnapshot.forEach(doc => {
          firestoreData[doc.id] = doc.data() as Partial<ServiceOverride>;
        });

        const mergedServices = servicesGCData
          .map(baseService => ({
            ...baseService,
            ...(firestoreData[baseService.id] ?? {})
          }))
          .filter(s => !(s as any).deleted);

        const baseIds = new Set(servicesGCData.map(s => s.id));
        querySnapshot.forEach(doc => {
          if (!baseIds.has(doc.id)) {
            const data = doc.data();
            if (!data.deleted) {
              mergedServices.push({ id: doc.id, ...data } as ServiceItem);
            }
          }
        });

        setServices(mergedServices);
      } catch (err) {
        // Firestore indisponível: usa dados base sem crash
        console.warn('[ServicosGC] erro ao carregar do Firestore:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadServices();
  }, []);


const location = useLocation();

  useEffect(() => {
    if (!loadingData && location.hash) {
      setTimeout(() => {
        const id = location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 160;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [loadingData, location.hash]);

// IntersectionObserver — destaca seção ativa na nav
  useEffect(() => {
    if (loadingData) return;
    const observers: IntersectionObserver[] = [];
    import('../data/servicesGCData').then(({ CATEGORIES }) => {
      CATEGORIES.forEach(cat => {
        const catSlug = cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const el = document.getElementById(`cat-${catSlug}`);
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

  // ── Handlers de edição ────────────────────────────────────────────────
  const openEdit = (service: ServiceItem | null) => {
    if (service) {
      setEditingId(service.id);
      setEditForm({
        name:          service.name,
        description:   service.description,
        accessInfo:    service.accessInfo || '',
        areas:         service.areas || '',
        featureGroups: service.featureGroups ? JSON.parse(JSON.stringify(service.featureGroups)) : [],
        category:      service.category || '',
      });
    } else {
      // Nova Plataforma
      const newId = `custom-${Date.now()}`;
      setEditingId(newId);
      setEditForm({
        name: '',
        description: '',
        accessInfo: '',
        areas: '',
        featureGroups: [],
        category: [CATEGORIES[0]],
      });
      // Add a temporary service to the list so we can render the editor there
      setServices(prev => [...prev, { id: newId, name: '', description: '', featureGroups: [], accessInfo: '', category: [CATEGORIES[0]] } as ServiceItem]);
    }
    setSaveStatus('idle');
  };

  const closeEdit = () => {
    if (saving) return;
    if (editingId && editingId.startsWith('custom-') && editForm.name === '') {
      setServices(prev => prev.filter(s => s.id !== editingId));
    }
    setEditingId(null);
    setEditForm({});
    setShowConfirmDelete(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      await setDoc(
        doc(db, 'services', editingId),
        {
          ...editForm,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.email ?? 'desconhecido',
        },
        { merge: true }
      );
      setServices(prev =>
        prev.map(s => s.id === editingId ? { ...s, ...editForm } as ServiceItem : s)
      );
      setSaveStatus('success');
      setTimeout(() => { setEditingId(null); setSaveStatus('idle'); setShowConfirmDelete(false); }, 1400);
    } catch (err) {
      console.error('[ServicosGC] erro ao salvar:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      // Usamos merge com deleted: true para permitir excluir itens base
      await setDoc(doc(db, 'services', editingId), { deleted: true }, { merge: true });
      setServices(prev => prev.filter(s => s.id !== editingId));
      closeEdit();
    } catch (err) {
      console.error('[ServicosGC] erro ao excluir:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setShowConfirmDelete(false);
    }
  };

  // ── Estado derivado ────────────────────────────────────────────────────
  const isAdmin        = checkIsAdmin(user);
  const editingService = services.find(s => s.id === editingId);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col w-full">
      <div className="max-w-7xl mx-auto w-full">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HERO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1e3f] tracking-tight">Serviços de GC</h1>
            <p className="text-brand-grafite mt-1 max-w-3xl">
              Plataformas, bases de dados e ferramentas gerenciadas pela equipe de Gestão do Conhecimento da Madrona Advogados.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openEdit(null)}
              className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Nova Plataforma
            </button>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            NAVEGAÇÃO INTERNA (sticky abaixo do header)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="sticky top-20 bg-gray-50 z-40 mb-6">
          <div className="flex overflow-x-auto gap-2 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CATEGORIES.map(cat => {
              const hasServices = services.some(s => normalizeCategories(s.category).includes(cat));
              if (!hasServices && !isAdmin) return null;
              const catSlug = cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
              return (
                <a
                  key={cat}
                  href={`#cat-${catSlug}`}
                  className={`
                    flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm
                    ${activeSection === catSlug
                      ? 'bg-brand-blue text-white'
                      : 'bg-white text-brand-grafite border border-gray-200 hover:bg-gray-50'}
                  `}
                >
                  {cat}
                </a>
              );
            })}
          </div>
        </div>
        {/* Caixa de Busca */}
        <div className="mb-6 relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar serviços..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue/30 focus:border-brand-blue/50 transition-all placeholder:text-gray-400 shadow-sm"
          />
        </div>


        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            LISTA DE SERVIÇOS AGRUPADOS POR CATEGORIA
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="space-y-10">

          {loadingData && (
            <div className="flex items-center justify-center gap-2 text-brand-grafite text-base py-6">
              <Loader2 size={18} className="animate-spin" />
              Carregando informações atualizadas…
            </div>
          )}

          {CATEGORIES.map(cat => {
            const catServices = [...services]
              .filter(s => normalizeCategories(s.category).includes(cat))
              .filter(s => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                return (
                  s.name.toLowerCase().includes(term) ||
                  (s.description && s.description.toLowerCase().includes(term)) ||
                  (s.areas && s.areas.toLowerCase().includes(term))
                );
              })
              .sort((a, b) => {
                const aName = a.name.trim();
                const bName = b.name.trim();
                if (aName === 'Sobre assinaturas digitais' || aName === 'INOVAGORA') return -1;
                if (bName === 'Sobre assinaturas digitais' || bName === 'INOVAGORA') return 1;
                return aName.localeCompare(bName);
              });
            
            if (catServices.length === 0 && !isAdmin) return null;

            const catSlug = cat.toLowerCase().replace(/[^a-z0-9]/g, '-');

            return (
              <div key={cat} id={`cat-${catSlug}`} className="scroll-mt-[160px]">
                {catServices.length > 0 && (
                  <h2 className="text-xl font-bold text-[#0a1e3f] mb-4 pl-2 border-l-4 border-brand-blue">
                    {cat}
                  </h2>
                )}
                
                <div className="space-y-4">
                  {catServices.map(service => {
                    const isOpen = expandedId === service.id;
                    const hasAccess = !!service.accessInfo;

                    return (
                      <div
                        key={service.id}
                        id={`svc-${service.id}`}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        {/* ── Cabeçalho do card ─────────────────────────── */}
                        <div
                          className="flex items-center gap-4 px-6 py-5 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedId(isOpen ? null : service.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-3">
                              {/* Nome principal */}
                              <span className="font-bold text-brand-blue text-xl">
                                {service.name}
                              </span>
                              {/* Nome completo (opcional) */}
                              {service.fullName && (
                                <span className="text-sm text-gray-500 hidden sm:inline">
                                  {service.fullName}
                                </span>
                              )}
                            </div>
                            {/* Preview da descrição quando fechado */}
                            {!isOpen && service.description && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-1 pr-4">
                                {renderMarkdown(service.description)}
                              </p>
                            )}
                          </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Botão de edição — visível apenas para admins */}
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(service); }}
                        className="p-2 rounded-xl text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                        title="Editar informações do serviço"
                        aria-label={`Editar ${service.name}`}
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    <div className="p-2 text-gray-400">
                      <ChevronDown
                        size={20}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Conteúdo expandido ────────────────────────── */}
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-gray-100 animate-[fadeIn_0.15s_ease-out]">

                    {/* O que é */}
                    <div className="mt-5 mb-6">
                      <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">
                        O que é
                      </p>
                      <p className="text-base text-brand-grafite leading-relaxed whitespace-pre-wrap">
                        {renderMarkdown(service.description)}
                    </p>
                  </div>

                  {/* Funcionalidades */}
                  {service.featureGroups.some(g => g.title.trim() || g.items.some(i => i.trim() !== '')) && (
                    <div className="mb-6">
                      <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-3">
                        Principais funcionalidades
                      </p>
                      <div className="space-y-4">
                        {service.featureGroups.map((group, gi) => {
                          const validItems = group.items.filter(i => i.trim() !== '');
                          if (!group.title.trim() && validItems.length === 0) return null;
                          return (
                            <div key={gi}>
                              {group.title.trim() && (
                                <p className="text-base font-semibold text-brand-grafite mb-2">
                                  {group.title}
                                </p>
                              )}
                              {validItems.length > 0 && (
                                <ul className="space-y-2">
                                  {validItems.map((item, ii) => (
                                    <li
                                      key={ii}
                                      className="flex items-start gap-2.5 text-base text-gray-600 leading-relaxed"
                                    >
                                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                                      {renderMarkdown(item)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rodapé: Áreas + Acesso */}
                  {(service.areas || service.accessInfo) && (
                  <div
                    className={`grid gap-6 mt-2 pt-5 border-t border-gray-100 ${
                      service.areas ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    {service.areas && (
                      <div>
                        <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">
                          Áreas cobertas
                        </p>
                        <p className="text-base text-brand-grafite">{renderMarkdown(service.areas)}</p>
                      </div>
                    )}
                    {service.accessInfo && (
                      <div>
                        <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">
                          Como acessar
                        </p>
                        <p className="text-base text-brand-grafite whitespace-pre-wrap">
                          {renderMarkdown(service.accessInfo)}
                        </p>
                      </div>
                    )}
                  </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    );
  })}
</div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL DE EDIÇÃO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {editingId && editingService && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4"
          onClick={closeEdit}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-brand-grafite text-base leading-tight">
                  Editar serviço
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{editingService.name}</p>
              </div>
              {!saving && (
                <button
                  onClick={closeEdit}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Formulário */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex gap-2 items-start mt-2">
                <Info size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-grafite leading-relaxed">
                  <strong>Dica de formatação:</strong> Você pode adicionar links personalizados usando o formato <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">[Texto](https://...)</code> e deixar o texto em negrito usando <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">**texto**</code>.
                </p>
              </div>


              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  Nome do serviço
                </label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = normalizeCategories(editForm.category).includes(cat);
                    return (
                      <label key={cat} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            const currentCats = normalizeCategories(editForm.category);
                            let newCats;
                            if (e.target.checked) {
                              newCats = [...currentCats, cat];
                            } else {
                              newCats = currentCats.filter(c => c !== cat);
                            }
                            setEditForm(f => ({ ...f, category: newCats }));
                          }}
                          className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue h-4 w-4"
                        />
                        {cat}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  O que é
                </label>
                <textarea
                  rows={5}
                  value={editForm.description ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  Como acessar{' '}
                  <span className="text-brand-red normal-case font-normal tracking-normal text-[11px]">
                    — campo principal a preencher
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={editForm.accessInfo ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, accessInfo: e.target.value }))}
                  placeholder="URL da plataforma, tipo de login, quem tem acesso, observações de uso…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  Áreas cobertas
                </label>
                <input
                  type="text"
                  value={editForm.areas ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, areas: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest">
                    Principais funcionalidades
                  </label>
                  <button
                    onClick={() => setEditForm(f => ({ ...f, featureGroups: [...(f.featureGroups || []), { title: '', items: [] }] }))}
                    className="text-brand-blue hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <Plus size={12} />
                    Adicionar grupo
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(editForm.featureGroups || []).map((group, groupIndex) => (
                    <div key={groupIndex} className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <input
                          type="text"
                          value={group.title}
                          onChange={e => {
                            const newGroups = [...(editForm.featureGroups || [])];
                            newGroups[groupIndex].title = e.target.value;
                            setEditForm(f => ({ ...f, featureGroups: newGroups }));
                          }}
                          placeholder="Título do grupo"
                          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm font-semibold text-brand-grafite focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                        <button
                          onClick={() => {
                            const newGroups = [...(editForm.featureGroups || [])];
                            newGroups.splice(groupIndex, 1);
                            setEditForm(f => ({ ...f, featureGroups: newGroups }));
                          }}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors"
                          title="Remover grupo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <textarea
                        rows={3}
                        value={group.items.join('\n')}
                        onChange={e => {
                          const newGroups = [...(editForm.featureGroups || [])];
                          newGroups[groupIndex].items = e.target.value.split('\n');
                          setEditForm(f => ({ ...f, featureGroups: newGroups }));
                        }}
                        placeholder="Lista de funcionalidades (uma por linha)"
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                      />
                    </div>
                  ))}
                  
                  {(!editForm.featureGroups || editForm.featureGroups.length === 0) && (
                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 text-gray-400 text-sm">
                      Nenhuma funcionalidade cadastrada.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer do modal */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-4">
                {editingId && !showConfirmDelete && (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    disabled={saving}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    title="Excluir serviço"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {showConfirmDelete && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-red-600">Excluir?</span>
                    <button
                      onClick={deleteService}
                      disabled={saving}
                      className="px-2 py-1 bg-red-600 text-white text-[11px] font-bold rounded hover:bg-red-700"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      disabled={saving}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-[11px] font-bold rounded hover:bg-gray-300"
                    >
                      Não
                    </button>
                  </div>
                )}
                <div className="text-sm min-h-[20px]">
                  {saveStatus === 'success' && (
                    <span className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle2 size={14} /> Salvo com sucesso
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-brand-red">
                      <AlertCircle size={14} /> Erro ao salvar — verifique as permissões
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closeEdit}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || saveStatus === 'success'}
                  className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-60"
                >
                  {saving
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Save size={13} />
                  }
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

