import React from 'react';
import { LayoutDashboard, ShieldCheck, Activity, Database, Rocket } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
    { id: 'marathon', icon: Rocket, label: 'Marathon Agent' },
    { id: 'audit', icon: ShieldCheck, label: 'Cognitive Audit' },
    { id: 'ledger', icon: Database, label: 'Immutable Ledger' },
    { id: 'network', icon: Activity, label: 'A2A Network' },
  ];

  return (
    <div className="w-64 h-screen bg-aegis-panel border-r border-aegis-border flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-aegis-border">
        <h1 className="text-2xl font-bold tracking-tighter text-white flex items-center gap-2">
          <ShieldCheck className="text-hedera-accent" />
          AEGIS
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-mono">v1.0.4 | PROD</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-hedera-accent/10 text-hedera-accent border border-hedera-accent/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-aegis-border">
        <div className="flex items-center gap-3 px-4 py-2 text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-mono">HEDERA: CONNECTED</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 text-gray-500">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-mono">GEMINI 3: ONLINE</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;