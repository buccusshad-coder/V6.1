const http = require('http');
const url = require('url');

const mockData = {
  wallets: [
    {
      id: '1',
      name: 'My Ethereum Wallet',
      address: '0x742d35Cc6634C0532925a3b844Bc369e4471243D',
      chain: 'ethereum',
      chains: ['ethereum', 'arbitrum', 'base', 'polygon', 'optimism'],
      type: 'evm',
      balance: 50000,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'My Solana Wallet',
      address: '3J98t1WnwEjsnkYXLB1QNLsNgPDMzcBkSfh8HWqGrJwN',
      chain: 'solana',
      chains: ['solana'],
      type: 'solana',
      balance: 25000,
      createdAt: new Date().toISOString()
    }
  ],
  holdings: {
    '1': [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        amount: '1.5',
        decimals: 18,
        value: 3000,
        chain: 'ethereum'
      },
      {
        symbol: 'JOE',
        name: 'Joe',
        amount: '500',
        decimals: 18,
        value: 2500,
        chain: 'arbitrum'
      },
      {
        symbol: 'BONK',
        name: 'Bonk',
        amount: '100000',
        decimals: 5,
        value: 1000,
        chain: 'base'
      },
      {
        symbol: 'PNKSTR',
        name: 'PinkStr',
        amount: '1000',
        decimals: 18,
        value: 500,
        chain: 'polygon'
      },
      {
        symbol: 'EIGEN',
        name: 'Eigen',
        amount: '100',
        decimals: 18,
        value: 3000,
        chain: 'optimism'
      }
    ],
    '2': [
      {
        symbol: 'SOL',
        name: 'Solana',
        amount: '50',
        decimals: 9,
        value: 12500,
        chain: 'solana'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (Solana)',
        amount: '5000',
        decimals: 6,
        value: 5000,
        chain: 'solana'
      },
      {
        symbol: 'COPE',
        name: 'Cope',
        amount: '2000',
        decimals: 6,
        value: 200,
        chain: 'solana'
      }
    ],
    // For dynamically created wallets - return wallet-type appropriate data
    'default-solana': [
      {
        symbol: 'SOL',
        name: 'Solana',
        amount: '50',
        decimals: 9,
        value: 12500,
        chain: 'solana'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (Solana)',
        amount: '5000',
        decimals: 6,
        value: 5000,
        chain: 'solana'
      }
    ],
    'default-evm': [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        amount: '1.5',
        decimals: 18,
        value: 3000,
        chain: 'ethereum'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        amount: '10000',
        decimals: 6,
        value: 10000,
        chain: 'base'
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        amount: '0.5',
        decimals: 8,
        value: 20000,
        chain: 'ethereum'
      }
    ],
    // Scanned real holdings data for EVM wallet
    'scan-evm': [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        amount: '0.000711345',
        decimals: 18,
        value: 1.71,
        chain: 'ethereum',
        price: 2407.29,
        change24h: 0.37
      },
      {
        symbol: 'JOE',
        name: 'Joe Coin',
        amount: '8293.34',
        decimals: 18,
        value: 45.64,
        chain: 'ethereum',
        address: '0x76e222b07C53D28b89b0bAc18602810Fc22B49A8',
        price: 0.005503,
        change24h: 5.53,
        bridge: 'Wormhole'
      },
      {
        symbol: 'Bonk',
        name: 'Bonk',
        amount: '14046387.50',
        decimals: 6,
        value: 36.38,
        chain: 'ethereum',
        address: '0x1151CB3d861920e07a38e03eEAd12C32178567F6',
        price: 0.000003,
        change24h: 0.15
      },
      {
        symbol: 'PNKSTR',
        name: 'PunkStrategy',
        amount: '2260.52',
        decimals: 18,
        value: 16.60,
        chain: 'ethereum',
        address: '0xc50673EDb3A7b94E8CAD8a7d4E0cD68864E33eDF',
        price: 0.007343,
        change24h: 3.07
      },
      {
        symbol: 'EIGEN',
        name: 'Eigen',
        amount: '62.87',
        decimals: 18,
        value: 11.97,
        chain: 'ethereum',
        address: '0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83',
        price: 0.190398,
        change24h: 1.33
      }
    ],
    // Scanned real holdings data for Solana wallet
    'scan-solana': [
      {
        symbol: 'SOL',
        name: 'Solana',
        amount: '5.25',
        decimals: 9,
        value: 1050,
        chain: 'solana',
        price: 200,
        change24h: 2.5
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (Solana)',
        amount: '2500',
        decimals: 6,
        value: 2500,
        chain: 'solana',
        address: 'EPjFWaLb3DiFVzFaxZucxDkH7lgA1DTJK9KpqUgS7zKu',
        price: 1.0,
        change24h: 0.1
      },
      {
        symbol: 'COPE',
        name: 'Cope',
        amount: '1000',
        decimals: 4,
        value: 150,
        chain: 'solana',
        address: '8HGyAAB1yoM1ttS7pnqYRV34aak3xcN7WfDPjYuxV84j',
        price: 0.15,
        change24h: -5.2
      }
    ],
    // Alternative EVM holdings for different wallet
    'scan-evm-alt': [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        amount: '5000',
        decimals: 6,
        value: 5000,
        chain: 'ethereum',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        price: 1.0,
        change24h: 0.05
      },
      {
        symbol: 'USDT',
        name: 'Tether',
        amount: '3000',
        decimals: 6,
        value: 3000,
        chain: 'ethereum',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        price: 1.0,
        change24h: 0.02
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        amount: '1.5',
        decimals: 18,
        value: 3600,
        chain: 'ethereum',
        address: '0xC02aaA39b223FE8D0A0e8e4F27ead9083C756Cc2',
        price: 2400,
        change24h: 1.2
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        amount: '2000',
        decimals: 18,
        value: 2000,
        chain: 'ethereum',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        price: 1.0,
        change24h: -0.01
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        amount: '100',
        decimals: 18,
        value: 1500,
        chain: 'ethereum',
        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        price: 15.0,
        change24h: 3.5
      }
    ]
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Mock auth
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({ token: 'mock-token', user: { id: 'user-1', email: 'user@test.com' } }));
    return;
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({ token: 'mock-token', user: { id: 'user-1', email: 'user@test.com' } }));
    return;
  }

  if (pathname === '/api/auth/profile' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ id: 'user-1', email: 'user@test.com' }));
    return;
  }

  // Mock wallets endpoints
  if (pathname === '/api/wallets' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(mockData.wallets));
    return;
  }

  if (pathname === '/api/wallets' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const newWallet = JSON.parse(body);
      const wallet = {
        id: String(mockData.wallets.length + 1),
        ...newWallet,
        chain: newWallet.chain || 'ethereum',
        chains: newWallet.address.startsWith('0x')
          ? ['ethereum', 'arbitrum', 'base', 'polygon', 'optimism']
          : ['solana'],
        type: newWallet.address.startsWith('0x') ? 'evm' : 'solana',
        balance: 0,
        createdAt: new Date().toISOString()
      };
      mockData.wallets.push(wallet);
      res.writeHead(201);
      res.end(JSON.stringify(wallet));
    });
    return;
  }

  if (pathname.startsWith('/api/wallets/') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    const wallet = mockData.wallets.find(w => w.id === id);
    if (wallet) {
      // Return wallet-type appropriate holdings
      let holdings = mockData.holdings[id] || [];
      if (holdings.length === 0) {
        // For dynamically created wallets, return type-appropriate data
        holdings = wallet.type === 'solana'
          ? mockData.holdings['default-solana']
          : mockData.holdings['default-evm'];
      }
      res.writeHead(200);
      res.end(JSON.stringify({ ...wallet, metadata: { holdings } }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Wallet not found' }));
    }
    return;
  }

  if (pathname.startsWith('/api/wallets/') && pathname.endsWith('/scan') && req.method === 'POST') {
    const id = pathname.split('/')[3];
    const wallet = mockData.wallets.find(w => w.id === id);

    if (wallet) {
      let scannedHoldings;

      if (wallet.type === 'solana') {
        scannedHoldings = mockData.holdings['scan-solana'];
      } else {
        // Return different EVM holdings based on wallet address length and middle character
        const addressHash = wallet.address.length + (wallet.address.charCodeAt(Math.floor(wallet.address.length / 2)) || 0);
        scannedHoldings = addressHash % 2 === 0
          ? mockData.holdings['scan-evm-alt']
          : mockData.holdings['scan-evm'];
      }

      // Update wallet holdings with scanned data
      mockData.holdings[id] = scannedHoldings;

      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Scan completed',
        wallet: { ...wallet, metadata: { holdings: scannedHoldings } }
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Wallet not found' }));
    }
    return;
  }

  if (pathname.startsWith('/api/wallets/') && req.method === 'PUT') {
    const id = pathname.split('/')[3];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const idx = mockData.wallets.findIndex(w => w.id === id);
      if (idx >= 0) {
        mockData.wallets[idx] = { ...mockData.wallets[idx], ...JSON.parse(body) };
        res.writeHead(200);
        res.end(JSON.stringify(mockData.wallets[idx]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Wallet not found' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/wallets/') && req.method === 'DELETE') {
    const id = pathname.split('/')[3];
    const idx = mockData.wallets.findIndex(w => w.id === id);
    if (idx >= 0) {
      mockData.wallets.splice(idx, 1);
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Deleted' }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Wallet not found' }));
    }
    return;
  }

  // Default 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Mock API server running on http://localhost:${PORT}`);
});
