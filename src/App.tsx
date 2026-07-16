/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import Sitemap from './pages/Sitemap';
import ServicosGC from './pages/ServicosGC';
import MadronaLab from './pages/MadronaLab';   // ← NOVO
import Sobre from './pages/Sobre';
import Explorador from './pages/Explorador';
import ProjetosDeLei from './pages/ProjetosDeLei';
import TemasRepetitivos from './pages/TemasRepetitivos';
import ControversiasSTJ from './pages/ControversiasSTJ';
import RepercussaoGeralSTF from './pages/RepercussaoGeralSTF';
import PrecedentesSTJ from './pages/PrecedentesSTJ';
import MonitoramentoEmpresas from './pages/MonitoramentoEmpresas';
import ClippingCorporativo from './pages/ClippingCorporativo';
import ClippingAbril2026 from './pages/clipping/ClippingAbril2026';
import ClippingMaio2026 from './pages/clipping/ClippingMaio2026';
import ClippingJunho2026 from './pages/clipping/ClippingJunho2026';
import ClippingJulho2026 from './pages/clipping/ClippingJulho2026';
import ErrorBoundary from './components/ErrorBoundary';

const checkPreviewEnvironment = () => {
  const url = window.location.href;
  const hostname = window.location.hostname;
  const indicators = [
    'googleusercontent',
    'webcontainer',
    'shim',
    '.goog',
    'scf.usercontent',
    'stackblitz',
    'codesandbox'
  ];
  return indicators.some(indicator => url.includes(indicator) || hostname.includes(indicator));
};

const isPreview = checkPreviewEnvironment();
const Router = isPreview ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <ErrorBoundary>
      <RequireAuth>
        <Router>
          <Routes>
            {/* Redireciona raiz para /servicos-gc (nova home) */}
            <Route path="/" element={<Navigate to={isPreview ? '/sitemap' : '/servicos-gc'} replace />} />

            {/* Sitemap para ambientes de preview */}
            <Route path="/sitemap" element={<Sitemap />} />

            {/* Layout principal */}
            <Route element={<Layout />}>
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/madrona-lab" element={<MadronaLab />} />
              {/* NOVA ROTA — Serviços de GC (home) */}
              <Route path="/servicos-gc" element={<ServicosGC />} />

              <Route path="/explorador" element={<Explorador />} />
              <Route path="/projetos-de-lei" element={<ProjetosDeLei />} />
              <Route path="/precedentes/temas-repetitivos" element={<TemasRepetitivos />} />
              <Route path="/precedentes/controversias" element={<ControversiasSTJ />} />
              <Route path="/precedentes/stj" element={<PrecedentesSTJ />} />
              <Route path="/precedentes/repercussao-geral" element={<RepercussaoGeralSTF />} />
              <Route path="/monitoramento-de-empresas" element={<MonitoramentoEmpresas />} />
              <Route path="/clipping-corporativo" element={<ClippingCorporativo />} />
              <Route path="/clipping-corporativo/abril-2026" element={<ClippingAbril2026 />} />
              <Route path="/clipping-corporativo/maio-2026" element={<ClippingMaio2026 />} />
              <Route path="/clipping-corporativo/junho-2026" element={<ClippingJunho2026 />} />
              <Route path="/clipping-corporativo/julho-2026" element={<ClippingJulho2026 />} />
            </Route>
          </Routes>
        </Router>
      </RequireAuth>
    </ErrorBoundary>
  );
}
