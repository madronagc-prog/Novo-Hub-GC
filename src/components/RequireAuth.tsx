import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, OAuthProvider, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';
import { ADMIN_EMAILS } from '../constants';
import { Mail } from 'lucide-react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (u.email && u.email.endsWith('@madronaadvogados.com.br')) {
          setUser(u);
        } else if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) {
          setUser(u);
        } else {
          // Check role from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', u.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
              setUser(u);
            } else {
              setError('Acesso negado. Utilize um email @madronaadvogados.com.br ou uma conta com permissão de administrador.');
              setUser(null);
            }
          } catch {
            setError('Acesso negado. Utilize um email @madronaadvogados.com.br ou uma conta com permissão de administrador.');
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMicrosoftLogin = async () => {
    setError('');
    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        tenant: 'madronaadvogados.com.br'
      });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-supported-in-this-environment') {
         setError('A autenticação via Microsoft não está suportada neste ambiente.');
      } else if (err.code === 'auth/internal-error' || err.message?.includes('configuration-not-found')) {
         setError('Por favor, configure o provedor Microsoft no painel de Autenticação do Firebase.');
      } else {
         setError('Erro ao fazer login com Microsoft: ' + err.message + '. (Lembre-se de ativar o provedor Microsoft no Firebase Console).');
      }
    }
  };

  const handleAdminLogin = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError('Erro ao fazer login como administrador: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#0a1e3f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-brand-blue flex flex-col items-center justify-center relative overflow-hidden font-sans py-16 px-4 sm:px-6 lg:px-8">
      <img src="/logo.png" alt="Madrona Advogados" className="h-16 w-auto object-contain mb-8 z-10" />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl z-10 p-8 my-4">
        <h2 className="text-center text-3xl font-bold font-serif text-brand-grafite border-b-4 border-brand-blue pb-4 mb-6">
          Hub de Gestão do Conhecimento
        </h2>
        <p className="mt-2 text-center text-sm text-brand-grafite px-4 mb-8">
          O acesso a esta plataforma é restrito aos colaboradores do escritório e administradores.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleMicrosoftLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#00a4ef] hover:bg-[#0091d3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a4ef] transition-all"
          >
            <svg viewBox="0 0 23 23" className="w-5 h-5 fill-current"><path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/></svg>
            Entrar com a Microsoft
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <button
            onClick={handleAdminLogin}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-brand-grafite bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-grafite transition-all"
          >
            <Mail size={16} />
            Entrar como Administrador
          </button>
        </div>
      </div>
    </div>
  );
}
