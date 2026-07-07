import { Link } from 'react-router-dom';
import { Info, Search, Map, FileText, Scale, LayoutDashboard } from 'lucide-react';

export default function Sitemap() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Map className="w-8 h-8 text-brand-grafite" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-brand-grafite mb-2 text-center">
          Development Sitemap
        </h1>
        <p className="text-brand-grafite mb-10 text-center text-base">
          Visão geral da estrutura da aplicação. Selecione uma página para navegar.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Sobre o Hub */}
          <Link
            to="/sobre"
            className="group block p-6 border border-gray-200 rounded-xl hover:border-brand-blue hover:shadow-md transition-all bg-white"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-brand-blue transition-colors">
                <Info className="w-6 h-6 text-brand-grafite group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-xl font-semibold text-brand-grafite">Sobre o Hub</h2>
            </div>
            <p className="text-brand-grafite text-sm">
              Página inicial com a apresentação do projeto e o Dashboard integrado contendo métricas e gráficos das fontes de informação.
            </p>
          </Link>

          {/* Card: Explorador */}
          <Link
            to="/explorador"
            className="group block p-6 border border-gray-200 rounded-xl hover:border-brand-blue hover:shadow-md transition-all bg-white"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-brand-blue transition-colors">
                <Search className="w-6 h-6 text-brand-grafite group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-xl font-semibold text-brand-grafite">Explorador</h2>
            </div>
            <p className="text-brand-grafite text-sm">
              Tabela interativa com todas as fontes cadastradas, permitindo busca, filtros avançados e paginação.
            </p>
          </Link>
          
          {/* Card: Monitoramento de Empresas */}
          <Link
            to="/monitoramento-empresas"
            className="group block p-6 border border-gray-200 rounded-xl hover:border-brand-blue hover:shadow-md transition-all bg-white"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-brand-blue transition-colors">
                <LayoutDashboard className="w-6 h-6 text-brand-grafite group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-xl font-semibold text-brand-grafite">Monitoramento</h2>
            </div>
            <p className="text-brand-grafite text-sm">
              Feed RSS em tempo real para acompanhamento de notícias e menções das empresas monitoradas.
            </p>
          </Link>

          {/* Card: Projetos de Lei */}
          <Link
            to="/projetos-de-lei"
            className="group block p-6 border border-gray-200 rounded-xl hover:border-brand-blue hover:shadow-md transition-all bg-white"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-brand-blue transition-colors">
                <FileText className="w-6 h-6 text-brand-grafite group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-xl font-semibold text-brand-grafite">Projetos de Lei</h2>
            </div>
            <p className="text-brand-grafite text-sm">
              Base de dados de Projetos de Lei monitorados, com filtros por tema e status de tramitação.
            </p>
          </Link>

          {/* Card: Precedentes */}
          <div className="p-6 border border-gray-200 rounded-xl bg-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Scale className="w-6 h-6 text-brand-grafite" />
              </div>
              <h2 className="text-xl font-semibold text-brand-grafite">Precedentes</h2>
            </div>
            <div className="space-y-2">
              <Link to="/precedentes/temas-repetitivos" className="block text-sm text-blue-600 hover:underline">
                • Temas repetitivos do STJ
              </Link>
              <Link to="/precedentes/controversias" className="block text-sm text-blue-600 hover:underline">
                • Controvérsias do STJ
              </Link>
              <Link to="/precedentes/repercussao-geral" className="block text-sm text-blue-600 hover:underline">
                • Repercussão Geral STF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
