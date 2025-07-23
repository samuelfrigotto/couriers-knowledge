import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly STORAGE_KEY = 'app_language';
  private readonly DEFAULT_LANGUAGE = 'en';

  public readonly availableLanguages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
  ];

  private currentLanguageSubject = new BehaviorSubject<string>(
    this.DEFAULT_LANGUAGE
  );
  public currentLanguage$: Observable<string> =
    this.currentLanguageSubject.asObservable();

  // Traduções apenas para premium e settings
  private readonly translations: { [key: string]: { [key: string]: string } } =
    {
      en: {
        // Settings
        'settings.title': 'Settings',
        'settings.language': 'Language',
        'settings.language.description': 'Select your preferred language',

        // Language selector
        'language.current': 'Current Language',
        'language.select': 'Select Language',

        // Premium Page
        'premium.title': 'Unlock Your Full Potential',
        'premium.subtitle':
          'Choose the perfect plan for you and elevate your experience to a new level with exclusive features and no limitations.',
        'premium.loading': 'Loading plans...',
        'premium.error': 'Error loading plans',
        'premium.retryButton': 'Try Again',

        // Plans
        'premium.monthly': 'Premium Monthly',
        'premium.semiannual': 'Premium Semi-Annual',
        'premium.annual': 'Premium Annual',
        'premium.tryhard': 'Tryhard Pro',

        'premium.perMonth': 'per month',
        'premium.perMonthSix': 'per month (6 months)',
        'premium.perMonthTwelve': 'per month (12 months)',
        'premium.noLimitations': 'no limitations',

        'premium.totalPeriod': 'Total for the period',
        'premium.status': 'Status',
        'premium.comingSoon': 'Coming Soon',
        'premium.inDevelopment': 'In development',

        // Plan features
        'premium.features.unlimitedEvaluations': 'Unlimited evaluations',
        'premium.features.prioritySupport': 'Priority VIP support',
        'premium.features.noAds': 'No ads',
        'premium.features.advancedReports': 'Advanced reports',
        'premium.features.dataExport': 'Data export',
        'premium.features.betaFeatures': 'Exclusive beta features',
        'premium.features.monthlyConsulting': 'Free monthly consulting',
        'premium.features.allPremiumFeatures': 'All premium features',
        'premium.features.support247': '24/7 dedicated support',
        'premium.features.fullApiAccess': 'Full API access',
        'premium.features.noLimitations': 'No limitations whatsoever',
        'premium.features.experimentalFeatures': 'Experimental features',
        'premium.features.advancedCustomizations': 'Advanced customizations',
        'premium.features.enterpriseIntegration': 'Enterprise integration',

        // Discounts
        'premium.discount.20': '20% discount',
        'premium.discount.40': '40% discount',

        // Buttons
        'premium.choosePlan': 'Choose Plan',
        'premium.bestValue': 'Best Value',
        'premium.notifyMe': 'Notify Me',

        // FAQ Section
        'premium.faq.title': 'Frequently Asked Questions',
        'premium.faq.security.title': '🔒 Is it safe to pay?',
        'premium.faq.security.content':
          'We use state-of-the-art encryption and do not store card information. All payments are processed by Stripe.',
        'premium.faq.export.title': '📊 Can I export my data?',
        'premium.faq.export.content':
          'Yes! With Premium, you can export all your evaluations and reports in JSON formats. More formats will be added soon.',
        'premium.faq.activation.title': '⚡ When is Premium activated?',
        'premium.faq.activation.content':
          'Your Premium plan is activated immediately after payment confirmation and remains active for the entire contracted period.',
        'premium.faq.features.title':
          '🎮 What Premium features will be available?',
        'premium.faq.features.content':
          'Unlimited evaluations, advanced reports, priority support, and early access to new features as they are developed.',

        // Final CTA
        'premium.finalCta.title': 'Ready to get started?',
        'premium.finalCta.subtitle':
          "Improve your Dota 2 experience with exclusive Courier's Knowledge Premium features!",

        // Friends Page
        'friends.title': 'Steam Friends',
        'friends.subtitle':
          'Invite your friends and open Steam chat automatically!',
        'friends.refresh': 'Refresh',
        'friends.loading': 'Loading...',
        'friends.loadingFriends': 'Loading your Steam friends...',
        'friends.errorTitle': 'Could not load your friends',
        'friends.errorMessage':
          'Check if your Steam profile is not private and try again.',
        'friends.retry': 'Try again',

        // Stats
        'friends.stats.totalFriends': 'Total friends',
        'friends.stats.usingApp': 'Using the app',
        'friends.stats.toInvite': 'To invite',
        'friends.stats.invitesSent': 'Invites sent',

        // Steam Integration Banner
        'friends.banner.title': 'Steam Chat Integration',
        'friends.banner.description':
          'Now you can open Steam chat automatically with the invite message ready! Just press Enter.',

        // Search
        'friends.search.placeholder': 'Search friends by name...',
        'friends.search.searching': 'Searching for: ',

        // Tabs
        'friends.tabs.all': 'All',
        'friends.tabs.toInvite': 'To Invite',
        'friends.tabs.invited': 'Invited',
        'friends.tabs.usingApp': 'Using App',
        'friends.tabs.statistics': 'Statistics',

        // Friend Actions
        'friends.action.inviteAndChat': 'Invite + Steam Chat',
        'friends.action.copyMessage': 'Copy Message',
        'friends.action.inviteAndChatShort': 'Invite + Chat',
        'friends.action.copyInvite': 'Copy Invite',
        'friends.action.alreadyInvited': 'Already Invited',
        'friends.action.chatOpenedAuto': 'Chat opened automatically',
        'friends.action.openChat': 'Open Chat',

        // Status Messages
        'friends.status.usingApp': 'Using the app',
        'friends.status.notUsingApp': 'Not using the app',
        'friends.status.invited': 'Invited on',
        'friends.status.friendsSince': 'Friends since',

        // Empty States
        'friends.empty.noFriends': 'No friends found',
        'friends.empty.noResults': 'No friends found with this search',
        'friends.empty.noInvited': "You haven't sent any invites yet",
        'friends.empty.noUsingApp':
          'None of your friends are using the app yet',
        'friends.empty.startInviting': 'Start inviting your friends!',

        // Notifications
        'friends.notification.friendsLoaded': 'friends loaded!',
        'friends.notification.errorLoading': 'Error loading friends',
        'friends.notification.steamOpening': 'Steam opening! Message copied.',
        'friends.notification.steamOpeningManual':
          'Steam opening. Copy the message manually.',
        'friends.notification.messageCopied': 'Invite message copied!',
        'friends.notification.copyError': 'Error copying message',
        'friends.notification.errorInviting':
          'Error sending invite. Try again.',
        'friends.search.clear': 'Clear search',
        'friends.stats.distribution': 'Friend Distribution',
        'friends.stats.inviteSummary': 'Invite Summary',
        'friends.stats.totalInvitesSent': 'Total Invites Sent',
        'friends.stats.pendingInvites': 'Pending Invites',
        'friends.stats.inviteProgress': 'Invite Progress',
      },
      pt: {
        // Settings
        'settings.title': 'Configurações',
        'settings.language': 'Idioma',
        'settings.language.description': 'Selecione seu idioma preferido',

        // Language selector
        'language.current': 'Idioma Atual',
        'language.select': 'Selecionar Idioma',

        // Premium Page
        'premium.title': 'Desbloqueie Todo o Potencial',
        'premium.subtitle':
          'Escolha o plano perfeito para você e eleve sua experiência a um novo patamar com recursos exclusivos e sem limitações.',
        'premium.loading': 'Carregando planos...',
        'premium.error': 'Erro ao carregar planos',
        'premium.retryButton': 'Tentar Novamente',

        // Plans
        'premium.monthly': 'Premium Mensal',
        'premium.semiannual': 'Premium Semestral',
        'premium.annual': 'Premium Anual',
        'premium.tryhard': 'Tryhard Pro',

        'premium.perMonth': 'por mês',
        'premium.perMonthSix': 'por mês (6 meses)',
        'premium.perMonthTwelve': 'por mês (12 meses)',
        'premium.noLimitations': 'sem limitações',

        'premium.totalPeriod': 'Total no período',
        'premium.status': 'Status',
        'premium.comingSoon': 'Em breve',
        'premium.inDevelopment': 'Em desenvolvimento',

        // Plan features
        'premium.features.unlimitedEvaluations': 'Avaliações ilimitadas',
        'premium.features.prioritySupport': 'Suporte prioritário VIP',
        'premium.features.noAds': 'Sem anúncios',
        'premium.features.advancedReports': 'Relatórios avançados',
        'premium.features.dataExport': 'Exportação de dados',
        'premium.features.betaFeatures': 'Recursos beta exclusivos',
        'premium.features.monthlyConsulting': 'Consultoria mensal gratuita',
        'premium.features.allPremiumFeatures': 'Todos os recursos premium',
        'premium.features.support247': 'Suporte 24/7 dedicado',
        'premium.features.fullApiAccess': 'API de acesso completa',
        'premium.features.noLimitations': 'Sem qualquer limitação',
        'premium.features.experimentalFeatures': 'Recursos experimentais',
        'premium.features.advancedCustomizations': 'Customizações avançadas',
        'premium.features.enterpriseIntegration': 'Integração empresarial',

        // Discounts
        'premium.discount.20': '20% de desconto',
        'premium.discount.40': '40% de desconto',

        // Buttons
        'premium.choosePlan': 'Escolher Plano',
        'premium.bestValue': 'Melhor Valor',
        'premium.notifyMe': 'Me Avisar',

        // FAQ Section
        'premium.faq.title': 'Perguntas Frequentes',
        'premium.faq.security.title': '🔒 É seguro pagar?',
        'premium.faq.security.content':
          'Utilizamos criptografia de ponta e não armazenamos informações de cartão. Todos os pagamentos são processados pela Stripe.',
        'premium.faq.export.title': '📊 Posso exportar meus dados?',
        'premium.faq.export.content':
          'Sim! Com o Premium, você pode exportar todas as suas avaliações e relatórios em formatos JSON. Mais formatos serão adicionados em breve.',
        'premium.faq.activation.title': '⚡ Quando o Premium é ativado?',
        'premium.faq.activation.content':
          'Seu plano Premium é ativado imediatamente após a confirmação do pagamento e permanece ativo por todo o período contratado.',
        'premium.faq.features.title':
          '🎮 Quais recursos Premium estarão disponíveis?',
        'premium.faq.features.content':
          'Avaliações ilimitadas, relatórios avançados, suporte prioritário e acesso antecipado a novos recursos conforme são desenvolvidos.',

        // Final CTA
        'premium.finalCta.title': 'Pronto para começar?',
        'premium.finalCta.subtitle':
          "Melhore sua experiência no Dota 2 com recursos exclusivos do Courier's Knowledge Premium!",
        // Friends Page
        'friends.title': 'Amigos Steam',
        'friends.subtitle':
          'Convide seus amigos e abra o chat da Steam automaticamente!',
        'friends.refresh': 'Atualizar',
        'friends.loading': 'Carregando...',
        'friends.loadingFriends': 'Carregando seus amigos da Steam...',
        'friends.errorTitle': 'Não foi possível carregar seus amigos',
        'friends.errorMessage':
          'Verifique se seu perfil Steam não está privado e tente novamente.',
        'friends.retry': 'Tentar novamente',

        // Stats
        'friends.stats.totalFriends': 'Total de amigos',
        'friends.stats.usingApp': 'Usando o app',
        'friends.stats.toInvite': 'Para convidar',
        'friends.stats.invitesSent': 'Convites enviados',

        // Steam Integration Banner
        'friends.banner.title': 'Integração com Chat Steam',
        'friends.banner.description':
          'Agora você pode abrir o chat da Steam automaticamente com a mensagem de convite já pronta! Só apertar Enter.',

        // Search
        'friends.search.placeholder': 'Pesquisar amigos pelo nome...',
        'friends.search.searching': 'Pesquisando por: ',

        // Tabs
        'friends.tabs.all': 'Todos',
        'friends.tabs.toInvite': 'Para Convidar',
        'friends.tabs.invited': 'Convidados',
        'friends.tabs.usingApp': 'Usando App',
        'friends.tabs.statistics': 'Estatísticas',

        // Friend Actions
        'friends.action.inviteAndChat': 'Convidar + Chat Steam',
        'friends.action.copyMessage': 'Copiar Mensagem',
        'friends.action.inviteAndChatShort': 'Convidar + Chat',
        'friends.action.copyInvite': 'Copiar Convite',
        'friends.action.alreadyInvited': 'Já Convidado',
        'friends.action.chatOpenedAuto': 'Chat aberto automaticamente',
        'friends.action.openChat': 'Abrir Chat',

        // Status Messages
        'friends.status.usingApp': 'Usando o app',
        'friends.status.notUsingApp': 'Não está usando o app',
        'friends.status.invited': 'Convidado em',
        'friends.status.friendsSince': 'Amigos desde',

        // Empty States
        'friends.empty.noFriends': 'Nenhum amigo encontrado',
        'friends.empty.noResults': 'Nenhum amigo encontrado com esta pesquisa',
        'friends.empty.noInvited': 'Você ainda não enviou nenhum convite',
        'friends.empty.noUsingApp':
          'Nenhum dos seus amigos está usando o app ainda',
        'friends.empty.startInviting': 'Comece convidando seus amigos!',

        // Notifications
        'friends.notification.friendsLoaded': 'amigos carregados!',
        'friends.notification.errorLoading': 'Erro ao carregar amigos',
        'friends.notification.steamOpening': 'Steam abrindo! Mensagem copiada.',
        'friends.notification.steamOpeningManual':
          'Steam abrindo. Copie a mensagem manualmente.',
        'friends.notification.messageCopied': 'Mensagem de convite copiada!',
        'friends.notification.copyError': 'Erro ao copiar mensagem',
        'friends.notification.errorInviting':
          'Erro ao enviar convite. Tente novamente.',
        'friends.search.clear': 'Limpar pesquisa',
        'friends.stats.distribution': 'Distribuição de Amigos',
        'friends.stats.inviteSummary': 'Resumo de Convites',
        'friends.stats.totalInvitesSent': 'Total de Convites Enviados',
        'friends.stats.pendingInvites': 'Convites Pendentes',
        'friends.stats.inviteProgress': 'Progresso dos Convites',
      },
    };

  constructor() {
    this.loadLanguageFromStorage();
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setCurrentLanguage(languageCode: string): void {
    if (this.availableLanguages.some((lang) => lang.code === languageCode)) {
      this.currentLanguageSubject.next(languageCode);
      this.saveLanguageToStorage(languageCode);
    }
  }

  translate(key: string, params?: { [key: string]: string }): string {
    const currentLang = this.getCurrentLanguage();
    const translation =
      this.translations[currentLang]?.[key] ||
      this.translations[this.DEFAULT_LANGUAGE]?.[key] ||
      key;

    if (params) {
      return Object.keys(params).reduce((text, param) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      }, translation);
    }

    return translation;
  }

  getCurrentLanguageInfo(): Language {
    const currentCode = this.getCurrentLanguage();
    return (
      this.availableLanguages.find((lang) => lang.code === currentCode) ||
      this.availableLanguages[0]
    );
  }

  private loadLanguageFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const savedLanguage = localStorage.getItem(this.STORAGE_KEY);
      if (
        savedLanguage &&
        this.availableLanguages.some((lang) => lang.code === savedLanguage)
      ) {
        this.currentLanguageSubject.next(savedLanguage);
      }
    }
  }

  private saveLanguageToStorage(languageCode: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, languageCode);
    }
  }
}
