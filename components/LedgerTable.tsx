import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { fetchLiveTransactions, HederaTransaction } from '../services/hederaService';
import { ExternalLink, RefreshCw, Activity } from 'lucide-react';

const LedgerTable: React.FC = () => {
  const [transactions, setTransactions] = useState<HederaTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLiveTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Poll every 5 seconds for live feel
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-aegis-panel border border-aegis-border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-aegis-border bg-white/5 flex justify-between items-center">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Activity size={18} className="text-hedera-accent" />
          Hedera Public Testnet
          <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
            LIVE
          </span>
        </h3>
        <button 
          onClick={loadData}
          className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Syncing...' : 'Refresh'}
        </button>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-gray-500 font-mono text-xs uppercase sticky top-0 bg-aegis-panel z-10">
            <tr>
              <th className="p-4">TX ID</th>
              <th className="p-4">Type</th>
              <th className="p-4">Fee (HBAR)</th>
              <th className="p-4">Result</th>
              <th className="p-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aegis-border">
            {transactions.map((tx) => (
              <tr key={tx.transaction_id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4 font-mono text-xs text-blue-500 truncate max-w-[150px]">
                  <a 
                    href={`https://hashscan.io/testnet/transaction/${tx.transaction_id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    {tx.transaction_id} <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
                  </a>
                </td>
                <td className="p-4">
                   <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-[10px] font-bold uppercase">
                     {tx.name}
                   </span>
                </td>
                <td className="p-4 font-mono text-white text-xs">
                  {(tx.charged_tx_fee / 100000000).toFixed(8)} ℏ
                </td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                    tx.result === 'SUCCESS' 
                      ? 'text-green-400 bg-green-400/10' 
                      : 'text-red-400 bg-red-400/10'
                  }`}>
                    {tx.result}
                  </span>
                </td>
                <td className="p-4 text-right text-gray-500 text-xs font-mono">
                  {new Date(parseFloat(tx.consensus_timestamp) * 1000).toLocaleTimeString()}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Connecting to Mirror Node...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerTable;