import React from 'react';
import { X, AlertCircle, ExternalLink } from 'lucide-react';

interface AuthErrorModalProps {
  error: string | null;
  onClose: () => void;
}

export default function AuthErrorModal({ error, onClose }: AuthErrorModalProps) {
  if (!error) return null;

  let title = 'Erro na Autenticação';
  let message = 'Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.';
  let action = null;

  if (error === 'POPUP_BLOCKED') {
    title = 'Popup Bloqueado';
    message = 'O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site e tente novamente.';
  } else if (error === 'UNAUTHORIZED_DOMAIN') {
    title = 'Domínio não Autorizado';
    message = 'Este domínio não está autorizado para autenticação no Firebase. Se você for o administrador, adicione este domínio na lista de domínios autorizados no Console do Firebase.';
    action = (
      <a 
        href="https://console.firebase.google.com/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-brand-grafite hover:underline"
      >
        Ir para o Console do Firebase
        <ExternalLink size={14} />
      </a>
    );
  } else if (error.includes('popup-closed-by-user')) {
    return null; // Don't show modal for user cancellation
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={20} />
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-brand-grafite/70 hover:text-brand-grafite transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-brand-grafite text-sm leading-relaxed">
            {message}
          </p>
          {action}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-brand-grafite rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
