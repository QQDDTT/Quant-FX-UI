# Quant-FX 前端静态展示看板 (`ui/`)

本目录承载 Quant-FX 外汇高精量化交易系统的只读展示层，对标 `Quant-FMP` 工业级量化大盘标准设计，未来通过 GitHub Actions 部署托管于 GitHub Pages（如 `fx.evotensor.dev`），提供极客深色、现代专业的技术博客与量化大盘体验。

---

## 📁 目录结构与二级子目录分工

```
ui/
├── index.html                   # 平台首页：系统总览、基础数据核心指标卡、全景架构与演进路线图
├── transactions.html            # 事务总览页面：配额看门狗实时水位监控与基础数据真实事务流水
├── base-data-transactions.html  # 基础数据事务页面：12只标的微观画像、3级时序数据湖与5维审计矩阵
├── README.md                    # 本看板说明文档与部署指引
│
└── assets/                      # 前端静态资源中心
    ├── favicon.svg              # 平台专属外汇量化矢量图标
    ├── css/                     # 原生 Vanilla CSS 样式系统 (零 Tailwind 外部依赖)
    │   ├── style.css            # 基础排版、现代暗黑主题变量与毛玻璃顶栏
    │   ├── components.css       # 卡片系统、指标徽章、5维审计表格
    │   └── responsive.css       # 电脑宽屏与移动手机端响应式自适应适配
    ├── js/                      # 原生 ES6 前端交互与数据加载引擎
    │   └── utils.js             # 异步静态 JSON 切片加载引擎与 SVG Sparkline 走势图绘制
    └── data/                    # 纯静态 JSON 契约数据切片 (Data Contracts)
        ├── platform_meta.json           # 平台元数据与配额状态 (当前处于 Phase 1: 基础数据就绪)
        ├── base_data_summary.json       # 12 只核心标的基础数据湖落盘资产与画像 (179,988 根)
        ├── data_validation_summary.json # 5 维数据质量与连续性门禁 100% 审计报告
        └── transaction_registry.json    # 基础数据事务真实注册流水与执行日志
```


---

## 🛡️ 架构红线与三大原则

1. **纯静态只读呈现 (Static Read-Only Display)**：
   - 严禁在前端执行模型推理、特征计算或高耗能任务。所有展示数据均由本地 PowerShell 脚本或 GCP 云端集群生成为静态 JSON 切片后推入 `assets/data/`。
2. **零构建轻量化 (Zero-Build & Lightweight)**：
   - 采用标准 HTML5 + Vanilla CSS + 原生 JavaScript，宿主机无需安装任何 Node.js、npm 或打包构建工具，双击 HTML 即改即看，极速加载。
3. **资金安全第一与隐私隔离 (Strict Capital Protection)**：
   - 前端绝对禁止包含任何真实的交易下单私钥或敏感 API 凭据。所有展示订单均标明为 OANDA Practice 沙盘参考模型，并严格公示动态点差过滤、强制止损与全局急停开关（Kill Switch）。

---

## 🚀 本地浏览与数据切片刷新

- **本地预览**：直接在浏览器双击打开 `ui/index.html`（或使用轻量静态服务器）；
- **数据更新**：运行原生 PowerShell 管线 `powershell.exe -ExecutionPolicy Bypass -File scripts\export_ui_data.ps1` 即可自动提取最新数据湖与量化指标并更新 `assets/data/*.json`。
