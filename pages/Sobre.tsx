import { useState, useEffect } from 'react';
import { Mail, Pencil, Save, X, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

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

interface SobreContent {
  heroTitle: string;
  heroDescription: string;
  compromissoTitle: string;
  compromissoText: string;
  recursosTitle: string;
  recursosList: string[];
  contatoTexto: string;
  contatoEmail: string;
}

const defaultContent: SobreContent = {
  heroTitle: 'Sobre o Hub',
  heroDescription: 'O Hub de Gestão do Conhecimento da Madrona Advogados reúne em um só lugar as principais iniciativas de GC, facilitando o acesso dos advogados e o acompanhamento de tendências legislativas, judiciárias e de mercado.',
  compromissoTitle: 'Nosso Compromisso',
  compromissoText: 'Nosso compromisso é transformar a informação em inteligência, garantindo segurança jurídica e agilidade na tomada de decisão. O Hub foi projetado para centralizar plataformas, bases de dados e ferramentas essenciais para o dia a dia jurídico.',
  recursosTitle: 'O que você encontra aqui?',
  recursosList: [
    'Acesso aos **Serviços de GC**, plataformas e bases de dados externas gerenciadas pela equipe.',
    'Monitoramento contínuo de **Jurisprudência** (Temas Repetitivos, Controvérsias do STJ, Repercussão Geral do STF).',
    'Acompanhamento Legislativo e **Monitoramento de Empresas**.',
    '**Clipping Corporativo** e fontes de curadoria confiáveis no Explorador.'
  ],
  contatoTexto: 'Dúvidas ou sugestões? Fale com a GC:',
  contatoEmail: 'gestaodoconhecimento@madronaadvogados.com.br'
};

export default function Sobre() {
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<SobreContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<SobreContent>(defaultContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'sobre');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setContent({ ...defaultContent, ...snap.data() });
        }
      } catch (err) {
        console.error('[Sobre] erro ao carregar:', err);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const isAdmin = checkIsAdmin(user);

  const handleEdit = () => {
    setEditForm(content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'sobre'), editForm);
      setContent(editForm);
      setIsEditing(false);
    } catch (err) {
      console.error('[Sobre] erro ao salvar:', err);
      alert('Erro ao salvar. Verifique as permissões.');
    } finally {
      setSaving(false);
    }
  };

  const renderBoldText = (text: string) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" size={24} /> Carregando...
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col w-full">
        <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#0a1e3f]">Editar Página Sobre</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar
              </button>
            </div>
          </div>

          <div className="space-y-6">
            
            <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex gap-2 items-start mb-6">
              <Info size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-grafite leading-relaxed">
                <strong>Dica de formatação:</strong> Você pode adicionar links personalizados usando o formato <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">[Texto](https://...)</code> e deixar o texto em negrito usando <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">**texto**</code>.
              </p>
            </div>
<div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Título Hero</label>
              <input
                type="text"
                value={editForm.heroTitle}
                onChange={e => setEditForm(f => ({ ...f, heroTitle: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descrição Hero</label>
              <textarea
                value={editForm.heroDescription}
                onChange={e => setEditForm(f => ({ ...f, heroDescription: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
              />
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">Título Compromisso</label>
              <input
                type="text"
                value={editForm.compromissoTitle}
                onChange={e => setEditForm(f => ({ ...f, compromissoTitle: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Texto Compromisso</label>
              <textarea
                value={editForm.compromissoText}
                onChange={e => setEditForm(f => ({ ...f, compromissoText: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
              />
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">Título Recursos</label>
              <input
                type="text"
                value={editForm.recursosTitle}
                onChange={e => setEditForm(f => ({ ...f, recursosTitle: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Lista de Recursos</label>
              <p className="text-xs text-gray-500 mb-2">Use **texto** para negrito.</p>
              <div className="space-y-2">
                {editForm.recursosList.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={e => {
                        const newList = [...editForm.recursosList];
                        newList[idx] = e.target.value;
                        setEditForm(f => ({ ...f, recursosList: newList }));
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        const newList = editForm.recursosList.filter((_, i) => i !== idx);
                        setEditForm(f => ({ ...f, recursosList: newList }));
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditForm(f => ({ ...f, recursosList: [...f.recursosList, ''] }))}
                  className="flex items-center gap-1 text-brand-blue font-medium text-sm hover:underline"
                >
                  <Plus size={16} /> Adicionar item
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">Texto Contato</label>
              <input
                type="text"
                value={editForm.contatoTexto}
                onChange={e => setEditForm(f => ({ ...f, contatoTexto: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Contato</label>
              <input
                type="email"
                value={editForm.contatoEmail}
                onChange={e => setEditForm(f => ({ ...f, contatoEmail: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col w-full relative">
      {isAdmin && !isEditing && (
        <button
          onClick={handleEdit}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Pencil size={16} />
          Editar Página
        </button>
      )}
      <div className="max-w-4xl mx-auto w-full">
        {/* HERO */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0a1e3f] tracking-tight mb-4">{content.heroTitle}</h1>
          <p className="text-lg text-brand-grafite max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
            {content.heroDescription}
          </p>
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 mb-8">
          {content.compromissoTitle && (
            <h2 className="text-xl font-bold text-[#0a1e3f] mb-4">{content.compromissoTitle}</h2>
          )}
          {content.compromissoText && (
            <p className="text-base text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
              {content.compromissoText}
            </p>
          )}
          
          {content.recursosTitle && (
            <h2 className="text-xl font-bold text-[#0a1e3f] mb-4">{content.recursosTitle}</h2>
          )}
          {content.recursosList && content.recursosList.length > 0 && (
            <ul className="space-y-3 text-base text-gray-600 leading-relaxed mb-8">
              {content.recursosList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                  <span>{renderBoldText(item)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider mb-2">Contato</h3>
            <p className="text-base text-brand-grafite flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-gray-600">{content.contatoTexto}</span>
              {content.contatoEmail && (
                <a
                  href={`mailto:${content.contatoEmail}`}
                  className="inline-flex items-center gap-2 text-brand-blue font-medium hover:underline break-all"
                >
                  <Mail size={16} className="flex-shrink-0" />
                  {content.contatoEmail}
                </a>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
