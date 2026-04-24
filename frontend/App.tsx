
import React, { useState ,useEffect} from 'react';
import {
  DashboardIcon,
  ScanIcon,
  GmailIcon,
  FilesIcon,
  ReportIcon,
  SettingsIcon,
  LogoutIcon,
  ShieldCheckIcon,
} from './components/Icons';
import { MainContent } from './components/MainContent';
import { AuthForm } from './components/Login';
import { ScannedFile } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinLock, setShowPinLock] = useState(false); // Can be used to simulate app lock
  const [activeView, setActiveView] = useState('Dashboard');
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveView('Dashboard');
    setScannedFiles([]);
  };
    useEffect(() => {
  const loadFiles = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/files/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    
    setScannedFiles(data.map(item => ({
      id: item._id,
      file: { name: item.fileName, size: item.fileSize },
      previewUrl: item.previewUrl,
      risk: item.risk,
      details: item.details,
      category: item.category,
      scanDate: new Date(item.scanDate),
    })));
  };

  loadFiles();
}, []);

  const NavItem: React.FC<{ icon: React.ReactNode; label: string; view: string }> = ({ icon, label, view }) => (
    <li
      onClick={() => {
        setActiveView(view);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
        activeView === view
          ? 'bg-accent text-white'
          : 'text-text-secondary hover:bg-secondary hover:text-text-primary'
      }`}
    >
      {icon}
      <span className="ml-4 font-semibold">{label}</span>
    </li>
  );
  
  const navItems = [
    { icon: <DashboardIcon className="w-6 h-6" />, label: 'Dashboard', view: 'Dashboard' },
    { icon: <ScanIcon className="w-6 h-6" />, label: 'Scanner', view: 'Scanner' },
    { icon: <GmailIcon className="w-6 h-6" />, label: 'Gmail', view: 'Gmail' },
    { icon: <FilesIcon className="w-6 h-6" />, label: 'File Manager', view: 'File Manager' },
    { icon: <ReportIcon className="w-6 h-6" />, label: 'Reports', view: 'Reports' },
    { icon: <SettingsIcon className="w-6 h-6" />, label: 'Settings', view: 'Settings' },
  ];

  if (!isAuthenticated) {
    return <AuthForm onLogin={handleLogin} />;
  }
  
  // A simple PIN lock simulation can be added here if needed
  // if (showPinLock) { return <PinLock onUnlock={() => setShowPinLock(false)} />; }



  return (
    <div className="flex h-screen bg-primary">
       {/* Sidebar */}
       <aside className={`absolute lg:relative z-20 h-full bg-secondary border-r border-border-color w-64 flex-shrink-0 flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex`}>
          <div>
            <div className="flex items-center mb-8 px-2">
              <ShieldCheckIcon className="w-8 h-8 text-accent" />
              <h1 className="ml-2 text-xl font-bold text-text-primary">Cyber Shield</h1>
            </div>
            <nav>
              <ul className="space-y-2">
                {navItems.map(item => <NavItem key={item.view} {...item} />)}
              </ul>
            </nav>
          </div>
          <div className="pb-4">
             <li
                onClick={handleLogout}
                className="flex items-center p-3 rounded-lg cursor-pointer transition-colors text-text-secondary hover:bg-secondary hover:text-text-primary"
            >
              <LogoutIcon className="w-6 h-6" />
              <span className="ml-4 font-semibold">Logout</span>
            </li>
          </div>
        </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex lg:hidden items-center justify-between p-4 bg-secondary border-b border-border-color">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-6 h-6 text-accent" />
              <h1 className="ml-2 text-lg font-bold text-text-primary">Sentinel Shield</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <MainContent activeView={activeView} scannedFiles={scannedFiles} setScannedFiles={setScannedFiles} />
        </main>
      </div>
    </div>
  );
};

export default App;
