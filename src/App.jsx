import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

  const handleNavigate = (view,params) => {
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
        return <Dashboard onNavigate={handleNavigate} />;
      case 'anagrafica':
        return <Anagrafica />;
      case 'interventi':
      case 'verbali':
        return <InterventiVerbali initialTab={currentView === 'verbali' ? 'verbali' : 'interventi'} />;
      case 'checklist':
        return (
          <ChecklistUNI11224 
            pianoId={centraleSelezionata?.pianoId}
            centraleId={centraleSelezionata?.centraleId}
            protocolloTipo={centraleSelezionata?.protocolloTipo || 'sorveglianza'}
            onSave={(data) => console.log('Salvato:', data)}
            onComplete={() => setCurrentView('interventi')}
            deviceList={centraleSelezionata?.dispositivi || []}
          />
        );
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 fixed h-screen overflow-y-auto`}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Flame className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="font-bold text-sm">IRAI</h1>
                <p className="text-xs text-gray-400">Manutenzione</p>
              </div>
            )}
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              {sidebarOpen && (
                <div>
                  <p className="text-sm font-medium">{profilo?.nome || user?.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{profilo?.ruolo || 'Tecnico'}</p>
                </div>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(m => m.id === currentView)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <button className="relative p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            renderView()
          )}
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;