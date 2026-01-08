# DEX-AMM React 系统

这是一个基于 React + TypeScript + Vite 构建的去中心化交易所（DEX）自动做市商（AMM）系统。

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **React Router** - 路由管理
- **Jotai** - 状态管理（已安装，可选使用）

## 项目结构

```
dex-amm-react/
├── src/
│   ├── components/          # 共享组件
│   │   ├── Layout.tsx       # 布局组件
│   │   ├── Notification.tsx  # 通知组件
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
│   │   └── storage.ts      # 数据存储服务
│   ├── styles/             # 全局样式
│   │   └── theme.css       # 主题样式
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 入口文件
└── package.json
```

## 快速开始

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

## 功能特性

### 🔐 多角色权限管理

系统支持五种角色，每种角色有独立的仪表板：

1. **交易者 (Trader)**
   - 交易概览
   - 现货交易（买入/卖出）
   - 订单管理
   - 资产组合
   - 交易历史

2. **流动性提供者 (Liquidity Provider)**
   - 收益统计
   - 流动性池管理
   - 添加/移除流动性
   - LP代币管理
   - 收益历史

3. **治理者 (Governor)**
   - 治理概览
   - 提案管理
   - 创建提案和投票
   - 协议参数设置
   - 投票历史

4. **套利者 (Arbitrageur)**
   - 套利概览
   - 机会发现
   - 自动交易设置
   - 收益分析

5. **系统管理员 (Admin)**
   - 系统概览
   - 用户管理
   - 交易监控
   - 流动性管理
   - 安全管理
   - 系统设置

### 🎨 UI/UX 特性

- 现代化绿色主题设计
- 响应式布局，支持移动端
- 流畅的动画过渡
- 实时通知系统
- 数据持久化（localStorage/sessionStorage）

## 测试账户

系统预置了以下测试账户（用户名 / 密码 / 角色）：

| 角色 | 用户名 | 密码 | 角色选择 |
|------|--------|------|----------|
| 交易者 | trader | 123456 | trader |
| 流动性提供者 | liquidity | 123456 | liquidity |
| 治理者 | governor | 123456 | governor |
| 套利者 | arbitrageur | 123456 | arbitrageur |
| 系统管理员 | admin | 123456 | admin |

## 数据存储

系统使用浏览器本地存储：

- **localStorage**: 存储用户数据、交易记录、流动性池等持久化数据
- **sessionStorage**: 存储当前登录用户会话信息

⚠️ **注意**: 清除浏览器数据会丢失所有存储的信息。

## 开发说明

### 代码规范

- 使用 TypeScript 进行类型检查
- 组件使用函数式组件和 Hooks
- CSS 模块化，每个组件有自己的样式文件
- 遵循 React 最佳实践

### 添加新功能

1. 在 `src/types/index.ts` 中添加类型定义
2. 在 `src/services/storage.ts` 中添加数据存储逻辑
3. 创建新的页面组件或扩展现有组件
4. 在 `src/App.tsx` 中添加路由（如需要）

### 样式定制

全局主题样式在 `src/styles/theme.css` 中定义，可以修改 CSS 变量来定制主题：

```css
:root {
  --primary-color: #4CAF50;
  --primary-dark: #45a049;
  /* ... 更多变量 */
}
```

## 浏览器兼容性

推荐使用现代浏览器：
- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 许可证

MIT License

## 更新日志

### v1.0.0 (2024-01-20)

- ✅ 完成 React + TypeScript + Vite 项目搭建
- ✅ 实现多角色登录系统
- ✅ 实现交易者仪表板
- ✅ 实现流动性提供者仪表板
- ✅ 实现治理者仪表板
- ✅ 实现套利者仪表板
- ✅ 实现管理员仪表板
- ✅ 完善响应式设计
- ✅ 添加数据持久化
- ✅ 优化用户体验
