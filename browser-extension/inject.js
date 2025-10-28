// inject.js - Injected into page context to access window.solana
(function() {
  'use strict';

  const base64ChunkSize = 0x8000;

  const uint8ToBase64 = (uint8Array) => {
    if (!(uint8Array instanceof Uint8Array)) {
      uint8Array = new Uint8Array(uint8Array);
    }

    let binary = '';
    for (let i = 0; i < uint8Array.length; i += base64ChunkSize) {
      const chunk = uint8Array.subarray(i, i + base64ChunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  };

  const base64ToUint8 = (base64) => {
    const cleaned = (base64 || '').replace(/\s+/g, '');
    const binary = atob(cleaned);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  let solanaWeb3Promise = null;

  const waitForSolanaWeb3 = () => {
    if (window.solanaWeb3) {
      return Promise.resolve(window.solanaWeb3);
    }

    if (solanaWeb3Promise) {
      return solanaWeb3Promise;
    }

    solanaWeb3Promise = new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100;
      const interval = setInterval(() => {
        attempts += 1;
        if (window.solanaWeb3) {
          clearInterval(interval);
          resolve(window.solanaWeb3);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Solana Web3 failed to load'));
        }
      }, 100);
    });

    return solanaWeb3Promise;
  };

  const getSolanaWeb3 = async () => {
    if (window.solanaWeb3) {
      return window.solanaWeb3;
    }
    return waitForSolanaWeb3();
  };

  console.log('Pump Extension: Inject script starting...');

  // Check if already injected
  if (window.pumpExtensionInjected) {
    console.log('Pump Extension: Already injected, skipping...');
    window.postMessage({
      type: 'PUMP_INJECTION_COMPLETE',
      timestamp: Date.now(),
      walletsDetected: window.pumpWalletHelper ? 'Helper created' : 'Helper failed'
    }, '*');
    return;
  }
  window.pumpExtensionInjected = true;

  console.log('Pump Extension: Inject script loaded');
  
  // Log available wallet objects
  console.log('Available wallet objects:', {
    phantom: !!window.phantom,
    solflare: !!window.solflare,
    backpack: !!window.backpack,
    coin98: !!window.coin98,
    solana: !!window.solana
  });

  // Wallet connection helper with adapter pattern
  window.pumpWalletHelper = {
    supportedWallets: ['phantom', 'solflare', 'backpack', 'coin98', 'solong'],
    
    async detectWallets() {
      const detected = [];
      
      // Check for different wallet providers
      if (window.phantom?.solana) {
        detected.push({ name: 'Phantom', provider: window.phantom.solana, type: 'phantom' });
      }
      if (window.solflare) {
        detected.push({ name: 'Solflare', provider: window.solflare, type: 'solflare' });
      }
      if (window.backpack) {
        detected.push({ name: 'Backpack', provider: window.backpack, type: 'backpack' });
      }
      if (window.coin98?.sol) {
        detected.push({ name: 'Coin98', provider: window.coin98.sol, type: 'coin98' });
      }
      if (window.solong) {
        detected.push({ name: 'Solong', provider: window.solong, type: 'solong' });
      }
      
      // Fallback to window.solana if available
      if (window.solana && !detected.length) {
        const walletType = this.detectWalletType(window.solana);
        detected.push({ name: walletType, provider: window.solana, type: walletType.toLowerCase() });
      }
      
      return detected;
    },

    async connectWallet(preferredWallet = null, forcePrompt = false) {
      try {
        const availableWallets = await this.detectWallets();
        
        if (availableWallets.length === 0) {
          throw new Error('No Solana wallet found. Please install Phantom, Solflare, or another supported wallet.');
        }

        // Use preferred wallet or first available
        let selectedWallet = availableWallets[0];
        if (preferredWallet) {
          const normalizedPreferred = preferredWallet.toString().toLowerCase();
          const preferred = availableWallets.find((w) => {
            const type = w.type?.toLowerCase();
            const name = w.name?.toLowerCase();
            return type === normalizedPreferred || name === normalizedPreferred;
          });
          if (preferred) selectedWallet = preferred;
        }

        console.log(`Connecting to ${selectedWallet.name} wallet...`);
        const provider = selectedWallet.provider;

          if (provider.isConnected && provider.publicKey && !forcePrompt) {
          return {
            success: true,
            publicKey: provider.publicKey.toString(),
            connected: true,
            walletType: selectedWallet.name,
            provider: selectedWallet.type
          };
        }

        if (forcePrompt && provider.isConnected && typeof provider.disconnect === 'function') {
          try {
            await provider.disconnect();
          } catch (disconnectError) {
            console.warn('Wallet disconnect before reconnect failed:', disconnectError);
          }
        }

        // Connect using the selected wallet provider
        let response;
        if (forcePrompt) {
          try {
            response = await provider.connect({ onlyIfTrusted: false });
          } catch (connectWithArgError) {
            console.warn('Wallet connect with options failed, retrying without args', connectWithArgError);
            response = await provider.connect();
          }
        } else {
          response = await provider.connect();
        }
        
        // Verify connection
        if (!response.publicKey) {
          const derivedKey = provider.publicKey?.toString?.();
          if (!derivedKey) {
            throw new Error('Wallet connection failed - no public key received');
          }
          response.publicKey = derivedKey;
        }
        
          if (!provider.publicKey && response.publicKey) {
            if (typeof response.publicKey.toBase58 === 'function') {
              provider.publicKey = response.publicKey;
            } else {
              const { PublicKey } = await getSolanaWeb3();
              try {
                provider.publicKey = new PublicKey(response.publicKey);
              } catch (keyError) {
                console.warn('Unable to construct PublicKey from response, falling back to string', keyError);
                provider.publicKey = {
                  toString: () => String(response.publicKey),
                  toBase58: () => String(response.publicKey)
                };
              }
            }
          }

          if (!provider.isConnected) {
            provider.isConnected = true;
          }

        return {
          success: true,
          publicKey: response.publicKey.toString(),
          connected: provider.isConnected || true,
          walletType: selectedWallet.name,
          provider: selectedWallet.type
        };
      } catch (error) {
        console.error('Wallet connection error:', error);
        return {
          success: false,
          error: error.message || 'Failed to connect wallet'
        };
      }
    },

    async signTransaction(transactionPayload, walletType = null) {
      try {
        let provider = await this.getConnectedProvider(walletType);

        if (!provider || !provider.publicKey) {
          const connectResult = await this.connectWallet(walletType || null, true);
          if (!connectResult?.success || !connectResult.publicKey) {
            throw new Error(connectResult?.error || 'Wallet not connected');
          }
          provider = await this.getConnectedProvider(walletType);
        }

        if (!provider || (!provider.isConnected && !provider.publicKey)) {
          throw new Error('Wallet not connected');
        }

        const solanaWeb3 = await getSolanaWeb3();
        const { VersionedTransaction } = solanaWeb3;

        if (!VersionedTransaction) {
          throw new Error('Solana VersionedTransaction unavailable');
        }

        let transactionToSign;

        if (typeof transactionPayload === 'string') {
          transactionToSign = VersionedTransaction.deserialize(base64ToUint8(transactionPayload));
        } else if (transactionPayload instanceof Uint8Array) {
          transactionToSign = VersionedTransaction.deserialize(transactionPayload);
        } else if (transactionPayload?.serializedTransaction) {
          transactionToSign = VersionedTransaction.deserialize(
            base64ToUint8(transactionPayload.serializedTransaction)
          );
        } else if (transactionPayload?.message) {
          transactionToSign = transactionPayload;
        } else {
          throw new Error('Unsupported transaction payload');
        }

        const signedTx = await provider.signTransaction(transactionToSign);

        let serializedBytes;

        if (signedTx instanceof Uint8Array) {
          serializedBytes = signedTx;
        } else if (typeof signedTx === 'string') {
          serializedBytes = base64ToUint8(signedTx);
        } else if (signedTx?.serialize) {
          serializedBytes = signedTx.serialize();
        } else if (signedTx?.signedTransaction) {
          if (typeof signedTx.signedTransaction === 'string') {
            serializedBytes = base64ToUint8(signedTx.signedTransaction);
          } else {
            serializedBytes = new Uint8Array(signedTx.signedTransaction);
          }
        } else if (signedTx?.transaction) {
          if (signedTx.transaction instanceof Uint8Array) {
            serializedBytes = signedTx.transaction;
          } else if (signedTx.transaction?.serialize) {
            serializedBytes = signedTx.transaction.serialize();
          }
        }

        if (!serializedBytes) {
          throw new Error('Wallet did not return a signed transaction');
        }

        return {
          success: true,
          signedTransaction: uint8ToBase64(serializedBytes)
        };
      } catch (error) {
        console.error('Transaction signing error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    async signAndSendTransaction(transactionPayload, walletType = null) {
      try {
        let provider = await this.getConnectedProvider(walletType);

        if (!provider || !provider.publicKey) {
          const connectResult = await this.connectWallet(walletType || null, true);
          if (!connectResult?.success || !connectResult.publicKey) {
            throw new Error(connectResult?.error || 'Wallet not connected');
          }
          provider = await this.getConnectedProvider(walletType);
        }

        if (!provider || (!provider.isConnected && !provider.publicKey)) {
          throw new Error('Wallet not connected');
        }

        const solanaWeb3 = await getSolanaWeb3();
        const { VersionedTransaction } = solanaWeb3;

        if (!VersionedTransaction) {
          throw new Error('Solana VersionedTransaction unavailable');
        }

        let transactionToHandle;

        if (typeof transactionPayload === 'string') {
          transactionToHandle = VersionedTransaction.deserialize(base64ToUint8(transactionPayload));
        } else if (transactionPayload instanceof Uint8Array) {
          transactionToHandle = VersionedTransaction.deserialize(transactionPayload);
        } else if (transactionPayload?.serializedTransaction) {
          transactionToHandle = VersionedTransaction.deserialize(
            base64ToUint8(transactionPayload.serializedTransaction)
          );
        } else if (transactionPayload?.message) {
          transactionToHandle = transactionPayload;
        } else {
          throw new Error('Unsupported transaction payload');
        }

        if (typeof provider.signAndSendTransaction === 'function') {
          const response = await provider.signAndSendTransaction(transactionToHandle);
          const serializedAfter = transactionToHandle.serialize();

          let signature = null;
          if (typeof response === 'string') {
            signature = response;
          } else if (response?.signature) {
            signature = response.signature.toString ? response.signature.toString() : response.signature;
          } else if (response?.txid) {
            signature = response.txid;
          }

          return {
            success: true,
            sent: true,
            signature: signature || null,
            signedTransaction: uint8ToBase64(serializedAfter)
          };
        }

        // Fallback: sign first, then try sending via provider.request
        const signedResult = await this.signTransaction(transactionPayload, walletType);
        if (signedResult.success === false) {
          return signedResult;
        }

        const signedBytes = base64ToUint8(signedResult.signedTransaction);

        if (typeof provider.request === 'function') {
          try {
            const signature = await provider.request({
              method: 'sendRawTransaction',
              params: [
                uint8ToBase64(signedBytes),
                {
                  skipPreflight: false,
                  preflightCommitment: 'confirmed'
                }
              ]
            });

            return {
              success: true,
              sent: true,
              signature: typeof signature === 'string' ? signature : (signature?.signature || null),
              signedTransaction: uint8ToBase64(signedBytes)
            };
          } catch (sendError) {
            console.warn('Wallet provider.sendRawTransaction failed:', sendError);
            // Fall through to return signed transaction for manual submission
          }
        }

        return {
          success: true,
          sent: false,
          signedTransaction: uint8ToBase64(signedBytes)
        };
      } catch (error) {
        console.error('signAndSendTransaction error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    async getConnectedProvider(preferredType = null) {
      const wallets = await this.detectWallets();

      const normalizedPreferred = preferredType ? preferredType.toString().toLowerCase() : null;

      if (normalizedPreferred) {
        const preferredWallet = wallets.find((wallet) => {
          const isConnected = wallet.provider.isConnected || wallet.provider.publicKey;
          if (!isConnected) {
            return false;
          }
          const type = wallet.type?.toLowerCase();
          const name = wallet.name?.toLowerCase();
          return type === normalizedPreferred || name === normalizedPreferred;
        });

        if (preferredWallet) {
          return preferredWallet.provider;
        }
      }

      for (const wallet of wallets) {
        if (wallet.provider.isConnected || wallet.provider.publicKey) {
          return wallet.provider;
        }
      }

      return null;
    },

    async getWalletInfo() {
      try {
        const availableWallets = await this.detectWallets();
        const connectedWallet = availableWallets.find((w) => w.provider.isConnected || w.provider.publicKey);

        return {
          connected: !!connectedWallet,
          walletFound: availableWallets.length > 0,
          publicKey: connectedWallet?.provider.publicKey?.toString() || null,
          walletType: connectedWallet?.name || null,
          provider: connectedWallet?.type || null,
          availableWallets: availableWallets.map(w => ({ name: w.name, type: w.type }))
        };
      } catch (error) {
        console.error('Error getting wallet info:', error);
        return { 
          connected: false, 
          walletFound: false, 
          error: error.message,
          provider: null,
          availableWallets: []
        };
      }
    },

    async disconnectWallet(preferredWallet = null) {
      try {
        const wallets = await this.detectWallets();
        let target = null;

        if (preferredWallet) {
          target = wallets.find((wallet) => wallet.type === preferredWallet);
        }

        if (!target) {
          target = wallets.find((wallet) => wallet.provider?.isConnected);
        }

        if (!target) {
          return { success: false, error: 'No connected wallet found' };
        }

        if (typeof target.provider.disconnect !== 'function') {
          return { success: false, error: 'Disconnect not supported by wallet' };
        }

        await target.provider.disconnect();
        return { success: true };
      } catch (error) {
        console.error('Wallet disconnect error:', error);
        return { success: false, error: error.message || 'Failed to disconnect wallet' };
      }
    },

    detectWalletType(provider) {
      if (provider?.isPhantom) return 'Phantom';
      if (provider?.isSolflare) return 'Solflare';
      if (provider?.isBackpack) return 'Backpack';
      if (provider?.isCoin98) return 'Coin98';
      if (provider?.isSolongWallet) return 'Solong';
      return 'Unknown';
    },

    // Auto-detect wallet installation changes
    async watchForWallets() {
      let lastWalletCount = 0;
      
      setInterval(async () => {
        const wallets = await this.detectWallets();
        if (wallets.length !== lastWalletCount) {
          lastWalletCount = wallets.length;
          window.postMessage({
            type: 'PUMP_WALLETS_CHANGED',
            wallets: wallets.map(w => ({ name: w.name, type: w.type }))
          }, '*');
        }
      }, 2000);
    }
  };

  // Listen for wallet events from multiple providers
  const setupWalletListeners = () => {
    const providers = [
      { name: 'phantom', provider: window.phantom?.solana },
      { name: 'solflare', provider: window.solflare },
      { name: 'backpack', provider: window.backpack },
      { name: 'coin98', provider: window.coin98?.sol },
      { name: 'solong', provider: window.solong },
      { name: 'generic', provider: window.solana }
    ];

    providers.forEach(({ name, provider }) => {
      if (provider) {
        try {
          provider.on('connect', (publicKey) => {
            console.log(`Pump Extension: ${name} wallet connected`, publicKey?.toString());
            
            window.postMessage({
              type: 'PUMP_WALLET_CONNECTED',
              publicKey: publicKey?.toString(),
              walletType: name
            }, '*');
          });

          provider.on('disconnect', () => {
            console.log(`Pump Extension: ${name} wallet disconnected`);
            
            window.postMessage({
              type: 'PUMP_WALLET_DISCONNECTED',
              walletType: name
            }, '*');
          });

          if (provider.on) {
            provider.on('accountChanged', (publicKey) => {
              console.log(`Pump Extension: ${name} account changed`, publicKey?.toString());
              
              window.postMessage({
                type: 'PUMP_WALLET_ACCOUNT_CHANGED',
                publicKey: publicKey?.toString() || null,
                walletType: name
              }, '*');
            });
          }
        } catch (error) {
          console.warn(`Failed to setup listeners for ${name}:`, error);
        }
      }
    });
  };

  // Setup listeners after a short delay to ensure wallets are loaded
  setTimeout(setupWalletListeners, 1000);
  
  // Start watching for wallet changes
  window.pumpWalletHelper.watchForWallets();

  const respondToContent = (requestId, type, payload, success = true, error = null) => {
    window.postMessage({
      __pumpMessage: true,
      direction: 'page-to-content',
      requestId,
      type,
      success,
      payload,
      error
    }, '*');
  };

  window.addEventListener('message', async (event) => {
    if (event.source !== window) {
      return;
    }

    const data = event.data;
    if (!data?.__pumpMessage || data.direction !== 'content-to-page') {
      return;
    }

    const { requestId, type, payload } = data;

    try {
      switch (type) {
        case 'PUMP_CONNECT_WALLET': {
          const result = await window.pumpWalletHelper.connectWallet(
            payload?.preferredWallet || null,
            payload?.forcePrompt || false
          );
          respondToContent(requestId, type, result, result.success !== false, result.success === false ? result.error : null);
          break;
        }
        case 'PUMP_DISCONNECT_WALLET': {
          const result = await window.pumpWalletHelper.disconnectWallet(payload?.walletType || null);
          respondToContent(requestId, type, result, result.success !== false, result.success === false ? result.error : null);
          break;
        }
        case 'PUMP_SIGN_TRANSACTION': {
          const result = await window.pumpWalletHelper.signTransaction(payload?.transaction, payload?.walletType || null);
          respondToContent(requestId, type, result, result.success !== false, result.success === false ? result.error : null);
          break;
        }
        case 'PUMP_SIGN_AND_SEND_TRANSACTION': {
          const result = await window.pumpWalletHelper.signAndSendTransaction(payload?.transaction, payload?.walletType || null);
          respondToContent(requestId, type, result, result.success !== false, result.success === false ? result.error : null);
          break;
        }
        case 'PUMP_GET_AVAILABLE_WALLETS': {
          const wallets = await window.pumpWalletHelper.detectWallets();
          const safeWallets = wallets.map((wallet) => ({ name: wallet.name, type: wallet.type }));
          respondToContent(requestId, type, { success: true, wallets: safeWallets }, true, null);
          break;
        }
        case 'PUMP_GET_WALLET_INFO': {
          const info = await window.pumpWalletHelper.getWalletInfo();
          respondToContent(requestId, type, info, info.success !== false, info.success === false ? info.error : null);
          break;
        }
        default:
          respondToContent(requestId, type, { success: false, error: `Unknown request type: ${type}` }, false, `Unknown request type: ${type}`);
      }
    } catch (error) {
      respondToContent(requestId, type, { success: false, error: error.message || 'Wallet helper error' }, false, error.message || 'Wallet helper error');
    }
  });

  // Twitter/X specific helpers
  window.pumpTwitterHelper = {
    getTweetData(element) {
      try {
        if (!element) {
          // Try to find current tweet
          element = document.querySelector('[data-testid="tweet"]') ||
                   document.querySelector('[role="article"]');
        }

        if (!element) return null;

        // Extract text
        const textEl = element.querySelector('[data-testid="tweetText"]') ||
                      element.querySelector('[lang]') ||
                      element.querySelector('.tweet-text');
        
        const text = textEl ? textEl.textContent : '';

        // Extract author
        const authorEl = element.querySelector('[data-testid="User-Name"] a') ||
                        element.querySelector('.username') ||
                        element.querySelector('a[href*="/"]');
        
        let author = 'unknown';
        if (authorEl) {
          const href = authorEl.getAttribute('href');
          if (href) {
            author = href.replace('/', '').split('/')[0];
          }
        }

        // Extract engagement metrics
        const metrics = this.extractEngagementMetrics(element);

        return {
          text: text.trim(),
          author: author,
          url: window.location.href,
          id: this.extractTweetId(),
          metrics: metrics,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error extracting tweet data:', error);
        return null;
      }
    },

    extractEngagementMetrics(element) {
      const metrics = {
        likes: 0,
        retweets: 0,
        replies: 0,
        views: 0
      };

      try {
        // Try to find engagement buttons and their counts
        const buttons = element.querySelectorAll('[role="button"]');
        
        buttons.forEach(button => {
          const text = button.textContent || '';
          const ariaLabel = button.getAttribute('aria-label') || '';
          
          if (ariaLabel.includes('like') || ariaLabel.includes('Like')) {
            metrics.likes = this.parseCount(text) || this.parseCount(ariaLabel);
          } else if (ariaLabel.includes('retweet') || ariaLabel.includes('Retweet')) {
            metrics.retweets = this.parseCount(text) || this.parseCount(ariaLabel);
          } else if (ariaLabel.includes('repl') || ariaLabel.includes('Repl')) {
            metrics.replies = this.parseCount(text) || this.parseCount(ariaLabel);
          }
        });

        // Try to find view count
        const viewsEl = element.querySelector('[href*="/analytics"]') ||
                       element.querySelector('[data-testid="analytics"]');
        if (viewsEl) {
          metrics.views = this.parseCount(viewsEl.textContent);
        }
      } catch (error) {
        console.error('Error extracting metrics:', error);
      }

      return metrics;
    },

    parseCount(text) {
      if (!text) return 0;
      
      const match = text.match(/(\d+(?:\.\d+)?)\s*([KMB])?/i);
      if (!match) return 0;

      const number = parseFloat(match[1]);
      const multiplier = match[2];

      switch (multiplier?.toUpperCase()) {
        case 'K': return Math.floor(number * 1000);
        case 'M': return Math.floor(number * 1000000);
        case 'B': return Math.floor(number * 1000000000);
        default: return Math.floor(number);
      }
    },

    extractTweetId() {
      const match = window.location.pathname.match(/\/status\/(\d+)/);
      return match ? match[1] : null;
    },

    isOnTweetPage() {
      return window.location.pathname.includes('/status/');
    },

    getAllTweets() {
      return Array.from(document.querySelectorAll('[data-testid="tweet"]'))
        .map(tweet => this.getTweetData(tweet))
        .filter(data => data !== null);
    }
  };

  // Auto-detection of viral content
  window.pumpViralDetector = {
    checkViralMetrics(tweetData) {
      if (!tweetData?.metrics) return false;

      const { likes, retweets, replies, views } = tweetData.metrics;
      const engagement = likes + retweets + replies;
      
      // Consider viral if:
      // - High engagement (>1000 total interactions)
      // - High engagement rate (>10% of views)
      // - Crypto-related keywords
      const isHighEngagement = engagement > 1000;
      const hasGoodEngagementRate = views > 0 && (engagement / views) > 0.1;
      const hasCryptoKeywords = this.hasCryptoKeywords(tweetData.text);

      return isHighEngagement || hasGoodEngagementRate || hasCryptoKeywords;
    },

    hasCryptoKeywords(text) {
      const cryptoKeywords = [
        'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol',
        'defi', 'nft', 'token', 'coin', 'blockchain', 'web3', 'dao',
        'pump', 'moon', 'gem', 'hodl', 'diamond', 'hands', 'ape',
        'bullish', 'bearish', 'lambo', 'wagmi', 'gm', 'gn'
      ];

      const lowerText = text.toLowerCase();
      return cryptoKeywords.some(keyword => lowerText.includes(keyword));
    },

    scanPageForViral() {
      const tweets = window.pumpTwitterHelper.getAllTweets();
      return tweets.filter(tweet => this.checkViralMetrics(tweet));
    }
  };

  // Notify that injection is complete
  window.postMessage({
    type: 'PUMP_INJECTION_COMPLETE',
    timestamp: Date.now(),
    walletsDetected: window.pumpWalletHelper ? 'Helper created' : 'Helper failed'
  }, '*');

  console.log('Pump Extension: Injection complete, wallet helper available:', !!window.pumpWalletHelper);
})();