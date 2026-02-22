// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // Uniswap V2 Router02 合约 (Sepolia 网络)
  UNISWAPV2_ROUTER02: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
  
  // Uniswap V2 Factory 合约 (Sepolia 网络)
  UNISWAPV2_FACTORY: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
  
  // DEX-AMM Router02 合约 (Sepolia 网络)
  DEXAMM_ROUTER02: '0xc41bAF3EB77599444283c21f7781475b0e81f978',
  
  // DEX-AMM Factory 合约 (Sepolia 网络)
  DEXAMM_FACTORY: '0x80A9a98Dc2432994E826227457e06BAAdCbE8c6F',
  
  // Sepolia 网络交易对合约
  TRADING_PAIRS: {
    'ETH-USDT': '0x1111111111111111111111111111111111111111',
    'WBTC-USDT': '0x2222222222222222222222222222222222222222',
    'DAI-USDT': '0x3333333333333333333333333333333333333333'
  },
  
  // Sepolia 网络 ERC20 代币合约
  TOKENS: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDT: '0x2Bd4D30d4E026146039600aF11e83e4f8277BbDD',
    WBTC: '0x9B2283478B422B7040e90A50c427109763e126A3',
    DAI: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844'
  }
};

// 合约 ABIs
export const CONTRACT_ABIS = {
  UNISWAPV2_ROUTER02: [
    'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
    'function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)',
    'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
    'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
    'function addLiquidity(uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256[] memory amounts)',
    'function removeLiquidity(uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256[] memory amounts)'
  ],
  
  ERC20: [
    'function balanceOf(address owner) external view returns (uint256)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function approve(address spender, uint256 value) external returns (bool)',
    'function transfer(address to, uint256 value) external returns (bool)',
    'function transferFrom(address from, address to, uint256 value) external returns (bool)',
    'function totalSupply() external view returns (uint256)',
    'function decimals() external view returns (uint8)',
    'function symbol() external view returns (string memory)',
    'function name() external view returns (string memory)'
  ],
  
  UNISWAPV2_FACTORY: [
    'function createPair(address tokenA, address tokenB) external returns (address pair)',
    'function getPair(address tokenA, address tokenB) external view returns (address pair)',
    'function allPairs(uint) external view returns (address pair)',
    'function allPairsLength() external view returns (uint)',
    'function feeTo() external view returns (address)',
    'function feeToSetter() external view returns (address)'
  ],
  
  UNISWAPV2_PAIR: [
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function balanceOf(address owner) external view returns (uint256)',
    'function transfer(address to, uint256 value) external returns (bool)',
    'function approve(address spender, uint256 value) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)'
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
  },
  
  // 网络配置
  NETWORKS: {
    SEPOLIA: {
      chainId: 11155111,
      name: 'Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'
    }
  },
  
  // 默认配置
  DEFAULT_ROUTER: 'dexamm',
  DEFAULT_FACTORY: 'dexamm',
  DEFAULT_SLIPPAGE: 0.01,
  DEFAULT_DEADLINE: 60 * 20 // 20分钟
};

