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
        amount: '2.5',
        decimals: 18,
        value: 5000,
        chain: 'ethereum'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        amount: '25000',
        decimals: 6,
        value: 25000,
        chain: 'base'
      },
      {
        symbol: 'ARB',
        name: 'Arbitrum',
        amount: '1000',
        decimals: 18,
        value: 20000,
        chain: 'arbitrum'
      }
    ],
    '2': [
      {
        symbol: 'SOL',
        name: 'Solana',
        amount: '100',
        decimals: 9,
        value: 25000,
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
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Scan started' }));
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
