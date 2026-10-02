import React from 'react';
import {
  ferrAssinaturaData,
  AssinaturaEletronicaContrato
} from '../../data/ferr-assinatura.data';
import {
  FileCheck,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Info,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingDown,
  PieChart,
  Activity,
  Zap,
  HelpCircle
} from 'lucide-react';

export default function FerrAssinaturaView() {
  const certisign = ferrAssinaturaData.find((f) => f.fornecedor === 'Certisign');
  const docusign = ferrAssinaturaData.find((f) => f.fornecedor === 'Docusign') || {
    fornecedor: 'Docusign',
    modelo_contrato: 'Contrato anual',
    inicio_contrato: 'Janeiro/2026',
    fim_contrato: 'Janeiro/2027',
    envelopes_contratados: 7500,
    envelopes_usados: 2984,
    envelopes_disponiveis: 4516,
    percentual_uso: 39.8
  };

  // Cálculo para o gráfico de rosca (SVG Donut)
  const pctUso = docusign.percentual_uso || 39.8;
  const pctDisponivel = +(100 - pctUso).toFixed(1);
  const strokeDashoffset = 100 - pctUso;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. SEÇÃO DOCUSIGN (CONTRATO ANUAL & CONSUMO DE ENVELOPES)            */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header Docusign */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#fafbfc] to-blue-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-brand-blue flex items-center justify-center border border-blue-200/60 shadow-2xs">
                <FileCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-serif font-bold text-gray-900">
                    {docusign.fornecedor}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-blue border border-blue-200">
                    {docusign.modelo_contrato}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Contrato Vigente
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Calendar size={13} className="text-gray-400" />
                  <span>
                    Período de Vigência:{' '}
                    <strong className="text-gray-700">
                      {docusign.inicio_contrato} até {docusign.fim_contrato}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Status do Pacote
              </div>
              <div className="text-sm font-bold text-gray-800">
                12 Meses de Franquia
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Docusign: Gráfico de Rosca + Métricas Principais */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Gráfico de Rosca (Donut SVG) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-gray-50/60 rounded-2xl border border-gray-100">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Fundo do Donut (Disponível) */}
                  <path
                    className="text-emerald-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Arco de Uso (Consumido) */}
                  <path
                    className="text-[#00b2ff] transition-all duration-1000 ease-out"
                    strokeDasharray="100, 100"
                    strokeDashoffset={strokeDashoffset}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>

                {/* Texto Central da Rosca */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-serif font-bold text-gray-900 leading-none">
                    {pctUso}%
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                    Consumido
                  </span>
                </div>
              </div>

              {/* Legenda do Donut */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#00b2ff]"></span>
                  <span className="text-gray-600 font-medium">
                    Usados ({pctUso}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-300"></span>
                  <span className="text-gray-600 font-medium">
                    Disponíveis ({pctDisponivel}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Painel de Métricas e Detalhes da Franquia */}
            <div className="lg:col-span-7 space-y-6">
              {/* Grid com 3 Cards de Números */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Contratados */}
                <div className="bg-gray-50/80 border border-gray-200/70 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Total Contratado
                  </div>
                  <div className="text-2xl font-serif font-bold text-gray-900 mt-1">
                    {docusign.envelopes_contratados?.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    100% da franquia
                  </div>
                </div>

                {/* Usados */}
                <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-brand-blue uppercase tracking-wider">
                    Envelopes Usados
                  </div>
                  <div className="text-2xl font-serif font-bold text-gray-900 mt-1">
                    {docusign.envelopes_usados?.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[11px] text-brand-blue font-semibold mt-0.5">
                    {pctUso}% consumido
                  </div>
                </div>

                {/* Disponíveis */}
                <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                    Saldo Disponível
                  </div>
                  <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">
                    {docusign.envelopes_disponiveis?.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    {pctDisponivel}% restantes
                  </div>
                </div>
              </div>

              {/* Barra de Progresso Horizontal Detalhada */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-gray-600">
                  <span>Progresso de Utilização da Cota</span>
                  <span>
                    <strong>{docusign.envelopes_usados?.toLocaleString('pt-BR')}</strong> de{' '}
                    {docusign.envelopes_contratados?.toLocaleString('pt-BR')} envelopes
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-[#00b2ff] to-[#0a1e3f] rounded-full transition-all duration-700"
                    style={{ width: `${pctUso}%` }}
                  ></div>
                </div>
              </div>

              {/* Nota Informativa sobre o Ritmo de Uso */}
              <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100 flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                <Info size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-800">Ritmo de Consumo Controlado:</strong> Com{' '}
                  <strong>{pctUso}%</strong> de utilização acumulada e saldo de{' '}
                  <strong>{docusign.envelopes_disponiveis?.toLocaleString('pt-BR')} envelopes</strong>, o
                  consumo está perfeitamente alinhado com a vigência contratual prevista até{' '}
                  <strong>{docusign.fim_contrato}</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SEÇÃO CERTISIGN (PAGAMENTO PONTUAL CONFORME NECESSIDADE)          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header Certisign */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#fafbfc] to-emerald-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-serif font-bold text-gray-900">
                    {certisign?.fornecedor || 'Certisign'}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sob Demanda (On-Demand)
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Sem Custo Fixo
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Certificação Digital e Assinatura Eletrônica com Validade ICP-Brasil
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Formato de Cobrança
              </div>
              <div className="text-sm font-bold text-gray-800">
                Pagamento Pontual
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Certisign: Explicativo do Modelo */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Modelo Contratual */}
            <div className="bg-gray-50/70 border border-gray-200/70 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  <Clock size={15} className="text-emerald-600" />
                  <span>Sem Contrato Fixo</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Não há compromisso financeiro recorrente nem franquia mensal mínima obrigatória.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200/60 text-[11px] text-gray-500">
                Flexibilidade orçamentária total
              </div>
            </div>

            {/* Card 2: Aquisição de Créditos */}
            <div className="bg-gray-50/70 border border-gray-200/70 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  <Zap size={15} className="text-amber-500" />
                  <span>Créditos Pontuais</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Créditos e certificações são adquiridos e pagos exclusivamente quando há necessidade operacional nos casos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200/60 text-[11px] text-gray-500">
                Pagamento por uso efetivo
              </div>
            </div>

            {/* Card 3: Conformidade e Segurança */}
            <div className="bg-gray-50/70 border border-gray-200/70 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  <ShieldCheck size={15} className="text-blue-600" />
                  <span>Validade ICP-Brasil</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Utilizada para assinaturas qualificadas com certificado digital padrão ICP-Brasil e demandas jurídicas específicas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200/60 text-[11px] text-gray-500">
                Total conformidade jurídica
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. QUADRO RESUMO COMPARATIVO DE CONTRATOS                            */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-[#fafbfc]">
          <h4 className="text-sm font-serif font-bold text-gray-900 flex items-center gap-2">
            <Layers size={16} className="text-brand-blue" />
            <span>Quadro Comparativo de Plataformas de Assinatura</span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">Modelo de Contrato</th>
                <th className="py-3 px-4">Período de Vigência</th>
                <th className="py-3 px-4 text-center">Envelopes Contratados</th>
                <th className="py-3 px-4 text-center">Consumo Atual</th>
                <th className="py-3 px-4 text-center">Status / Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Docusign */}
              <tr className="hover:bg-blue-50/20 transition-colors">
                <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Docusign
                </td>
                <td className="py-3.5 px-4 text-gray-700">Contrato anual corporativo</td>
                <td className="py-3.5 px-4 text-gray-600">Jan/2026 a Jan/2027</td>
                <td className="py-3.5 px-4 text-center font-semibold text-gray-900">7.500</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="font-bold text-brand-blue">2.984</span>{' '}
                  <span className="text-xs text-gray-400">({pctUso}%)</span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    4.516 disponíveis
                  </span>
                </td>
              </tr>

              {/* Certisign */}
              <tr className="hover:bg-blue-50/20 transition-colors">
                <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Certisign
                </td>
                <td className="py-3.5 px-4 text-gray-700">Créditos sob demanda (on-demand)</td>
                <td className="py-3.5 px-4 text-gray-600">Sem vencimento fixo</td>
                <td className="py-3.5 px-4 text-center text-gray-400">—</td>
                <td className="py-3.5 px-4 text-center text-gray-500">Faturado por uso</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand-blue border border-blue-200">
                    Ativo sob demanda
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
