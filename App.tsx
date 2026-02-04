import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AuditTerminal from './components/AuditTerminal';
import LedgerTable from './components/LedgerTable';
import A2AMonitor from './components/A2AMonitor';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'audit':
        return <AuditTerminal />;
      case 'ledger':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Immutable Ledger</h2>
            <LedgerTable />
          </div>
        );
      case 'network':
        return <A2AMonitor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-aegis-bg text-gray-200 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-gray-500 text-sm font-mono uppercase tracking-widest">System Status</h2>
            <div className="flex gap-4 mt-2">
               <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                 Handshake: OK
               </div>
               <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                 Audit: OK
               </div>
               <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                 Ledger: OK
               </div>
               <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                 Settlement: OK
               </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-xs text-gray-500">Operator ID</p>
               <p className="text-sm font-bold text-white">0.0.12345</p>
             </div>
             <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-600 to-purple-600 border border-white/20"></div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

export default App;