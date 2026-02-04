import React from 'react';
import { AgentStatus } from '../types';
import { Activity, Users, Wallet, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const mockChartData = [
  { name: '00:00', load: 40, verified: 35 },
  { name: '04:00', load: 30, verified: 28 },
  { name: '08:00', load: 85, verified: 70 },
  { name: '12:00', load: 90, verified: 82 },
  { name: '16:00', load: 65, verified: 60 },
  { name: '20:00', load: 50, verified: 48 },
];

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="bg-aegis-panel border border-aegis-border p-6 rounded-lg">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded bg-${color}-500/10 text-${color}-500`}>
        <Icon size={20} />
      </div>
    </div>
    <p className={`text-xs ${sub.includes('+') ? 'text-green-400' : 'text-gray-400'}`}>{sub}</p>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Activity} 
          label="Active Agents" 
          value="1,024" 
          sub="+12% from yesterday" 
          color="blue" 
        />
        <StatCard 
          icon={ShieldAlert} 
          label="Audits (24h)" 
          value="84,392" 
          sub="98.2% Verification Rate" 
          color="green" 
        />
        <StatCard 
          icon={Wallet} 
          label="TVL (Escrow)" 
          value="4.2M ℏ" 
          sub="$320,000 USD approx" 
          color="yellow" 
        />
        <StatCard 
          icon={Users} 
          label="Reputation Avg" 
          value="87/100" 
          sub="Stable" 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-aegis-panel border border-aegis-border p-6 rounded-lg">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <Activity className="text-hedera-accent" size={18} />
            Network Reasoning Throughput
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="load" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Thought Signatures" />
                <Bar dataKey="verified" fill="#10b981" radius={[4, 4, 0, 0]} name="Verified" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Active Agents List */}
        <div className="bg-aegis-panel border border-aegis-border p-6 rounded-lg flex flex-col">
          <h3 className="text-white font-bold mb-4">Marathon Monitor (Top Agents)</h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded border border-transparent hover:border-aegis-border transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-white">Agent-Theta-{i}0{i}</p>
                    <p className="text-xs text-gray-500">Task: Optimization</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-hedera-accent">9{8-i}.5</p>
                  <p className="text-[10px] text-gray-500">Reputation</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;