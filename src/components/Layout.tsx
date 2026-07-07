import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Info, Menu, X, FileText, Scale,
  ChevronDown, LogIn, LogOut, User, BookOpen, Briefcase, FlaskConical
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { auth, signIn, logOut } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import AuthErrorModal from './AuthErrorModal';
import { CATEGORIES } from '../data/servicesGCData';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authError, setAuthError] = useState<{type: 'POPUP_BLOCKED' | 'UNAUTHORIZED_DOMAIN' | 'UNKNOWN', message?: string} | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await signIn();
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      if (error?.code === 'auth/popup-blocked') {
        setAuthError({ type: 'POPUP_BLOCKED' });
      } else if (error?.message?.includes('unauthorized_client') || error?.code === 'auth/unauthorized-domain') {
        setAuthError({ type: 'UNAUTHORIZED_DOMAIN' });
      } else {
        setAuthError({ type: 'UNKNOWN', message: error?.message });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { path: '/sobre', label: 'Sobre o Hub', icon: Info },
    
    {
      label: 'Madrona Lab',
      path: '/madrona-lab',
      icon: FlaskConical,
    },
    {
      label: 'Serviços de GC',
      path: '/servicos-gc',
      icon: Briefcase,
      subItems: CATEGORIES.map(cat => ({
        path: `/servicos-gc#cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        label: cat
      }))
    },

    {
      label: 'Monitoramentos',
      icon: LayoutDashboard,
      subItems: [
        { path: '/projetos-de-lei',          label: 'Acompanhamento legislativo' },
        { path: '/monitoramento-de-empresas', label: 'Monitoramento de Empresas' },
      ],
    },
    {
      label: 'Jurisprudência',
      icon: Scale,
      subItems: [
        { path: '/precedentes/temas-repetitivos', label: 'Temas repetitivos do STJ' },
        { path: '/precedentes/controversias',     label: 'Controvérsias do STJ' },
        { path: '/precedentes/repercussao-geral', label: 'Repercussão Geral STF' },
      ],
    },
    {
      label: 'Curadoria',
      icon: BookOpen,
      subItems: [
        { path: '/explorador',          label: 'Fontes de informação' },
        { path: '/clipping-corporativo', label: 'Clipping de Corporativo' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-brand-blue text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              {/* Logo agora aponta para /servicos-gc */}
              <Link to="/servicos-gc" className="flex-shrink-0 flex items-center gap-2">
                <img src="/logo.png" alt="Madrona Advogados" className="h-10 w-auto object-contain" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-nowrap" ref={dropdownRef}>
              {navItems.map((item) => {
                const Icon = item.icon;

                if ('subItems' in item && item.subItems) {
                  const isActive = item.subItems.some(sub => {
                    const subPathname = sub.path.split('#')[0];
                    return location.pathname === subPathname;
                  });
                  const isOpen   = openDropdown === item.label;

                  return (
                    <div key={item.label} className="relative flex-shrink-0">
                      <button
                        onClick={() => {
                          if (item.path) {
                            navigate(item.path);
                            setOpenDropdown(null);
                          } else {
                            setOpenDropdown(isOpen ? null : item.label);
                          }
                        }}
                        className={`flex items-center gap-1 px-1.5 py-1.5 xl:px-2 rounded-md text-xs xl:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                          isActive || isOpen
                            ? 'bg-white/20 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        <span className="whitespace-nowrap flex-shrink-0">{item.label}</span>
                        <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                          <div className="py-1">
                            {item.subItems.map(sub => {
                              const subPathname = sub.path.split('#')[0];
                              const subHash = sub.path.split('#')[1] ? '#' + sub.path.split('#')[1] : '';
                              return (
                              <Link
                                key={sub.path}
                                to={sub.path}
                                onClick={(e) => {
                                  setOpenDropdown(null);
                                  if (location.pathname === subPathname) {
                                    e.preventDefault();
                                    window.history.pushState(null, '', sub.path);
                                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                                    setTimeout(() => {
                                      const el = document.getElementById(subHash.substring(1));
                                      if (el) {
                                        const y = el.getBoundingClientRect().top + window.scrollY - 160;
                                        window.scrollTo({ top: y, behavior: 'smooth' });
                                      }
                                    }, 50);
                                  }
                                }}
                                className={`block px-4 py-2 text-sm ${
                                  location.pathname === subPathname && location.hash === subHash
                                    ? 'bg-gray-100 text-brand-grafite font-medium'
                                    : 'text-brand-grafite hover:bg-gray-50'
                                }`}
                              >
                                {sub.label}
                              </Link>
                            )})}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path!}
                    className={`flex items-center gap-1 px-1.5 py-1.5 xl:px-2 rounded-md text-xs xl:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="whitespace-nowrap flex-shrink-0">{item.label}</span>
                  </Link>
                );
              })}

              <div className="h-6 w-[1px] bg-white/20 mx-2 flex-shrink-0" />

              {/* User Authentication UI */}
              {user ? (
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border-2 border-white/20" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <User size={16} />
                      </div>
                    )}
                    <span className="text-xs font-medium hidden lg:block max-w-[100px] truncate">
                      {user.displayName?.split(' ')[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white flex-shrink-0"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-1.5 bg-white text-brand-grafite px-3 py-1.5 rounded-full text-xs xl:text-sm font-bold shadow-sm hover:bg-blue-50 transition-all border border-transparent flex-shrink-0"
                >
                  <LogIn size={16} />
                  Acesso Administrador
                </button>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#0099d9]">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon;

                if ('subItems' in item && item.subItems) {
                  const isActive = item.subItems.some(sub => {
                    const subPathname = sub.path.split('#')[0];
                    return location.pathname === subPathname;
                  });
                  return (
                    <div key={item.label} className="space-y-1">
                      {item.path ? (
                        <Link 
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                            isActive ? 'text-white' : 'text-white/80'
                          }`}
                        >
                          <Icon size={20} />
                          {item.label}
                        </Link>
                      ) : (
                        <div className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                          isActive ? 'text-white' : 'text-white/80'
                        }`}>
                          <Icon size={20} />
                          {item.label}
                        </div>
                      )}
                      <div className="pl-10 space-y-1">
                        {item.subItems.map(sub => {
                          const subPathname = sub.path.split('#')[0];
                          const subHash = sub.path.split('#')[1] ? '#' + sub.path.split('#')[1] : '';
                          return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={(e) => {
                              setIsMenuOpen(false);
                              if (location.pathname === subPathname) {
                                e.preventDefault();
                                window.history.pushState(null, '', sub.path);
                                window.dispatchEvent(new HashChangeEvent('hashchange'));
                                setTimeout(() => {
                                  const el = document.getElementById(subHash.substring(1));
                                  if (el) {
                                    const y = el.getBoundingClientRect().top + window.scrollY - 160;
                                    window.scrollTo({ top: y, behavior: 'smooth' });
                                  }
                                }, 50);
                              }
                            }}
                            className={`block px-3 py-2 rounded-md text-sm font-medium ${
                              location.pathname === subPathname && location.hash === subHash
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        )})}
                      </div>
                    </div>
                  );
                }

                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path!}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}

              <div className="border-t border-white/10 pt-4 mt-4 pb-2">
                {user ? (
                  <div className="px-3 space-y-3">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border-2 border-white/20" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                          <User size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{user.displayName}</p>
                        <p className="text-white/60 text-xs">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <LogOut size={20} />
                      Sair da conta
                    </button>
                  </div>
                ) : (
                  <div className="px-3">
                    <button
                      onClick={() => { handleLogin(); setIsMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-3 bg-white text-brand-grafite px-4 py-3 rounded-xl text-base font-bold shadow-sm"
                    >
                      <LogIn size={20} />
                      Acesso Administrador
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-brand-navy text-white/80 py-4 text-center text-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          © 2026 Hub de Gestão do Conhecimento - Madrona Advogados. Confidencial e Interno.
        </div>
      </footer>

      <AuthErrorModal
        error={authError?.type || null}
        onClose={() => setAuthError(null)}
      />
    </div>
  );
}
