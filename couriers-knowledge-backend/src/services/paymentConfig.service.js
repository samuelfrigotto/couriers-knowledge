// couriers-knowledge-backend/src/services/paymentConfig.service.js
// Serviço para gerenciar configurações de pagamento por região

class PaymentConfigService {
  
  /**
   * 🌍 Mapeamento completo de métodos de pagamento por país/região
   * FOCO: Principais regiões do Dota 2 (Brasil, EUA, Peru, Rússia, Sudeste Asiático, China)
   */
  static getPaymentMethodsByCountry() {
    return {
      // 🇧🇷 Brasil - PIX é dominante + cartões
      'BR': {
        instant: ['pix', 'card', 'link', 'paypal', 'amazon_pay', 'google_pay', 'apple_pay'],
        deferred: [], // Removido boleto conforme solicitado
        wallets: ['paypal', 'amazon_pay', 'google_pay', 'apple_pay', 'mercado_pago'],
        bnpl: ['klarna'], 
        local: ['pix'], // PIX é o método local mais popular
        currency: 'brl',
        recommended: ['pix', 'card', 'paypal'], // PIX primeiro por popularidade
        installments: true, // Brasileiro adora parcelamento
        locale: 'pt-BR',
        priority: 'very_high' // Uma das principais bases de Dota 2
      },

      // 🇺🇸 Estados Unidos - Máxima variedade de métodos
      'US': {
        instant: ['card', 'cashapp', 'link', 'paypal', 'amazon_pay', 'google_pay', 'apple_pay', 'venmo'],
        deferred: ['us_bank_account'],
        wallets: ['paypal', 'amazon_pay', 'google_pay', 'apple_pay', 'cashapp', 'venmo', 'revolut_pay'],
        bnpl: ['affirm', 'afterpay_clearpay', 'klarna', 'zip', 'sezzle'],
        local: ['cashapp', 'venmo', 'us_bank_account'],
        currency: 'usd',
        recommended: ['card', 'cashapp', 'paypal', 'apple_pay'],
        installments: false, // Americanos preferem BNPL a parcelamento tradicional
        locale: 'en-US',
        priority: 'very_high' // Maior base de jogadores
      },

      // 🇵🇪 Peru - Foco em métodos locais + cartões internacionais
      'PE': {
        instant: ['card', 'link', 'paypal', 'amazon_pay'],
        deferred: ['pagoefectivo', 'bcp', 'bbva_peru'],
        wallets: ['paypal', 'amazon_pay'],
        bnpl: [],
        local: ['pagoefectivo', 'bcp', 'bbva_peru', 'interbank'], // Bancos peruanos populares
        currency: 'pen', // Sol peruano
        recommended: ['card', 'pagoefectivo', 'paypal'],
        installments: true, // Popular na América Latina
        locale: 'es-PE',
        priority: 'high' // Base significativa de Dota 2
      },

      // 🇷🇺 Rússia - Métodos locais + internacionais que funcionam
      'RU': {
        instant: ['card', 'link', 'yandex_money', 'qiwi', 'webmoney'],
        deferred: ['sberbank', 'alfabank'],
        wallets: ['yandex_money', 'qiwi', 'webmoney'],
        bnpl: [],
        local: ['yandex_money', 'qiwi', 'webmoney', 'sberbank', 'alfabank'], // Métodos russos populares
        currency: 'rub', // Rublo russo
        recommended: ['card', 'yandex_money', 'sberbank'],
        installments: false,
        locale: 'ru-RU',
        priority: 'very_high' // Uma das maiores bases de Dota 2
      },

      // 🇨🇳 China - Foco em métodos locais dominantes
      'CN': {
        instant: ['alipay', 'wechat_pay', 'card'],
        deferred: ['china_unionpay'],
        wallets: ['alipay', 'wechat_pay'],
        bnpl: [],
        local: ['alipay', 'wechat_pay', 'china_unionpay'], // Dominam o mercado chinês
        currency: 'cny', // Yuan chinês
        recommended: ['alipay', 'wechat_pay', 'card'],
        installments: false,
        locale: 'zh-CN',
        priority: 'very_high' // Enorme base de jogadores
      },

      // 🇵🇭 Filipinas - Representando Sudeste Asiático
      'PH': {
        instant: ['card', 'gcash', 'paymaya', 'grabpay', 'link'],
        deferred: ['dragonpay', 'cebuana'],
        wallets: ['gcash', 'paymaya', 'grabpay', 'paypal'],
        bnpl: [],
        local: ['gcash', 'paymaya', 'grabpay', 'dragonpay'], // Filipinas é hub do SEA Dota
        currency: 'php',
        recommended: ['gcash', 'card', 'paymaya'],
        installments: false,
        locale: 'en-PH',
        priority: 'high' // SEA é região competitiva
      },

      // 🇮🇩 Indonésia - Maior país do Sudeste Asiático
      'ID': {
        instant: ['card', 'gopay', 'ovo', 'dana', 'link'],
        deferred: ['bank_transfer', 'alfamart', 'indomaret'],
        wallets: ['gopay', 'ovo', 'dana', 'paypal'],
        bnpl: [],
        local: ['gopay', 'ovo', 'dana', 'bank_transfer'], // Carteiras digitais dominantes
        currency: 'idr',
        recommended: ['gopay', 'card', 'ovo'],
        installments: false,
        locale: 'id-ID',
        priority: 'high'
      },

      // 🇹🇭 Tailândia - Importante no SEA
      'TH': {
        instant: ['card', 'promptpay', 'truemoney', 'link'],
        deferred: ['bank_transfer_th'],
        wallets: ['truemoney', 'paypal'],
        bnpl: [],
        local: ['promptpay', 'truemoney', 'bank_transfer_th'], // PromptPay é como PIX
        currency: 'thb',
        recommended: ['promptpay', 'card', 'truemoney'],
        installments: false,
        locale: 'th-TH',
        priority: 'medium'
      },

      // 🇲🇾 Malásia - Hub tecnológico do SEA
      'MY': {
        instant: ['card', 'fpx', 'grabpay', 'boost', 'link'],
        deferred: ['maybank2u', 'cimb_clicks'],
        wallets: ['grabpay', 'boost', 'touch_n_go'],
        bnpl: [],
        local: ['fpx', 'grabpay', 'boost', 'touch_n_go'], // FPX conecta todos os bancos
        currency: 'myr',
        recommended: ['fpx', 'card', 'grabpay'],
        installments: false,
        locale: 'en-MY',
        priority: 'medium'
      },

      // 🇻🇳 Vietnã - Crescente no Dota 2
      'VN': {
        instant: ['card', 'momo', 'zalopay', 'vietqr', 'link'],
        deferred: ['bank_transfer_vn'],
        wallets: ['momo', 'zalopay', 'paypal'],
        bnpl: [],
        local: ['momo', 'zalopay', 'vietqr'], // MoMo e ZaloPay são dominantes
        currency: 'vnd',
        recommended: ['momo', 'card', 'zalopay'],
        installments: false,
        locale: 'vi-VN',
        priority: 'medium'
      },

      // 🇸🇬 Singapura - Hub financeiro do SEA
      'SG': {
        instant: ['card', 'link', 'grabpay', 'paynow', 'paypal', 'amazon_pay'],
        deferred: ['bank_transfer_sg'],
        wallets: ['grabpay', 'paypal', 'amazon_pay'],
        bnpl: ['zip', 'atome'],
        local: ['paynow', 'grabpay'], // PayNow é como PIX
        currency: 'sgd',
        recommended: ['paynow', 'card', 'grabpay'],
        installments: false,
        locale: 'en-SG',
        priority: 'medium'
      },

      // 🇺🇦 Ucrânia - Base significativa de Dota 2
      'UA': {
        instant: ['card', 'link', 'privat24', 'liqpay'],
        deferred: ['bank_transfer_ua'],
        wallets: ['liqpay', 'paypal'],
        bnpl: [],
        local: ['privat24', 'liqpay'], // PrivatBank é dominante
        currency: 'uah',
        recommended: ['card', 'privat24', 'liqpay'],
        installments: false,
        locale: 'uk-UA',
        priority: 'medium'
      },

      // 🇦🇷 Argentina - Importante na América do Sul
      'AR': {
        instant: ['card', 'link', 'mercado_pago', 'paypal'],
        deferred: ['rapipago', 'pagofacil'],
        wallets: ['mercado_pago', 'paypal'],
        bnpl: [],
        local: ['mercado_pago', 'rapipago', 'pagofacil'], // MercadoPago domina
        currency: 'ars',
        recommended: ['mercado_pago', 'card', 'paypal'],
        installments: true, // Popular na América Latina
        locale: 'es-AR',
        priority: 'medium'
      },

      // 🇨🇱 Chile - Representa região andina
      'CL': {
        instant: ['card', 'link', 'webpay', 'paypal'],
        deferred: ['servipag', 'multicaja'],
        wallets: ['paypal'],
        bnpl: [],
        local: ['webpay', 'servipag'], // WebPay é padrão
        currency: 'clp',
        recommended: ['webpay', 'card', 'paypal'],
        installments: true,
        locale: 'es-CL',
        priority: 'low'
      },

      // 🇨🇴 Colômbia - Importante na América do Sul
      'CO': {
        instant: ['card', 'link', 'pse', 'nequi', 'paypal'],
        deferred: ['efecty', 'baloto'],
        wallets: ['nequi', 'paypal'],
        bnpl: [],
        local: ['pse', 'nequi', 'efecty'], // PSE conecta bancos, Nequi é carteira popular
        currency: 'cop',
        recommended: ['pse', 'card', 'nequi'],
        installments: true,
        locale: 'es-CO',
        priority: 'medium'
      },

      // 🇪🇺 Europa Ocidental - Consolidado (Alemanha como referência)
      'DE': {
        instant: ['card', 'link', 'sofort', 'giropay', 'paypal', 'amazon_pay'],
        deferred: ['sepa_debit'],
        wallets: ['paypal', 'amazon_pay', 'google_pay', 'apple_pay'],
        bnpl: ['klarna', 'ratepay'],
        local: ['sofort', 'giropay', 'sepa_debit'],
        currency: 'eur',
        recommended: ['sofort', 'card', 'paypal'],
        installments: false,
        locale: 'de-DE',
        priority: 'medium' // Base menor mas estável
      },

      // 🌍 Padrão Global (fallback otimizado)
      'DEFAULT': {
        instant: ['card', 'link', 'paypal', 'amazon_pay'],
        deferred: [],
        wallets: ['paypal', 'amazon_pay'],
        bnpl: ['klarna'],
        local: [],
        currency: 'usd',
        recommended: ['card', 'paypal'],
        installments: false,
        locale: 'en-US',
        priority: 'low'
      }
    };
  }

