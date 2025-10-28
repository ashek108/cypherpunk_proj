// wallet-adapter.js - bridges the content script to the injected page helper so we can talk to Phantom
(function initSolanaWalletAdapter() {
  const SCRIPT_ID = '__pump_wallet_helper__';
  const SOLANA_SCRIPT_ID = '__pump_solana_web3__';

  const injectScript = (id, fileName) => {
    if (document.getElementById(id)) {
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.type = 'text/javascript';
    script.src = chrome.runtime.getURL(fileName);
    script.onload = () => script.remove();

    (document.head || document.documentElement).appendChild(script);
  };

  const injectHelperScript = () => {
    injectScript(SOLANA_SCRIPT_ID, 'solanaWeb3.iife.min.js');
    injectScript(SCRIPT_ID, 'inject.js');
  };

  class SolanaWalletAdapter {
    constructor() {
      this.publicKey = null;
      this.walletName = null;
      this.walletProviderKey = null;
      this.helperReady = false;
      this.helperResolvers = [];
      this.pending = new Map();
      this.listenForMessages();
      injectHelperScript();
    }

    listenForMessages() {
      window.addEventListener('message', (event) => {
        if (event.source !== window) {
          return;
        }

        const data = event.data;
        if (!data) {
          return;
        }

        if (data.type === 'PUMP_INJECTION_COMPLETE') {
          this.helperReady = true;
          this.helperResolvers.splice(0).forEach((resolve) => resolve());
          return;
        }

        if (data.__pumpMessage && data.direction === 'page-to-content') {
          const pending = this.pending.get(data.requestId);
          if (!pending) {
            return;
          }

          this.pending.delete(data.requestId);

          if (data.success !== false && data.payload?.success !== false) {
            pending.resolve(data.payload);
          } else {
            const error = data.error || data.payload?.error || 'Wallet request failed';
            pending.reject(new Error(error));
          }
          return;
        }

        if (data.type === 'PUMP_WALLET_CONNECTED') {
          this.publicKey = data.publicKey || this.publicKey;
          this.walletName = data.walletType || this.walletName;
          this.walletProviderKey = data.walletType || this.walletProviderKey;
        }

        if (data.type === 'PUMP_WALLET_DISCONNECTED') {
          this.publicKey = null;
          this.walletName = null;
          this.walletProviderKey = null;
        }

        if (data.type === 'PUMP_WALLET_ACCOUNT_CHANGED') {
          this.publicKey = data.publicKey || null;
        }
      });
    }

    waitForHelper(timeout = 8000) {
      if (this.helperReady) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const onResolve = () => {
          clearTimeout(timer);
          resolve();
        };

        const timer = setTimeout(() => {
          this.helperResolvers = this.helperResolvers.filter((fn) => fn !== onResolve);
          reject(new Error('Wallet helper not ready'));
        }, timeout);

        this.helperResolvers.push(onResolve);
      });
    }

    sendRequest(type, payload = {}, timeout = 15000) {
      return new Promise((resolve, reject) => {
        const requestId = `pump-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const timer = setTimeout(() => {
          this.pending.delete(requestId);
          reject(new Error(`${type} timed out`));
        }, timeout);

        this.pending.set(requestId, {
          resolve: (response) => {
            clearTimeout(timer);
            resolve(response);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          }
        });

        window.postMessage({
          __pumpMessage: true,
          direction: 'content-to-page',
          type,
          requestId,
          payload
        }, '*');
      });
    }

    async connect(options = {}) {
      await this.waitForHelper();
      const response = await this.sendRequest(
        'PUMP_CONNECT_WALLET',
        {
          preferredWallet: options.walletKey || options.walletType || null,
          forcePrompt: !!options.forcePrompt
        },
        options.timeout || 20000
      );

      if (response.success) {
        this.publicKey = response.publicKey;
        this.walletName = response.walletType;
        this.walletProviderKey = response.provider || this.walletProviderKey;
      }

      return response;
    }

    async getWalletInfo() {
      await this.waitForHelper();
      return this.sendRequest('PUMP_GET_WALLET_INFO', {}, 8000);
    }

    async disconnect() {
      await this.waitForHelper();
      const response = await this.sendRequest('PUMP_DISCONNECT_WALLET', {
        walletType: this.walletName || null
      });

      if (response.success) {
        this.publicKey = null;
        this.walletName = null;
      }

      return response;
    }

    async signTransaction(serializedTransaction, walletType = null) {
      await this.waitForHelper();
      return this.sendRequest('PUMP_SIGN_TRANSACTION', {
        transaction: serializedTransaction,
        walletType: walletType || this.walletProviderKey || (this.walletName ? this.walletName.toLowerCase() : null)
      });
    }

    async signAndSendTransaction(serializedTransaction, walletType = null) {
      await this.waitForHelper();
      return this.sendRequest('PUMP_SIGN_AND_SEND_TRANSACTION', {
        transaction: serializedTransaction,
        walletType: walletType || this.walletProviderKey || (this.walletName ? this.walletName.toLowerCase() : null)
      }, 30000);
    }

    async getAvailableWallets() {
      await this.waitForHelper();
      const response = await this.sendRequest('PUMP_GET_AVAILABLE_WALLETS');
      return response.wallets || [];
    }
  }

  if (!window.SolanaWalletAdapter) {
    window.SolanaWalletAdapter = SolanaWalletAdapter;
  }

  if (!window.solanaWalletAdapter) {
    window.solanaWalletAdapter = new SolanaWalletAdapter();
  }

  console.log('Solana Wallet Adapter bridge loaded');
})();