// Service to fetch real-time data from Hedera Testnet Mirror Node
// Docs: https://docs.hedera.com/hedera/sdks-and-apis/rest-api

export interface HederaTransaction {
  transaction_id: string;
  consensus_timestamp: string;
  charged_tx_fee: number;
  result: string;
  name: string;
  entity_id: string;
}

export const fetchLiveTransactions = async (): Promise<HederaTransaction[]> => {
  try {
    // Fetch latest 10 transactions from Hedera Testnet
    const response = await fetch(
      'https://testnet.mirrornode.hedera.com/api/v1/transactions?limit=10&order=desc'
    );
    
    if (!response.ok) {
      throw new Error(`Mirror Node Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.transactions.map((tx: any) => ({
      transaction_id: tx.transaction_id,
      consensus_timestamp: tx.consensus_timestamp,
      charged_tx_fee: tx.charged_tx_fee,
      result: tx.result,
      name: tx.name,
      entity_id: tx.entity_id || '0.0.xxxxx'
    }));
  } catch (error) {
    console.error("Failed to fetch Hedera transactions:", error);
    return [];
  }
};