  /**
   * 💳 Informações detalhadas sobre cada método de pagamento
   */
  static getPaymentMethodsInfo() {
    return {
      // Cartões
      card: {
        name: 'Cartão de Crédito/Débito',
        description: 'Visa, Mastercard, Elo, American Express',
        icon: '💳',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Global',
        supports_installments: true
      },

      // Métodos brasileiros
      pix: {
        name: 'PIX',
        description: 'Pagamento instantâneo 24/7 via QR Code ou Pix Copia e Cola',
        icon: '⚡',
        processing_time: 'Instantâneo',
        fees: 'Sem taxas',
        popularity: 'Brasil',
        supports_installments: false,
        recommended_for: ['BR']
      },

      // Carteiras digitais globais
      link: {
        name: 'Stripe Link',
        description: 'Pague com 1 clique usando dados salvos com segurança',
        icon: '🔗',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Global',
        supports_installments: false
      },

      paypal: {
        name: 'PayPal',
        description: 'Use sua conta PayPal ou cartões salvos',
        icon: '🅿️',
        processing_time: 'Instantâneo',
        fees: 'Médias',
        popularity: 'Global',
        supports_installments: false
      },

      amazon_pay: {
        name: 'Amazon Pay',
        description: 'Use sua conta Amazon e endereços salvos',
        icon: '📦',
        processing_time: 'Instantâneo',
        fees: 'Médias',
        popularity: 'Global',
        supports_installments: false
      },

      google_pay: {
        name: 'Google Pay',
        description: 'Pagamento rápido com sua conta Google',
        icon: '🔵',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Global',
        supports_installments: false
      },

      apple_pay: {
        name: 'Apple Pay',
        description: 'Pagamento seguro com Touch ID ou Face ID',
        icon: '🍎',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Global',
        supports_installments: false
      },

      // Métodos americanos
      cashapp: {
        name: 'Cash App',
        description: 'Popular nos EUA - pagamento via app',
        icon: '💵',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'EUA',
        supports_installments: false,
        recommended_for: ['US']
      },

      revolut_pay: {
        name: 'Revolut Pay',
        description: 'Pagamento via app Revolut',
        icon: '🔄',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Europa/EUA',
        supports_installments: false
      },

      // Buy Now Pay Later
      affirm: {
        name: 'Affirm',
        description: 'Parcele sem cartão de crédito, aprovação instantânea',
        icon: '📊',
        processing_time: 'Instantâneo',
        fees: 'Variáveis',
        popularity: 'EUA/Canadá',
        supports_installments: true,
        recommended_for: ['US', 'CA']
      },

      klarna: {
        name: 'Klarna',
        description: 'Compre agora, pague depois em 4x sem juros',
        icon: '🛒',
        processing_time: 'Instantâneo',
        fees: 'Sem taxas para cliente',
        popularity: 'Europa/EUA/Austrália',
        supports_installments: true
      },

      afterpay_clearpay: {
        name: 'Afterpay/Clearpay',
        description: 'Pague em 4 parcelas sem juros',
        icon: '💎',
        processing_time: 'Instantâneo',
        fees: 'Sem taxas para cliente',
        popularity: 'Austrália/Reino Unido',
        supports_installments: true,
        recommended_for: ['AU', 'GB']
      },

      zip: {
        name: 'Zip',
        description: 'Flexibilidade de pagamento em parcelas',
        icon: '⚡',
        processing_time: 'Instantâneo',
        fees: 'Variáveis',
        popularity: 'Austrália/EUA',
        supports_installments: true
      },

      // Métodos europeus
      sepa_debit: {
        name: 'SEPA Direct Debit',
        description: 'Débito automático europeu (SEPA)',
        icon: '🏦',
        processing_time: '1-3 dias úteis',
        fees: 'Muito baixas',
        popularity: 'União Europeia',
        supports_installments: false,
        recommended_for: ['DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'PL']
      },

      ideal: {
        name: 'iDEAL',
        description: 'Método preferido na Holanda - transferência bancária',
        icon: '🇳🇱',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Holanda',
        supports_installments: false,
        recommended_for: ['NL']
      },

      sofort: {
        name: 'Sofort',
        description: 'Transferência bancária alemã e austríaca',
        icon: '🇩🇪',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Alemanha/Áustria',
        supports_installments: false,
        recommended_for: ['DE', 'AT']
      },

      giropay: {
        name: 'Giropay',
        description: 'Sistema bancário alemão',
        icon: '🏛️',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Alemanha',
        supports_installments: false,
        recommended_for: ['DE']
      },

      bancontact: {
        name: 'Bancontact',
        description: 'Método nacional da Bélgica',
        icon: '🇧🇪',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Bélgica',
        supports_installments: false,
        recommended_for: ['BE']
      },

      eps: {
        name: 'EPS',
        description: 'Sistema de pagamento austríaco',
        icon: '🇦🇹',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Áustria',
        supports_installments: false,
        recommended_for: ['AT']
      },

      p24: {
        name: 'Przelewy24',
        description: 'Sistema bancário polonês',
        icon: '🇵🇱',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Polônia',
        supports_installments: false,
        recommended_for: ['PL']
      },

      multibanco: {
        name: 'Multibanco',
        description: 'Sistema ATM português',
        icon: '🇵🇹',
        processing_time: '1-3 dias úteis',
        fees: 'Baixas',
        popularity: 'Portugal',
        supports_installments: false,
        recommended_for: ['PT']
      },

      mb_way: {
        name: 'MB WAY',
        description: 'Pagamento móvel português',
        icon: '📱',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Portugal',
        supports_installments: false,
        recommended_for: ['PT']
      },

      // Métodos de outros países
      us_bank_account: {
        name: 'US Bank Account',
        description: 'Débito em conta bancária americana (ACH)',
        icon: '🏦',
        processing_time: '1-3 dias úteis',
        fees: 'Muito baixas',
        popularity: 'EUA',
        supports_installments: false,
        recommended_for: ['US']
      },

      acss_debit: {
        name: 'Canadian Pre-authorized Debit',
        description: 'Débito automático canadense',
        icon: '🏦',
        processing_time: '1-3 dias úteis',
        fees: 'Muito baixas',
        popularity: 'Canadá',
        supports_installments: false,
        recommended_for: ['CA']
      },

      bacs_debit: {
        name: 'BACS Direct Debit',
        description: 'Débito automático britânico',
        icon: '🏦',
        processing_time: '1-3 dias úteis',
        fees: 'Muito baixas',
        popularity: 'Reino Unido',
        supports_installments: false,
        recommended_for: ['GB']
      },

      au_becs_debit: {
        name: 'BECS Direct Debit',
        description: 'Débito automático australiano',
        icon: '🏦',
        processing_time: '1-3 dias úteis',
        fees: 'Muito baixas',
        popularity: 'Austrália',
        supports_installments: false,
        recommended_for: ['AU']
      },

      oxxo: {
        name: 'OXXO',
        description: 'Pagamento em lojas OXXO no México',
        icon: '🏪',
        processing_time: '1-3 dias úteis',
        fees: 'Baixas',
        popularity: 'México',
        supports_installments: false,
        recommended_for: ['MX']
      },

      konbini: {
        name: 'Konbini',
        description: 'Pagamento em lojas de conveniência no Japão',
        icon: '🏪',
        processing_time: '1-3 dias úteis',
        fees: 'Baixas',
        popularity: 'Japão',
        supports_installments: false,
        recommended_for: ['JP']
      },

      // Métodos asiáticos
      upi: {
        name: 'UPI',
        description: 'Unified Payments Interface - muito popular na Índia',
        icon: '🇮🇳',
        processing_time: 'Instantâneo',
        fees: 'Sem taxas',
        popularity: 'Índia',
        supports_installments: false,
        recommended_for: ['IN']
      },

      netbanking: {
        name: 'Net Banking',
        description: 'Transferência bancária online indiana',
        icon: '🏦',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Índia',
        supports_installments: false,
        recommended_for: ['IN']
      },

      paytm: {
        name: 'Paytm',
        description: 'Carteira digital indiana',
        icon: '💼',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Índia',
        supports_installments: false,
        recommended_for: ['IN']
      },

      grabpay: {
        name: 'GrabPay',
        description: 'Super app do Sudeste Asiático',
        icon: '🚗',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Sudeste Asiático',
        supports_installments: false,
        recommended_for: ['SG', 'MY', 'TH', 'VN']
      },

      fpx: {
        name: 'FPX',
        description: 'Financial Process Exchange - Malásia',
        icon: '🏦',
        processing_time: 'Instantâneo',
        fees: 'Baixas',
        popularity: 'Malásia',
        supports_installments: false,
        recommended_for: ['MY']
      }
    };
  }

  /**
   * 🎯 Obter configuração de pagamento para um país específico
   */
  static getConfigForCountry(countryCode = 'BR') {
    const configs = this.getPaymentMethodsByCountry();
    const methodsInfo = this.getPaymentMethodsInfo();
    
    const config = configs[countryCode] || configs['DEFAULT'];
    
    // Combinar todos os métodos disponíveis
    const allMethods = [
      ...config.instant,
      ...config.deferred,
      ...config.bnpl
    ];
    
    // Remover duplicatas
    const uniqueMethods = [...new Set(allMethods)];
    
    // Adicionar informações detalhadas
    const methodsWithInfo = uniqueMethods
      .filter(method => methodsInfo[method])
      .map(method => ({
        id: method,
        ...methodsInfo[method],
        category: this.categorizeMethod(method, config)
      }));

    return {
      country: countryCode,
      currency: config.currency,
      locale: config.locale,
      recommended: config.recommended,
      supports_installments: config.installments,
      available_methods: uniqueMethods,
      methods_with_info: methodsWithInfo,
      categories: {
        instant: config.instant,
        deferred: config.deferred,
        wallets: config.wallets,
        bnpl: config.bnpl,
        local: config.local
      }
    };
  }

  /**
   * 🏷️ Categorizar método de pagamento
   */
  static categorizeMethod(method, config) {
    if (config.instant.includes(method)) return 'instant';
    if (config.deferred.includes(method)) return 'deferred';
    if (config.bnpl.includes(method)) return 'bnpl';
    if (config.wallets.includes(method)) return 'wallet';
    if (config.local.includes(method)) return 'local';
    return 'other';
  }

  /**
   * 🌍 Detectar país do usuário baseado em múltiplas fontes
   */
  static detectUserCountry(req) {
    // 1. Headers de CDN/Proxy (Cloudflare, AWS, etc.)
    const cfCountry = req.headers['cf-ipcountry'];
    const xRealCountry = req.headers['x-real-country'];
    const xCountry = req.headers['x-country'];
    
    // 2. Headers de geolocalização
    const xForwardedCountry = req.headers['x-forwarded-country'];
    const geoCountry = req.headers['x-geo-country'];
    
    // 3. Accept-Language header
    const acceptLanguage = req.headers['accept-language'];
    let languageCountry = null;
    if (acceptLanguage) {
      const match = acceptLanguage.match(/[a-z]{2}-([A-Z]{2})/);
      if (match) languageCountry = match[1];
    }
    
    // 4. User preference salvo no banco
    const userCountry = req.user?.country || req.user?.detected_country;
    
    // 5. Timezone para detectar região aproximada
    const timezone = req.headers['x-timezone'];
    let timezoneCountry = null;
    if (timezone) {
      const timezoneMap = {
        'America/Sao_Paulo': 'BR',
        'America/Fortaleza': 'BR',
        'America/Manaus': 'BR',
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'America/Chicago': 'US',
        'America/Toronto': 'CA',
        'America/Vancouver': 'CA',
        'Europe/London': 'GB',
        'Europe/Berlin': 'DE',
        'Europe/Paris': 'FR',
        'Europe/Amsterdam': 'NL',
        'Europe/Rome': 'IT',
        'Europe/Madrid': 'ES',
        'Europe/Lisbon': 'PT',
        'Asia/Tokyo': 'JP',
        'Asia/Seoul': 'KR',
        'Asia/Shanghai': 'CN',
        'Asia/Singapore': 'SG',
        'Asia/Kolkata': 'IN',
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU'
      };
      
      timezoneCountry = timezoneMap[timezone] || null;
    }
    
    // 6. IP-based detection (pode ser implementado com uma lib como geoip-lite)
    const userIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress;
    
    // Prioridade de detecção (do mais confiável para o menos)
    const detectedCountry = userCountry ||           // Preferência do usuário
                           cfCountry ||              // Cloudflare (muito confiável)
                           xRealCountry ||           // Headers de proxy
                           xCountry ||               
                           xForwardedCountry ||      
                           geoCountry ||             
                           languageCountry ||        // Accept-Language
                           timezoneCountry ||        // Timezone
                           'BR';                     // Default para Brasil

    console.log(`🌍 País detectado: ${detectedCountry} (fontes: cf=${cfCountry}, lang=${languageCountry}, tz=${timezoneCountry})`);
    
    return detectedCountry.toUpperCase();
  }

  /**
   * 💳 Gerar configuração do Stripe baseada no país
   */
  static generateStripeConfig(countryCode, priceId, customerId, userId, userEmail) {
    const config = this.getConfigForCountry(countryCode);
    
    const baseConfig = {
      customer: customerId,
      payment_method_types: config.available_methods,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      locale: config.locale,
      currency: config.currency,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      
      metadata: {
        user_id: userId.toString(),
        price_id: priceId,
        user_email: userEmail,
        detected_country: countryCode
      },
      
      subscription_data: {
        metadata: {
          user_id: userId.toString(),
          user_email: userEmail,
          country: countryCode
        }
      }
    };

    // 🇧🇷 Configurações específicas para o Brasil
    if (countryCode === 'BR') {
      baseConfig.payment_method_options = {
        pix: {
          expires_after_seconds: 86400 // 24 horas para pagar via PIX
        },
        card: {
          installments: {
            enabled: true,
            plan: {
              count: 12,
              interval: 'month',
              type: 'fixed_count'
            }
          },
          setup_future_usage: 'off_session'
        }
      };
      
      baseConfig.custom_text = {
        submit: {
          message: 'Ao confirmar, você autoriza pagamentos recorrentes conforme os termos de uso.'
        }
      };
    }

    // 🇺🇸 Configurações específicas para os EUA
    else if (countryCode === 'US') {
      baseConfig.payment_method_options = {
        card: {
          setup_future_usage: 'off_session'
        },
        us_bank_account: {
          verification_method: 'instant'
        }
      };
    }

    // 🇪🇺 Configurações para países europeus
    else if (['DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'PL'].includes(countryCode)) {
      baseConfig.payment_method_options = {
        card: {
          setup_future_usage: 'off_session'
        },
        sepa_debit: {
          setup_future_usage: 'off_session'
        }
      };
    }

    // 🇬🇧 Configurações para o Reino Unido
    else if (countryCode === 'GB') {
      baseConfig.payment_method_options = {
        card: {
          setup_future_usage: 'off_session'
        },
        bacs_debit: {
          setup_future_usage: 'off_session'
        }
      };
    }

    // 🇦🇺 Configurações para a Austrália
    else if (countryCode === 'AU') {
      baseConfig.payment_method_options = {
        card: {
          setup_future_usage: 'off_session'
        },
        au_becs_debit: {
          setup_future_usage: 'off_session'
        }
      };
    }

    return baseConfig;
  }

  /**
   * 📊 Obter estatísticas de uso por método de pagamento
   */
  static getPaymentMethodStats() {
    return {
      most_popular_global: ['card', 'paypal', 'apple_pay', 'google_pay'],
      fastest_conversion: ['card', 'link', 'apple_pay', 'google_pay'],
      lowest_fees: ['pix', 'sepa_debit', 'upi', 'ideal'],
      highest_success_rate: ['card', 'paypal', 'pix', 'ideal'],
      
      by_region: {
        'BR': {
          most_used: ['pix', 'card', 'paypal'],
          recommended_order: ['pix', 'card', 'link', 'paypal']
        },
        'US': {
          most_used: ['card', 'paypal', 'apple_pay', 'cashapp'],
          recommended_order: ['card', 'cashapp', 'paypal', 'link']
        },
        'EU': {
          most_used: ['card', 'paypal', 'sepa_debit', 'ideal'],
          recommended_order: ['card', 'ideal', 'sofort', 'paypal']
        }
      }
    };
  }

  /**
   * ⚡ Métodos considerados instantâneos (processamento imediato)
   */
  static getInstantMethods() {
    return [
      'card', 'pix', 'link', 'paypal', 'amazon_pay', 'google_pay', 'apple_pay',
      'cashapp', 'revolut_pay', 'affirm', 'klarna', 'afterpay_clearpay', 'zip',
      'ideal', 'sofort', 'giropay', 'bancontact', 'eps', 'p24', 'mb_way',
      'upi', 'netbanking', 'paytm', 'grabpay', 'fpx', 'konbini'
    ];
  }

  /**
   * 🔄 Métodos que suportam pagamentos recorrentes
   */
  static getRecurringMethods() {
    return [
      'card', 'sepa_debit', 'us_bank_account', 'acss_debit', 
      'bacs_debit', 'au_becs_debit', 'paypal'
    ];
  }

  /**
   * 💰 Obter configurações de taxa por método
   */
  static getFeeStructure() {
    return {
      lowest: ['pix', 'sepa_debit', 'upi', 'ideal', 'sofort'],
      low: ['card', 'link', 'giropay', 'bancontact', 'eps'],
      medium: ['paypal', 'amazon_pay', 'google_pay', 'apple_pay'],
      high: ['affirm', 'klarna', 'afterpay_clearpay'],
      variable: ['cashapp', 'revolut_pay', 'zip']
    };
  }

  /**
   * 🎨 Obter configurações de UI por método
   */
  static getUIPreferences(countryCode) {
    const preferences = {
      'BR': {
        highlight_methods: ['pix', 'card'],
        show_installments: true,
        preferred_language: 'pt-BR',
        show_fees: false,
        emphasis_instant: true
      },
      'US': {
        highlight_methods: ['card', 'cashapp', 'paypal'],
        show_installments: false,
        preferred_language: 'en-US',
        show_fees: true,
        emphasis_instant: true
      },
      'DE': {
        highlight_methods: ['sofort', 'card', 'paypal'],
        show_installments: false,
        preferred_language: 'de-DE',
        show_fees: true,
        emphasis_instant: true
      },
      'DEFAULT': {
        highlight_methods: ['card', 'paypal'],
        show_installments: false,
        preferred_language: 'en-US',
        show_fees: true,
        emphasis_instant: true
      }
    };

    return preferences[countryCode] || preferences['DEFAULT'];
  }

  /**
   * 🚀 Validar se um método de pagamento é suportado em um país
   */
  static isMethodSupportedInCountry(method, countryCode) {
    const config = this.getConfigForCountry(countryCode);
    return config.available_methods.includes(method);
  }

  /**
   * 📝 Obter mensagens localizadas para métodos de pagamento
   */
  static getLocalizedMessages(countryCode) {
    const messages = {
      'BR': {
        pix_description: 'Pagamento instantâneo via PIX - disponível 24 horas',
        card_description: 'Cartão de crédito ou débito - parcele em até 12x',
        processing_instant: 'Processamento instantâneo',
        processing_delayed: 'Processamento em 1-3 dias úteis',
        no_fees: 'Sem taxas adicionais',
        low_fees: 'Taxas baixas',
        installments_available: 'Parcelamento disponível'
      },
      'US': {
        cashapp_description: 'Popular payment app - instant transfer',
        card_description: 'Credit or debit card - instant processing',
        processing_instant: 'Instant processing',
        processing_delayed: 'Processing in 1-3 business days',
        no_fees: 'No additional fees',
        low_fees: 'Low fees',
        installments_available: 'Installments available'
      },
      'DE': {
        sofort_description: 'Sofortüberweisung - Sichere Online-Überweisung',
        card_description: 'Kredit- oder Debitkarte - Sofortige Bearbeitung',
        processing_instant: 'Sofortige Bearbeitung',
        processing_delayed: 'Bearbeitung in 1-3 Werktagen',
        no_fees: 'Keine zusätzlichen Gebühren',
        low_fees: 'Niedrige Gebühren',
        installments_available: 'Ratenzahlung verfügbar'
      }
    };

    return messages[countryCode] || messages['US'];
  }
}

module.exports = PaymentConfigService;