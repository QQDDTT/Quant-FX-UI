# Quant-FX 前端静态展示看板 (`ui/`)

本目录承载 Quant-FX 外汇高精量化交易系统的只读展示层，对标 `Quant-FMP` 工业级量化大盘标准设计，通过独立公开副仓库 `QQDDTT/Quant-FX-UI` 部署托管于 GitHub Pages（生产域名：`https://fx.evotensor.dev/`），提供极客深色、现代专业的量化监控大盘体验。

---

## 📁 目录结构与二级子目录分工

```text
ui/
├── index.html                   # 平台首页：系统总览、48 标的池核心指标卡、全景架构与短周期策略路线图
├── transactions.html            # 事务总览页面：Twelve Data 配额看门狗实时水位监控与数据/训练事务流水
├── base-data-transactions.html  # 基础数据事务页面：48 只标的微观画像、3 级时序数据湖 (144 分区) 与 5 维审计矩阵
├── README.md                    # 本看板说明文档、终端适配规范与部署指引
│
└── assets/                      # 前端静态资源中心
    ├── favicon.svg              # 平台专属外汇量化矢量图标
    ├── css/                     # 原生 Vanilla CSS 样式系统 (零构建外部依赖)
    │   ├── style.css            # 基础排版、现代暗黑主题变量与毛玻璃顶栏
    │   ├── components.css       # 卡片系统、指标徽章、5 维审计表格
    │   └── responsive.css       # PC 桌面宽屏 (1920x1080) 与移动端竖屏 (393x852) 响应式适配
    ├── js/                      # 原生 ES6 前端交互与数据加载引擎
    │   └── utils.js             # 异步静态 JSON 切片加载引擎与 SVG Sparkline 走势图绘制
    └── data/                    # 纯静态 JSON 契约数据切片 (Data Contracts)
        ├── platform_meta.json           # 平台元数据与配额状态
        ├── base_data_summary.json       # 48 只核心标的基础数据湖落盘资产与画像 (144 分区)
        ├── data_validation_summary.json # 5 维数据质量与连续性门禁 100% 审计报告
        ├── model_registry.json          # 模型注册中心与每日评估生命周期状态 (HEALTHY/SHADOW/RETIRED)
        └── transaction_registry.json    # 基础数据与模型训练事务真实注册流水
```

---

## 📱 终端设备适配规范 (Terminal Adaptation Spec)

遵循 `Evopoiesis/docs/specs/17-terminal-adaptation-spec.md` 与项目 `.agents/rules/AGENTS.md` 第 5 节：
1. **目标视口矩阵**：
   - **PC 桌面操盘工作台**：`1920×1080`（多列网格卡片、完整 5 维审计矩阵表）；
   - **移动端竖屏巡检**：`iPhone 15/16 Pro (393×852, DPR 3)` 与 `Pixel 7 (412×915)`。
2. **四大防线要求**：
   - **零横向滑溢**：移动端竖屏下页面主体严禁产生横向滚动条（Horizontal Overflow $\le 0\text{px}$），宽表格必须包裹在局部 `.table-responsive`（`overflow-x: auto`）容器内；
   - **动态视口与安全区**：采用 `100dvh` 防止移动浏览器地址栏遮挡，底部预留 `env(safe-area-inset-bottom)`；
   - **触控热区标准**：所有导航栏按钮、Tab 切换器与交互控件尺寸必须 $\ge 44 \times 44\text{px}$；
   - **防挤压折行**：窄屏下核心统计数字与徽章自适应单列流式排布，严禁文字重叠破损。

---

## 🛡️ 架构红线与三大原则

1. **纯静态只读呈现 (Static Read-Only Display)**：
   - 严禁在前端执行模型推理、特征计算或高耗能任务。所有展示数据均由本地 PowerShell 脚本或 GCP 云端集群生成为静态 JSON 切片后推入 `assets/data/`。
2. **零构建轻量化 (Zero-Build & Lightweight)**：
   - 采用标准 HTML5 + Vanilla CSS + 原生 JavaScript，宿主机无需安装任何 Node.js、npm 或打包构建工具。
3. **资金安全第一与隐私隔离 (Strict Capital Protection)**：
   - 前端绝对禁止包含任何真实的交易下单私钥或敏感 API 凭据。

---

## 🚀 本地浏览与线上发布

- **数据切片刷新**：`powershell.exe -ExecutionPolicy Bypass -File scripts\export_ui_data.ps1`
- **一键推送 GitHub Pages**：`powershell.exe -ExecutionPolicy Bypass -File scripts\publish_ui_repo.ps1`
