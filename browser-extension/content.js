// content.js - Runs on Twitter/X pages
const SOLANA_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-mainnet.rpcpool.com'
];
const PLACEHOLDER_IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

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

class PumpExtensionContent {
  constructor() {
    this.walletProvider = null;
    this.walletAdapter = null;
    this.connected = false;
    this.connection = null;
    this.walletProviderKey = null;
    this.rpcEndpoints = [...SOLANA_RPC_ENDPOINTS];
    this.rpcEndpointIndex = 0;
    this.rpcEndpoint = this.rpcEndpoints[0];
    this.init();
  }

  async init() {
    console.log('Pump Extension: Content script loaded');
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Wait for wallet adapter to initialize
    setTimeout(() => {
      console.log('Initializing wallet adapter and UI...');
      this.addTokenButtons();
    }, 2000); // Wait 2 seconds for wallet adapter to load
    
    // Monitor for new tweets (dynamic content)
    this.observeNewTweets();
    
    // Cleanup duplicate buttons periodically
    setInterval(() => {
      this.cleanupDuplicateButtons();
    }, 5000); // Every 5 seconds
  }

  async getConnection() {
    if (!window.solanaWeb3?.Connection) {
      throw new Error('Solana Web3 connection unavailable. Please refresh.');
    }

    if (!this.connection) {
      this.connection = new window.solanaWeb3.Connection(this.rpcEndpoint, {
        commitment: 'confirmed'
      });
    }

    return this.connection;
  }

  async rpcRequest(method, params) {
    const errors = [];
    const count = this.rpcEndpoints.length || 1;

    for (let offset = 0; offset < count; offset += 1) {
      const index = (this.rpcEndpointIndex + offset) % count;
      const endpoint = this.rpcEndpoints[index];

      try {
        const response = await this.sendBackgroundMessage({
          action: 'proxySolanaRpc',
          payload: {
            endpoint,
            method,
            params
          }
        });

        if (response?.success) {
          this.rpcEndpoint = endpoint;
          this.rpcEndpointIndex = index;
          return response.result;
        }

        const message = response?.error || 'Unknown RPC error';
        errors.push(`${endpoint}: ${message}`);
      } catch (rpcError) {
        errors.push(`${endpoint}: ${rpcError.message || rpcError}`);
      }
    }

    throw new Error(`[${method}] RPC failed on all endpoints: ${errors.join('; ')}`);
  }

  async waitForConfirmation(signature, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = await this.rpcRequest('getSignatureStatuses', [
        [signature],
        { searchTransactionHistory: true }
      ]);

      const status = result?.value?.[0];

      if (status?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      }

      if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
        return status;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error('Transaction confirmation timed out');
  }

