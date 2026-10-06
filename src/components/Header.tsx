import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Layers,
  Bell,
  X,
  ChevronDown,
  LogIn,
  LogOut,
  Globe,
  LayoutDashboard,
  Trash2,
  Menu,
  Printer,
  Zap,
  Package,
  Folder,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { KimoLogo } from './KimoLogo';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    user,
    handleGoogleSignIn,
    handleSignOut,
    resetAllDataToZero,
    notifications,
    dismissNotification,
  } = useWorkshop();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Panel General', icon: LayoutDashboard },
    { id: 'cotizador', label: 'Cotizador Activo', icon: Zap },
    { id: 'taller', label: 'Tablero Kanban', icon: Layers },
  ] as const;

  const adminTabs = [
    { id: 'inventario', label: 'Inventario y Almacén', icon: Package },
    { id: 'flota', label: 'Flota y Mantenimiento', icon: Printer },
    { id: 'catalogo', label: 'Catálogo de Recetas', icon: Folder },
    { id: 'finanzas', label: 'Finanzas y OPEX', icon: TrendingUp },
  ] as const;

  const activeMeta = [...mainTabs, ...adminTabs].find((t) => t.id === activeTab) || mainTabs[0];

  const [showAdminMenu, setShowAdminMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E5E2DB] shadow-2xs">
      <div className="h-13 w-full px-3 lg:px-6 flex items-center justify-between gap-2 max-w-[1720px] mx-auto">
        {/* LOGO COMPACTO */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className="flex items-center text-left active:scale-95 transition-transform cursor-pointer"
            title="KiMO 3D Studio"
          >
            <KimoLogo size="sm" showSubtitle={false} />
          </button>
        </div>

        {/* NAVEGACIÓN DESKTOP COMPACTA Y ERGONÓMICA */}
        <nav className="hidden lg:flex items-center p-1 bg-[#F0EEE7] rounded-full gap-0.5 border border-[#CDC3D2]/30 shadow-2xs relative">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#350463] text-white shadow-xs'
                    : 'text-[#4B4450] hover:text-[#1C1C18] hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C0F441]' : 'text-[#6D3ACD]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="relative">
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ml-1 ${
                adminTabs.some(t => t.id === activeTab)
                  ? 'bg-[#6D3ACD] text-white shadow-xs'
                  : 'text-[#4B4450] hover:text-[#1C1C18] hover:bg-white/60'
              }`}
            >
              <Settings className={`w-3.5 h-3.5 ${adminTabs.some(t => t.id === activeTab) ? 'text-[#C0F441]' : 'text-[#6D3ACD]'}`} />
              <span>Gestión de Taller</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showAdminMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                {adminTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setShowAdminMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                        isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-purple-700' : 'text-gray-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* CONTROLES DERECHA + BOTÓN HAMBURGUESA MÓVIL */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tienda / Panel toggle en Desktop (Oculto a petición del usuario) */}
          {/*
          <div className="hidden sm:flex items-center gap-1.5">
            {activeTab !== 'tienda' ? (
              <button
                type="button"
                onClick={() => setActiveTab('tienda')}
                className="px-2.5 py-1 rounded-full bg-[#6D3ACD] hover:bg-[#5829AE] text-white font-bold text-xs shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                title="Abrir Tienda Web Pública"
              >
                <Globe className="w-3.5 h-3.5 text-[#C0F441]" />
                <span className="hidden xl:inline">Tienda</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-2.5 py-1 rounded-full bg-[#350463] hover:bg-[#250247] text-[#C0F441] font-bold text-xs shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                title="Panel Taller"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Taller</span>
              </button>
            )}
          </div>
          */}

          {/* Notificaciones */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-8 h-8 rounded-full bg-white hover:bg-[#F0EEE7] flex items-center justify-center transition-colors text-[#350463] border border-[#CDC3D2]/40 shadow-2xs cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-3.5 h-3.5" />
              {notifications.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#FF5252] ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl p-3 shadow-xl border border-[#E5E2DB] z-50 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0EEE7]">
                  <span className="font-bold text-xs text-[#350463] uppercase tracking-wider">
                    Notificaciones
                  </span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-[#F0EEE7] rounded-lg text-[#4B4450] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#4B4450] py-2 text-center">Sin alertas pendientes</p>
                  ) : (
                    notifications.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E5E2DB] flex items-start justify-between gap-2 text-xs"
                      >
                        <span className="text-[#1C1C18] font-medium leading-snug">{note}</span>
                        <button
                          onClick={() => dismissNotification(idx)}
                          className="text-[#4B4450] hover:text-[#BA1A1A] shrink-0 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menú de Usuario */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 pr-2 bg-white hover:bg-[#FAF7F0] rounded-full shadow-2xs border border-[#CDC3D2]/40 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#EADDFB] text-[#350463] flex items-center justify-center font-bold text-[10px] overflow-hidden border border-[#9C6DFF]/30">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span>KM</span>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-[#4B4450]" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl p-3 shadow-xl border border-[#E5E2DB] z-50 animate-in zoom-in-95">
                <div className="p-1.5 border-b border-[#F0EEE7] mb-2">
                  <span className="font-bold text-xs text-[#350463] block">
                    {user ? user.displayName : 'Taller KiMO CDMX'}
                  </span>
                  <span className="text-[10px] text-[#4B4450] block truncate">
                    {user ? user.email : 'Modo Operador Local'}
                  </span>
                </div>
                {/* Inicio de sesión / Cerrar sesión oculto por petición del usuario */}
                {/* 
                {user ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleGoogleSignIn();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#350463] bg-[#EADDFB] hover:bg-[#D2BCFF] transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Iniciar con Google</span>
                  </button>
                )} 
                */}

                <div className="mt-2 pt-2 border-t border-[#F0EEE7]">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          '¿Estás seguro de que deseas eliminar TODOS los datos y reiniciar a 0?'
                        )
                      ) {
                        resetAllDataToZero();
                        setShowUserMenu(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#C62828] hover:bg-[#FFEBEE] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#C62828]" />
                    <span>Reiniciar Sistema</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MENÚ HAMBURGUESA MÓVIL (ÚNICO NAVEGADOR EN MÓVIL) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-full bg-[#350463] text-white flex items-center justify-center border border-[#6D3ACD]/30 shadow-2xs cursor-pointer active:scale-95 transition-transform"
            title="Menú de navegación"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* DRAWER MÓVIL ÚNICO AL HACER CLIC EN MENÚ HAMBURGUESA */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-13 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-start animate-in fade-in duration-150">
          <div className="bg-white border-b border-[#E5E2DB] shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between border-b border-[#F0EEE7] pb-2">
              <span className="text-xs font-extrabold text-[#350463] uppercase tracking-wider">
                Navegación Taller KiMO 3D
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-[#4B4450] hover:bg-[#F0EEE7] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[...mainTabs, ...adminTabs].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#350463] text-white shadow-xs'
                        : 'bg-[#FAF7F0] text-[#4B4450] hover:bg-[#F0EEE7]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C0F441]' : 'text-[#6D3ACD]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#F0EEE7] flex items-center justify-between">
              <span className="text-xs font-bold text-[#350463]">Acción rápida:</span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas reiniciar los datos del sistema a cero?')) {
                    resetAllDataToZero();
                    setMobileMenuOpen(false);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-[#FFEBEE] text-[#C62828] text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reiniciar Cero</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
