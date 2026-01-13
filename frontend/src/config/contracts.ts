// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // Uniswap V2 Router 合约 (Sepolia 网络)
  UNISWAP_ROUTER: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
  
  // Uniswap V2 Factory 合约 (Sepolia 网络)
  UNISWAP_FACTORY: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
  
  // Sepolia 网络交易对合约
  TRADING_PAIRS: {
    'ETH-USDT': '0x1111111111111111111111111111111111111111',
    'WBTC-USDT': '0x2222222222222222222222222222222222222222',
    'DAI-USDT': '0x3333333333333333333333333333333333333333'
  },
  
  // Sepolia 网络 ERC20 代币合约
  TOKENS: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
    WBTC: '0x9B2283478B422B7040e90A50c427109763e126A3',
    DAI: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844'
  }
};

// 合约 ABIs
export const CONTRACT_ABIS = {
  UNISWAP_ROUTER: [
    'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
    'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
  ],
  
  ERC20: [
    'function balanceOf(address owner) external view returns (uint256)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function approve(address spender, uint256 value) external returns (bool)',
    'function transfer(address to, uint256 value) external returns (bool)',
  ]
};

// 应用配置
export const APP_CONFIG = {
  APP_NAME: 'DEX-AMM',
  APP_VERSION: '1.0.0',
  DEFAULT_TRADE_FEE: 0.003,
  DECIMALS: {
    ETH: 18,
    USDT: 6,
    WBTC: 8,
    DAI: 18
  }
};

