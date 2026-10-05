import React, { useMemo } from 'react';
import { acadMadronaData } from '../../data/acad-madrona.data';
import { gruposEstudosData } from '../../data/grupos-estudos.data';
import { pesquisasData } from '../../data/pesquisas.data';
import { bibAquisicoesData } from '../../data/bib-aquisicoes.data';
import { acadTreinamentoIMData } from '../../data/acad-treinamento-im.data';
import { scoutsData } from '../../data/scouts.data';
import { lexJurisData } from '../../data/lex-juris.data';
import { ferrAssinaturaData } from '../../data/ferr-assinatura.data';
import { UPMINER_TOTAL_CONTRATO, UPMINER_TOTAL_USADO } from '../../data/ferr-upminer.data';
import { pubControleData } from '../../data/pub-controle.data';
import { pubCapitalData } from '../../data/pub-capital.data';
import { redeSociaisData } from '../../data/rede-sociais.data';
import { emailMailingData } from '../../data/email-mailing.data';
import { redeNewsLinkedinData } from '../../data/rede-news-linkedin.data';
import { pubUNsEmNumerosData } from '../../data/pub-uns-numeros.data';
import { impAtividadesData } from '../../data/imp-atividades.data';
import { normalizarMes, normalizarUN } from '../../utils/padronizacao';
import {
  GraduationCap,
  Users,
  Search,
  BookOpen,
  Monitor,
  Compass,
  FileText,
  Coins,
  TrendingUp,
  Shield,
  FileCheck,
  CheckCircle2,
  Share2,
  Mail,
  BarChart3,
  Newspaper,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface VisaoGeralViewProps {
  activeSubTab: string;
  selectedMonth: string;
}

function formatarMoeda(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function VisaoGeralView({ activeSubTab, selectedMonth }: VisaoGeralViewProps) {
  const isAllMonths = selectedMonth === 'Todos os meses';

  // =========================================================================
  // GESTÃO DO CONHECIMENTO
  // =========================================================================

  // 1. Sessões Academia Madrona
  const sessoesAcademia = useMemo(() => {
    if (isAllMonths) return acadMadronaData.length;
    return acadMadronaData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
  }, [isAllMonths, selectedMonth]);

  // 2. Encontros Grupos de Estudos
  const encontrosGrupos = useMemo(() => {
    if (isAllMonths) return gruposEstudosData.length;
    return gruposEstudosData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
  }, [isAllMonths, selectedMonth]);

  // 3. Pesquisas realizadas
  const pesquisasRealizadas = useMemo(() => {
    if (isAllMonths) return pesquisasData.length;
    return pesquisasData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
  }, [isAllMonths, selectedMonth]);

  // 4. Aquisições de material
  const aquisicoesMaterial = useMemo(() => {
    if (isAllMonths) return bibAquisicoesData.length;
    return bibAquisicoesData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
  }, [isAllMonths, selectedMonth]);

  // 5. Treinamentos iManage (sessões)
  const treinamentosIManage = useMemo(() => {
    if (isAllMonths) return acadTreinamentoIMData.length;
    return acadTreinamentoIMData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
  }, [isAllMonths, selectedMonth]);

  // 6. Scouts realizados
  const scoutsRealizados = useMemo(() => {
    if (isAllMonths) return scoutsData.length;
    return scoutsData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
  }, [isAllMonths, selectedMonth]);

  // 7. Reportes Lex e Juris 3.0
  const reportesLexJuris = useMemo(() => {
    if (isAllMonths) return lexJurisData.length;
    return lexJurisData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
  }, [isAllMonths, selectedMonth]);

  // Contratos de Assinatura
  const certisignInfo = useMemo(() => {
    return ferrAssinaturaData.find((d) => d.fornecedor.toLowerCase().includes('certisign'));
  }, []);

  const docusignInfo = useMemo(() => {
    return ferrAssinaturaData.find((d) => d.fornecedor.toLowerCase().includes('docusign'));
  }, []);

  // upMiner
  const upMinerContrato = UPMINER_TOTAL_CONTRATO;
  const upMinerUsado = UPMINER_TOTAL_USADO;
  const upMinerPct = (upMinerUsado / upMinerContrato) * 100;
  const upMinerSaldo = Math.max(0, upMinerContrato - upMinerUsado);

  // =========================================================================
  // COMUNICAÇÃO
  // =========================================================================

  // 1. Publicações realizadas (pubControleData + pubCapitalData)
  const publicacoesRealizadas = useMemo(() => {
    if (isAllMonths) {
      return pubControleData.length + pubCapitalData.length;
    }
    const cControle = pubControleData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
    const cCapital = pubCapitalData.filter((d) => normalizarMes(d.mes) === selectedMonth).length;
    return cControle + cCapital;
  }, [isAllMonths, selectedMonth]);

  // 2. Alcance de público (Mês mais recente disponível: Agosto)
  const alcancePublico = useMemo(() => {
    // Foto do mês mais recente com dados (Agosto)
    const valid = redeSociaisData.filter((d) => d.linkedin_seguidores !== null);
    const last = valid[valid.length - 1] || valid[0];

    const seguidores = (last?.linkedin_seguidores || 0) + (last?.insta_seguidores || 0);
    const views = (last?.site_views || 0) + (last?.intra_views || 0);
    const total = seguidores + views;

    return {
      mes: last?.mes || 'Agosto',
      total,
      seguidores,
      views
    };
  }, []);

  // 3. Campanhas ativas (áreas distintas em emailMailingData, exceto "Todos")
  const campanhasAtivas = useMemo(() => {
    const areas = new Set<string>();
    emailMailingData.forEach((d) => {
      if (d.area && d.area.trim() !== 'Todos') {
        areas.add(d.area.trim());
      }
    });
    return areas.size;
  }, []);

  // 4. Taxa de engajamento (News LinkedIn)
  const taxaEngajamentoNews = useMemo(() => {
    const totalCurtidas = redeNewsLinkedinData.reduce((acc, d) => acc + (d.curtidas || 0), 0);
    const totalViews = redeNewsLinkedinData.reduce((acc, d) => acc + (d.views || 0), 0);
    const taxa = totalViews > 0 ? (totalCurtidas / totalViews) * 100 : 0;
    return {
      taxa: taxa.toFixed(2),
      curtidas: totalCurtidas,
      views: totalViews
    };
  }, []);

  // Gráfico 1 Comunicação: Distribuição de publicações por área (pubUNsEmNumerosData sem Total Geral)
  const rankingPublicacoesAreas = useMemo(() => {
    return pubUNsEmNumerosData
      .filter((d) => d.area !== 'Total Geral')
      .map((d) => {
        let label = d.area;
        if (label.startsWith('UN ')) {
          label = normalizarUN(label);
        }
        return {
          area: label,
          total: d.total
        };
      })
      .sort((a, b) => b.total - a.total);
  }, []);

  const maxPublicacoesArea = rankingPublicacoesAreas[0]?.total || 1;

  // Gráfico 2 Comunicação: Evolução mensal de atividades de imprensa (Janeiro a Agosto)
  const evolucaoImprensa = useMemo(() => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto'];
    return meses.map((m) => {
      const count = impAtividadesData.filter((d) => normalizarMes(d.mes) === m).length;
      return {
        mes: m,
        count
      };
    });
  }, []);

  const maxImprensaMes = Math.max(...evolucaoImprensa.map((e) => e.count), 1);

  // Renderização da Sub-aba Gestão do Conhecimento
  if (activeSubTab === 'gc' || !activeSubTab) {
    return (
      <div className="space-y-8">
        {/* ================================================================== */}
        {/* SEÇÃO 1: GESTÃO DO CONHECIMENTO                               */}
        {/* ================================================================== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap size={20} className="text-brand-blue" />
                <span>Gestão do Conhecimento</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Métricas consolidadas de capacitação, pesquisa, curadoria e inteligência jurídica
              </p>
            </div>
            <span className="text-xs font-medium text-brand-blue bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              {isAllMonths ? 'Ano Completo (2026)' : selectedMonth}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Sessões Academia Madrona */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-gray-300 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
                <GraduationCap size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  Sessões Academia Madrona
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                  {sessoesAcademia}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Treinamentos e webinars técnicos
                </div>
              </div>
            </div>

            {/* Card 2: Encontros Grupos de Estudos */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-gray-300 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
                <Users size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  Encontros Grupos de Estudos
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                  {encontrosGrupos}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Reuniões de RT Tax e debates setoriais
                </div>
              </div>
            </div>

            {/* Card 3: Pesquisas realizadas */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-gray-300 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <Search size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  Pesquisas Realizadas
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                  {pesquisasRealizadas}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Dossiês e levantamentos aprofundados
                </div>
              </div>
            </div>

            {/* Card 4: Aquisições de material */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-gray-300 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                <BookOpen size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  Aquisições de Material
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                  {aquisicoesMaterial}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Obras e títulos incorporados ao acervo
                </div>
              </div>
            </div>

            {/* Card 5: Treinamentos iManage */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-gray-300 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100">
                <Monitor size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  Treinamentos iManage
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                  {treinamentosIManage}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Sessões de capacitação da plataforma
                </div>
              </div>
            </div>

            {/* Card 6: Scouts realizados */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-gray-300 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
                <Compass size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  Scouts Realizados
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                  {scoutsRealizados}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Mapeamentos de inteligência e mercado
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SEÇÃO 2: INDICADORES ADICIONAIS                                    */}
        {/* ================================================================== */}
        <div>
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={18} className="text-brand-blue" />
              <span>Indicadores Adicionais</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Informativos jurisprudenciais e programas de engajamento do escritório
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Reportes Lex e Juris 3.0 */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                <FileText size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  Reportes Lex e Juris 3.0
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-indigo-900 mt-0.5">
                  {reportesLexJuris}
                </div>
                <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                  Informativos jurídicos consolidados
                </div>
              </div>
            </div>

            {/* Card 2: Lab Coins distribuídos (Mantido como Dados a carregar) */}
            <div className="bg-gray-50/70 rounded-2xl border border-dashed border-gray-300 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0 border border-gray-200">
                <Coins size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  Lab Coins Distribuídos
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-400 mt-0.5">
                  --
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <Info size={12} className="text-amber-500" />
                  <span>Dados a carregar (fonte em estruturação)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SEÇÃO 3: CONSUMO DE CONTRATOS E SERVIÇOS                           */}
        {/* ================================================================== */}
        <div>
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Shield size={18} className="text-brand-blue" />
              <span>Consumo de Contratos e Serviços de Inteligência</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Status operacional de licenças, créditos e franquias contratadas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. upMiner */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Shield size={16} className="text-brand-blue" />
                    upMiner
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue border border-blue-100">
                    {upMinerPct.toFixed(1)}% Usado
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Franquia de créditos para pesquisas patrimoniais e compliance
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Valor Usado:</span>
                    <strong className="text-brand-navy">{formatarMoeda(upMinerUsado)}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Valor Contratado:</span>
                    <span className="text-gray-700 font-medium">{formatarMoeda(upMinerContrato)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Saldo Disponível:</span>
                    <strong className="text-emerald-700">{formatarMoeda(upMinerSaldo)}</strong>
                  </div>
                </div>
              </div>

              <div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-1.5">
                  <div
                    className="bg-brand-blue h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, upMinerPct)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-gray-400 text-right">
                  {upMinerPct.toFixed(1)}% do pacote anual consumido
                </div>
              </div>
            </div>

            {/* 2. Certisign */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <FileCheck size={16} className="text-emerald-600" />
                    Certisign
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Sob Demanda
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Assinatura digital padrão ICP-Brasil e certificados digitais
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed mb-4">
                  <strong>Modelo de contratação:</strong> {certisignInfo?.modelo_contrato || 'Sem contrato fixo - créditos por pagamento pontual conforme necessidade.'}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Faturamento pontual</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Ativo
                </span>
              </div>
            </div>

            {/* 3. Docusign */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <FileCheck size={16} className="text-purple-600" />
                    Docusign
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    {docusignInfo?.percentual_uso || 39.8}% Usado
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Plataforma corporativa de assinatura eletrônica de minutas e contratos
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Envelopes Usados:</span>
                    <strong className="text-brand-navy">{(docusignInfo?.envelopes_usados || 2984).toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Franquia Contratada:</span>
                    <span className="text-gray-700 font-medium">{(docusignInfo?.envelopes_contratados || 7500).toLocaleString('pt-BR')} envelopes</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Saldo Remanescente:</span>
                    <strong className="text-emerald-700">{(docusignInfo?.envelopes_disponiveis || 4516).toLocaleString('pt-BR')}</strong>
                  </div>
                </div>
              </div>

              <div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-1.5">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-700"
                    style={{ width: `${docusignInfo?.percentual_uso || 39.8}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-gray-400 text-right">
                  Vigência: Jan/2026 - Jan/2027
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-ABA: COMUNICAÇÃO
  // =========================================================================
  return (
    <div className="space-y-8">
      {/* ==================================================================== */}
      {/* SEÇÃO 1: INDICADORES DE COMUNICAÇÃO 2026                             */}
      {/* ==================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Share2 size={20} className="text-brand-blue" />
              <span>Indicadores de Comunicação 2026</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Publicações, presença digital institucional, mailings e engajamento
            </p>
          </div>
          <span className="text-xs font-medium text-brand-blue bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            {isAllMonths ? 'Ano Completo (2026)' : selectedMonth}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Publicações Realizadas */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
              <FileText size={24} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                Publicações Realizadas
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                {publicacoesRealizadas}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                Controle de Publicações + Capital Aberto
              </div>
            </div>
          </div>

          {/* Card 2: Alcance de Público (Foto de Agosto) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
              <Users size={24} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                Alcance de Público
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
                {alcancePublico.total.toLocaleString('pt-BR')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 truncate" title={`${alcancePublico.seguidores.toLocaleString('pt-BR')} seguidores + ${alcancePublico.views.toLocaleString('pt-BR')} views (Foto de ${alcancePublico.mes}/2026)`}>
                {alcancePublico.seguidores.toLocaleString('pt-BR')} seguidores + {alcancePublico.views.toLocaleString('pt-BR')} views
              </div>
            </div>
          </div>

          {/* Card 3: Campanhas Ativas */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
              <Mail size={24} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                Campanhas Ativas
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
                {campanhasAtivas}
              </div>
              <div className="text-[11px] text-purple-700 font-medium mt-0.5 truncate">
                segmentos de mailing ativos
              </div>
            </div>
          </div>

          {/* Card 4: Taxa de Engajamento */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
              <TrendingUp size={24} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                Taxa de Engajamento
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                {taxaEngajamentoNews.taxa}%
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5 truncate" title={`News LinkedIn (${taxaEngajamentoNews.curtidas} curtidas / ${taxaEngajamentoNews.views.toLocaleString('pt-BR')} views)`}>
                News LinkedIn ({taxaEngajamentoNews.curtidas} curtidas / {taxaEngajamentoNews.views.toLocaleString('pt-BR')} views)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SEÇÃO 2: ANÁLISES DE COMUNICAÇÃO                                     */}
      {/* ==================================================================== */}
      <div>
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-blue" />
            <span>Análises de Comunicação</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Distribuição temática de publicações por área e evolução de atividades de imprensa
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Distribuição de publicações por área */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h4 className="font-serif font-bold text-gray-900 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-brand-blue" />
                    <span>Distribuição de Publicações por Área</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Produção editorial e artigos técnicos (UNs em Números)
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {rankingPublicacoesAreas.length} áreas
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {rankingPublicacoesAreas.map((item, idx) => {
                  const barWidth = (item.total / maxPublicacoesArea) * 100;

                  return (
                    <div
                      key={item.area}
                      className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1 gap-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {item.area}
                        </span>
                        <span className="font-serif font-bold text-brand-navy">
                          {item.total} {item.total === 1 ? 'pub.' : 'pubs.'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx < 3 ? 'bg-brand-blue' : 'bg-slate-600'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfico 2: Evolução mensal de atividades de imprensa */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h4 className="font-serif font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Newspaper size={16} className="text-emerald-600" />
                    <span>Evolução Mensal de Atividades de Imprensa</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Entrevistas, pautas e inserções na mídia de Janeiro a Agosto
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Total: {impAtividadesData.length} atividades
                </span>
              </div>

              {/* Grid de Barras Mensais */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 my-4">
                {evolucaoImprensa.map((item) => {
                  const heightPct = Math.max(15, Math.round((item.count / maxImprensaMes) * 100));
                  const isSelected = selectedMonth === item.mes;

                  return (
                    <div
                      key={item.mes}
                      className={`rounded-xl border p-2 flex flex-col justify-between text-center transition-all ${
                        isSelected
                          ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                          : 'border-gray-200/70 bg-gray-50/60'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy truncate">
                        {item.mes.slice(0, 3)}
                      </span>

                      <div className="my-2 flex flex-col items-center justify-end h-28">
                        <span className="text-xs font-serif font-bold text-emerald-800 mb-1">
                          {item.count}
                        </span>
                        <div className="w-6 bg-gray-200 rounded-t-md h-20 flex items-end overflow-hidden">
                          <div
                            className={`w-full rounded-t-md transition-all duration-700 ${
                              isSelected
                                ? 'bg-brand-navy'
                                : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-[9px] text-gray-400 border-t border-gray-200/60 pt-1">
                        atividades
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between">
              <span>Média mensal de assessoria:</span>
              <strong className="text-brand-navy font-semibold">
                {(impAtividadesData.length / evolucaoImprensa.length).toFixed(1)} ações / mês
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
