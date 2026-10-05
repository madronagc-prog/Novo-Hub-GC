import React, { useMemo } from 'react';
import { redeSociaisData } from '../../data/rede-sociais.data';
import { redeEmbaixadoresData } from '../../data/rede-embaixadores.data';
import { redeNewsLinkedinData } from '../../data/rede-news-linkedin.data';
import { redePostsPatrocinadosData } from '../../data/rede-posts-patrocinados.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Users,
  TrendingUp,
  Newspaper,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  Award,
  Layers,
  BarChart2
} from 'lucide-react';

interface RedeResumoViewProps {
  selectedMonth?: string;
}

export default function RedeResumoView({ selectedMonth = 'Todos os meses' }: RedeResumoViewProps) {
  // 1. Mês mais recente disponível em redeSociaisData (Agosto)
  const mesesValidos = useMemo(() => {
    return redeSociaisData.filter((d) => d.linkedin_seguidores !== null && d.insta_seguidores !== null);
  }, []);

  const dadoMaisRecente = useMemo(() => {
    return mesesValidos[mesesValidos.length - 1] || mesesValidos[0];
  }, [mesesValidos]);

  // Primeiro mês para cálculo de crescimento acumulado
  const primeiroMes = useMemo(() => mesesValidos[0], [mesesValidos]);

  const crescimentoLinkedIn = useMemo(() => {
    if (!dadoMaisRecente || !primeiroMes) return 0;
    return (dadoMaisRecente.linkedin_seguidores || 0) - (primeiroMes.linkedin_seguidores || 0);
  }, [dadoMaisRecente, primeiroMes]);

  const crescimentoInsta = useMemo(() => {
    if (!dadoMaisRecente || !primeiroMes) return 0;
    return (dadoMaisRecente.insta_seguidores || 0) - (primeiroMes.insta_seguidores || 0);
  }, [dadoMaisRecente, primeiroMes]);

  // 2. Embaixadores ativos (nomes únicos)
  const embaixadoresUnicosCount = useMemo(() => {
    const nomes = new Set<string>();
    redeEmbaixadoresData.forEach((d) => {
      if (d.nome && d.nome.trim()) {
        nomes.add(d.nome.trim());
      }
    });
    return nomes.size;
  }, []);

  // 3. Edições do News LinkedIn & total de curtidas
  const totalEdicoesNews = redeNewsLinkedinData.length;
  const totalCurtidasNews = useMemo(() => {
    return redeNewsLinkedinData.reduce((acc, d) => acc + (d.curtidas || 0), 0);
  }, []);

  // 4. Agrupamento de embaixadores por grupo
  const embaixadoresPorGrupo = useMemo(() => {
    const counts: Record<string, number> = {};
    redeEmbaixadoresData.forEach((d) => {
      const grupo = d.grupo ? d.grupo.trim() : 'Outros';
      counts[grupo] = (counts[grupo] || 0) + 1;
    });

    const total = redeEmbaixadoresData.length || 1;
    return Object.entries(counts)
      .map(([grupo, totalGrupo]) => ({
        grupo,
        total: totalGrupo,
        percentual: (totalGrupo / total) * 100
      }))
      .sort((a, b) => b.total - a.total);
  }, []);

  // 5. Posts Patrocinados: Realizados vs Planejados/Pendentes
  const postsPatrocinadosStats = useMemo(() => {
    const total = redePostsPatrocinadosData.length;
    const realizados = redePostsPatrocinadosData.filter(
      (d) => (d.status || '').toLowerCase().trim() === 'realizado'
    );
    const pendentes = total - realizados.length;
    const postRealizadoDestaque = realizados[0] || null;

    return {
      total,
      realizadosCount: realizados.length,
      pendentesCount: pendentes,
      taxaConclusao: total > 0 ? (realizados.length / total) * 100 : 0,
      postRealizadoDestaque
    };
  }, []);

  // 6. Dados para o gráfico de evolução mensal (Janeiro a Agosto)
  const minLinkedIn = useMemo(() => {
    return Math.min(...mesesValidos.map((d) => d.linkedin_seguidores || 50000));
  }, [mesesValidos]);

  const maxLinkedIn = useMemo(() => {
    return Math.max(...mesesValidos.map((d) => d.linkedin_seguidores || 55000));
  }, [mesesValidos]);

  const minInsta = useMemo(() => {
    return Math.min(...mesesValidos.map((d) => d.insta_seguidores || 3500));
  }, [mesesValidos]);

  const maxInsta = useMemo(() => {
    return Math.max(...mesesValidos.map((d) => d.insta_seguidores || 4500));
  }, [mesesValidos]);

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOPO)                                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Seguidores LinkedIn */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0077b5] flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Share2 size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Seguidores LinkedIn
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {dadoMaisRecente?.linkedin_seguidores?.toLocaleString('pt-BR') || '--'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              dado de {dadoMaisRecente?.mes || 'Agosto'} • +{crescimentoLinkedIn.toLocaleString('pt-BR')} no ano
            </div>
          </div>
        </div>

        {/* Card 2: Seguidores Instagram */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#e1306c] flex items-center justify-center flex-shrink-0 border border-pink-100">
            <Award size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Seguidores Instagram
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {dadoMaisRecente?.insta_seguidores?.toLocaleString('pt-BR') || '--'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              dado de {dadoMaisRecente?.mes || 'Agosto'} • +{crescimentoInsta.toLocaleString('pt-BR')} no ano
            </div>
          </div>
        </div>

        {/* Card 3: Embaixadores Ativos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Users size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Embaixadores Ativos
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {embaixadoresUnicosCount}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5 truncate">
              {redeEmbaixadoresData.length} publicações amplificadas
            </div>
          </div>
        </div>

        {/* Card 4: Edições do News LinkedIn */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Newspaper size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Edições News LinkedIn
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalEdicoesNews}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
              {totalCurtidasNews} curtidas acumuladas
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (JANEIRO A AGOSTO)                     */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-blue" />
              <span>Evolução de Seguidores</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Crescimento de base orgânica nas páginas institucionais do LinkedIn e Instagram
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-[#0077b5]"></span>
              <span>LinkedIn</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-[#e1306c]"></span>
              <span>Instagram</span>
            </div>
          </div>
        </div>

        {/* Grid com os 8 meses de Janeiro a Agosto */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 my-4">
          {mesesValidos.map((d) => {
            const isSelected = selectedMonth === d.mes;
            const diffLinkedIn = (d.linkedin_crescimento || 0);
            const diffInsta = (d.insta_crescimento || 0);

            // Proporções visuais relativas
            const linkedinHeight = Math.max(25, Math.round((((d.linkedin_seguidores || minLinkedIn) - (minLinkedIn - 1000)) / ((maxLinkedIn - (minLinkedIn - 1000)) || 1)) * 100));
            const instaHeight = Math.max(25, Math.round((((d.insta_seguidores || minInsta) - (minInsta - 300)) / ((maxInsta - (minInsta - 300)) || 1)) * 100));

            return (
              <div
                key={d.mes}
                className={`rounded-xl border p-2.5 flex flex-col justify-between text-center transition-all ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/60 shadow-xs'
                    : 'border-gray-200/70 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy">
                    {d.mes.slice(0, 3)}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>
                  )}
                </div>

                {/* Métricas e colunas comparativas */}
                <div className="my-2.5 space-y-2">
                  {/* LinkedIn */}
                  <div className="text-left">
                    <div className="flex items-baseline justify-between text-[10px] text-gray-500 mb-0.5">
                      <span className="font-semibold text-[#0077b5]">LinkedIn:</span>
                      {diffLinkedIn > 0 && (
                        <span className="text-[9px] text-emerald-600 font-bold">+{diffLinkedIn}</span>
                      )}
                    </div>
                    <div className="text-xs font-serif font-bold text-gray-900">
                      {d.linkedin_seguidores?.toLocaleString('pt-BR')}
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-[#0077b5] h-full rounded-full transition-all duration-500"
                        style={{ width: `${linkedinHeight}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="text-left pt-1 border-t border-gray-100">
                    <div className="flex items-baseline justify-between text-[10px] text-gray-500 mb-0.5">
                      <span className="font-semibold text-[#e1306c]">Insta:</span>
                      {diffInsta > 0 && (
                        <span className="text-[9px] text-emerald-600 font-bold">+{diffInsta}</span>
                      )}
                    </div>
                    <div className="text-xs font-serif font-bold text-gray-900">
                      {d.insta_seguidores?.toLocaleString('pt-BR')}
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-[#e1306c] h-full rounded-full transition-all duration-500"
                        style={{ width: `${instaHeight}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-medium text-gray-500 pt-1 border-t border-gray-200/60">
                  Total: {((d.linkedin_seguidores || 0) + (d.insta_seguidores || 0)).toLocaleString('pt-BR')}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>Meses monitorados com dados oficiais: <strong>Janeiro a Agosto/2026</strong></span>
          <span className="text-emerald-700 font-semibold">
            Crescimento consolidado total: +{(crescimentoLinkedIn + crescimentoInsta).toLocaleString('pt-BR')} seguidores
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. DEMAIS INICIATIVAS DE REDES (EMBAIXADORES + POSTS PATROCINADOS)   */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Embaixadores por Grupo */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <Users size={18} className="text-purple-600" />
                  <span>Embaixadores por Grupo de Atuação</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Participação no programa de amplificação de conteúdo institucional
                </p>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                {redeEmbaixadoresData.length} registros
              </span>
            </div>

            <div className="space-y-3.5 my-2">
              {embaixadoresPorGrupo.map((item, idx) => {
                const colors = [
                  'from-purple-600 to-indigo-600',
                  'from-blue-600 to-sky-600',
                  'from-teal-600 to-emerald-600'
                ];
                const color = colors[idx % colors.length];

                return (
                  <div
                    key={item.grupo}
                    className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/60"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                        <strong className="text-gray-900">{item.grupo}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-brand-navy">
                          {item.total} {item.total === 1 ? 'participação' : 'participações'}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
                        style={{ width: `${item.percentual}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-center justify-between mt-4">
            <span>Base ativa de embaixadores:</span>
            <strong>{embaixadoresUnicosCount} profissionais únicos</strong>
          </div>
        </div>

        {/* Bloco 2: Posts Patrocinados LinkedIn */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <BarChart2 size={18} className="text-[#0077b5]" />
                  <span>Posts Patrocinados LinkedIn</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Campanhas de mídia paga para distribuição estratégica de conteúdos
                </p>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0077b5] border border-blue-100">
                {postsPatrocinadosStats.total} planejadas
              </span>
            </div>

            {/* Comparativo Realizado vs Planejado */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Realizados
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    {postsPatrocinadosStats.taxaConclusao.toFixed(0)}%
                  </span>
                </div>
                <div className="text-2xl font-serif font-bold text-emerald-900">
                  {postsPatrocinadosStats.realizadosCount}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  campanha executada com sucesso
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-600" />
                    Planejados
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    {(100 - postsPatrocinadosStats.taxaConclusao).toFixed(0)}%
                  </span>
                </div>
                <div className="text-2xl font-serif font-bold text-amber-900">
                  {postsPatrocinadosStats.pendentesCount}
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  campanhas em elaboração/aprovação
                </div>
              </div>
            </div>

            {/* Destaque da campanha realizada */}
            {postsPatrocinadosStats.postRealizadoDestaque && (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-brand-blue" />
                    Última Campanha Realizada:
                  </span>
                  <span className="text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded font-medium text-gray-600">
                    {postsPatrocinadosStats.postRealizadoDestaque.mes}/2026
                  </span>
                </div>

                <div className="text-xs font-medium text-gray-800 truncate" title={postsPatrocinadosStats.postRealizadoDestaque.tema}>
                  "{postsPatrocinadosStats.postRealizadoDestaque.tema}"
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Impressões</div>
                    <div className="text-xs font-serif font-bold text-brand-navy">
                      {postsPatrocinadosStats.postRealizadoDestaque.impressoes?.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Cliques</div>
                    <div className="text-xs font-serif font-bold text-brand-navy">
                      {postsPatrocinadosStats.postRealizadoDestaque.cliques?.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">CTR</div>
                    <div className="text-xs font-serif font-bold text-emerald-700">
                      {postsPatrocinadosStats.postRealizadoDestaque.ctr || '--'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between mt-4">
            <span>Objetivo prioritário das campanhas:</span>
            <strong className="text-brand-navy font-semibold">Brand Awareness & Geração de Leads</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
