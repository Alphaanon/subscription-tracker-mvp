'use client';

export default function PaymentSection() {
  const cryptoAddresses = {
    bitcoin: '1564ZXsKePcBDci8GDWmsvfUy3DkKBe4x1',
    ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    usdt: 'TJX6K7K4Z3h3q3Xq3h3q3Xq3h3q3Xq3h3q',
    usdc: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  };

  return (
    <div className="mt-8 p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white">
      <h2 className="text-2xl font-bold mb-4">Support This Project</h2>
      <p className="mb-4">
        Love the subscription tracker? Consider supporting development with a crypto donation!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/10 p-4 rounded">
          <h3 className="font-semibold mb-2">Bitcoin (BTC)</h3>
          <code className="text-sm break-all">
            {cryptoAddresses.bitcoin}
          </code>
        </div>
        
        <div className="bg-white/10 p-4 rounded">
          <h3 className="font-semibold mb-2">Ethereum (ETH)</h3>
          <code className="text-sm break-all">
            {cryptoAddresses.ethereum}
          </code>
        </div>
        
        <div className="bg-white/10 p-4 rounded">
          <h3 className="font-semibold mb-2">Tether (USDT)</h3>
          <code className="text-sm break-all">
            {cryptoAddresses.usdt}
          </code>
        </div>
        
        <div className="bg-white/10 p-4 rounded">
          <h3 className="font-semibold mb-2">USD Coin (USDC)</h3>
          <code className="text-sm break-all">
            {cryptoAddresses.usdc}
          </code>
        </div>
      </div>
      
      <p className="mt-4 text-sm text-white/80">
        Thank you for supporting open-source development!
      </p>
    </div>
  );
}
