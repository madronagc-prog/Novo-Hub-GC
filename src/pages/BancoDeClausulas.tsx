import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Copy,
  Check,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Bookmark,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Layers,
  Globe,
  Sparkles,
  Upload,
  RotateCcw,
  CheckSquare,
  Square,
  Hash,
  Info,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  Save,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { INITIAL_CLAUSULAS, Clausula, composeClausulaTitulo } from '../data/clausulasData';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { canEditBancoDeClausulas } from '../constants';

export type Variacao = '1C 1V' | '1C 2V' | '2C 1V' | '2C 2V';
export type Idioma = 'pt' | 'en';

// Helper to produce clean plain text for clipboard (fallback)
function convertClauseToPlainText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// Convert clause text to standard HTML fragment preserving <u> (underline), <b> (bold), <i> (italic)
function convertClauseToHtmlFragment(rawText: string): string {
  if (!rawText) return '';
  let formatted = rawText
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  // Convert markdown syntax if any into styled html tags
  formatted = formatted
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
    .replace(/__(.*?)__/g, '<u style="text-decoration: underline;">$1</u>')
    .replace(/\*([^*\n]+)\*/g, '<em style="font-style: italic;">$1</em>');

  // Ensure HTML tags have explicit inline styles for full Word & Google Docs compatibility
  formatted = formatted
    .replace(/<u>/gi, '<u style="text-decoration: underline;">')
    .replace(/<b>/gi, '<b style="font-weight: bold;">')
    .replace(/<strong>/gi, '<strong style="font-weight: bold;">')
    .replace(/<i>/gi, '<i style="font-style: italic;">')
    .replace(/<em>/gi, '<em style="font-style: italic;">');

  // Split into paragraphs by \n\n
  const paragraphs = formatted.split(/\n\s*\n/);
  return paragraphs
    .map(p => {
      const line = p.replace(/\n/g, '<br/>').trim();
      return `<p style="margin-top: 0pt; margin-bottom: 8pt; font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.25; color: #000000; text-align: justify;">${line}</p>`;
    })
    .join('');
}

// Wrap HTML fragment in a complete document for Microsoft Word / Google Docs clipboard
function wrapHtmlForClipboard(htmlFragment: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Cláusula</title>
<!--[if !mso]><!-->
<style>
p { margin-top: 0pt; margin-bottom: 8pt; font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.25; color: #000000; text-align: justify; }
u { text-decoration: underline; }
b, strong { font-weight: bold; }
i, em { font-style: italic; }
</style>
<!--<![endif]-->
</head>
<body style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.25; color: #000000;">
${htmlFragment}
</body>
</html>`;
}

// Copy single formatted text to clipboard with both text/html and text/plain
async function copyFormattedToClipboard(rawText: string): Promise<boolean> {
  if (!rawText) return false;
  const htmlContent = wrapHtmlForClipboard(convertClauseToHtmlFragment(rawText));
  const plainText = convertClauseToPlainText(rawText);

  // 1. Try modern Clipboard API with ClipboardItem (supports both text/html and text/plain)
  if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      await navigator.clipboard.write([item]);
      return true;
    } catch (e) {
      console.warn('ClipboardItem write failed, trying fallback:', e);
    }
  }

  // 2. Synchronous execCommand copy with oncopy event listener
  try {
    let success = false;
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/html', htmlContent);
        e.clipboardData.setData('text/plain', plainText);
        success = true;
      }
    };
    document.addEventListener('copy', handleCopy);
    document.execCommand('copy');
    document.removeEventListener('copy', handleCopy);
    if (success) return true;
  } catch (e) {
    console.warn('execCommand copy failed:', e);
  }

  // 3. Fallback to writeText (plain text)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(plainText);
      return true;
    }
  } catch (e) {
    console.error('All copy operations failed:', e);
  }

  return false;
}

// Copy multiple formatted clauses to clipboard with both text/html and text/plain
async function copyMultipleFormattedToClipboard(rawTexts: string[]): Promise<boolean> {
  const nonEmpty = rawTexts.filter(Boolean);
  if (nonEmpty.length === 0) return false;

  const fragments = nonEmpty.map(t => convertClauseToHtmlFragment(t));
  const combinedHtml = wrapHtmlForClipboard(fragments.join('<p style="margin: 0 0 12pt 0;"><br/></p>'));
  const combinedPlain = nonEmpty.map(t => convertClauseToPlainText(t)).join('\n\n');

  if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    try {
      const htmlBlob = new Blob([combinedHtml], { type: 'text/html' });
      const textBlob = new Blob([combinedPlain], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      await navigator.clipboard.write([item]);
      return true;
    } catch (e) {
      console.warn('Batch ClipboardItem write failed:', e);
    }
  }

  try {
    let success = false;
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/html', combinedHtml);
        e.clipboardData.setData('text/plain', combinedPlain);
        success = true;
      }
    };
    document.addEventListener('copy', handleCopy);
    document.execCommand('copy');
    document.removeEventListener('copy', handleCopy);
    if (success) return true;
  } catch (e) {
    console.warn('execCommand batch failed:', e);
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(combinedPlain);
      return true;
    }
  } catch (e) {
    console.error('All batch copy operations failed:', e);
  }

  return false;
}

// Helper to render text with safe inline formatting (<b>, <i>, <u>, <strong>, <em>, markdown)
function formatDisplayText(rawText: string): React.ReactNode {
  if (!rawText) return null;
  const decoded = rawText
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  const hasFormatting =
    /<(b|strong|i|em|u)>/i.test(decoded) ||
    /\*\*|__|\*|_/.test(decoded);

  if (!hasFormatting) {
    return decoded;
  }

  // Pre-process markdown syntax if any into html tags
  let html = decoded
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/\*([^*\n]+)\*/g, '<i>$1</i>');

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<span>${html}</span>`, 'text/html');
    const span = doc.body.firstElementChild;
    if (!span) return decoded;

    const renderNode = (node: Node, key: string | number): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const children = Array.from(el.childNodes).map((child, i) => renderNode(child, `${key}-${i}`));
        if (tag === 'b' || tag === 'strong') {
          return (
            <strong key={key} className="font-bold text-[#111827]">
              {children}
            </strong>
          );
        }
        if (tag === 'i' || tag === 'em') {
          return (
            <em key={key} className="italic">
              {children}
            </em>
          );
        }
        if (tag === 'u') {
          return (
            <span key={key} className="underline decoration-[#00b2ff]/70 underline-offset-2 font-medium">
              {children}
            </span>
          );
        }
        if (tag === 'br') {
          return <br key={key} />;
        }
        return <span key={key}>{children}</span>;
      }
      return null;
    };

    return Array.from(span.childNodes).map((child, idx) => renderNode(child, idx));
  } catch {
    return decoded;
  }
}

// Reusable text editor field with toolbar for Negrito, Itálico e Sublinhado
interface FormattedTextareaProps {
  label: React.ReactNode;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  labelIcon?: React.ReactNode;
  labelClassName?: string;
  extraAction?: React.ReactNode;
}

