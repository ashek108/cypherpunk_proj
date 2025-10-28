// popup.js
class PumpExtensionPopup {
  constructor() {
    this.walletConnected = false;
    this.walletAddress = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadWalletState();
    await this.loadPosts();
    this.loadSettings();
  }

  setupEventListeners() {
    // Wallet connection
    document.getElementById('connect-wallet').addEventListener('click', () => {
      this.connectWallet();
    });

    document.getElementById('disconnect-wallet').addEventListener('click', () => {
      this.disconnectWallet();
    });

    // Posts functionality
    document.getElementById('refresh-posts').addEventListener('click', () => {
      this.loadPosts();
    });

    document.getElementById('sort-filter').addEventListener('change', (e) => {
      this.loadPosts(e.target.value);
    });

    // Settings
    document.getElementById('auto-detect').addEventListener('change', (e) => {
      this.saveSetting('autoDetect', e.target.checked);
    });

    document.getElementById('notifications').addEventListener('change', (e) => {
      this.saveSetting('notifications', e.target.checked);
    });
  }

  async loadWalletState() {
    try {
      const result = await chrome.storage.local.get(['walletConnected', 'walletAddress', 'walletType']);
      
      if (result.walletConnected && result.walletAddress) {
        this.walletConnected = true;
        this.walletAddress = result.walletAddress;
        this.walletType = result.walletType || 'Unknown';
        this.updateWalletUI();
      }
    } catch (error) {
      console.error('Error loading wallet state:', error);
    }
  }

  async connectWallet() {
    try {
      // Send message to content script to connect wallet
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
        // Show connecting state
        this.setConnectingState(true);
        
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'connectWallet'
        });

