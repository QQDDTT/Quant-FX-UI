/**
 * Quant-FX Research - 前端工具库与动态数据加载引擎 (utils.js)
 * 纯原生 ES6 实现，零打包，零框架依赖，内置 XSS 防御转义与全局元信息同步
 */

export const QuantFX = {
  _cache: {},

  // HTML 实体安全转义 (防御 DOM XSS)
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // 异步获取静态 JSON 数据切片
  async loadData(filename) {
    if (this._cache[filename]) return this._cache[filename];
    try {
      const res = await fetch(`assets/data/${filename}?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load ${filename}`);
      const data = await res.json();
      this._cache[filename] = data;
      return data;
    } catch (err) {
      console.warn(`[QuantFX] 数据加载警告: ${filename}`, err);
      return null;
    }
  },

  // 格式化价格数字 (自适应小数位)
  formatPrice(num, decimals = 4) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  // 格式化点数与盈亏
  formatPips(pips) {
    if (!pips) return '0.0 pips';
    const num = parseFloat(pips);
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(1)} pips`;
  },

  // 生成内联 SVG Sparkline 走势图
  renderSparkline(points, width = 100, height = 28, strokeColor = '#58A6FF') {
    if (!points || points.length < 2) return '';
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const pad = 3;

    const coords = points.map((p, i) => {
      const numP = Number(p) || 0;
      const x = pad + (i / (points.length - 1)) * (width - pad * 2);
      const y = height - pad - ((numP - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${coords.join(' L ')}`;
    return `
      <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}">
        <path class="sparkline-path" d="${pathD}" stroke="${this.escapeHtml(strokeColor)}" />
      </svg>
    `;
  },

  // 初始化全局事件与移动端导航
  initGlobal() {
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('show');
      });
    }

    // 自动更新平台元信息与 API 配额看门狗状态
    this.loadData('platform_meta.json').then(meta => {
      if (!meta) return;
      const syncEl = document.getElementById('lastSynced');
      if (syncEl && meta.last_synced) syncEl.textContent = meta.last_synced;

      const statusEl = document.getElementById('engineStatus');
      if (statusEl && meta.status) {
        statusEl.textContent = meta.status;
        statusEl.className = `badge ${meta.status === 'OPERATIONAL' ? 'badge-green' : 'badge-red'}`;
      }

      const modelBadge = document.getElementById('modelStatusBadge');
      if (modelBadge && meta.model_status) {
        modelBadge.textContent = meta.model_status;
        modelBadge.className = 'badge badge-blue';
      }

      const tradeBadge = document.getElementById('tradeStatusBadge');
      if (tradeBadge && meta.trading_status) {
        tradeBadge.textContent = meta.trading_status;
        tradeBadge.className = 'badge badge-green';
      }

      if (meta.api_quota) {
        const rem = Number(meta.api_quota.remaining_today ?? 700);
        const lim = Number(meta.api_quota.daily_limit ?? 800);
        const used = Number(meta.api_quota.used_today ?? 100);
        const pct = ((used / Math.max(1, lim)) * 100).toFixed(1);

        const homeQuota = document.getElementById('homeQuotaRemaining');
        if (homeQuota) {
          homeQuota.innerHTML = `${rem} <span style="font-size: 0.9rem; font-weight: 400; color: var(--text-muted);">/ ${lim} 次余量</span>`;
        }

        const txQuota = document.getElementById('quotaRemaining');
        if (txQuota) {
          txQuota.innerHTML = `${rem} <span style="font-size:0.9rem; font-weight:400; color:var(--text-muted);">/ ${lim} 次</span>`;
        }

        const txQuotaDesc = document.getElementById('quotaDesc');
        if (txQuotaDesc) {
          txQuotaDesc.textContent = `今日累计消耗 ${used} 次 (占 ${pct}%) · 安全余量 ${rem} 次 (软上限预留 50 次缓冲)`;
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  QuantFX.initGlobal();
});