function FormattedTextarea({
  label,
  required,
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  labelIcon,
  labelClassName = "font-semibold text-[#333333]",
  extraAction
}: FormattedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const applyFormat = (openTag: string, closeTag: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.substring(start, end);
    const replacement = selected ? `${openTag}${selected}${closeTag}` : `${openTag}${closeTag}`;
    const nextVal = value.substring(0, start) + replacement + value.substring(end);

    onChange(nextVal);

    setTimeout(() => {
      el.focus();
      if (selected) {
        el.setSelectionRange(start, start + replacement.length);
      } else {
        el.setSelectionRange(start + openTag.length, start + openTag.length);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        applyFormat('<b>', '</b>');
      } else if (key === 'i') {
        e.preventDefault();
        applyFormat('<i>', '</i>');
      } else if (key === 'u') {
        e.preventDefault();
        applyFormat('<u>', '</u>');
      }
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className={`block text-xs ${labelClassName} flex items-center gap-1.5`}>
          {labelIcon}
          <span>{label}</span>
          {required && <span className="text-[#fc745c]">*</span>}
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          {extraAction}

          {/* Barra de Formatação: Negrito, Itálico e Sublinhado */}
          <div className="inline-flex items-center bg-white border border-[#b2bab9]/60 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => applyFormat('<b>', '</b>')}
              className="px-2 py-0.5 rounded text-[11px] font-bold text-gray-700 hover:text-black hover:bg-gray-100 transition-colors flex items-center gap-1"
              title="Inserir Negrito (Ctrl+B ou <b>...</b>)"
            >
              <Bold size={12} className="stroke-[2.5]" />
              <span className="text-[10px]">Negrito</span>
            </button>
            <div className="w-[1px] h-3 bg-gray-200 mx-0.5" />
            <button
              type="button"
              onClick={() => applyFormat('<i>', '</i>')}
              className="px-2 py-0.5 rounded text-[11px] italic text-gray-700 hover:text-black hover:bg-gray-100 transition-colors flex items-center gap-1"
              title="Inserir Itálico (Ctrl+I ou <i>...</i>)"
            >
              <Italic size={12} />
              <span className="text-[10px]">Itálico</span>
            </button>
            <div className="w-[1px] h-3 bg-gray-200 mx-0.5" />
            <button
              type="button"
              onClick={() => applyFormat('<u>', '</u>')}
              className="px-2 py-0.5 rounded text-[11px] underline text-gray-700 hover:text-black hover:bg-gray-100 transition-colors flex items-center gap-1"
              title="Inserir Sublinhado (Ctrl+U ou <u>...</u>)"
            >
              <Underline size={12} />
              <span className="text-[10px]">Sublinhado</span>
            </button>
          </div>

          {value.trim() && (
            <button
              type="button"
              onClick={() => setShowPreview(p => !p)}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-medium border transition-colors ${
                showPreview
                  ? 'bg-sky-50 text-[#007cb8] border-[#00b2ff]'
                  : 'bg-white text-gray-600 border-[#b2bab9]/60 hover:bg-gray-50'
              }`}
              title="Alternar prévia com formatação visual"
            >
              {showPreview ? 'Editar' : 'Prévia'}
            </button>
          )}
        </div>
      </div>

      {showPreview ? (
        <div className="w-full p-3 text-xs bg-[#f9fafb] border border-[#00b2ff]/40 rounded-xl leading-relaxed whitespace-pre-line min-h-[5.5rem] font-sans text-[#374151]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#00b2ff] mb-1">Prévia formatada:</div>
          {formatDisplayText(value)}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={
            className ||
            "w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none leading-relaxed font-sans"
          }
        />
      )}
    </div>
  );
}

// Helper to highlight search term matches safely
function highlightSearchMatch(text: string, term: string): React.ReactNode {
  if (!term.trim()) return text;
  const regex = new RegExp(`(${term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (regex.test(part)) {
      return (
        <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 font-medium">
          {part}
        </mark>
      );
    }
    return part;
  });
}

export function getFallbackContexto(tipo?: string): string {
  const t = (tipo || '').toLowerCase();
  if (t.includes('preço')) return 'Minuta para regulação do preço de aquisição, formas de pagamento, parcelamento e ajustes em operações de M&A (SPA).';
  if (t.includes('indeniza')) return 'Regime de indenização para reparação de perdas por descumprimento de obrigações e declarações contratuais.';
  if (t.includes('condiç')) return 'Condições precedentes suspensivas essenciais à eficácia e consumação do fechamento da transação.';
  if (t.includes('fechamento')) return 'Procedimentos, atos solenes e formalidades necessárias para consumação da transação na Data do Fechamento.';
  if (t.includes('negócio') || t.includes('condução')) return 'Obrigações e limitações de conduta (interim covenants) entre o signing e o closing.';
  if (t.includes('definiç') || t.includes('interpreta')) return 'Regras de interpretação contratual e conceitos uniformes com alocação acordada de riscos (arts. 421 e 421-A do CC).';
  if (t.includes('cade')) return 'Submissão e aprovação da operação societária perante as autoridades concorrenciais brasileiras.';
  if (t.includes('demanda') || t.includes('terceiro')) return 'Procedimento para condução, notificação e assunção de demandas judiciais, arbitrais ou administrativas de terceiros.';
  if (t.includes('objeto')) return 'Identificação das quotas ou ações objeto de compra e venda, titularidade e declaração de livre desembaraço de gravames.';
  return 'Minuta padrão para contratos de Compra e Venda de Ações / Quotas (SPA) com negociação direta.';
}

export function getFallbackPontos(tipo?: string): string {
  const t = (tipo || '').toLowerCase();
  if (t.includes('preço')) return 'Verificar contas bancárias de destino, parcelas diferidas com correção pelo CDI e eventual retenção em escrow.';
  if (t.includes('indeniza')) return 'Observar limitações temporais (sunset), tetos (cap), franquias mínimas (basket) e prazos de notificação de perdas.';
  if (t.includes('condiç')) return 'Atentar para a drop-dead date (data limite), dever de mútua cooperação e consequências do não implemento de condições.';
  if (t.includes('fechamento')) return 'Garantir a simultaneidade dos atos de fechamento: liquidação do preço, entrega de livros sociais e renúncia de administradores.';
  if (t.includes('negócio') || t.includes('condução')) return 'Atenção aos atos fora do curso ordinário e às regras concorrenciais para evitar gun jumping pré-CADE.';
  if (t.includes('definiç') || t.includes('interpreta')) return 'Garantir expressa exclusão de interpretação contra o redator (contra proferentem) e presunção de paridade negocial.';
  if (t.includes('cade')) return 'Verificar prazos regulatórios perante o CADE e responsabilidade pelo recolhimento de taxas processuais.';
  if (t.includes('demanda') || t.includes('terceiro')) return 'Cumprir prazo estrito de notificação do sinistro à parte indenizadora para não precluir o direito de defesa.';
  if (t.includes('objeto')) return 'Certificar a regularidade dos livros societários e a inexistência de ônus, penhoras ou direitos de preferência não exercidos.';
  return 'Verificar conformidade com a alocação de risco pactuada na LOI/MOU e preencher os dados dos anexos referenciados.';
}

export function getFallbackDefinicoes(tipo?: string): string {
  const t = (tipo || '').toLowerCase();
  if (t.includes('preço')) return 'Preço de Aquisição, Parcela do Fechamento, Parcelas Diferidas, CDI, Contas Bancárias.';
  if (t.includes('indeniza')) return 'Perdas, Parte Indenizada, Parte Indenizadora, Limitação Temporal, Reclamação.';
  if (t.includes('condiç')) return 'Condições Suspensivas, Notificação de Fechamento, Data Limite, Partes.';
  if (t.includes('fechamento')) return 'Data do Fechamento, Termo de Fechamento, Livro de Transferência, Ações Adquiridas.';
  if (t.includes('negócio') || t.includes('condução')) return 'Curso Ordinário dos Negócios, Notificação Prévia, Período Interino.';
  if (t.includes('definiç') || t.includes('interpreta')) return 'Partes, Contrato, Transação, Dias Úteis, Código Civil.';
  if (t.includes('cade')) return 'CADE, Aprovação Concorrencial, Notificação, Atos de Concentração.';
  if (t.includes('demanda') || t.includes('terceiro')) return 'Demanda de Terceiros, Notificação de Perda, Assessores Jurídicos, Acordo.';
  if (t.includes('objeto')) return 'Ações Adquiridas, Sociedade, Vendedores, Compradora.';
  return 'Partes, Contrato, Data do Fechamento, Perda, Compradora, Vendedores, Companhia.';
}

const STORAGE_DATA_KEY = 'banco_clausulas_user_data_v9';

function persistClausulas(list: Clausula[]) {
  try {
    localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not persist clausulas to localStorage', e);
  }
}

export default function BancoDeClausulas() {
  // Master list of clauses
  const [clausulas, setClausulas] = useState<Clausula[]>(() => {
    try {
      localStorage.removeItem('banco_clausulas_copies');
      const saved = localStorage.getItem(STORAGE_DATA_KEY);
      if (saved) {
        const parsed: Clausula[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_CLAUSULAS;
  });

  // Permissions: Admin or specific Banco de Cláusulas editor
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setCanEdit(canEditBancoDeClausulas(u?.email));
    });
    return () => unsubscribeAuth();
  }, []);

  // Modal for Edit / Add Clause
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClausulaId, setEditingClausulaId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'geral' | 'notas' | 'pt' | 'en'>('geral');
  const [formError, setFormError] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // User feedback toast and recently saved card highlight
  const [savedToastMessage, setSavedToastMessage] = useState<string | null>(null);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);

  const [formState, setFormState] = useState<{
    titulo: string;
    tipoClausula: string;
    subtipo: string;
    posicaoNegocial: string;
    selo: string;
    status: string;
    tagsInput: string;
    idiomaOriginal: string;
    tipoDocumento: string;
    contextoUso: string;
    pontosAtencao: string;
    definicoesUtilizadas: string;
    observacao: string;
    contribuidor: string;
    aprovador: string;
    textoOriginal: string;
    texto1C1V_pt: string;
    texto1C2V_pt: string;
    texto2C1V_pt: string;
    texto2C2V_pt: string;
    texto1C1V_en: string;
    texto1C2V_en: string;
    texto2C1V_en: string;
    texto2C2V_en: string;
    initialTextoOriginal: string;
  }>({
    titulo: '',
    tipoClausula: 'Preço',
    subtipo: '',
    posicaoNegocial: 'Neutro',
    selo: 'Padrão do Escritório',
    status: 'Publicado',
    tagsInput: '',
    idiomaOriginal: 'Português',
    tipoDocumento: 'SPA',
    contextoUso: '',
    pontosAtencao: '',
    definicoesUtilizadas: '',
    observacao: '',
    contribuidor: '',
    aprovador: '',
    textoOriginal: '',
    texto1C1V_pt: '',
    texto1C2V_pt: '',
    texto2C1V_pt: '',
    texto2C2V_pt: '',
    texto1C1V_en: '',
    texto1C2V_en: '',
    texto2C1V_en: '',
    texto2C2V_en: '',
    initialTextoOriginal: ''
  });

  // Global defaults
  const [globalVariacao, setGlobalVariacao] = useState<Variacao>('1C 1V');
  const [globalIdioma, setGlobalIdioma] = useState<Idioma>('pt');

  // Per-card selections: id -> { variacao, idioma, expanded }
  const [cardSettings, setCardSettings] = useState<Record<string, { variacao: Variacao; idioma: Idioma; expanded: boolean }>>({});

  // Multiple selection set
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Copy feedback state
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState<boolean>(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [selectedSubtipo, setSelectedSubtipo] = useState<string>('todos');
  const [selectedPosicao, setSelectedPosicao] = useState<string>('todos');
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [onlyPublicado, setOnlyPublicado] = useState<boolean>(true);

  // Filter options derived from dataset
  const posicoesNegociais = useMemo(() => {
    const defaultPos = ['Pro-Buyer', 'Pro-Seller', 'Neutro'];
    const extraSet = new Set<string>();
    clausulas.forEach(c => {
      if (c.posicaoNegocial && !defaultPos.some(dp => dp.toLowerCase() === c.posicaoNegocial.toLowerCase())) {
        extraSet.add(c.posicaoNegocial);
      }
    });
    return [...defaultPos, ...Array.from(extraSet).sort()];
  }, [clausulas]);

  // Filter options derived from dataset
  const tiposClausula = useMemo(() => {
    const set = new Set<string>();
    clausulas.forEach(c => {
      if (c.tipoClausula) set.add(c.tipoClausula);
    });
    return Array.from(set).sort();
  }, [clausulas]);

  const subtipos = useMemo(() => {
    const set = new Set<string>();
    clausulas.forEach(c => {
      if (selectedTipo === 'todos' || c.tipoClausula === selectedTipo) {
        if (c.subtipo) set.add(c.subtipo);
      }
    });
    return Array.from(set).sort();
  }, [clausulas, selectedTipo]);

  const tagsConceituais = useMemo(() => {
    const set = new Set<string>();
    clausulas.forEach(c => {
      c.tagsConceituais?.forEach(tag => {
        if (tag.trim()) set.add(tag.trim());
      });
    });
    return Array.from(set).sort();
  }, [clausulas]);

  // Sync copy counts to persistent storage
  const incrementCopyCount = useCallback((id: string, amount: number = 1) => {
    setClausulas(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, contadorCopias: (c.contadorCopias || 0) + amount } : c));
      persistClausulas(updated);
      return updated;
    });
  }, []);

  const incrementBatchCopyCount = useCallback((ids: string[]) => {
    setClausulas(prev => {
      const idSet = new Set(ids);
      const updated = prev.map(c => (idSet.has(c.id) ? { ...c, contadorCopias: (c.contadorCopias || 0) + 1 } : c));
      persistClausulas(updated);
      return updated;
    });
  }, []);

  // Modal actions: Add / Edit / Delete / Reset Counters
  const handleTipoChange = (newTipo: string) => {
    setFormState(prev => {
      const prevComposed = composeClausulaTitulo(prev.tipoClausula, prev.subtipo);
      const shouldUpdateTitle = !prev.titulo || prev.titulo === prevComposed;
      const newComposed = composeClausulaTitulo(newTipo, prev.subtipo);
      return {
        ...prev,
        tipoClausula: newTipo,
        titulo: shouldUpdateTitle ? newComposed : prev.titulo
      };
    });
  };

  const handleSubtipoChange = (newSubtipo: string) => {
    setFormState(prev => {
      const prevComposed = composeClausulaTitulo(prev.tipoClausula, prev.subtipo);
      const shouldUpdateTitle = !prev.titulo || prev.titulo === prevComposed;
      const newComposed = composeClausulaTitulo(prev.tipoClausula, newSubtipo);
      return {
        ...prev,
        subtipo: newSubtipo,
        titulo: shouldUpdateTitle ? newComposed : prev.titulo
      };
    });
  };

  const handleOpenCreate = () => {
    if (!canEdit) return;
    setEditingClausulaId(null);
    const defaultTipo = tiposClausula[0] || 'Preço';
    const defaultSubtipo = '';
    const defaultTitulo = composeClausulaTitulo(defaultTipo, defaultSubtipo);
    setFormState({
      titulo: defaultTitulo,
      textoOriginal: '',
      texto1C1V_pt: '',
      texto1C2V_pt: '',
      texto2C1V_pt: '',
      texto2C2V_pt: '',
      texto1C1V_en: '',
      texto1C2V_en: '',
      texto2C1V_en: '',
      texto2C2V_en: '',
      idiomaOriginal: 'Português',
      tipoClausula: defaultTipo,
      subtipo: defaultSubtipo,
      contextoUso: '',
      pontosAtencao: '',
      definicoesUtilizadas: '',
      posicaoNegocial: 'Neutro',
      tagsInput: '',
      observacao: '',
      selo: 'Nenhum',
      status: 'Publicado',
      contribuidor: '',
      aprovador: '',
      tipoDocumento: 'SPA',
      initialTextoOriginal: ''
    });
    setModalTab('geral');
    setFormError('');
    setDeleteConfirmId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Clausula) => {
    if (!canEdit) return;
    setEditingClausulaId(c.id);
    const initClause = INITIAL_CLAUSULAS.find(init => init.id === c.id);

    const tipo = c.tipoClausula !== undefined ? c.tipoClausula : (initClause?.tipoClausula || '');
    const subtipo = c.subtipo !== undefined ? c.subtipo : (initClause?.subtipo || '');
    const titulo = c.titulo !== undefined ? c.titulo : (initClause?.titulo || composeClausulaTitulo(tipo, subtipo));
    const textoOrig = c.textoOriginal !== undefined ? c.textoOriginal : (initClause?.textoOriginal || c.texto1C1V_pt || initClause?.texto1C1V_pt || '');
    const texto1C1V = c.texto1C1V_pt !== undefined ? c.texto1C1V_pt : (initClause?.texto1C1V_pt || textoOrig);

    // Metadados e Notas: respeitar estritamente o valor salvo no card (inclusive vazio / em branco)
    const contexto = c.contextoUso !== undefined ? c.contextoUso : (initClause?.contextoUso ?? '');
    const pontos = c.pontosAtencao !== undefined ? c.pontosAtencao : (initClause?.pontosAtencao ?? '');
    const definicoes = c.definicoesUtilizadas !== undefined ? c.definicoesUtilizadas : (initClause?.definicoesUtilizadas ?? '');
    const observacao = c.observacao !== undefined ? c.observacao : (initClause?.observacao ?? '');
    const aprovador = c.aprovador !== undefined ? c.aprovador : (initClause?.aprovador ?? '');
    const contribuidor = c.contribuidor !== undefined ? c.contribuidor : (initClause?.contribuidor ?? '');
    const tags = Array.isArray(c.tagsConceituais) ? c.tagsConceituais : (initClause?.tagsConceituais || []);

    setFormState({
      titulo,
      textoOriginal: textoOrig,
      texto1C1V_pt: texto1C1V,
      texto1C2V_pt: c.texto1C2V_pt !== undefined ? c.texto1C2V_pt : (initClause?.texto1C2V_pt ?? ''),
      texto2C1V_pt: c.texto2C1V_pt !== undefined ? c.texto2C1V_pt : (initClause?.texto2C1V_pt ?? ''),
      texto2C2V_pt: c.texto2C2V_pt !== undefined ? c.texto2C2V_pt : (initClause?.texto2C2V_pt ?? ''),
      texto1C1V_en: c.texto1C1V_en !== undefined ? c.texto1C1V_en : (initClause?.texto1C1V_en ?? ''),
      texto1C2V_en: c.texto1C2V_en !== undefined ? c.texto1C2V_en : (initClause?.texto1C2V_en ?? ''),
      texto2C1V_en: c.texto2C1V_en !== undefined ? c.texto2C1V_en : (initClause?.texto2C1V_en ?? ''),
      texto2C2V_en: c.texto2C2V_en !== undefined ? c.texto2C2V_en : (initClause?.texto2C2V_en ?? ''),
      idiomaOriginal: c.idiomaOriginal || initClause?.idiomaOriginal || 'Português',
      tipoClausula: tipo,
      subtipo,
      contextoUso: contexto,
      pontosAtencao: pontos,
      definicoesUtilizadas: definicoes,
      posicaoNegocial: c.posicaoNegocial || initClause?.posicaoNegocial || 'Neutro',
      tagsInput: tags.join(', '),
      observacao,
      selo: c.selo || initClause?.selo || 'Padrão do Escritório',
      status: c.status || initClause?.status || 'Publicado',
      contribuidor,
      aprovador,
      tipoDocumento: c.tipoDocumento || initClause?.tipoDocumento || 'SPA',
      initialTextoOriginal: textoOrig
    });
    setModalTab('geral');
    setFormError('');
    setDeleteConfirmId(null);
    setModalOpen(true);
  };

  const handleFillVariationsFromOriginal = () => {
    const base = formState.textoOriginal.trim() || formState.texto1C1V_pt.trim();
    if (!base) return;
    setFormState(prev => ({
      ...prev,
      textoOriginal: base,
      texto1C1V_pt: base,
      texto1C2V_pt: base,
      texto2C1V_pt: base,
      texto2C2V_pt: base
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const composed = composeClausulaTitulo(formState.tipoClausula, formState.subtipo);
    const finalTitulo = formState.titulo.trim() || composed || 'Sem título';

    const effectiveOriginal = formState.textoOriginal.trim() || formState.texto1C1V_pt.trim();
    if (!effectiveOriginal) {
      setFormError('Informe ao menos o Texto Original ou o Texto 1C 1V em português.');
      setModalTab('geral');
      return;
    }

    const tags = formState.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    // Intelligent sync: only propagate original to 1C1V if 1C1V was matching original before edit
    const textOriginalWasEdited = formState.textoOriginal.trim() !== formState.initialTextoOriginal.trim();
    const was1C1VMatchingOriginal =
      formState.initialTextoOriginal.trim() !== '' &&
      formState.texto1C1V_pt.trim() === formState.initialTextoOriginal.trim();
    const updated1C1V =
      textOriginalWasEdited && was1C1VMatchingOriginal
        ? formState.textoOriginal.trim()
        : formState.texto1C1V_pt.trim();

    // Se o status for alterado para Rascunho ou Em Revisão, ajusta filtro para que o card continue visível na tela
    if (formState.status !== 'Publicado' && onlyPublicado) {
      setOnlyPublicado(false);
    }

    if (editingClausulaId) {
      setClausulas(prev => {
        const updated = prev.map(c => {
          if (c.id === editingClausulaId) {
            return {
              ...c,
              titulo: finalTitulo,
              textoOriginal: formState.textoOriginal.trim() || effectiveOriginal,
              texto1C1V_pt: updated1C1V,
              texto1C2V_pt: formState.texto1C2V_pt.trim(),
              texto2C1V_pt: formState.texto2C1V_pt.trim(),
              texto2C2V_pt: formState.texto2C2V_pt.trim(),
              texto1C1V_en: formState.texto1C1V_en.trim(),
              texto1C2V_en: formState.texto1C2V_en.trim(),
              texto2C1V_en: formState.texto2C1V_en.trim(),
              texto2C2V_en: formState.texto2C2V_en.trim(),
              idiomaOriginal: formState.idiomaOriginal,
              tipoClausula: formState.tipoClausula.trim() || 'Geral',
              subtipo: formState.subtipo.trim(),
              contextoUso: formState.contextoUso.trim(),
              pontosAtencao: formState.pontosAtencao.trim(),
              definicoesUtilizadas: formState.definicoesUtilizadas.trim(),
              posicaoNegocial: formState.posicaoNegocial,
              tagsConceituais: tags,
              observacao: formState.observacao.trim(),
              selo: formState.selo,
              status: formState.status,
              contribuidor: formState.contribuidor.trim(),
              aprovador: formState.aprovador.trim(),
              tipoDocumento: formState.tipoDocumento.trim() || 'SPA'
            };
          }
          return c;
        });
        persistClausulas(updated);
        return updated;
      });

      setRecentlySavedId(editingClausulaId);
      setSavedToastMessage(`Cláusula "${finalTitulo}" salva e atualizada no card!`);
      setTimeout(() => {
        setRecentlySavedId(null);
        setSavedToastMessage(null);
      }, 3500);
    } else {
      const newId = `clausula-${Date.now()}`;
      const newClausula: Clausula = {
        id: newId,
        titulo: finalTitulo,
        textoOriginal: effectiveOriginal,
        texto1C1V_pt: updated1C1V,
        texto1C2V_pt: formState.texto1C2V_pt.trim(),
        texto2C1V_pt: formState.texto2C1V_pt.trim(),
        texto2C2V_pt: formState.texto2C2V_pt.trim(),
        texto1C1V_en: formState.texto1C1V_en.trim(),
        texto1C2V_en: formState.texto1C2V_en.trim(),
        texto2C1V_en: formState.texto2C1V_en.trim(),
        texto2C2V_en: formState.texto2C2V_en.trim(),
        idiomaOriginal: formState.idiomaOriginal,
        tipoClausula: formState.tipoClausula.trim() || 'Geral',
        subtipo: formState.subtipo.trim(),
        contextoUso: formState.contextoUso.trim(),
        pontosAtencao: formState.pontosAtencao.trim(),
        definicoesUtilizadas: formState.definicoesUtilizadas.trim(),
        posicaoNegocial: formState.posicaoNegocial,
        tagsConceituais: tags,
        observacao: formState.observacao.trim(),
        selo: formState.selo,
        status: formState.status,
        contadorCopias: 0,
        contribuidor: formState.contribuidor.trim(),
        aprovador: formState.aprovador.trim(),
        dataAprovacao: new Date().toLocaleDateString('pt-BR'),
        substitui: '',
        tipoDocumento: formState.tipoDocumento.trim() || 'SPA',
        tipoItem: 'Item'
      };
      setClausulas(prev => {
        const updated = [newClausula, ...prev];
        persistClausulas(updated);
        return updated;
      });

      setRecentlySavedId(newId);
      setSavedToastMessage(`Nova cláusula "${finalTitulo}" cadastrada com sucesso!`);
      setTimeout(() => {
        setRecentlySavedId(null);
        setSavedToastMessage(null);
      }, 3500);
    }

    setModalOpen(false);
  };

  const handleDeleteClausula = (id: string) => {
    setClausulas(prev => {
      const updated = prev.filter(c => c.id !== id);
      persistClausulas(updated);
      return updated;
    });
    setModalOpen(false);
  };

  // Get active clause text based on variacao and idioma
  const getClauseText = useCallback((clausula: Clausula, variacao: Variacao, idioma: Idioma): string => {
    if (idioma === 'pt') {
      switch (variacao) {
        case '1C 1V':
          return clausula.texto1C1V_pt !== undefined ? clausula.texto1C1V_pt : (clausula.textoOriginal || '');
        case '1C 2V':
          return clausula.texto1C2V_pt !== undefined ? clausula.texto1C2V_pt : (clausula.textoOriginal || '');
        case '2C 1V':
          return clausula.texto2C1V_pt !== undefined ? clausula.texto2C1V_pt : (clausula.textoOriginal || '');
        case '2C 2V':
          return clausula.texto2C2V_pt !== undefined ? clausula.texto2C2V_pt : (clausula.textoOriginal || '');
        default:
          return clausula.textoOriginal || '';
      }
    } else {
      switch (variacao) {
        case '1C 1V':
          return clausula.texto1C1V_en !== undefined ? clausula.texto1C1V_en : '';
        case '1C 2V':
          return clausula.texto1C2V_en !== undefined ? clausula.texto1C2V_en : '';
        case '2C 1V':
          return clausula.texto2C1V_en !== undefined ? clausula.texto2C1V_en : '';
        case '2C 2V':
          return clausula.texto2C2V_en !== undefined ? clausula.texto2C2V_en : '';
        default:
          return clausula.texto1C1V_en !== undefined ? clausula.texto1C1V_en : '';
      }
    }
  }, []);

  // Filtered clauses
  const filteredClausulas = useMemo(() => {
    return clausulas.filter(c => {
      // 10. Não mostrar cláusulas cujo Status seja diferente de "Publicado"
      if (onlyPublicado && c.status !== 'Publicado') {
        return false;
      }

      // 1º filtro: Tipo de Cláusula
      if (selectedTipo !== 'todos' && c.tipoClausula !== selectedTipo) {
        return false;
      }

      // 2º filtro: Subtipo
      if (selectedSubtipo !== 'todos' && c.subtipo !== selectedSubtipo) {
        return false;
      }

      // 3º filtro: Posição Negocial (Pro-Buyer, Pro-Seller, Neutro)
      if (selectedPosicao !== 'todos') {
        const cPos = (c.posicaoNegocial || 'Neutro').toLowerCase().trim();
        const targetPos = selectedPosicao.toLowerCase().trim();
        if (targetPos === 'pro-buyer') {
          if (!cPos.includes('buyer')) return false;
        } else if (targetPos === 'pro-seller') {
          if (!cPos.includes('seller')) return false;
        } else if (targetPos === 'neutro') {
          if (cPos.includes('buyer') || cPos.includes('seller') || (cPos !== 'neutro' && cPos !== '')) return false;
        } else {
          if (cPos !== targetPos) return false;
        }
      }

      // 4º filtro: Tags Conceituais
      if (selectedTag !== 'todos' && (!c.tagsConceituais || !c.tagsConceituais.includes(selectedTag))) {
        return false;
      }

      // Busca por texto livre (procura no Título composto, Tipo, Subtipo, Tags e Texto Original)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const inTitulo = (c.titulo || '').toLowerCase().includes(query);
        const inTipo = (c.tipoClausula || '').toLowerCase().includes(query);
        const inSubtipo = (c.subtipo || '').toLowerCase().includes(query);
        const inTextoOriginal = (c.textoOriginal || '').toLowerCase().includes(query);
        const inTags = (c.tagsConceituais || []).some(t => t.toLowerCase().includes(query));

        if (!inTitulo && !inTipo && !inSubtipo && !inTextoOriginal && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [clausulas, onlyPublicado, selectedTipo, selectedSubtipo, selectedPosicao, selectedTag, searchTerm]);

  // Card toggle functions
  const getCardVariacao = (id: string): Variacao => cardSettings[id]?.variacao ?? globalVariacao;
  const getCardIdioma = (id: string): Idioma => cardSettings[id]?.idioma ?? globalIdioma;
  const isCardExpanded = (id: string): boolean => cardSettings[id]?.expanded ?? false;

  const setCardVariacao = (id: string, variacao: Variacao) => {
    setCardSettings(prev => ({
      ...prev,
      [id]: {
        variacao,
        idioma: prev[id]?.idioma ?? globalIdioma,
        expanded: prev[id]?.expanded ?? false
      }
    }));
  };

  const setCardIdioma = (id: string, idioma: Idioma) => {
    setCardSettings(prev => ({
      ...prev,
      [id]: {
        variacao: prev[id]?.variacao ?? globalVariacao,
        idioma,
        expanded: prev[id]?.expanded ?? false
      }
    }));
  };

  const toggleCardExpanded = (id: string) => {
    setCardSettings(prev => ({
      ...prev,
      [id]: {
        variacao: prev[id]?.variacao ?? globalVariacao,
        idioma: prev[id]?.idioma ?? globalIdioma,
        expanded: !(prev[id]?.expanded ?? false)
      }
    }));
  };

  // Copy single card preserving rich formatting (underline, bold, italic)
  const handleCopyCard = async (clausula: Clausula) => {
    const variacao = getCardVariacao(clausula.id);
    const idioma = getCardIdioma(clausula.id);
    const rawText = getClauseText(clausula, variacao, idioma);

    const success = await copyFormattedToClipboard(rawText);
    if (success) {
      incrementCopyCount(clausula.id, 1);
      setCopiedCardId(clausula.id);
      setTimeout(() => setCopiedCardId(null), 2000);
    }
  };

  // Selection toggle
  const toggleSelectCard = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedIds.size === filteredClausulas.length && filteredClausulas.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClausulas.map(c => c.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Copy all selected clauses joined by blank line preserving rich formatting
  const handleCopySelected = async () => {
    if (selectedIds.size === 0) return;

    const selectedList = clausulas.filter(c => selectedIds.has(c.id));
    const rawTexts = selectedList.map(c => {
      const variacao = getCardVariacao(c.id);
      const idioma = getCardIdioma(c.id);
      return getClauseText(c, variacao, idioma);
    });

    const success = await copyMultipleFormattedToClipboard(rawTexts);
    if (success) {
      incrementBatchCopyCount(selectedList.map(c => c.id));
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2500);
    }
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTipo('todos');
    setSelectedSubtipo('todos');
    setSelectedPosicao('todos');
    setSelectedTag('todos');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedTipo !== 'todos' ||
    selectedSubtipo !== 'todos' ||
    selectedPosicao !== 'todos' ||
    selectedTag !== 'todos';

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#444444] font-sans pb-28">
      {/* Top Header / Banner */}
      <div className="bg-white border-b border-[#b2bab9]/40 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#222222] tracking-tight">
                Banco de Cláusulas
              </h1>
              <p className="text-xs sm:text-sm text-[#666666] mt-1">
                Repositório institucional de minutas, redações contratuais padronizadas e variações bilíngues (PT/EN).
              </p>
            </div>

            {/* Quick Global Configuration */}
            <div className="flex flex-wrap items-center gap-3 bg-[#f3f4f6] p-2.5 rounded-xl border border-[#b2bab9]/40 text-xs">
              <span className="text-xs font-semibold text-[#555555] flex items-center gap-1">
                <Layers size={14} className="text-[#00b2ff]" /> Padrão global:
              </span>

              {/* Global Variation Selector */}
              <div className="flex bg-white rounded-lg p-0.5 border border-[#b2bab9]/50 shadow-2xs">
                {(['1C 1V', '1C 2V', '2C 1V', '2C 2V'] as Variacao[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setGlobalVariacao(v)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      globalVariacao === v
                        ? 'bg-[#00b2ff] text-white shadow-xs font-bold'
                        : 'text-[#555555] hover:text-[#111111] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Global Language Selector */}
              <div className="flex bg-white rounded-lg p-0.5 border border-[#b2bab9]/50 shadow-2xs">
                <button
                  onClick={() => setGlobalIdioma('pt')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    globalIdioma === 'pt'
                      ? 'bg-[#00b2ff] text-white shadow-xs font-bold'
                      : 'text-[#555555] hover:text-[#111111] hover:bg-[#f3f4f6]'
                  }`}
                >
                  PT
                </button>
                <button
                  onClick={() => setGlobalIdioma('en')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    globalIdioma === 'en'
                      ? 'bg-[#00b2ff] text-white shadow-xs font-bold'
                      : 'text-[#555555] hover:text-[#111111] hover:bg-[#f3f4f6]'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Action: Nova Cláusula */}
              {canEdit && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00b2ff] text-white hover:brightness-110 font-bold transition-all shadow-xs active:scale-95"
                    title="Cadastrar uma nova cláusula no banco"
                  >
                    <Plus size={14} />
                    <span>Nova Cláusula</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Search & Filters Section */}
        <div className="bg-white rounded-2xl p-5 border border-[#b2bab9]/50 shadow-sm mb-6">
          {/* Free Text Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por texto livre no Título, Texto Original, subtipo ou palavras-chave..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#fcfcfd] border border-[#b2bab9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00b2ff] focus:border-transparent text-[#222222] placeholder-[#888888] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#888888] hover:text-[#222222]"
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1º Filtro: Tipo de Cláusula */}
            <div>
              <label className="block font-semibold text-[#555555] mb-1">Tipo de Cláusula</label>
              <select
                value={selectedTipo}
                onChange={e => {
                  setSelectedTipo(e.target.value);
                  setSelectedSubtipo('todos');
                }}
                className="w-full py-2 px-2.5 bg-white border border-[#b2bab9] rounded-lg text-[#333333] focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
              >
                <option value="todos">Todos os tipos ({tiposClausula.length})</option>
                {tiposClausula.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 2º Filtro: Subtipo */}
            <div>
              <label className="block font-semibold text-[#555555] mb-1">Subtipo</label>
              <select
                value={selectedSubtipo}
                onChange={e => setSelectedSubtipo(e.target.value)}
                className="w-full py-2 px-2.5 bg-white border border-[#b2bab9] rounded-lg text-[#333333] focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
              >
                <option value="todos">Todos os subtipos ({subtipos.length})</option>
                {subtipos.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 3º Filtro: Posição Negocial (Pro-Buyer, Pro-Seller, Neutro) */}
            <div>
              <label className="block font-semibold text-[#555555] mb-1">Posição Negocial</label>
              <select
                value={selectedPosicao}
                onChange={e => setSelectedPosicao(e.target.value)}
                className="w-full py-2 px-2.5 bg-white border border-[#b2bab9] rounded-lg text-[#333333] focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
              >
                <option value="todos">Todas as posições</option>
                {posicoesNegociais.map(pos => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* 4º Filtro: Tags Conceituais */}
            <div>
              <label className="block font-semibold text-[#555555] mb-1">Tags Conceituais</label>
              <select
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
                className="w-full py-2 px-2.5 bg-white border border-[#b2bab9] rounded-lg text-[#333333] focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
              >
                <option value="todos">Todas as tags ({tagsConceituais.length})</option>
                {tagsConceituais.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count & Select all toolbar */}
          <div className="mt-4 pt-3 border-t border-[#b2bab9]/30 flex flex-wrap items-center justify-between gap-3 text-xs text-[#666666]">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAllVisible}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#b2bab9] hover:border-[#00b2ff] hover:text-[#00b2ff] bg-white font-medium transition-colors"
              >
                {selectedIds.size === filteredClausulas.length && filteredClausulas.length > 0 ? (
                  <>
                    <CheckSquare size={15} className="text-[#00b2ff]" /> Desmarcar visíveis
                  </>
                ) : (
                  <>
                    <Square size={15} /> Selecionar visíveis ({filteredClausulas.length})
                  </>
                )}
              </button>

              {selectedIds.size > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="text-xs text-[#888888] hover:text-[#fc745c] underline"
                >
                  Limpar seleção ({selectedIds.size})
                </button>
              )}

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-[#fc745c] hover:underline inline-flex items-center gap-1 font-medium ml-2"
                >
                  <RotateCcw size={12} /> Limpar filtros
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-[#222222]">
                Mostrando {filteredClausulas.length} de {clausulas.length} cláusulas
              </span>
              <span className="text-[#999999]">|</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyPublicado}
                  onChange={e => setOnlyPublicado(e.target.checked)}
                  className="rounded text-[#00b2ff] focus:ring-[#00b2ff]"
                />
                <span>Apenas status "Publicado"</span>
              </label>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredClausulas.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#b2bab9]/50 shadow-sm max-w-xl mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-[#f0f9ff] text-[#00b2ff] flex items-center justify-center mx-auto mb-4">
              <Search size={22} />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#222222] mb-1">
              Nenhuma cláusula encontrada
            </h3>
            <p className="text-sm text-[#666666] mb-5">
              Não encontramos nenhuma cláusula correspondente aos critérios de busca ou filtros aplicados.
            </p>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00b2ff] text-white rounded-xl font-medium text-sm hover:brightness-105 transition-all shadow-xs"
            >
              <RotateCcw size={15} />
              Redefinir filtros
            </button>
          </div>
        )}

        {/* List of Cards */}
        <div className="space-y-5">
          {filteredClausulas.map(clausula => {
            const cardVariacao = getCardVariacao(clausula.id);
            const cardIdioma = getCardIdioma(clausula.id);
            const isExpanded = isCardExpanded(clausula.id);
            const isSelected = selectedIds.has(clausula.id);
            const displayText = getClauseText(clausula, cardVariacao, cardIdioma);
            const isCopied = copiedCardId === clausula.id;

            // Selo badge styling
            const isPadrao = clausula.selo === 'Padrão do Escritório';
            const isValidada = clausula.selo === 'Validada pela Curadoria';

            // Negocial Position badge styling
            const isProBuyer = clausula.posicaoNegocial?.toLowerCase().includes('buyer');
            const isProSeller = clausula.posicaoNegocial?.toLowerCase().includes('seller');

            const cardTitulo = clausula.titulo || composeClausulaTitulo(clausula.tipoClausula, clausula.subtipo);
            const isRecentlySaved = recentlySavedId === clausula.id;

            return (
              <div
                key={clausula.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isRecentlySaved
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                    : isSelected
                    ? 'border-[#00b2ff] ring-2 ring-[#00b2ff]/20 shadow-md'
                    : 'border-[#b2bab9]/60 shadow-xs hover:shadow-md hover:border-[#b2bab9]'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 bg-[#fafbfc]/50">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Checkbox + Title + Badges */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCard(clausula.id)}
                          className="w-4 h-4 rounded text-[#00b2ff] focus:ring-[#00b2ff] border-[#b2bab9] cursor-pointer"
                          title="Marcar para cópia múltipla"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Saved indicator badge */}
                          {isRecentlySaved && (
                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                              <Check size={12} className="stroke-3" /> Alteração Salva
                            </span>
                          )}

                          {/* Selo Badge (Req. 9) */}
                          {isPadrao ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ff] text-[#007cb8] border border-[#00b2ff]/40 shadow-2xs">
                              {clausula.selo}
                            </span>
                          ) : isValidada ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D0FFCC]/60 text-[#20661c] border border-[#9ae893]">
                              {clausula.selo}
                            </span>
                          ) : clausula.selo && clausula.selo !== 'Nenhum' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-[#555555] border border-gray-200">
                              {clausula.selo}
                            </span>
                          ) : null}

                          {/* Tipo & Subtipo */}
                          {clausula.tipoClausula && (
                            <span className="text-xs font-medium text-[#555555] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                              {clausula.tipoClausula}
                            </span>
                          )}
                          {clausula.subtipo && (
                            <span className="text-xs text-[#666666] bg-[#f9fafb] px-2 py-0.5 rounded border border-[#b2bab9]/40">
                              {clausula.subtipo}
                            </span>
                          )}

                          {/* Posição Negocial Badge */}
                          {clausula.posicaoNegocial && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-medium ${
                                isProBuyer
                                  ? 'bg-[#e0f2fe] text-[#0369a1]'
                                  : isProSeller
                                  ? 'bg-[#fef3c7] text-[#92400e]'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {clausula.posicaoNegocial}
                            </span>
                          )}
                        </div>

                        {/* Clause Title (Composto por Tipo de Cláusula e Subtipo) */}
                        <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1f2937] leading-snug">
                          {highlightSearchMatch(cardTitulo, searchTerm)}
                        </h2>
                      </div>
                    </div>

                    {/* Right: Copy Counter + Copy Button */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 pt-1">
                      {/* Copy Counter (Req. 8) */}
                      <span className="text-xs text-[#777777] bg-[#f3f4f6] px-2 py-0.5 rounded-md border border-[#b2bab9]/30 font-medium whitespace-nowrap">
                        {clausula.contadorCopias === 1
                          ? '1 cópia realizada'
                          : `${clausula.contadorCopias || 0} cópias`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Edit Button */}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(clausula)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-[#b2bab9]/70 hover:border-[#00b2ff] text-[#555555] hover:text-[#00b2ff] bg-white transition-all hover:bg-sky-50/40"
                            title="Editar os textos, variações e notas desta cláusula"
                          >
                            <Edit3 size={13} />
                            <span>Editar</span>
                          </button>
                        )}

                        {/* Single Copy Button (Req. 6) */}
                        <button
                          onClick={() => handleCopyCard(clausula)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                            isCopied
                              ? 'bg-[#22c55e] text-white shadow-sm'
                              : 'bg-[#00b2ff] text-white hover:brightness-105 active:scale-95'
                          }`}
                          title="Copiar texto da cláusula na variação e idioma selecionados"
                        >
                          {isCopied ? (
                            <>
                              <Check size={14} className="stroke-3" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selectors Bar (Req. 4) */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Variação Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#666666] font-medium">Variação:</span>
                        <div className="inline-flex rounded-lg bg-white border border-[#b2bab9]/70 p-0.5 shadow-2xs">
                          {(['1C 1V', '1C 2V', '2C 1V', '2C 2V'] as Variacao[]).map(v => (
                            <button
                              key={v}
                              onClick={() => setCardVariacao(clausula.id, v)}
                              className={`px-2 py-1 rounded text-xs transition-all font-medium ${
                                cardVariacao === v
                                  ? 'bg-[#00b2ff] text-white font-bold shadow-2xs'
                                  : 'text-[#555555] hover:text-[#111111] hover:bg-gray-100'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Idioma Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#666666] font-medium">Idioma:</span>
                        <div className="inline-flex rounded-lg bg-white border border-[#b2bab9]/70 p-0.5 shadow-2xs">
                          <button
                            onClick={() => setCardIdioma(clausula.id, 'pt')}
                            className={`px-2 py-1 rounded text-xs transition-all font-medium ${
                              cardIdioma === 'pt'
                                ? 'bg-[#00b2ff] text-white font-bold shadow-2xs'
                                : 'text-[#555555] hover:text-[#111111] hover:bg-gray-100'
                            }`}
                          >
                            Português
                          </button>
                          <button
                            onClick={() => setCardIdioma(clausula.id, 'en')}
                            className={`px-2 py-1 rounded text-xs transition-all font-medium ${
                              cardIdioma === 'en'
                                ? 'bg-[#00b2ff] text-white font-bold shadow-2xs'
                                : 'text-[#555555] hover:text-[#111111] hover:bg-gray-100'
                            }`}
                          >
                            Inglês
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body: Text Content (Req. 1 & 4) */}
                <div className="p-5 sm:p-6 pt-4 text-sm leading-relaxed text-[#374151]">
                  <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#b2bab9]/30 font-sans whitespace-pre-line text-[13.5px]">
                    {displayText && displayText.trim() ? (
                      formatDisplayText(displayText)
                    ) : (
                      <span className="text-gray-400 italic">Em branco (nenhum texto cadastrado para esta variação).</span>
                    )}
                  </div>
                </div>

                {/* Card Notes: Contexto de Uso e Pontos de Atenção sempre visíveis */}
                <div className="p-5 sm:p-6 pt-3 border-t border-gray-100 bg-[#fbfcfd]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Contexto de Uso */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#b2bab9]/40 shadow-2xs">
                      <span className="font-bold text-[#333333] block mb-1 flex items-center gap-1.5">
                        <FileText size={13} className="text-[#00b2ff]" />
                        <span>Contexto de Uso</span>
                      </span>
                      <div className="text-[#555555] leading-relaxed whitespace-pre-line font-sans">
                        {clausula.contextoUso && clausula.contextoUso.trim() ? (
                          formatDisplayText(clausula.contextoUso)
                        ) : (
                          <span className="text-gray-400 italic">Em branco</span>
                        )}
                      </div>
                    </div>

                    {/* Pontos de Atenção (Req. 5 & Attention Red) */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#b2bab9]/40 shadow-2xs">
                      <span className="font-bold text-[#fc745c] block mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-[#fc745c]" />
                        <span>Pontos de Atenção</span>
                      </span>
                      <div className="text-[#555555] leading-relaxed whitespace-pre-line font-sans">
                        {clausula.pontosAtencao && clausula.pontosAtencao.trim() ? (
                          formatDisplayText(clausula.pontosAtencao)
                        ) : (
                          <span className="text-gray-400 italic">Em branco</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Footer bar inside card */}
                  <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-wrap items-center justify-between text-[11px] text-[#777777] gap-2">
                    <div>
                      <span>Aprovador: </span>
                      <strong className="text-[#444444]">
                        {clausula.aprovador && clausula.aprovador.trim() ? (
                          clausula.aprovador
                        ) : (
                          <span className="text-gray-400 italic font-normal">Não informado</span>
                        )}
                      </strong>
                      {clausula.contribuidor && clausula.contribuidor.trim() ? (
                        <span className="ml-3">
                          Contribuidor: <strong className="text-[#444444]">{clausula.contribuidor}</strong>
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {clausula.tipoDocumento && (
                        <span>Documento: <strong className="text-[#444444]">{clausula.tipoDocumento}</strong></span>
                      )}
                      <span>Status: <strong className="text-[#22c55e]">{clausula.status}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Bar: Sticky "Copiar Selecionadas" (Req. 7) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-[#222222] text-white rounded-2xl p-4 shadow-2xl border border-[#444444] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00b2ff] text-white flex items-center justify-center font-bold text-xs">
                {selectedIds.size}
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {selectedIds.size === 1 ? '1 cláusula selecionada' : `${selectedIds.size} cláusulas selecionadas`}
                </p>
                <p className="text-[11px] text-gray-300">
                  Os textos serão copiados com as variações e idiomas escolhidos em cada cartão.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearSelection}
                className="px-3 py-1.5 text-xs text-gray-300 hover:text-white rounded-xl transition-colors"
              >
                Desmarcar
              </button>

              <button
                onClick={handleCopySelected}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                  copiedBatch
                    ? 'bg-[#22c55e] text-white'
                    : 'bg-[#00b2ff] text-white hover:brightness-110'
                }`}
              >
                {copiedBatch ? (
                  <>
                    <Check size={16} className="stroke-3" />
                    <span>{selectedIds.size} Copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copiar selecionadas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal for Edit / Add Clause */}
      {modalOpen && canEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#b2bab9]/60 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#b2bab9]/30 flex items-center justify-between bg-[#fafbfc]">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1f2937] flex items-center gap-2">
                  {editingClausulaId ? (
                    <>
                      <Edit3 size={18} className="text-[#00b2ff]" /> Editar Cláusula
                    </>
                  ) : (
                    <>
                      <Plus size={18} className="text-[#00b2ff]" /> Adicionar Nova Cláusula
                    </>
                  )}
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  {editingClausulaId
                    ? 'Modifique os textos, variações e metadados desta minuta jurídica.'
                    : 'Cadastre uma nova cláusula no banco de conhecimento com variações e metadados.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar formulário"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-[#b2bab9]/30 bg-[#f8f9fa] px-6 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('geral')}
                className={`py-3 px-4 border-b-2 inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  modalTab === 'geral'
                    ? 'border-[#00b2ff] text-[#00b2ff] bg-white font-bold'
                    : 'border-transparent text-[#666666] hover:text-[#222222]'
                }`}
              >
                <Layers size={14} /> Dados Principais
              </button>
              <button
                type="button"
                onClick={() => setModalTab('pt')}
                className={`py-3 px-4 border-b-2 inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  modalTab === 'pt'
                    ? 'border-[#00b2ff] text-[#00b2ff] bg-white font-bold'
                    : 'border-transparent text-[#666666] hover:text-[#222222]'
                }`}
              >
                <Bookmark size={14} /> Variações em Português
              </button>
              <button
                type="button"
                onClick={() => setModalTab('en')}
                className={`py-3 px-4 border-b-2 inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  modalTab === 'en'
                    ? 'border-[#00b2ff] text-[#00b2ff] bg-white font-bold'
                    : 'border-transparent text-[#666666] hover:text-[#222222]'
                }`}
              >
                <Globe size={14} /> Variações em Inglês
              </button>
              <button
                type="button"
                onClick={() => setModalTab('notas')}
                className={`py-3 px-4 border-b-2 inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  modalTab === 'notas'
                    ? 'border-[#00b2ff] text-[#00b2ff] bg-white font-bold'
                    : 'border-transparent text-[#666666] hover:text-[#222222]'
                }`}
              >
                <FileText size={14} /> Notas
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#fc745c] rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Tab 1: Dados Principais */}
              {modalTab === 'geral' && (
                <div className="space-y-4 text-xs">
                  {/* Bloco de Identificação */}
                  <div className="bg-[#fafbfc] p-4 rounded-xl border border-[#b2bab9]/40 space-y-4">
                    {/* Título da Cláusula */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#333333]">
                          Título da Cláusula <span className="text-[#fc745c]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const composed = composeClausulaTitulo(formState.tipoClausula, formState.subtipo);
                            setFormState(prev => ({ ...prev, titulo: composed }));
                          }}
                          className="text-[11px] text-[#00b2ff] hover:underline font-medium"
                          title="Recalcular título automático a partir do Tipo e Subtipo"
                        >
                          Sugerir por Tipo + Subtipo
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={formState.titulo}
                        onChange={e => setFormState(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ex: Preço - Ajuste de Preço"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none font-medium text-[#1f2937]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-[#333333] mb-1">
                          Tipo de Cláusula <span className="text-[#fc745c]">*</span>
                        </label>
                        <input
                          type="text"
                          list="tipos-list"
                          required
                          value={formState.tipoClausula}
                          onChange={e => handleTipoChange(e.target.value)}
                          placeholder="Ex: Preço, Indenização, Declarações"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        />
                        <datalist id="tipos-list">
                          {tiposClausula.map(t => (
                            <option key={t} value={t} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#333333] mb-1">Subtipo</label>
                        <input
                          type="text"
                          list="subtipos-list"
                          value={formState.subtipo}
                          onChange={e => handleSubtipoChange(e.target.value)}
                          placeholder="Ex: Pagamento Parcelado, Quitação"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        />
                        <datalist id="subtipos-list">
                          {subtipos.map(st => (
                            <option key={st} value={st} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-[#333333] mb-1">Posição Negocial</label>
                        <select
                          value={formState.posicaoNegocial}
                          onChange={e => setFormState(prev => ({ ...prev, posicaoNegocial: e.target.value }))}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        >
                          <option value="Neutro">Neutro</option>
                          <option value="Pro-Buyer">Pro-Buyer</option>
                          <option value="Pro-Seller">Pro-Seller</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#333333] mb-1">Selo Institucional</label>
                        <select
                          value={formState.selo}
                          onChange={e => setFormState(prev => ({ ...prev, selo: e.target.value }))}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        >
                          <option value="Padrão do Escritório">Padrão do Escritório</option>
                          <option value="Validada pela Curadoria">Validada pela Curadoria</option>
                          <option value="Nenhum">Nenhum</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#333333] mb-1">Status da Cláusula</label>
                        <select
                          value={formState.status}
                          onChange={e => setFormState(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        >
                          <option value="Publicado">Publicado</option>
                          <option value="Rascunho">Rascunho</option>
                          <option value="Em Revisão">Em Revisão</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[#333333] mb-1">
                          Tags Conceituais (separadas por vírgula)
                        </label>
                        <input
                          type="text"
                          value={formState.tagsInput}
                          onChange={e => setFormState(prev => ({ ...prev, tagsInput: e.target.value }))}
                          placeholder="Ex: Parcela do Fechamento, Retenção, IPCA"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#333333] mb-1">Tipo de Documento</label>
                        <input
                          type="text"
                          value={formState.tipoDocumento}
                          onChange={e => setFormState(prev => ({ ...prev, tipoDocumento: e.target.value }))}
                          placeholder="Ex: SPA, Acordo de Sócios"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#333333] mb-1">Idioma Original</label>
                      <select
                        value={formState.idiomaOriginal}
                        onChange={e => setFormState(prev => ({ ...prev, idiomaOriginal: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                      >
                        <option value="Português">Português</option>
                        <option value="Inglês">Inglês</option>
                      </select>
                    </div>
                  </div>

                  {/* Texto Original */}
                  <div className="bg-[#fafbfc] p-4 rounded-xl border border-[#b2bab9]/40 space-y-2">
                    <FormattedTextarea
                      label="Texto Original (Minuta Padrão)"
                      required
                      rows={6}
                      value={formState.textoOriginal}
                      onChange={val => setFormState(prev => ({ ...prev, textoOriginal: val }))}
                      placeholder="Cole aqui o texto completo da minuta da cláusula..."
                      extraAction={
                        <button
                          type="button"
                          onClick={handleFillVariationsFromOriginal}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00b2ff] text-white rounded-lg font-semibold hover:brightness-105 transition-all text-xs flex-shrink-0 shadow-2xs"
                        >
                          <Sparkles size={12} />
                          <span>Copiar Original para 1C/2C</span>
                        </button>
                      }
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Variações em Português */}
              {modalTab === 'pt' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-[#e8f7ff]/70 border border-[#00b2ff]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-[#007cb8]">
                      Preencha ou ajuste as redações específicas conforme o número de partes (Compradores e Vendedores).
                    </p>
                    <button
                      type="button"
                      onClick={handleFillVariationsFromOriginal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00b2ff] text-white rounded-lg font-semibold hover:brightness-105 transition-all text-xs flex-shrink-0"
                    >
                      <Sparkles size={13} />
                      <span>Copiar Original para Todas</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <FormattedTextarea
                      label="Texto 1C 1V (1 Comprador, 1 Vendedor)"
                      rows={4}
                      value={formState.texto1C1V_pt}
                      onChange={val => setFormState(prev => ({ ...prev, texto1C1V_pt: val }))}
                      placeholder="Redação adaptada para 1 Comprador e 1 Vendedor..."
                    />

                    <FormattedTextarea
                      label="Texto 1C 2V (1 Comprador, 2+ Vendedores)"
                      rows={4}
                      value={formState.texto1C2V_pt}
                      onChange={val => setFormState(prev => ({ ...prev, texto1C2V_pt: val }))}
                      placeholder="Redação adaptada para 1 Comprador e 2 ou mais Vendedores..."
                    />

                    <FormattedTextarea
                      label="Texto 2C 1V (2+ Compradores, 1 Vendedor)"
                      rows={4}
                      value={formState.texto2C1V_pt}
                      onChange={val => setFormState(prev => ({ ...prev, texto2C1V_pt: val }))}
                      placeholder="Redação adaptada para 2 ou mais Compradores e 1 Vendedor..."
                    />

                    <FormattedTextarea
                      label="Texto 2C 2V (2+ Compradores, 2+ Vendedores)"
                      rows={4}
                      value={formState.texto2C2V_pt}
                      onChange={val => setFormState(prev => ({ ...prev, texto2C2V_pt: val }))}
                      placeholder="Redação adaptada para 2 ou mais Compradores e 2 ou mais Vendedores..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Variações em Inglês */}
              {modalTab === 'en' && (
                <div className="space-y-4 text-xs">
                  <p className="text-xs text-[#666666]">
                    Insira as traduções da cláusula para operações internacionais ou contratos bilíngues.
                  </p>

                  <div className="space-y-4">
                    <FormattedTextarea
                      label="Texto Traduzido 1C 1V (EN)"
                      rows={4}
                      value={formState.texto1C1V_en}
                      onChange={val => setFormState(prev => ({ ...prev, texto1C1V_en: val }))}
                      placeholder="English version for 1 Buyer, 1 Seller..."
                    />

                    <FormattedTextarea
                      label="Texto Traduzido 1C 2V (EN)"
                      rows={4}
                      value={formState.texto1C2V_en}
                      onChange={val => setFormState(prev => ({ ...prev, texto1C2V_en: val }))}
                      placeholder="English version for 1 Buyer, multiple Sellers..."
                    />

                    <FormattedTextarea
                      label="Texto Traduzido 2C 1V (EN)"
                      rows={4}
                      value={formState.texto2C1V_en}
                      onChange={val => setFormState(prev => ({ ...prev, texto2C1V_en: val }))}
                      placeholder="English version for multiple Buyers, 1 Seller..."
                    />

                    <FormattedTextarea
                      label="Texto Traduzido 2C 2V (EN)"
                      rows={4}
                      value={formState.texto2C2V_en}
                      onChange={val => setFormState(prev => ({ ...prev, texto2C2V_en: val }))}
                      placeholder="English version for multiple Buyers and Sellers..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Notas (Última aba) */}
              {modalTab === 'notas' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#fafbfc] p-4 rounded-xl border border-[#b2bab9]/40 space-y-4">
                    <FormattedTextarea
                      label="Contexto de Uso"
                      labelIcon={<FileText size={14} className="text-[#00b2ff]" />}
                      rows={3}
                      value={formState.contextoUso}
                      onChange={val => setFormState(prev => ({ ...prev, contextoUso: val }))}
                      placeholder="Ex: Minuta para regulação do preço de aquisição, formas de pagamento, parcelamento e ajustes em operações de M&A (SPA)..."
                    />

                    <FormattedTextarea
                      label="Pontos de Atenção"
                      labelIcon={<AlertTriangle size={14} className="text-[#fc745c]" />}
                      labelClassName="font-semibold text-[#fc745c]"
                      rows={3}
                      value={formState.pontosAtencao}
                      onChange={val => setFormState(prev => ({ ...prev, pontosAtencao: val }))}
                      placeholder="Ex: Verificar contas bancárias de destino, parcelas diferidas com correção pelo CDI e eventual retenção em escrow..."
                      className="w-full px-3 py-2 text-xs bg-white border border-red-200 focus:border-[#fc745c] rounded-xl focus:ring-2 focus:ring-red-200 focus:outline-none leading-relaxed font-sans"
                    />

                    <div>
                      <label className="block font-semibold text-[#333333] mb-1 flex items-center gap-1.5">
                        <Bookmark size={14} className="text-[#00b2ff]" /> Definições Utilizadas
                      </label>
                      <input
                        type="text"
                        value={formState.definicoesUtilizadas}
                        onChange={e => setFormState(prev => ({ ...prev, definicoesUtilizadas: e.target.value }))}
                        placeholder="Ex: Preço de Aquisição, Parcela do Fechamento, Perda, Compradora, Vendedores"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-[#333333] mb-1">Aprovador</label>
                        <input
                          type="text"
                          value={formState.aprovador}
                          onChange={e => setFormState(prev => ({ ...prev, aprovador: e.target.value }))}
                          placeholder="Ex: Lucas Grilli Bastos"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#333333] mb-1">Contribuidor</label>
                        <input
                          type="text"
                          value={formState.contribuidor}
                          onChange={e => setFormState(prev => ({ ...prev, contribuidor: e.target.value }))}
                          placeholder="Nome do advogado ou área que redigiu a minuta"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#b2bab9] rounded-xl focus:ring-2 focus:ring-[#00b2ff] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-[#b2bab9]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {editingClausulaId && (
                    <>
                      {deleteConfirmId === editingClausulaId ? (
                        <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-[#fc745c]/40 rounded-xl">
                          <span className="text-xs text-[#fc745c] font-semibold px-2">Confirma exclusão?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteClausula(editingClausulaId)}
                            className="px-2.5 py-1 bg-[#fc745c] text-white rounded-lg text-xs font-bold hover:brightness-110"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(editingClausulaId)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-[#fc745c] hover:bg-red-50 border border-[#fc745c]/40 transition-colors"
                        >
                          <Trash2 size={13} />
                          <span>Excluir Cláusula</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#b2bab9] text-xs font-semibold text-[#555555] hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00b2ff] text-white hover:brightness-110 text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <Save size={14} />
                    <span>{editingClausulaId ? 'Salvar Alterações' : 'Cadastrar Cláusula'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Floating Save Confirmation Toast */}
      {savedToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f2937] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/60 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Check size={15} className="stroke-3" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Alteração confirmada</p>
            <p className="text-[11px] text-gray-300">{savedToastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
