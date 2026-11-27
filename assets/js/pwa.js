/**
 * Quant-FX Research - PWA Client Controller (pwa.js)
 * 职责:
 *  1. 自动注册并维护 Service Worker 生命周期
 *  2. 捕获 beforeinstallprompt 事件，提供原生沉浸式安装交互
 *  3. 实时感知在线/离线网络状态并提供高质感横幅提示
 */

(function () {
  'use strict';

  let deferredPrompt = null;

  // 1. 注册 Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker 注册成功，Scope:', registration.scope);

          // 监听是否有正在等待生效的新版本
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showToast('系统发现新版本，下次启动时自动生效');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker 注册失败:', error);
        });
    });
  }

  // 2. 捕获原生 PWA 安装事件
  window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止浏览器默认粗暴弹窗
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] 触发 beforeinstallprompt 事件，准备挂载安装入口');

    // 唤起界面上的安装按钮
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
    showToast('🎉 Quant-FX 独立应用安装成功！');
    console.log('[PWA] 用户已成功将应用安装至桌面或主屏幕');
  });

  // 渲染/显示安装按钮
  function showInstallButton() {
    let installBtn = document.getElementById('pwaInstallBtn');
    if (!installBtn) {
      const navLinks = document.getElementById('navLinks');
      if (navLinks) {
        installBtn = document.createElement('button');
        installBtn.id = 'pwaInstallBtn';
        installBtn.className = 'pwa-install-btn';
        installBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          安装应用
        `;
        installBtn.setAttribute('title', '将 Quant-FX 安装为独立桌面/手机应用');
        installBtn.addEventListener('click', handleInstallClick);
        navLinks.appendChild(installBtn);
      }
    }
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
    }
  }

  function hideInstallButton() {
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] 用户安装选择结果: ${outcome}`);
    if (outcome === 'accepted') {
      hideInstallButton();
    }
    deferredPrompt = null;
  }

  // 3. 网络离线/在线状态监控
  window.addEventListener('offline', () => {
    showNetworkBanner(false);
  });

  window.addEventListener('online', () => {
    showNetworkBanner(true);
  });

  function showNetworkBanner(isOnline) {
    let banner = document.getElementById('pwaNetworkBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'pwaNetworkBanner';
      banner.className = 'pwa-network-banner';
      document.body.prepend(banner);
    }

    if (!isOnline) {
      banner.className = 'pwa-network-banner offline';
      banner.innerHTML = `
        <span class="pwa-dot offline"></span>
        当前处于离线模式 · 正在读取本地安全离线数据湖缓存
      `;
      banner.style.display = 'flex';
    } else {
      banner.className = 'pwa-network-banner online';
      banner.innerHTML = `
        <span class="pwa-dot online"></span>
        网络连接已恢复 · 实时数据同步已重新连接
      `;
      banner.style.display = 'flex';
      setTimeout(() => {
        banner.style.display = 'none';
      }, 4000);
    }
  }

  // 简易提示 Toast
  function showToast(message) {
    let toast = document.getElementById('pwaToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pwaToast';
      toast.className = 'pwa-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
})();