        if (response && response.success) {
          this.walletConnected = true;
          this.walletAddress = response.address;
          this.walletType = response.walletType || 'Unknown';
          
          // Save to storage
          await chrome.storage.local.set({
            walletConnected: true,
            walletAddress: response.address,
            walletType: this.walletType
          });
          
          this.updateWalletUI();
          this.showSuccess(`Connected to ${this.walletType} wallet!`);
        } else {
          throw new Error(response?.error || 'Failed to connect wallet');
        }
      } else {
        // Open X/Twitter in new tab
        this.showError('Please navigate to X/Twitter first, then connect your wallet.');
        setTimeout(() => {
          chrome.tabs.create({ url: 'https://x.com' });
          window.close();
        }, 2000);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      this.showError(this.getWalletErrorMessage(error.message));
    } finally {
      this.setConnectingState(false);
    }
  }

  setConnectingState(connecting) {
    const connectBtn = document.getElementById('connect-wallet');
    if (connecting) {
      connectBtn.disabled = true;
      connectBtn.innerHTML = `
        <div class="flex items-center justify-center space-x-2">
          <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Connecting...</span>
        </div>
      `;
    } else {
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect Wallet';
    }
  }

  getWalletErrorMessage(error) {
    if (error.includes('not found') || error.includes('install')) {
      return 'No Solana wallet detected. Please install Phantom, Solflare, or another supported wallet.';
    } else if (error.includes('rejected') || error.includes('denied')) {
      return 'Wallet connection was rejected. Please try again and approve the connection.';
    } else if (error.includes('timeout')) {
      return 'Wallet connection timed out. Please ensure your wallet is unlocked and try again.';
    }
    return `Wallet connection failed: ${error}`;
  }

  async disconnectWallet() {
    this.walletConnected = false;
    this.walletAddress = null;
    this.walletType = null;
    
    // Clear storage
  await chrome.storage.local.remove(['walletConnected', 'walletAddress', 'walletType', 'walletProviderKey']);
    
    this.updateWalletUI();
  }

  updateWalletUI() {
    const disconnectedDiv = document.getElementById('wallet-disconnected');
    const connectedDiv = document.getElementById('wallet-connected');
    const addressSpan = document.getElementById('wallet-address');

    if (this.walletConnected && this.walletAddress) {
      disconnectedDiv.classList.add('hidden');
      connectedDiv.classList.remove('hidden');
      
      const walletTypeText = this.walletType ? ` (${this.walletType})` : '';
      addressSpan.textContent = `${this.formatAddress(this.walletAddress)}${walletTypeText}`;
    } else {
      disconnectedDiv.classList.remove('hidden');
      connectedDiv.classList.add('hidden');
    }
  }

  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  async loadPosts(sortBy = 'newest') {
    const loadingEl = document.getElementById('posts-loading');
    const containerEl = document.getElementById('posts-container');
    const emptyEl = document.getElementById('posts-empty');

    loadingEl.classList.remove('hidden');
    containerEl.innerHTML = '';
    emptyEl.classList.add('hidden');

    try {
      // In a real implementation, this would fetch from your API
      const posts = await this.fetchViralPosts(sortBy);
      
      loadingEl.classList.add('hidden');

      if (posts.length === 0) {
        emptyEl.classList.remove('hidden');
        return;
      }

      posts.forEach(post => {
        const postElement = this.createPostElement(post);
        containerEl.appendChild(postElement);
      });

    } catch (error) {
      console.error('Error loading posts:', error);
      loadingEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
    }
  }

  async fetchViralPosts(sortBy) {
    const normalisePosts = (posts = []) => posts.map((post) => {
      const createdAt = post.createdAt || post.addedAt || post.timestamp || new Date().toISOString();
      const likes = post.metrics?.likes ?? post.likes ?? 0;
      const retweets = post.metrics?.retweets ?? post.retweets ?? 0;
      const content = post.description || post.text || post.tweetText || 'Token created on pump.fun';

      return {
        id: post.id || post.address || crypto.randomUUID?.() || `post-${Date.now()}`,
        author: post.author ? (post.author.startsWith('@') ? post.author : `@${post.author}`) : '@unknown',
        content,
        timestamp: new Date(createdAt),
        likes,
        retweets,
        viralScore: post.viralScore ?? (likes + retweets),
        token: {
          symbol: post.symbol || post.token?.symbol || '—',
          marketCap: post.marketCap || post.token?.marketCap || 'Pending',
          address: post.address || post.token?.address || null,
          url: post.pumpUrl || (post.address ? `https://pump.fun/${post.address}` : null)
        }
      };
    });

    const parseMarketCap = (value) => {
      if (!value) return 0;
      if (typeof value === 'number') return value;
      const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
      if (Number.isNaN(numeric)) {
        return 0;
      }
      if (/b/i.test(value)) return numeric * 1_000_000_000;
      if (/m/i.test(value)) return numeric * 1_000_000;
      if (/k/i.test(value)) return numeric * 1_000;
      return numeric;
    };

    const sortPosts = (posts) => {
      const sorted = [...posts];
      switch (sortBy) {
        case 'popular':
          sorted.sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));
          break;
        case 'market-cap':
          sorted.sort((a, b) => parseMarketCap(b.token.marketCap) - parseMarketCap(a.token.marketCap));
          break;
        default:
          sorted.sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
      }
      return sorted.filter((item) => item.token.address);
    };

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getViralPosts', sortBy }, (res) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(res);
        });
      });

      if (response?.success && Array.isArray(response.posts)) {
        return sortPosts(normalisePosts(response.posts));
      }
    } catch (error) {
      console.warn('Runtime messaging failed for viral posts, falling back to local storage.', error);
    }

    try {
      const stored = await chrome.storage.local.get(['viralPosts', 'createdTokens']);
      const fallbackPosts = stored.viralPosts?.length ? stored.viralPosts : stored.createdTokens || [];
      return sortPosts(normalisePosts(fallbackPosts));
    } catch (storageError) {
      console.error('Error fetching viral posts from storage:', storageError);
      return [];
    }
  }

  createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-item';
    
    const timeAgo = this.getTimeAgo(post.timestamp);
    const tokenSymbol = this.escapeHtml(post.token.symbol || '—');
    const tokenMarketCap = this.escapeHtml(post.token.marketCap || 'Pending');
    const author = this.escapeHtml(post.author);
    const content = this.escapeHtml(post.content);
    
    postDiv.innerHTML = `
      <div class="post-header">
        <span class="post-author">${author}</span>
        <span class="post-time">${timeAgo}</span>
      </div>
      <div class="post-content">${content}</div>
      <div class="post-stats">
        <span>❤️ ${post.likes}</span>
        <span>🔄 ${post.retweets}</span>
      </div>
      <div class="token-info">
        <div class="token-symbol">$${tokenSymbol}</div>
        <div class="market-cap">Market Cap: ${tokenMarketCap}</div>
      </div>
    `;

    postDiv.addEventListener('click', () => {
      if (post.token?.address) {
        this.openTokenDetails(post.token);
      }
    });

    return postDiv;
  }

  getTimeAgo(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return 'just now';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  }

  openTokenDetails(token) {
    if (!token?.address) {
      this.showError('Token address unavailable for this entry.');
      return;
    }

    // Open token details in new tab or show modal
    chrome.tabs.create({
      url: token.url || `https://pump.fun/${token.address}`
    });
  }

  escapeHtml(value) {
    if (value === undefined || value === null) {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }

  loadSettings() {
    chrome.storage.local.get(['autoDetect', 'notifications'], (result) => {
      document.getElementById('auto-detect').checked = result.autoDetect || false;
      document.getElementById('notifications').checked = result.notifications || false;
    });
  }

  saveSetting(key, value) {
    chrome.storage.local.set({ [key]: value });
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.className = `notification ${type}`;
      notification.classList.remove('hidden');
      
      // Auto-hide success/info messages after 3 seconds
      if (type === 'success' || type === 'info') {
        setTimeout(() => {
          notification.classList.add('hidden');
        }, 3000);
      }
    }
    
    console.log(`${type.toUpperCase()}:`, message);
  }

  hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.classList.add('hidden');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PumpExtensionPopup();
});