  async uploadMetadata({ name, symbol, description }) {
    const response = await this.sendBackgroundMessage({
      action: 'proxyUploadMetadata',
      payload: {
        imageDataUrl: PLACEHOLDER_IMAGE_DATA_URL,
        name,
        symbol,
        description
      }
    });

    if (!response?.success || !response?.data) {
      throw new Error(response?.error || 'Metadata upload failed');
    }

    return response.data;
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'connectWallet':
          const connected = await this.connectWallet({ forcePrompt: true });
          sendResponse(connected);
          break;
          
        case 'getTweetData':
          const tweetData = this.getCurrentTweetData();
          sendResponse({ tweet: tweetData });
          break;
          
        case 'createToken':
          const tokenResult = await this.createTokenFromCurrentTweet(request.walletAddress);
          sendResponse(tokenResult);
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ error: error.message });
    }
  }

  async sendBackgroundMessage(message) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome?.runtime?.id) {
          reject(new Error('Extension context unavailable. Refresh the page or reload the extension.'));
          return;
        }

        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Removed old injection methods - now using proper wallet adapter

  async connectWallet(options = {}) {
    try {
      console.log('Content script: Starting wallet connection with adapter...');
      
      // Wait for wallet adapter to be ready
      const adapter = await this.getWalletAdapter();
      
      if (!adapter) {
        throw new Error('Wallet adapter not available. Please refresh the page.');
      }

      let walletInfo = null;
      if (typeof adapter.getWalletInfo === 'function') {
        try {
          walletInfo = await adapter.getWalletInfo();
        } catch (infoError) {
          console.warn('Wallet info lookup failed:', infoError);
        }
      }

      const selectWalletKey = (...candidates) => {
        for (const value of candidates) {
          if (typeof value === 'string' && value.trim()) {
            return value.trim().toLowerCase();
          }
        }
        return null;
      };

      const walletKeyPreference = selectWalletKey(
        options.walletKey,
        walletInfo?.provider,
        adapter.walletProviderKey,
        this.walletProviderKey,
        options.walletType,
        walletInfo?.walletType,
        adapter.walletName,
        this.walletProvider
      );

      const mustPrompt = !!options.forcePrompt || !walletInfo?.connected || !walletInfo?.publicKey;
      let connectionResult = null;

      if (mustPrompt) {
        console.log('Using Solana Wallet Adapter for connection...');
        connectionResult = await adapter.connect({
          walletKey: walletKeyPreference,
          walletType: options.walletType || walletInfo?.walletType || adapter.walletName || this.walletProvider || null,
          forcePrompt: true,
          timeout: options.timeout || 20000
        });

        if (!connectionResult?.success || !connectionResult?.publicKey) {
          throw new Error(connectionResult?.error || 'Wallet connection failed');
        }

        walletInfo = {
          connected: true,
          publicKey: connectionResult.publicKey,
          walletType: connectionResult.walletType,
          provider: connectionResult.provider || walletKeyPreference || null
        };
      }

      const resolvedPublicKey = this.normalizePublicKey(
        walletInfo?.publicKey || adapter.publicKey || connectionResult?.publicKey
      );

      if (!resolvedPublicKey) {
        throw new Error('Wallet connection failed: missing public key');
      }

      const walletType = walletInfo?.walletType || connectionResult?.walletType || adapter.walletName || this.walletProvider || 'Unknown';
      const providerKey = connectionResult?.provider || walletKeyPreference || walletInfo?.provider || adapter.walletProviderKey || this.walletProviderKey || null;

      this.walletAdapter = adapter;
      this.connected = true;
      this.walletProvider = walletType;
      if (providerKey) {
        this.walletProviderKey = providerKey;
      }

      adapter.publicKey = resolvedPublicKey;
      if (walletType) {
        adapter.walletName = walletType;
        adapter.walletType = walletType;
      }
      if (providerKey) {
        adapter.walletProviderKey = providerKey;
      }

      try {
        await chrome.storage.local.set({
          walletConnected: true,
          walletAddress: resolvedPublicKey,
          walletType,
          walletProviderKey: providerKey || null
        });
      } catch (storageError) {
        console.warn('Wallet state persistence failed:', storageError);
      }

      console.log('Wallet connected successfully:', {
        walletType,
        publicKey: resolvedPublicKey,
        providerKey
      });

      return {
        success: true,
        address: resolvedPublicKey,
        walletType,
        providerKey
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.connected = false;
      return {
        success: false,
        error: error.message,
        providerKey: null
      };
    }
  }

  async getWalletAdapter() {
    console.log('Waiting for Solana Wallet Adapter...');

    if (this.walletAdapter) {
      return this.walletAdapter;
    }

    const maxAttempts = 50;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Checking for wallet adapter, attempt ${attempt}/${maxAttempts}`);
      const adapter = window.solanaWalletAdapter;

      if (adapter) {
        try {
          if (typeof adapter.waitForHelper === 'function') {
            await adapter.waitForHelper();
          }
        } catch (error) {
          console.warn('Wallet helper wait failed:', error);
        }

        this.walletAdapter = adapter;
        return this.walletAdapter;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('Wallet adapter timeout - solanaWalletAdapter not available');
    return null;
  }

  getCurrentTweetData() {
    // Try to extract tweet data from current page
    const tweetSelectors = [
      '[data-testid="tweet"]',
      '.tweet',
      '[role="article"]'
    ];

    for (const selector of tweetSelectors) {
      const tweetEl = document.querySelector(selector);
      if (tweetEl) {
        return this.extractTweetData(tweetEl);
      }
    }

    // If we're on a specific tweet page, try alternative selectors
    if (window.location.pathname.includes('/status/')) {
      const textEl = document.querySelector('[data-testid="tweetText"]') || 
                    document.querySelector('.tweet-text') ||
                    document.querySelector('[lang]');
      
      if (textEl) {
        return {
          text: textEl.textContent || textEl.innerText,
          author: this.extractAuthorFromPage(),
          url: window.location.href,
          id: this.extractTweetId()
        };
      }
    }

    return null;
  }

  extractTweetData(tweetElement) {
    try {
      // Extract text content
      const textEl = tweetElement.querySelector('[data-testid="tweetText"]') ||
                    tweetElement.querySelector('.tweet-text') ||
                    tweetElement.querySelector('[lang]');
      
      const text = textEl ? (textEl.textContent || textEl.innerText) : '';

      // Extract author
      const authorEl = tweetElement.querySelector('[data-testid="User-Name"]') ||
                      tweetElement.querySelector('.username') ||
                      tweetElement.querySelector('a[href*="/"]');
      
      let author = 'unknown';
      if (authorEl) {
        const href = authorEl.getAttribute('href');
        if (href) {
          author = href.replace('/', '').split('/')[0];
        } else {
          author = authorEl.textContent.replace('@', '');
        }
      }

      return {
        text: text.trim(),
        author: author,
        url: window.location.href,
        id: this.extractTweetId(),
        element: tweetElement
      };
    } catch (error) {
      console.error('Error extracting tweet data:', error);
      return null;
    }
  }

  extractAuthorFromPage() {
    // Try multiple selectors for author name
    const authorSelectors = [
      'h2[role="heading"] span',
      '[data-testid="UserName"]',
      '.profile-card-fullname',
      'h1'
    ];

    for (const selector of authorSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        return el.textContent.replace('@', '');
      }
    }

    return 'unknown';
  }

  extractTweetId() {
    const match = window.location.pathname.match(/\/status\/(\d+)/);
    return match ? match[1] : Date.now().toString();
  }

  deriveTokenIdentifiers(tweetData) {
    const text = tweetData?.text || '';
    const author = tweetData?.author || '';
    const candidates = [];

    const textMatches = text.match(/[A-Za-z][A-Za-z0-9]{1,20}/g);
    if (textMatches) {
      candidates.push(...textMatches);
    }

    if (author) {
      const cleanedAuthor = author.replace(/[^A-Za-z0-9]/g, '');
      if (cleanedAuthor) {
        candidates.push(cleanedAuthor);
      }
    }

    let name = null;
    for (const candidate of candidates) {
      const cleaned = candidate.replace(/[^A-Za-z0-9]/g, '');
      if (cleaned.length >= 3 && /^[A-Za-z]/.test(cleaned)) {
        name = cleaned.slice(0, 20);
        break;
      }
    }

    if (!name) {
      const suffix = Date.now().toString().slice(-5);
      name = `Pump${suffix}`;
    }

    let symbol = name.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (symbol.length < 3) {
      symbol = (symbol + 'PUMP').slice(0, 3);
    }
    symbol = symbol.slice(0, 4);
    if (symbol.length < 3) {
      symbol = (symbol + 'XXX').slice(0, 3);
    }

    return { name, symbol };
  }

  async createTokenFromCurrentTweet(walletAddress, tweetDataOverride = null) {
    try {
      const tweetData = tweetDataOverride || this.getCurrentTweetData();
      if (!tweetData) {
        throw new Error('No tweet data found');
      }

      const { name, symbol } = this.deriveTokenIdentifiers(tweetData);
      const description = `A token inspired by ${name}. Created on ${new Date().toLocaleDateString()}.`;

      const adapter = await this.getWalletAdapter();
      if (!adapter) {
        throw new Error('Wallet adapter not available');
      }

      if (!adapter.publicKey) {
        if (typeof adapter.connect === 'function') {
          const connectionResult = await adapter.connect();
          if (!connectionResult?.success) {
            throw new Error(connectionResult?.error || 'Wallet connection required');
          }
        } else {
          throw new Error('Wallet connection required');
        }
      }

      let creatorPublicKey = adapter.publicKey || walletAddress;
      if (creatorPublicKey && typeof creatorPublicKey !== 'string') {
        if (typeof creatorPublicKey.toBase58 === 'function') {
          creatorPublicKey = creatorPublicKey.toBase58();
        } else if (typeof creatorPublicKey.toString === 'function') {
          creatorPublicKey = creatorPublicKey.toString();
        }
      }
      if (!creatorPublicKey) {
        throw new Error('Creator wallet address missing');
      }

      if (!window.solanaWeb3?.Keypair || !window.solanaWeb3?.VersionedTransaction) {
        throw new Error('Solana Web3 library not ready');
      }

      const mintKeypair = window.solanaWeb3.Keypair.generate();
      const mintPubkey = mintKeypair.publicKey.toBase58();

      // Upload token metadata to pump.fun so the bonding curve can reference it
      const metadataResponse = await this.uploadMetadata({ name, symbol, description });

      if (!metadataResponse?.metadataUri) {
        throw new Error('Invalid metadata response from pump.fun');
      }

      // Ask pump.fun for the bonding curve creation transaction using our new mint
      const tradeResponse = await this.sendBackgroundMessage({
        action: 'proxyTradeTransaction',
        payload: {
          publicKey: creatorPublicKey,
          action: 'create',
          tokenMetadata: {
            name: metadataResponse.metadata?.name || name,
            symbol: metadataResponse.metadata?.symbol || symbol,
            uri: metadataResponse.metadataUri
          },
          mint: mintPubkey,
          denominatedInSol: 'true',
          amount: 1,
          slippage: 10,
          priorityFee: 0.0005,
          pool: 'pump'
        }
      });

      if (!tradeResponse?.success || !tradeResponse?.transactionBase64) {
        throw new Error(tradeResponse?.error || 'Transaction creation failed');
      }

      const unsignedBytes = base64ToUint8(tradeResponse.transactionBase64);
      const unsignedTx = window.solanaWeb3.VersionedTransaction.deserialize(unsignedBytes);
      // The mint authority must sign before the user wallet adds its signature
      unsignedTx.sign([mintKeypair]);

    const partialBase64 = uint8ToBase64(unsignedTx.serialize({ requireAllSignatures: false }));
    let signedTransactionBase64 = null;
    let broadcastSignature = null;

      if (typeof adapter.signAndSendTransaction === 'function') {
        try {
          const sendResult = await adapter.signAndSendTransaction(partialBase64);
          if (sendResult?.success) {
            if (sendResult?.signedTransaction) {
              signedTransactionBase64 = sendResult.signedTransaction;
            }
            if (sendResult?.sent && sendResult?.signature) {
              broadcastSignature = sendResult.signature;
            }
          }
        } catch (sendError) {
          console.warn('Wallet signAndSendTransaction failed, falling back to manual broadcast:', sendError);
        }
      }

      if (!signedTransactionBase64 && !broadcastSignature) {
        if (typeof adapter.signTransaction !== 'function') {
          throw new Error('Connected wallet cannot co-sign this transaction. Please update your wallet extension.');
        }
        // Prompt the connected wallet to co-sign the partially signed transaction
        let signedResult;
        try {
          signedResult = await adapter.signTransaction(partialBase64);
        } catch (signError) {
          console.error('Wallet signTransaction threw:', signError);
          throw signError;
        }

        if (!signedResult?.success || !signedResult?.signedTransaction) {
          console.error('Wallet signTransaction returned invalid payload:', signedResult);
          throw new Error(signedResult?.error || 'Wallet signature failed');
        }

        signedTransactionBase64 = signedResult.signedTransaction;
      }

      let finalSignature = broadcastSignature;
      let serializedSigned = null;

      if (signedTransactionBase64) {
        const signedBytes = base64ToUint8(signedTransactionBase64);
        const signedTx = window.solanaWeb3.VersionedTransaction.deserialize(signedBytes);
        serializedSigned = signedTx.serialize();
      }

      if (!finalSignature) {
        if (!serializedSigned) {
          throw new Error('Wallet did not return a signature or signed transaction');
        }

        // Broadcast the fully signed transaction ourselves and wait for confirmation
        finalSignature = await this.rpcRequest('sendRawTransaction', [
          uint8ToBase64(serializedSigned),
          { skipPreflight: false, maxRetries: 3 }
        ]);
      }

      if (serializedSigned) {
        try {
          await this.waitForConfirmation(finalSignature);
        } catch (confirmationError) {
          console.warn('Transaction confirmation check failed:', confirmationError);
        }
      }

      if (!finalSignature) {
        throw new Error('Transaction signature unavailable');
      }

      const tokenData = {
        name: metadataResponse.metadata?.name || name,
        symbol: metadataResponse.metadata?.symbol || symbol,
        address: mintPubkey,
        metadataUri: metadataResponse.metadataUri,
        tweetUrl: tweetData.url,
        author: tweetData.author,
        description,
        marketCap: 'Pending',
        transactionSignature: finalSignature,
        pumpUrl: `https://pump.fun/${mintPubkey}`,
        creator: creatorPublicKey,
        createdAt: new Date().toISOString()
      };

      await this.storeTokenData(tokenData);

      try {
        await this.sendBackgroundMessage({
          action: 'storeTokenData',
          data: tokenData
        });
      } catch (syncError) {
        console.warn('Background sync for token data failed:', syncError);
      }

      return {
        success: true,
        token: tokenData
      };
    } catch (error) {
      console.error('Token creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async storeTokenData(tokenData) {
    // Store in chrome storage for the extension to use
    const stored = await chrome.storage.local.get(['createdTokens']);
    const tokens = stored.createdTokens || [];
    tokens.unshift(tokenData); // Add to beginning
    
    // Keep only last 50 tokens
    if (tokens.length > 50) {
      tokens.splice(50);
    }
    
    await chrome.storage.local.set({ createdTokens: tokens });
  }

  addTokenButtons() {
    // Add "Create Token" buttons to tweets
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    
    tweets.forEach(tweet => {
      // Multiple checks to prevent duplicate buttons
      if (this.shouldAddButtonToTweet(tweet)) {
        const added = this.addTokenButtonToTweet(tweet);
        // Mark as processed only if we actually added a button
        if (added) {
          tweet.classList.add('pump-processed');
          tweet.setAttribute('data-pump-processed', 'true');
        }
      }
    });
  }

  isPromotedTweet(tweetElement) {
    if (!tweetElement) {
      return false;
    }

    if (tweetElement.closest('[data-testid="placementTracking"]')) {
      return true;
    }

    if (tweetElement.querySelector('[data-testid="placementTracking"]')) {
      return true;
    }

    // Additional heuristics for ads/promoted content
    const socialContext = tweetElement.querySelector('[data-testid="socialContext"]');
    if (socialContext) {
      const text = socialContext.textContent?.trim().toLowerCase();
      if (text && (text.includes('promoted') || text.includes('ad'))) {
        return true;
      }
    }

    const promotedAria = tweetElement.querySelector('[aria-label*="Promoted" i]');
    if (promotedAria) {
      return true;
    }

    const spans = tweetElement.querySelectorAll('span');
    for (const span of spans) {
      const text = span.textContent?.trim().toLowerCase();
      if (text === 'promoted' || text === 'ad') {
        return true;
      }
    }

    return false;
  }

  shouldAddButtonToTweet(tweetElement) {
    // Check if tweet already has a button
    if (tweetElement.classList.contains('pump-processed')) return false;
    if (tweetElement.getAttribute('data-pump-processed') === 'true') return false;
    if (tweetElement.querySelector('.pump-token-btn')) return false;

    // Use the nearest article root to be robust across media tweets
    const root = tweetElement.closest('article[role="article"]') || tweetElement;

    if (this.isPromotedTweet(root)) return false;

    // Check if tweet has the required action bar (more robust scan)
    const groups = Array.from(root.querySelectorAll('div[role="group"]'));
    const actionBar = groups.find(g => g.querySelector('[data-testid="reply"], [data-testid="retweet"], [data-testid="like"], [data-testid="share"]'))
                    || root.querySelector('.tweet-actions')
                    || root.querySelector('[data-testid="reply"]')?.closest('div[role="group"]')
                    || root.querySelector('[data-testid="reply"]')?.parentElement;

    return !!actionBar;
  }

  addTokenButtonToTweet(tweetElement) {
    try {
      // Double-check: Don't add if button already exists
      if (tweetElement.querySelector('.pump-token-btn')) {
        console.log('Button already exists for this tweet, skipping...');
        return false;
      }

      // Find the action bar (like, retweet, share buttons)
      const root = tweetElement.closest('article[role="article"]') || tweetElement;
      const groups = Array.from(root.querySelectorAll('div[role="group"]'));
      let actionBar = groups.find(g => g.querySelector('[data-testid="reply"], [data-testid="retweet"], [data-testid="like"], [data-testid="share"]'))
                    || root.querySelector('.tweet-actions')
                    || root.querySelector('[data-testid="reply"]')?.closest('div[role="group"]')
                    || root.querySelector('[data-testid="reply"]')?.parentElement
                    || (groups.length ? groups[groups.length - 1] : null);

      if (!actionBar) {
        console.log('No action bar found for tweet, skipping...');
        return false;
      }

      // Create token button with unique identifier
    const tokenBtn = document.createElement('div');
    tokenBtn.className = 'pump-token-btn';
    tokenBtn.setAttribute('data-pump-button', 'true');
    const iconUrl = 'https://logos-world.net/wp-content/uploads/2024/10/Pump-Fun-Logo.png';
      tokenBtn.innerHTML = `
        <button class="pump-create-token" title="Create Token from Tweet" aria-label="Create Token" style="text-align:center;">
          <img src="${iconUrl}" alt="pump.fun" class="pump-create-token-icon" />
        </button>
      `;

      // Style the button
      tokenBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
      `;

      const button = tokenBtn.querySelector('.pump-create-token');
      button.style.cssText = `
        background: #1DA1F2;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 12px;
        color: white;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const iconImg = button.querySelector('.pump-create-token-icon');
      if (iconImg) {
        iconImg.style.cssText = `
          width: 18px;
          height: 18px;
          object-fit: contain;
          display: block;
        `;
      }

      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
      });

      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const tweetData = this.extractTweetData(tweetElement);
        if (tweetData) {
          this.showTokenCreationModal(tweetData);
        }
      });

      // Try to insert near the Share button if present for consistent layout
      const shareBtn = actionBar.querySelector('[data-testid="share"]');
      if (shareBtn && shareBtn.parentElement) {
        shareBtn.parentElement.after(tokenBtn);
      } else {
        actionBar.appendChild(tokenBtn);
      }
      
      // Mark the tweet as having a button
      tweetElement.setAttribute('data-pump-has-button', 'true');
      
      console.log('Token button added to tweet successfully');
      return true;
    } catch (error) {
      console.error('Error adding token button:', error);
      return false;
    }
  }

  showTokenCreationModal(tweetData) {
    const tweetText = (tweetData.text || '').trim();
    const truncatedText = tweetText.length > 100 ? `${tweetText.substring(0, 100)}...` : tweetText;
    const suggestedSymbolRaw = (tweetText.split(' ')[0] || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const suggestedSymbol = suggestedSymbolRaw || 'TOKEN';
    const safeText = this.escapeHtml(truncatedText);
    const safeAuthor = this.escapeHtml(tweetData.author || 'unknown');
    const safeSymbol = this.escapeHtml(suggestedSymbol);

    const modal = document.createElement('div');
    modal.className = 'pump-modal';
    modal.innerHTML = `
      <div class="pump-modal-content">
        <div class="pump-modal-header">
          <h3>Wanna create a token?</h3>
          <button class="pump-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="pump-modal-body">
          <div class="pump-tweet-preview">
            <p class="pump-tweet-heading">Tweet</p>
            <p class="pump-tweet-text">"${safeText}"</p>
            <p class="pump-tweet-author">@${safeAuthor}</p>
            <p class="pump-tweet-symbol">Suggested Symbol: <span>$${safeSymbol}</span></p>
          </div>
          <div class="pump-wallet-section">
            <div class="pump-wallet-row">
              <span class="pump-wallet-label">Wallet</span>
              <span class="pump-wallet-value pump-wallet-disconnected" id="pump-wallet-address">Checking...</span>
            </div>
            <button id="pump-wallet-connect" class="pump-btn-secondary">Connect Wallet</button>
          </div>
          <div class="pump-modal-status" role="status"></div>
          <button id="pump-create-confirm" class="pump-btn-primary" disabled>Create Token</button>
          <div class="pump-token-history">
            <div class="pump-token-history-header">
              <span>Recent tokens</span>
              <button id="pump-token-refresh" class="pump-token-refresh" title="Refresh">Refresh</button>
            </div>
            <div id="pump-token-list" class="pump-token-list">
              <div class="pump-token-empty">Loading tokens...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const closeButton = modal.querySelector('.pump-modal-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => modal.remove());
    }

    const statusEl = modal.querySelector('.pump-modal-status');
    const connectButton = modal.querySelector('#pump-wallet-connect');
    const walletValueEl = modal.querySelector('#pump-wallet-address');
    const confirmButton = modal.querySelector('#pump-create-confirm');
    const tokenListEl = modal.querySelector('#pump-token-list');
    const refreshTokenButton = modal.querySelector('#pump-token-refresh');

    if (!statusEl || !connectButton || !walletValueEl || !confirmButton || !tokenListEl || !refreshTokenButton) {
      console.error('Pump Extension: Modal template missing required elements.');
      modal.remove();
      return;
    }

  let currentWalletAddress = null;
    let isCreating = false;

    const setStatus = (message, tone = 'neutral') => {
      statusEl.textContent = message || '';
      if (!message) {
        return;
      }
      const toneColor = {
        success: '#047857',
        error: '#b91c1c',
        neutral: '#1f2937'
      };
      statusEl.style.color = toneColor[tone] || toneColor.neutral;
    };

    const updateCreateButtonState = () => {
      confirmButton.disabled = isCreating || !currentWalletAddress;
    };

    const setWalletState = (address, walletType, options = {}) => {
      currentWalletAddress = address || null;

      if (options.providerKey) {
        this.walletProviderKey = options.providerKey;
        if (this.walletAdapter) {
          this.walletAdapter.walletProviderKey = options.providerKey;
        }
      }

      if (address) {
        if (walletType) {
          this.walletProvider = walletType;
        }
        const label = `${this.truncateAddress(address)}${walletType ? ` (${walletType})` : ''}`;
        walletValueEl.textContent = label;
        walletValueEl.classList.remove('pump-wallet-disconnected');
        connectButton.textContent = 'Disconnect Wallet';
        if (!options.silent) {
          setStatus('Wallet connected.', 'success');
        }
      } else {
        walletValueEl.textContent = 'Not connected';
        walletValueEl.classList.add('pump-wallet-disconnected');
        connectButton.textContent = 'Connect Wallet';
        if (!options.silent) {
          setStatus('', 'neutral');
        }
      }

      connectButton.disabled = false;
      updateCreateButtonState();
    };

    const refreshWalletState = async () => {
      try {
        const adapter = await this.getWalletAdapter();

        if (adapter) {
          let info = null;
          if (typeof adapter.getWalletInfo === 'function') {
            try {
              info = await adapter.getWalletInfo();
            } catch (infoError) {
              console.warn('Wallet info lookup during refresh failed:', infoError);
            }
          }

          const infoKey = this.normalizePublicKey(info?.publicKey);
          if (info?.connected && infoKey) {
            setWalletState(
              infoKey,
              info?.walletType || adapter.walletName || adapter.walletType || this.walletProvider || null,
              {
                silent: true,
                providerKey: info?.provider || adapter.walletProviderKey || this.walletProviderKey || null
              }
            );
            return;
          }

          const adapterKey = this.normalizePublicKey(adapter.publicKey);
          if (adapterKey) {
            setWalletState(
              adapterKey,
              adapter.walletName || adapter.walletType || this.walletProvider || null,
              {
                silent: true,
                providerKey: adapter.walletProviderKey || this.walletProviderKey || null
              }
            );
            return;
          }
        }
      } catch (adapterError) {
        console.warn('Wallet adapter lookup during modal init failed:', adapterError);
      }

      try {
        const snapshot = await this.getStoredWalletSnapshot();
        if (snapshot?.walletConnected && snapshot.walletAddress) {
          setWalletState(snapshot.walletAddress, snapshot.walletType || null, {
            silent: true,
            providerKey: snapshot.walletProviderKey || null
          });
          return;
        }
      } catch (storageError) {
        console.warn('Wallet storage lookup failed:', storageError);
      }

      setWalletState(null, null, { silent: true });
    };

    const renderTokenList = async () => {
      tokenListEl.innerHTML = '';
      const loadingEl = document.createElement('div');
      loadingEl.className = 'pump-token-empty';
      loadingEl.textContent = 'Loading tokens...';
      tokenListEl.appendChild(loadingEl);

      try {
        const tokens = await this.getRecentTokens(6);

        tokenListEl.innerHTML = '';

        if (!tokens.length) {
          const emptyEl = document.createElement('div');
          emptyEl.className = 'pump-token-empty';
          emptyEl.textContent = 'No tokens created yet.';
          tokenListEl.appendChild(emptyEl);
          return;
        }

        tokens.forEach((token) => {
          const item = document.createElement('a');
          item.className = 'pump-token-item';
          item.href = token.pumpUrl || (token.address ? `https://pump.fun/${token.address}` : '#');
          item.target = '_blank';
          item.rel = 'noopener noreferrer';

          const symbolEl = document.createElement('span');
          symbolEl.className = 'pump-token-item-symbol';
          symbolEl.textContent = token.symbol ? `$${token.symbol}` : '$TOKEN';

          const addressEl = document.createElement('span');
          addressEl.className = 'pump-token-item-address';
          addressEl.textContent = token.address ? this.truncateAddress(token.address) : '—';

          item.appendChild(symbolEl);
          item.appendChild(addressEl);

          tokenListEl.appendChild(item);
        });
      } catch (error) {
        console.error('Failed to render token history:', error);
        tokenListEl.innerHTML = '';
        const errorEl = document.createElement('div');
        errorEl.className = 'pump-token-empty';
        errorEl.textContent = 'Could not load recent tokens.';
        tokenListEl.appendChild(errorEl);
      }
    };

    connectButton.addEventListener('click', async () => {
      if (connectButton.disabled) {
        return;
      }

      // If currently connected, disconnect
      if (currentWalletAddress) {
        connectButton.disabled = true;
        connectButton.textContent = 'Disconnecting...';
        setStatus('Disconnecting wallet...', 'neutral');
        try {
          const adapter = await this.getWalletAdapter();
          if (adapter && typeof adapter.disconnect === 'function') {
            const resp = await adapter.disconnect();
            if (resp && resp.success === false) {
              throw new Error(resp.error || 'Failed to disconnect wallet');
            }
          }
          try {
            await chrome.storage.local.remove(['walletConnected','walletAddress','walletType','walletProviderKey']);
          } catch (e) {
            console.warn('Failed clearing wallet storage on disconnect:', e);
          }
          setWalletState(null, null, { silent: false });
          setStatus('Wallet disconnected.', 'success');
        } catch (error) {
          console.error('Wallet disconnect failed:', error);
          setStatus(error.message || 'Failed to disconnect wallet. Please try again.', 'error');
        } finally {
          connectButton.disabled = false;
          connectButton.textContent = currentWalletAddress ? 'Disconnect Wallet' : 'Connect Wallet';
        }
        return;
      }

      // Otherwise connect flow
      connectButton.disabled = true;
      connectButton.textContent = 'Connecting...';
      setStatus('Confirm the connection in your wallet...', 'neutral');

      try {
        const response = await this.connectWallet({ forcePrompt: true });
        if (!response?.success || !response.address) {
          throw new Error(response?.error || 'Wallet connection failed.');
        }

        setWalletState(response.address, response.walletType || null, {
          providerKey: response.providerKey || null
        });
        setStatus(`Connected to ${response.walletType || 'wallet'}.`, 'success');
      } catch (error) {
        console.error('Wallet connection from modal failed:', error);
        setStatus(error.message || 'Wallet connection failed. Please try again.', 'error');
      } finally {
        connectButton.disabled = false;
        connectButton.textContent = currentWalletAddress ? 'Disconnect Wallet' : 'Connect Wallet';
      }
    });

    confirmButton.addEventListener('click', async () => {
      if (isCreating) {
        return;
      }

      if (!currentWalletAddress) {
        setStatus('Confirm the connection in your wallet...', 'neutral');
      }

      try {
        const connectionResponse = await this.connectWallet({
          forcePrompt: !currentWalletAddress
        });

        if (!connectionResponse?.success || !connectionResponse.address) {
          throw new Error(connectionResponse?.error || 'Wallet connection failed.');
        }

        setWalletState(connectionResponse.address, connectionResponse.walletType || null, {
          providerKey: connectionResponse.providerKey || null
        });
      } catch (connectionError) {
        console.error('Wallet verification before token creation failed:', connectionError);
        setStatus(connectionError.message || 'Wallet connection failed. Please try again.', 'error');
        return;
      }

      if (!currentWalletAddress) {
        setStatus('Connect your wallet first.', 'error');
        return;
      }

      isCreating = true;
      updateCreateButtonState();
      confirmButton.textContent = 'Creating token...';
      setStatus('Creating token on pump.fun...', 'neutral');

      try {
        const creationResult = await this.createTokenFromCurrentTweet(currentWalletAddress, tweetData);

        if (!creationResult?.success || !creationResult.token) {
          throw new Error(creationResult?.error || 'Token creation failed.');
        }

        setStatus('Token created! Opening pump.fun...', 'success');
        await renderTokenList();

        if (creationResult.token.pumpUrl) {
          setTimeout(() => {
            window.open(creationResult.token.pumpUrl, '_blank');
          }, 200);
        }

        setTimeout(() => modal.remove(), 1500);
      } catch (error) {
        console.error('Token creation from tweet failed:', error);
        setStatus(error.message || 'Token creation failed. Please try again.', 'error');
      } finally {
        isCreating = false;
        confirmButton.textContent = 'Create Token';
        updateCreateButtonState();
      }
    });

    refreshTokenButton.addEventListener('click', () => {
      renderTokenList();
    });

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);

    refreshWalletState();
    renderTokenList();
  }

  observeNewTweets() {
    // Watch for dynamically loaded content
    let addButtonsTimeout = null;
    
    const observer = new MutationObserver((mutations) => {
      let hasNewTweets = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node is a tweet or contains tweets
            if (node.matches && node.matches('[data-testid="tweet"]:not(.pump-processed)')) {
              hasNewTweets = true;
            } else if (node.querySelector && node.querySelector('[data-testid="tweet"]:not(.pump-processed)')) {
              hasNewTweets = true;
            } else if (node.closest) {
              // If content was added inside an existing tweet (e.g., media/actions), re-process
              const parentTweet = node.closest('[data-testid="tweet"]');
              if (parentTweet && !this.isPromotedTweet(parentTweet) && !parentTweet.querySelector('.pump-token-btn')) {
                hasNewTweets = true;
              }
            }
          }
        });
      });

      if (hasNewTweets) {
        // Debounce the button addition to prevent excessive calls
        if (addButtonsTimeout) {
          clearTimeout(addButtonsTimeout);
        }
        
        addButtonsTimeout = setTimeout(() => {
          console.log('Processing new tweets for token buttons...');
          this.addTokenButtons();
          addButtonsTimeout = null;
        }, 300); // Reduced timeout for better responsiveness
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('Tweet observer started');
  }

  // Clean up function to remove duplicate buttons (just in case)
  cleanupDuplicateButtons() {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    
    tweets.forEach(tweet => {
      const buttons = tweet.querySelectorAll('.pump-token-btn');

      if (this.isPromotedTweet(tweet) && buttons.length > 0) {
        buttons.forEach(btn => btn.remove());
        tweet.classList.remove('pump-processed');
        tweet.removeAttribute('data-pump-processed');
        return;
      }
      
      // If there are multiple buttons, remove all but the first one
      if (buttons.length > 1) {
        console.log(`Found ${buttons.length} buttons on tweet, removing duplicates...`);
        for (let i = 1; i < buttons.length; i++) {
          buttons[i].remove();
        }
      }

      // If no button yet but the tweet is eligible now (e.g., media/actions loaded), try to add
      if (buttons.length === 0 && this.shouldAddButtonToTweet(tweet)) {
        const added = this.addTokenButtonToTweet(tweet);
        if (added) {
          tweet.classList.add('pump-processed');
          tweet.setAttribute('data-pump-processed', 'true');
        }
      }
    });
  }

  normalizePublicKey(value) {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      if (typeof value.toBase58 === 'function') {
        return value.toBase58();
      }
      if (typeof value.toString === 'function') {
        return value.toString();
      }
    }

    return null;
  }

  truncateAddress(address) {
    if (!address || typeof address !== 'string') {
      return '--';
    }
    if (address.length <= 8) {
      return address;
    }
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  async getStoredWalletSnapshot() {
    try {
      return await new Promise((resolve) => {
        chrome.storage.local.get(['walletConnected', 'walletAddress', 'walletType', 'walletProviderKey'], (result) => {
          resolve(result);
        });
      });
    } catch (error) {
      console.warn('Failed to read wallet snapshot from storage:', error);
      return null;
    }
  }

  async getRecentTokens(limit = 5) {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['createdTokens'], (data) => resolve(data));
      });

      const tokens = Array.isArray(result?.createdTokens) ? result.createdTokens : [];
      return tokens.slice(0, Math.max(0, limit));
    } catch (error) {
      console.error('Error retrieving stored tokens:', error);
      return [];
    }
  }

  escapeHtml(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PumpExtensionContent();
  });
} else {
  new PumpExtensionContent();
}