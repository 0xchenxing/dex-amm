# DEX-AMM Frontend - 现代化去中心化交易所前端

这是一个基于 React + TypeScript + Vite 构建的现代化去中心化交易所（DEX）自动做市商（AMM）系统前端界面。

## ✨ 特性

- 🎨 **现代化炫酷UI设计** - 深色主题、渐变效果、玻璃态设计
- 🌈 **流畅动画** - 丰富的过渡动画和交互效果
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🔐 **多角色权限管理** - 支持5种不同角色的仪表板
- 💼 **完整功能模块** - 交易、流动性、治理、套利、管理

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 🎯 功能模块

### 1. 交易者 (Trader)
- 交易概览和统计
- 现货交易（买入/卖出）
- 订单管理
- 资产组合
- 交易历史

### 2. 流动性提供者 (Liquidity Provider)
- 收益统计
- 流动性池管理
- 添加/移除流动性
- LP代币管理
- 收益历史

### 3. 治理者 (Governor)
- 治理概览
- 提案管理
- 创建提案和投票
- 协议参数设置
- 投票历史

### 4. 套利者 (Arbitrageur)
- 套利概览
- 机会发现
- 自动交易设置
- 收益分析

### 5. 系统管理员 (Admin)
- 系统概览
- 用户管理
- 交易监控
- 流动性管理
- 安全管理
- 系统设置

## 🔑 测试账户

| 角色 | 用户名 | 密码 | 角色选择 |
|------|--------|------|----------|
| 交易者 | trader | 123456 | trader |
| 流动性提供者 | liquidity | 123456 | liquidity |
| 治理者 | governor | 123456 | governor |
| 套利者 | arbitrageur | 123456 | arbitrageur |
| 系统管理员 | admin | 123456 | admin |

## 🎨 设计特色

- **深色主题** - 护眼的深色背景
- **渐变效果** - 丰富的渐变色彩
- **玻璃态设计** - 现代化的毛玻璃效果
- **流畅动画** - 平滑的过渡和交互动画
- **响应式布局** - 完美适配各种屏幕尺寸

## 📦 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **React Router** - 路由管理
- **Wagmi** - Web3 连接
- **RainbowKit** - 钱包连接UI
- **Ethers.js** - 以太坊交互

## 📁 项目结构

```
frontend/
├── src/
│   ├── components/          # 共享组件
│   │   ├── Layout.tsx       # 布局组件
│   │   ├── Notification.tsx # 通知组件
│   │   └── ProtectedRoute.tsx # 受保护路由
│   ├── contexts/            # React Context
│   │   └── AuthContext.tsx  # 认证上下文
│   ├── hooks/               # 自定义 Hooks
│   │   └── useNotification.tsx
│   ├── pages/               # 页面组件
│   │   ├── Login.tsx        # 登录页面
│   │   ├── TraderDashboard.tsx      # 交易者仪表板
│   │   ├── LiquidityDashboard.tsx   # 流动性提供者仪表板
│   │   ├── GovernorDashboard.tsx    # 治理者仪表板
│   │   ├── ArbitrageurDashboard.tsx # 套利者仪表板
│   │   └── AdminDashboard.tsx        # 管理员仪表板
│   ├── services/            # 服务层
│   │   ├── storage.ts      # 数据存储服务
│   │   └── contractService.ts # 合约服务
│   ├── styles/             # 全局样式
│   │   └── theme.css       # 主题样式
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 入口文件
└── package.json
```

## 🌐 浏览器兼容性

推荐使用现代浏览器：
- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 📝 许可证

MIT License

