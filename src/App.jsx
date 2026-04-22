import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, ClipboardCheck, 
  FileText, Settings, LogOut, Menu, X, 
  Flame, Bell, User, Wifi, WifiOff
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login, Register, ResetPassword, UpdatePassword } from './pages/AuthPages';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Anagrafica from './components/Anagrafica';
import ChecklistUNI11224 from './components/ChecklistUNI11224';
import InterventiVerbali from './components/InterventiVerbali';

const AppContent = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [centraleSelezionata, setCentraleSelezionata] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, profilo, signOut } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'anagrafica', label: 'Anagrafica', icon: Building2 },
    { id: 'interventi', label: 'Interventi', icon: ClipboardCheck },
    { id: 'verbali', label: 'Verbali', icon: FileText },
  ];

  const handleNavigate = (view, params) => {
    if (view === 'checklist' && params?.centraleId) {
      setCentraleSelezionata(params.centraleId);
    }
    setCurrentView(view);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return React.createElement(Dashboard, { onNavigate: handleNavigate });
      case 'anagrafica':
        return React.createElement(Anagrafica);
      case 'interventi':
      case 'verbali':
        return React.createElement(InterventiVerbali, { initialTab: currentView === 'verbali' ? 'verbali' : 'interventi' });
      case 'checklist':
        return React.createElement(ChecklistUNI11224, {
          pianoId: centraleSelezionata?.pianoId,
          centraleId: centraleSelezionata?.centraleId,
          protocolloTipo: centraleSelezionata?.protocolloTipo || 'sorveglianza',
          onSave: (data) => console.log('Salvato:', data),
          onComplete: () => setCurrentView('interventi'),
          deviceList: centraleSelezionata?.dispositivi || []
        });
      default:
        return React.createElement(Dashboard, { onNavigate: handleNavigate });
    }
  };

  const asideClass = sidebarOpen ? 'w-64' : 'w-20';
  const mainClass = sidebarOpen ? 'ml-64' : 'ml-20';

  return (
    React.createElement('div', { className: 'min-h-screen bg-gray-100 flex' },
      React.createElement('aside', { className: `${asideClass} bg-gray-900 text-white transition-all duration-300 fixed h-screen overflow-y-auto` },
        React.createElement('div', { className: 'p-4 border-b border-gray-800 flex justify-between items-center' },
          sidebarOpen && React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement(Flame, { className: 'w-8 h-8 text-red-500' }),
            React.createElement('div', null,
              React.createElement('h1', { className: 'font-bold text-sm' }, 'IRAI'),
              React.createElement('p', { className: 'text-xs text-gray-400' }, 'Manutenzione')
            )
          ),
          React.createElement('button', {
            onClick: () => setSidebarOpen(!sidebarOpen),
            className: 'p-2 hover:bg-gray-800 rounded'
          }, sidebarOpen ? React.createElement(X, { className: 'w-5 h-5' }) : React.createElement(Menu, { className: 'w-5 h-5' }))
        ),
        React.createElement('nav', { className: 'p-2 space-y-1' },
          ...menuItems.map(item =>
            React.createElement('button', {
              key: item.id,
              onClick: () => handleNavigate(item.id),
              className: `w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${currentView === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
            }, [
              React.createElement(item.icon, { key: 'icon', className: 'w-5 h-5' }),
              sidebarOpen && React.createElement('span', { key: 'label', className: 'text-sm font-medium' }, item.label)
            ])
          )
        ),
        React.createElement('div', { className: 'absolute bottom-0 w-full p-4 border-t border-gray-800' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement(User, { className: 'w-5 h-5 text-gray-400' }),
              sidebarOpen && React.createElement('div', null,
                React.createElement('p', { className: 'text-sm font-medium' }, profilo?.nome || user?.email),
                React.createElement('p', { className: 'text-xs text-gray-400 capitalize' }, profilo?.ruolo || 'Tecnico')
              )
            ),
            React.createElement('button', {
              onClick: handleLogout,
              className: 'p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400',
              title: 'Logout'
            }, React.createElement(LogOut, { className: 'w-5 h-5' }))
          )
        )
      ),
      React.createElement('main', { className: `flex-1 ${mainClass} transition-all duration-300` },
        React.createElement('header', { className: 'bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-10' },
          React.createElement('div', { className: 'flex items-center gap-4' },
            React.createElement('h2', { className: 'text-lg font-semibold text-gray-800' },
              menuItems.find(m => m.id === currentView)?.label || 'Dashboard'
            )
          ),
          React.createElement('div', { className: 'flex items-center gap-4' },
            React.createElement('div', { className: `flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}` },
              isOnline ? React.createElement(Wifi, { className: 'w-4 h-4' }) : React.createElement(WifiOff, { className: 'w-4 h-4' }),
              React.createElement('span', { className: 'font-medium' }, isOnline ? 'Online' : 'Offline')
            ),
            React.createElement('button', { className: 'relative p-2 hover:bg-gray-100 rounded-full' },
              React.createElement(Bell, { className: 'w-5 h-5 text-gray-600' }),
              React.createElement('span', { className: 'absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full' })
            ),
            React.createElement('button', { className: 'p-2 hover:bg-gray-100 rounded-full' },
              React.createElement(Settings, { className: 'w-5 h-5 text-gray-600' })
            )
          )
        ),
        React.createElement('div', { className: 'p-6' },
          loading
            ? React.createElement('div', { className: 'flex items-center justify-center h-64' },
              React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
            )
            : renderView()
        )
      )
    )
  );
};

const App = () => {
  return (
    React.createElement(BrowserRouter, null,
      React.createElement(AuthProvider, null,
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/login', element: React.createElement(Login) }),
          React.createElement(Route, { path: '/register', element: React.createElement(Register) }),
          React.createElement(Route, { path: '/reset-password', element: React.createElement(ResetPassword) }),
          React.createElement(Route, { path: '/update-password', element: React.createElement(UpdatePassword) }),
          React.createElement(Route, { path: '/*', element: React.createElement(ProtectedRoute, null, React.createElement(AppContent)) })
        )
      )
    )
  );
};

export default App;