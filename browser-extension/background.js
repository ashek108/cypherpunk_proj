// background.js - Service worker for the extension
class PumpExtensionBackground {
  constructor() {
    this.init();
  }

  init() {
    console.log('Pump Extension: Background service worker started');
    
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open
    });

    // Listen for tab updates to inject content script
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Set up periodic tasks
    this.setupPeriodicTasks();
  }

  handleInstallation(details) {
    if (details.reason === 'install') {
      console.log('Pump Extension: First installation');
      
      // Set default settings
      chrome.storage.local.set({
        autoDetect: true,
        notifications: true,
        firstTime: true
      });

      // Open welcome page
      chrome.tabs.create({
        url: 'https://x.com'
      });
    } else if (details.reason === 'update') {
      console.log('Pump Extension: Updated to version', chrome.runtime.getManifest().version);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'openPopup':
          await this.openPopup();
          sendResponse({ success: true });
          break;

        case 'proxyUploadMetadata':
          {
            const metadata = await this.uploadMetadataRequest(message.payload);
            sendResponse({ success: true, data: metadata });
          }
          break;

        case 'proxyTradeTransaction':
          {
            const result = await this.requestTradeTransaction(message.payload);
            sendResponse(result);
          }
          break;

        case 'proxySolanaRpc':
          {
            const result = await this.forwardSolanaRpcRequest(message.payload);
            sendResponse(result);
          }
          break;

        case 'storeTokenData':
          await this.storeTokenData(message.data);
          sendResponse({ success: true });
          break;

        case 'getViralPosts':
          const posts = await this.getViralPosts(message.sortBy);
          sendResponse({ success: true, posts });
          break;

        case 'createNotification':
          await this.createNotification(message.title, message.message);
          sendResponse({ success: true });
          break;

        case 'trackAnalytics':
          await this.trackAnalytics(message.event, message.data);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // Inject content script when Twitter/X pages are loaded
    if (changeInfo.status === 'complete' && tab.url) {
      if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
        try {
          // Check if content script is already injected
          const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => null);
          
          if (!response) {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['solanaWeb3.iife.min.js', 'wallet-adapter.js', 'content.js']
            });

            await chrome.scripting.insertCSS({
              target: { tabId: tabId },
              files: ['content.css']
            });

            console.log('Pump Extension: Content script injected into tab', tabId);
          }
        } catch (error) {
          console.error('Error injecting content script:', error);
        }
      }
    }
  }

  async openPopup() {
    // Open popup by clicking the extension icon programmatically
    // Note: This might not work in all contexts due to user gesture requirements
    chrome.action.openPopup();
  }

  async storeTokenData(tokenData) {
    try {
      const stored = await chrome.storage.local.get(['createdTokens', 'viralPosts']);
      
      // Store created token
      const tokens = stored.createdTokens || [];
      tokens.unshift({
        ...tokenData,
        createdAt: new Date().toISOString(),
        id: this.generateId()
      });
      
      // Keep only last 100 tokens
      if (tokens.length > 100) {
        tokens.splice(100);
      }

      // Also add to viral posts if it meets criteria
      const viralPosts = stored.viralPosts || [];
      if (this.isViralWorthy(tokenData)) {
        viralPosts.unshift({
          ...tokenData,
          viralScore: this.calculateViralScore(tokenData),
          addedAt: new Date().toISOString()
        });

        // Keep only last 50 viral posts
        if (viralPosts.length > 50) {
          viralPosts.splice(50);
        }
      }

      await chrome.storage.local.set({
        createdTokens: tokens,
        viralPosts: viralPosts
      });

      // Send notification
      const settings = await chrome.storage.local.get(['notifications']);
      if (settings.notifications) {
        this.createNotification(
          'Token Created! 🚀',
          `$${tokenData.symbol} token created successfully`
        );
      }

    } catch (error) {
      console.error('Error storing token data:', error);
      throw error;
    }
  }

  async getViralPosts(sortBy = 'newest') {
    try {
      const stored = await chrome.storage.local.get(['viralPosts', 'createdTokens']);
      let posts = stored.viralPosts || [];

      if (posts.length === 0) {
        posts = (stored.createdTokens || []).slice(0, 10);
      }

      switch (sortBy) {
        case 'popular':
          posts.sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));
          break;
        case 'market-cap':
          posts.sort((a, b) => this.parseMarketCap(b.marketCap) - this.parseMarketCap(a.marketCap));
          break;
        default:
          posts.sort((a, b) => new Date(b.createdAt || b.addedAt) - new Date(a.createdAt || a.addedAt));
      }

      return posts.slice(0, 20);
    } catch (error) {
      console.error('Error getting viral posts:', error);
      return [];
    }
  }

  async uploadMetadataRequest(payload = {}) {
    const {
      imageDataUrl,
      name = 'Token',
      symbol = 'TOKEN',
      description = ''
    } = payload;

    console.log('Proxying metadata upload to pump.fun', { name, symbol });

    const formData = new FormData();
    const imageBlob = this.dataUrlToBlob(imageDataUrl);

    formData.append('file', imageBlob, 'token.png');
    formData.append('name', name);
    formData.append('symbol', symbol);
    formData.append('description', description);
    formData.append('twitter', '');
    formData.append('telegram', '');
    formData.append('website', '');
    formData.append('showName', 'true');

    const response = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      console.error('Metadata upload failed', response.status, response.statusText);
      const message = response.statusText || 'Metadata upload failed';
      const errorBody = await response.text().catch(() => '');
      throw new Error(`${message}${errorBody ? `: ${errorBody}` : ''}`);
    }

    console.log('Metadata upload succeeded');
    return response.json();
  }

  async requestTradeTransaction(body = {}) {
    console.log('Proxying trade transaction request', body?.action, body?.mint);
    const response = await fetch('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error('Trade transaction request failed', response.status, response.statusText);
      const text = await response.text().catch(() => '');
      return {
        success: false,
        error: `Transaction creation failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = this.uint8ToBase64(new Uint8Array(arrayBuffer));

    console.log('Trade transaction request succeeded');
    return {
      success: true,
      transactionBase64: base64
    };
  }

  async forwardSolanaRpcRequest(payload = {}) {
    const {
      endpoint = 'https://api.mainnet-beta.solana.com',
      method,
      params = []
    } = payload || {};

    if (!method) {
      return { success: false, error: 'RPC method is required' };
    }

    try {
      console.log('Proxying Solana RPC request', method, '->', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params
        })
      });

      if (!response.ok) {
        const message = `${response.status} ${response.statusText}`.trim();
        const text = await response.text().catch(() => '');
        return {
          success: false,
          error: text ? `${message}: ${text}` : message
        };
      }

      const json = await response.json();

      if (json?.error) {
        const message = json.error?.message || 'Solana RPC request failed';
        return { success: false, error: message, details: json.error };
      }

      return { success: true, result: json?.result ?? null };
    } catch (error) {
      console.error('Solana RPC proxy error:', method, error?.message, error);
      return { success: false, error: error.message };
    }
  }

  dataUrlToBlob(dataUrl) {
    if (!dataUrl) {
      return new Blob();
    }

    const [metadata, data] = dataUrl.split(',');
    const mimeMatch = metadata?.match(/:(.*?);/);
    const mime = (mimeMatch && mimeMatch[1]) || 'application/octet-stream';
    const binary = atob(data || '');
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  }

  uint8ToBase64(uint8Array) {
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
  }

  isViralWorthy() {
    // Simple criteria for determining if a token should be in viral posts
    // In a real implementation, this could consider:
    // - Social media engagement
    // - Market cap growth
    // - Trading volume
    // - Community activity
    
    return true; // For demo purposes, all tokens are considered viral
  }

  calculateViralScore(tokenData) {
    // Calculate a score based on various factors
    let score = 0;
    
    // Market cap factor
    const marketCap = this.parseMarketCap(tokenData.marketCap);
    score += Math.log10(marketCap + 1) * 100;
    
    // Recency factor (newer = higher score)
    const ageHours = (Date.now() - new Date(tokenData.createdAt)) / (1000 * 60 * 60);
    score += Math.max(0, 100 - ageHours);
    
    return Math.round(score);
  }

  parseMarketCap(marketCapStr) {
    if (!marketCapStr) return 0;
    
    const match = marketCapStr.match(/[\d.]+/);
    if (!match) return 0;
    
    const number = parseFloat(match[0]);
    if (marketCapStr.includes('K')) return number * 1000;
    if (marketCapStr.includes('M')) return number * 1000000;
    if (marketCapStr.includes('B')) return number * 1000000000;
    
    return number;
  }

  async createNotification(title, message) {
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async trackAnalytics(event, data) {
    try {
      // Store analytics data locally
      const stored = await chrome.storage.local.get(['analytics']);
      const analytics = stored.analytics || [];
      
      analytics.push({
        event,
        data,
        timestamp: new Date().toISOString(),
        id: this.generateId()
      });

      // Keep only last 1000 analytics events
      if (analytics.length > 1000) {
        analytics.splice(0, analytics.length - 1000);
      }

      await chrome.storage.local.set({ analytics });

      // In a real implementation, you could send this to your analytics service
      console.log('Analytics tracked:', event, data);
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  }

  setupPeriodicTasks() {
    // Set up alarm for periodic tasks
    chrome.alarms.create('periodicUpdate', { periodInMinutes: 30 });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'periodicUpdate') {
        this.performPeriodicUpdate();
      }
    });
  }

  async performPeriodicUpdate() {
    try {
      console.log('Pump Extension: Performing periodic update');
      
      // Clean up old data
      await this.cleanupOldData();
      
      // Update viral posts rankings
      await this.updateViralRankings();
      
      // Check for new features or updates
      await this.checkForUpdates();
      
    } catch (error) {
      console.error('Error in periodic update:', error);
    }
  }

  async cleanupOldData() {
    const stored = await chrome.storage.local.get(['createdTokens', 'viralPosts', 'analytics']);
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Clean up old tokens
    if (stored.createdTokens) {
      const recentTokens = stored.createdTokens.filter(token => 
        new Date(token.createdAt) > thirtyDaysAgo
      );
      
      if (recentTokens.length !== stored.createdTokens.length) {
        await chrome.storage.local.set({ createdTokens: recentTokens });
        console.log('Cleaned up old tokens');
      }
    }

    // Similar cleanup for other data...
  }

  async updateViralRankings() {
    const stored = await chrome.storage.local.get(['viralPosts']);
    const viralPosts = stored.viralPosts || [];
    
    // Recalculate viral scores
    viralPosts.forEach(post => {
      post.viralScore = this.calculateViralScore(post);
    });
    
    // Re-sort by viral score
    viralPosts.sort((a, b) => b.viralScore - a.viralScore);
    
    await chrome.storage.local.set({ viralPosts });
  }

  async checkForUpdates() {
    // Check for extension updates or new features
    // This could ping your server to check for announcements
    console.log('Checking for updates...');
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Initialize background service worker
new PumpExtensionBackground();