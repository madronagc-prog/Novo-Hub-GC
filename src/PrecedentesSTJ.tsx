import React, { useState, useMemo, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { Search, ExternalLink, Upload, Trash2 } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ADMIN_EMAILS } from '../constants';
import { PrecedenteSTJ } from '../data/precedentesSTJ';

export default function PrecedentesSTJ() {
  const [precedentes, setPrecedentes] = useState<PrecedenteSTJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) {
        setIsAdmin(true);
      } else if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    const q = query(collection(db, 'precedentesSTJ'), orderBy('updatedAt', 'desc'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PrecedenteSTJ[];
      setPrecedentes(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'precedentesSTJ');
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected', file);
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setErrorMessage(null);
    }
  };

  const processFile = async () => {
    console.log('processFile called', { selectedFile: !!selectedFile, isAdmin });
    if (!selectedFile || !isAdmin) {
      console.error('Guard clause triggered', { selectedFile: !!selectedFile, isAdmin });
      setErrorMessage('Erro: Arquivo não selecionado ou sem permissão de administrador.');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('loading');
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onerror = (e) => {
      console.error('FileReader error', e);
      setErrorMessage('Erro ao ler o arquivo.');
      setUploadStatus('error');
    };
    reader.onload = async (event) => {
      console.log('File loaded');
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        console.log('Lines count', lines.length);
        
        // The file seems to use semicolons or a different delimiter, 
        // and the header is complex. Let's try to parse more robustly.
        // Based on the log, it looks like the entire row is being treated as a single field.
        
        const headers = lines[0].split(';').map(h => h.trim());
        console.log('Headers:', headers);
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(';').map(v => v.trim());
          const data: any = {};
          headers.forEach((h, index) => data[h] = values[index]);

          console.log('Parsed row data:', data);

          // Map the actual CSV headers to our expected fields
          const id = data['Número de Registro'];
          if (!id) {
            console.warn('Skipping row without Número de Registro', data);
            continue;
          }
          
          const link = "https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroRegistro&termo=" + id;
          
          const docData: PrecedenteSTJ = {
            id,
            tema: data['Tema'] || '',
            situacao: data['Situação do Tema'] || '',
            orgaoJulgador: data['Órgão Julgador'] || '',
            ramoDireito: data['Ramo do direito'] || '',
            questaoSubmetida: data['Questão submetida a julgamento'] || '',
            teseFirmada: data['Tese Firmada'] || '',
            anotacoesNUGEPNAC: data['Anotações NUGEPNAC'] || '',
            delimitacaoJulgado: data['Delimitação do Julgado'] || '',
            repercussaoGeral: data['Repercussão Geral'] || '',
            processo: {
              numero: data['Processo'] || '',
              numeroRegistro: id,
              tribunalOrigem: data['Tribunal de Origem'] || '',
              relator: data['Relator atual'] || '',
              afetacao: data['Data de Afetação'] || '',
              julgadoEm: data['Julgado em'] || '',
              acordaoPublicadoEm: data['Acórdão Publicado em'] || '',
              transitoEmJulgado: data['Trânsito em Julgado'] || '',
              link
            },
            updatedAt: new Date().toISOString()
          };

          console.log('Saving docData:', docData);
          await setDoc(doc(db, 'precedentesSTJ', id), docData);
        }
        setUploadStatus('success');
        setSelectedFile(null);
      } catch (err) {
        console.error('Error processing file', err);
        setErrorMessage('Erro ao processar os dados. Verifique o formato do arquivo.');
        setUploadStatus('error');
      }
    };
    reader.readAsText(selectedFile);
  };


  const filtered = useMemo(() => {
    return precedentes.filter(p => 
      (p.tema && p.tema.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.processo && p.processo.numero && p.processo.numero.includes(searchTerm))
    );
  }, [precedentes, searchTerm]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <h1 className="text-3xl font-bold text-[#0a1e3f]">Precedentes do STJ</h1>
          {isAdmin && <span className="text-xs text-green-600 font-bold">Admin Ativo</span>}
          {isAdmin && (
            <button 
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 bg-brand-blue hover:bg-[#0099d9] text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all"
            >
              <Upload size={18} /> {showUpload ? 'Ocultar Upload' : 'Upload de Planilha'}
            </button>
          )}
        </div>

        {showUpload && isAdmin && (
          <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
            <label className="block text-sm font-bold text-brand-grafite mb-4">Upload de Planilha (CSV)</label>
            <div className="flex items-center gap-4">
              <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-brand-grafite file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-[#0099d9]" />
              {selectedFile && (
                <button 
                  onClick={processFile}
                  disabled={uploadStatus === 'loading'}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {uploadStatus === 'loading' ? 'Enviando...' : 'Enviar'}
                </button>
              )}
            </div>
            {selectedFile && <p className="mt-2 text-sm text-brand-grafite">Arquivo selecionado: {selectedFile.name}</p>}
            {uploadStatus === 'success' && <p className="mt-2 text-sm text-green-600 font-bold">Upload concluído com sucesso!</p>}
            {uploadStatus === 'error' && <p className="mt-2 text-sm text-red-600 font-bold">{errorMessage}</p>}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grafite/70 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Buscar por tema ou número do processo..." 
              className="w-full p-3 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-grafite outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <div className="w-full mt-4 pt-4 border-t border-gray-50 flex justify-end">
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm font-bold text-brand-grafite hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-brand-grafite">Nenhum precedente encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filtered.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-[#0a1e3f] mb-4">{p.tema}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Situação:</strong> {p.situacao}</p>
                  <p><strong>Órgão Julgador:</strong> {p.orgaoJulgador}</p>
                  <p><strong>Ramo do Direito:</strong> {p.ramoDireito}</p>
                  <p><strong>Repercussão Geral:</strong> {p.repercussaoGeral}</p>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm space-y-2">
                  <p><strong>Questão Submetida:</strong> {p.questaoSubmetida}</p>
                  <p><strong>Tese Firmada:</strong> {p.teseFirmada}</p>
                  <p><strong>Anotações NUGEPNAC:</strong> {p.anotacoesNUGEPNAC}</p>
                  <p><strong>Delimitação do Julgado:</strong> {p.delimitacaoJulgado}</p>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm space-y-1">
                  <p><strong>Processo:</strong> {p.processo.numero}</p>
                  <p><strong>Número de Registro:</strong> {p.processo.numeroRegistro}</p>
                  <p><strong>Tribunal de Origem:</strong> {p.processo.tribunalOrigem}</p>
                  <p><strong>Relator:</strong> {p.processo.relator}</p>
                  <p><strong>Afetação:</strong> {p.processo.afetacao}</p>
                  <p><strong>Julgado em:</strong> {p.processo.julgadoEm}</p>
                  <p><strong>Acórdão publicado em:</strong> {p.processo.acordaoPublicadoEm}</p>
                  <p><strong>Trânsito em Julgado:</strong> {p.processo.transitoEmJulgado}</p>
                  <a href={p.processo.link} target="_blank" rel="noopener noreferrer" className="text-brand-grafite font-bold flex items-center gap-1 mt-2">
                    Ver Processo no STJ <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
