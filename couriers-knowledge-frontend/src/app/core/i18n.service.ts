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

// === DASHBOARD SECTION ===
'dashboard.title': 'My Evaluations',

// Buttons
'dashboard.buttons.import': 'Import',
'dashboard.buttons.export': 'Export',
'dashboard.buttons.select': 'Select',
'dashboard.buttons.exitSelection': 'Exit Selection',
'dashboard.buttons.newEvaluation': 'New Evaluation',
'dashboard.buttons.updating': 'Updating...',
'dashboard.buttons.updateNames': 'Update Names',
'dashboard.buttons.limit': 'Limit',

// Search
'dashboard.search.placeholder': 'Search Player',
'dashboard.search.results': '{{count}} result(s)',
'dashboard.search.resultsText': 'result(s)',
'dashboard.search.noResults': 'No player found',
'dashboard.search.clear': 'Clear search',

// Table Headers
'dashboard.table.player': 'Player',
'dashboard.table.hero': 'Hero & Role',
'dashboard.table.rating': 'Rating',
'dashboard.table.notes': 'Notes',
'dashboard.table.tags': 'Tags',

// Player Info
'dashboard.player.unknown': 'Unknown Player',
'dashboard.player.id': 'ID: {{steamId}}',
'dashboard.player.match': 'Match: {{matchId}}',
'dashboard.player.anonymous': 'Anonymous',

// Hero & Notes
'dashboard.hero.notInformed': 'Hero not informed',
'dashboard.notes.noNotes': 'No notes',
'dashboard.notes.label': 'Rating:',

// Actions Menu
'dashboard.actions.edit': 'Edit',
'dashboard.actions.share': 'Share',
'dashboard.actions.delete': 'Delete',

// Status
'dashboard.status.premium': 'Premium',
'dashboard.status.free': 'Free',

// Tooltips
'dashboard.tooltips.import': 'Import evaluations',
'dashboard.tooltips.export': 'Export evaluations',
'dashboard.tooltips.selection': 'Toggle selection mode',
'dashboard.tooltips.newEvaluation': 'Create new evaluation',
'dashboard.tooltips.newEvaluationLimit': 'Evaluation limit reached. Upgrade to Premium!',
'dashboard.tooltips.updateNames': 'Update player names',

// Selection Controls
'dashboard.selection.count': '{{selected}}/{{total}} selected',
'dashboard.selection.selectAll': 'Select All',
'dashboard.selection.clearSelection': 'Clear Selection',
'dashboard.selection.selectedText': 'selected',

// Loading
'dashboard.loading.evaluations': 'Loading your evaluations...',

// Tags
'dashboard.tags.noTags': 'No tags',

// Import/Export Modal Headers
'dashboard.import.title': 'Import Evaluations',
'dashboard.export.title': 'Export Evaluations',
'dashboard.export.evaluationsText': 'evaluations',
'dashboard.export.success.evaluationsExported': 'evaluations exported',

// Import Tabs
'dashboard.import.tabs.paste': 'Paste',
'dashboard.import.tabs.file': 'File',
'dashboard.import.tabs.code': 'Code',

// Import Content
'dashboard.import.paste.description': 'Paste a shared evaluation here:',
'dashboard.import.paste.subtitle': 'Accepts both friendly text (WhatsApp/Discord) and exported JSON data!',
'dashboard.import.paste.placeholder': 'Paste a shared evaluation here...',

'dashboard.import.file.description': 'Select a JSON file with exported evaluations:',
'dashboard.import.file.button': 'Choose File',
'dashboard.import.file.selected': 'Selected file:',
'dashboard.import.file.remove': 'Remove file',
'dashboard.import.file.dragHere': 'Drag a JSON file here',
'dashboard.import.file.orClickToSelect': 'or click to select',
'dashboard.import.file.maxSize': 'Maximum: 10MB',

'dashboard.import.code.description': 'Enter the share code:',
'dashboard.import.code.placeholder': 'Enter share code (e.g., ABC12DE4)',
'dashboard.import.code.help': 'The share code has 8 characters and is provided when someone exports evaluations.',

// Import Preview
'dashboard.import.preview.title': 'Import Preview:',
'dashboard.import.preview.total': 'Total evaluations:',
'dashboard.import.preview.exportedBy': 'Exported by:',
'dashboard.import.preview.exportedAt': 'Export date:',
'dashboard.import.preview.version': 'Version:',
'dashboard.import.preview.type': 'Type:',
'dashboard.import.preview.source': 'Source:',
'dashboard.import.preview.player': 'Player:',
'dashboard.import.preview.rating': 'Rating:',
'dashboard.import.preview.friendlyText': 'Friendly Text',
'dashboard.import.preview.jsonData': 'JSON Data',
'dashboard.import.preview.date': 'Date:',

// Import Help
'dashboard.import.paste.howToUse': '💡 How to use:',
'dashboard.import.paste.receive': 'Receive',
'dashboard.import.paste.receiveDesc': 'Someone shares an evaluation via WhatsApp/Discord',
'dashboard.import.paste.paste': 'Paste',
'dashboard.import.paste.pasteDesc': 'Use Ctrl+V to paste the text here',
'dashboard.import.paste.import': 'Import',
'dashboard.import.paste.importDesc': 'Click "Import" to add to your collection',
'dashboard.import.paste.acceptedFormats': '📝 Accepted formats:',
'dashboard.import.paste.friendlyTextFormat': '✅ Friendly text:',
'dashboard.import.paste.casualSharing': 'Casual sharing via message',
'dashboard.import.paste.jsonFormat': '✅ Exported JSON:',
'dashboard.import.paste.completeExport': 'Complete export file',
'dashboard.import.paste.shortcuts': 'Shortcuts:',
'dashboard.import.paste.shortcutsList': 'Ctrl+V to paste • Ctrl+A to select all',

// Import Mode
'dashboard.import.mode.title': 'Import Mode:',
'dashboard.import.mode.add.title': 'Add (Recommended)',
'dashboard.import.mode.add.description': 'Keep existing, add new ones',
'dashboard.import.mode.merge.title': 'Merge',
'dashboard.import.mode.merge.description': 'Update existing, add new ones',
'dashboard.import.mode.replace.title': 'Replace All',
'dashboard.import.mode.replace.description': 'Removes all your existing evaluations and imports the new ones',

// Export Options
'dashboard.export.description': 'Choose how to export your evaluations:',
'dashboard.export.all': 'All evaluations',
'dashboard.export.selected': 'Selected evaluations',
'dashboard.export.allCount': '{{count}} evaluations',
'dashboard.export.selectedCount': '{{count}} evaluations',

// Export Details
'dashboard.export.whatWillBeExported': '📋 What will be exported:',
'dashboard.export.jsonFile': 'JSON file for local backup',
'dashboard.export.shareCode': 'Share code (valid for 30 days)',
'dashboard.export.completeData': 'Complete evaluation data',
'dashboard.export.playerInfo': 'Player information and tags',
'dashboard.export.processing': 'Processing export...',
'dashboard.export.generating': 'Generating file and share code',

// Export Results
'dashboard.export.success.title': 'Export Completed!',
'dashboard.export.success.completed': '✅ Export completed successfully!',
'dashboard.export.success.exportedCount': '{{count}} evaluations exported',
'dashboard.export.success.shareCodeTitle': '🔗 Share Code:',
'dashboard.export.success.copyCode': 'Copy code',
'dashboard.export.success.howToShare': '📱 How to share:',
'dashboard.export.success.step1': 'Copy the code above',
'dashboard.export.success.step2': 'Send to other players via WhatsApp/Discord',
'dashboard.export.success.step3': 'They can use this code in "Import → Code" option',
'dashboard.export.success.validUntil': '⏰ Valid until:',
'dashboard.export.success.thirtyDays': '(30 days)',
'dashboard.export.success.jsonFileLabel': '📄 JSON File:',
'dashboard.export.success.downloadedAutomatically': 'Downloaded automatically for backup',
'dashboard.export.success.messageExample': '💬 Example sharing message:',
'dashboard.export.success.exampleText1': 'Hey guys, I exported my Courier\'s Knowledge evaluations!',
'dashboard.export.success.exampleText2': 'Use the code:',
'dashboard.export.success.exampleText3': 'Go to Import → Code and paste this code.',
'dashboard.export.success.copyCodeButton': 'Copy Code',

// Modal Actions
'dashboard.modal.import': 'Import',
'dashboard.modal.export': 'Export',
'dashboard.modal.cancel': 'Cancel',
'dashboard.modal.close': 'Close',
'dashboard.export.exporting': 'Exporting...',
'dashboard.import.importing': 'Importing...',

// Success Messages
'dashboard.success.importCompleted': 'Import completed! {{imported}} evaluation(s) imported',
'dashboard.success.importSkipped': ', {{skipped}} ignored (duplicates)',
'dashboard.success.importErrors': '. {{errors}} error(s) found',
'dashboard.success.evaluationShared': 'Evaluation shared! Text copied to clipboard.',
'dashboard.success.codeCopied': 'Code copied to clipboard!',
'dashboard.success.evaluationDeleted': 'Evaluation deleted successfully!',
'dashboard.success.evaluationUpdated': 'Evaluation updated successfully!',

// Error Messages
'dashboard.errors.importData': 'Error importing data.',
'dashboard.errors.importLimit': 'Import limit reached.',
'dashboard.errors.shareEvaluation': 'Could not share evaluation.',
'dashboard.errors.copyCode': 'Error copying code.',
'dashboard.errors.deleteEvaluation': 'Error deleting evaluation.',
'dashboard.errors.loadEvaluations': 'Error loading evaluations.',
'dashboard.errors.invalidFile': 'Invalid file.',
'dashboard.errors.evaluationLimit': 'You have reached the limit of {{limit}} evaluations for the free plan.',

// ===== SEÇÃO INGLÊS (en): =====

// Confirmações
'dashboard.confirm.deleteEvaluation': 'Are you sure you want to delete this evaluation?',

// Compartilhamento
'dashboard.share.playerEvaluation': 'Player evaluation',
'dashboard.share.player': 'Player',
'dashboard.share.hero': 'Hero',
'dashboard.share.match': 'Match',
'dashboard.share.rating': 'Rating',
'dashboard.share.notes': 'Notes',
'dashboard.share.tags': 'Tags',
'dashboard.share.noNotes': 'None.',
'dashboard.share.noTags': 'None.',
'dashboard.share.footer': 'Track and evaluate your games with Courier\'s Knowledge!',

// Textos de importação específicos
'dashboard.import.textSharing': 'Text Sharing',
'dashboard.import.preview.unknown': 'Unknown',
'dashboard.import.preview.textVersion': 'Text',
'dashboard.import.preview.shareSource': 'Sharing',

// Erros específicos adicionais
'dashboard.errors.selectEvaluations': 'Select at least one evaluation to export.',
'dashboard.errors.exportLimitDaily': 'Daily export limit reached.',
'dashboard.errors.exportLimitMonthly': 'Monthly export limit reached.',
'dashboard.errors.importLimitDaily': 'Daily import limit reached.',
'dashboard.errors.importLimitMonthly': 'Monthly import limit reached.',
'dashboard.errors.fileTooLarge': 'File too large. Maximum: 10MB.',
'dashboard.errors.jsonReadError': 'Error reading JSON file. Check if the file is correct.',
'dashboard.errors.fileReadError': 'Error reading file.',
'dashboard.errors.invalidImportFormat': 'Invalid import file format.',
'dashboard.errors.importByCode': 'Error importing by code.',
'dashboard.errors.invalidJson': 'Invalid JSON file.',
'dashboard.errors.invalidPastedJson': 'Invalid pasted JSON.',
'dashboard.errors.importText': 'Error importing text evaluation.',
'dashboard.errors.exportFailed': 'Export failed.',
'dashboard.errors.updateNames': 'Failed to update names.',

// Sucessos adicionais
'dashboard.success.namesUpdated': 'Player names updated!',

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
        // Adicionar no final da seção 'en':

// Additional UI Elements
'friends.ui.refreshTooltip': 'Refresh friends list',
'friends.ui.profileButton': 'Profile',
'friends.ui.chatButton': 'Chat',
'friends.ui.opening': 'Opening...',
'friends.ui.generating': 'Generating...',
'friends.ui.reinviteButton': 'Re-invite + Steam',
'friends.ui.profileTooltip': 'Open Steam profile',
'friends.ui.chatTooltip': 'Open Steam chat',
'friends.ui.chatDirectTooltip': 'Open Steam chat directly',
'friends.ui.appBadgeTooltip': 'Uses Courier\'s Knowledge',

// Date Labels
'friends.date.joinedOn': 'Joined on',
'friends.date.friends': 'friends',

// Statistics Page
'friends.statistics.title': 'Your friends statistics',
'friends.statistics.joinedAfterInvite': 'Friends who joined after invite',

// Empty State Messages
'friends.empty.allUsingApp': 'Congratulations! All your Steam friends already know Courier\'s Knowledge.',
'friends.empty.suggestInvite': 'How about inviting some friends to use Courier\'s Knowledge?',
'friends.empty.viewToInvite': 'View friends to invite',
'friends.empty.noResultsToInvite': 'We couldn\'t find friends to invite with the name',
'friends.empty.noResultsUsingApp': 'We couldn\'t find friends using the app with the name',

// Steam Integration Section
'friends.steam.integrationTitle': 'Steam Integration',
'friends.steam.autoChat': 'Automatic Chat',
'friends.steam.readyMessage': 'Ready Message',
'friends.steam.superFast': 'Super Fast',
'friends.steam.autoChatDesc': 'Opens Steam and goes directly to chat with your friend',
'friends.steam.readyMessageDesc': 'The invite message is automatically copied',
'friends.steam.superFastDesc': 'Just press Enter to send the invite',

// Progress Text
'friends.progress.of': 'of',
'friends.date.today': 'Today',
'friends.date.yesterday': 'Yesterday',
'friends.date.daysAgo': 'days ago',
'friends.button.generating': 'Generating...',
'friends.button.openingSteam': 'Opening Steam...',
'friends.button.copied': 'Copied!',
'friends.button.inviteAndSteam': 'Invite + Steam',
'friends.button.reinviteAndSteam': 'Re-invite + Steam',
'friends.status.online': 'Online',
'friends.status.offline': 'Offline',
'friends.empty.noResultsGeneral': 'We couldn\'t find friends with the name',
'friends.empty.goToInviteTab': 'Go to the "To Invite" tab and start inviting your friends!',
'friends.empty.noResultsInvited': 'We couldn\'t find invited friends with the name',
'friends.tooltip.generateNewInvite': 'Generate new invite and open Steam',
'friends.tooltip.inviteAndOpenSteam': 'Invite and open Steam automatically',
'friends.tooltip.inviteSent': 'Invite sent',
'friends.tooltip.resendInvite': 'Send invite again + Steam',


// Profile Page
'profile.header.avatarAlt': 'User avatar',
'profile.header.memberSince': 'Member since:',

// Account Status
'profile.status.premium': 'Premium',
'profile.status.free': 'Free',

// General Stats
'profile.stats.evaluationsMade': 'Evaluations Made',
'profile.stats.averageRating': 'Average Rating Made',
'profile.stats.selfEvaluation': 'Self Evaluation',

// Premium Features
'profile.premium.evaluationsReceived': 'Evaluations Received',
'profile.premium.averageReceivedRating': 'Average Rating Received',
'profile.premium.tiltWinRate': 'Win Rate with Toxic Allies',
'profile.premium.badge': 'Premium',

// Upgrade Prompts
'profile.upgrade.button': 'Subscribe to Premium',
'profile.upgrade.tiltWinRateTitle': 'Win Rate with "Toxic" Allies',

// Match Stats
'profile.matches.mostUsedTags': 'Most Used Tags',
'profile.matches.last20Matches': 'Last 20 Matches',
'profile.matches.playersEvaluated': 'Players Evaluated',
'profile.matches.wins': 'Wins',
'profile.matches.averageMatchTime': 'Average Match Time',
'profile.matches.averageKda': 'Average KDA',
'profile.matches.mostPlayedHero': 'Most Played Hero',
'profile.matches.mostFacedHero': 'Most Faced Hero',

// Loading and Error States
'profile.loading.text': 'Loading profile...',
'profile.error.loadStats': 'Could not load profile statistics.',

// Data Placeholders
'profile.data.noData': '-',
// Layout Component
'layout.branding.logoAlt': 'Courier\'s Knowledge',
'layout.branding.tagline': 'Smart Notes',

// Navigation Menu
'layout.nav.evaluations': 'Evaluations',
'layout.nav.live': 'Live',
'layout.nav.matches': 'Matches',
'layout.nav.friends': 'Friends',
'layout.nav.premium': 'Premium',
'layout.nav.settings': 'Settings',

// User Profile Section
'layout.user.avatarAlt': 'Avatar',
'layout.user.statusFree': 'Free',
'layout.user.updatesCounter': 'Updates: {{current}} / {{total}}',
'layout.user.updateTooltip': 'Each update queries external data sources to fetch your most recent history. To ensure service stability for everyone, the free plan has a daily limit. Premium subscribers support the project and enjoy a much higher limit!',

// Actions
'layout.actions.logout': 'Logout',

'matches.title': 'Recent Matches',
'matches.header.backButton': '← Back to Matches',
'matches.header.victory': 'Victory',
'matches.header.defeat': 'Defeat',

// Match Details
'matches.details.advancedAnalysis': 'Advanced Match Analysis',
'matches.details.stratzDescription': 'Click here to view detailed statistics, economy graphs, timeline and much more on Stratz',
'matches.details.poweredBy': 'Powered by Stratz',
'matches.details.matchId': 'Match ID: {{matchId}}',

// Loading States
'matches.loading.title': 'Loading your matches...',
'matches.loading.subtitle': 'Fetching your recent match history',

// Empty States
'matches.empty.title': 'No matches found',
'matches.empty.subtitle': 'Your matches will appear here when you start playing',
'matches.empty.action': 'Setup GSI',

// Table Headers
'matches.table.yourHero': 'Your Hero',
'matches.table.result': 'Result',
'matches.table.heroes': 'Match Heroes',
'matches.table.duration': 'Duration & Date',

// Match Results
'matches.result.victory': 'Victory',
'matches.result.defeat': 'Defeat',
'matches.result.vs': ' vs ',
'matches.result.minutes': ' min',

'matches.teams.radiant': 'Radiant',
'matches.teams.dire': 'Dire',
'matches.teams.radiantFull': 'Radiant Team',
'matches.teams.direFull': 'Dire Team',

// Player Info
'matches.player.anonymous': 'Anonymous',
'matches.player.gold': 'Gold',

// Evaluation
'matches.evaluation.evaluate': 'Evaluate',
'matches.evaluation.evaluated': 'Evaluated',

// Error Messages
'matches.errors.loadDetails': 'Could not load match details.',
'matches.errors.limitReached': 'You have reached the evaluation limit. Consider upgrading to Premium to evaluate more players.',
'matches.errors.anonymousPlayer': 'Cannot evaluate anonymous players.',
'matches.errors.alreadyEvaluated': 'You have already evaluated this player in this match.',
'matches.errors.saveEvaluation': 'Error saving evaluation.',

// Success Messages
'matches.success.evaluationSaved': 'Evaluation saved successfully!',

 // Layout - Immortal Navigation
  'layout.nav.immortalLive': 'Live Analysis',
  'layout.nav.immortalMatches': 'Import Matches',

  // Layout - Immortal Section
  'layout.immortal.whyDifferent': 'Why is it different?',
  'layout.immortal.valveRestriction': 'Valve restricts data for 8.5k+ MMR players to protect professional strategies.',
  'layout.immortal.exclusiveFeatures': 'You have access to exclusive import and advanced analysis features.',

  // Layout - User Status
  'layout.user.status.immortal': 'Immortal',
  'layout.user.immortalPlayer': 'Immortal Player',

  // Tooltips específicos
  'layout.tooltips.immortalLive': 'Real-time analysis for elite players',
  'layout.tooltips.immortalMatches': 'Import matches via AI-powered screenshots',
  'layout.tooltips.immortalRestriction': 'Automatic history unavailable due to Valve restrictions for 8.5k+ MMR'


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
        // Adicionar no final da seção 'pt':

// Additional UI Elements
'friends.ui.refreshTooltip': 'Atualizar lista de amigos',
'friends.ui.profileButton': 'Perfil',
'friends.ui.chatButton': 'Chat',
'friends.ui.opening': 'Abrindo...',
'friends.ui.generating': 'Gerando...',
'friends.ui.reinviteButton': 'Reconvidar + Steam',
'friends.ui.profileTooltip': 'Abrir perfil Steam',
'friends.ui.chatTooltip': 'Abrir chat na Steam',
'friends.ui.chatDirectTooltip': 'Abrir chat direto na Steam',
'friends.ui.appBadgeTooltip': 'Usa o Courier\'s Knowledge',

// Date Labels
'friends.date.joinedOn': 'Entrou em',
'friends.date.friends': 'amigos',

// Statistics Page
'friends.statistics.title': 'Suas estatísticas de amigos',
'friends.statistics.joinedAfterInvite': 'Amigos que entraram após convite',

// Empty State Messages
'friends.empty.allUsingApp': 'Parabéns! Todos os seus amigos da Steam já conhecem o Courier\'s Knowledge.',
'friends.empty.suggestInvite': 'Que tal convidar alguns amigos para usar o Courier\'s Knowledge?',
'friends.empty.viewToInvite': 'Ver amigos para convidar',
'friends.empty.noResultsToInvite': 'Não encontramos amigos para convidar com o nome',
'friends.empty.noResultsUsingApp': 'Não encontramos amigos usando o app com o nome',

// Steam Integration Section
'friends.steam.integrationTitle': 'Integração Steam',
'friends.steam.autoChat': 'Chat Automático',
'friends.steam.readyMessage': 'Mensagem Pronta',
'friends.steam.superFast': 'Super Rápido',
'friends.steam.autoChatDesc': 'Abre o Steam e vai direto para o chat com seu amigo',
'friends.steam.readyMessageDesc': 'A mensagem de convite é copiada automaticamente',
'friends.steam.superFastDesc': 'Só apertar Enter para enviar o convite',

// Progress Text
'friends.progress.of': 'de',

'friends.date.today': 'Hoje',
'friends.date.yesterday': 'Ontem',
'friends.date.daysAgo': 'dias atrás',
'friends.button.generating': 'Gerando...',
'friends.button.openingSteam': 'Abrindo Steam...',
'friends.button.copied': 'Copiado!',
'friends.button.inviteAndSteam': 'Convidar + Steam',
'friends.button.reinviteAndSteam': 'Reconvidar + Steam',
'friends.status.online': 'Online',
'friends.status.offline': 'Offline',
'friends.empty.noResultsGeneral': 'Não encontramos amigos com o nome',
'friends.empty.goToInviteTab': 'Vá para a aba "Para Convidar" e comece a chamar seus amigos!',
'friends.empty.noResultsInvited': 'Não encontramos amigos convidados com o nome',
'friends.tooltip.generateNewInvite': 'Gerar novo convite e abrir Steam',
'friends.tooltip.inviteAndOpenSteam': 'Convidar e abrir Steam automaticamente',
'friends.tooltip.inviteSent': 'Convite enviado',
'friends.tooltip.resendInvite': 'Enviar convite novamente + Steam',
// Profile Page
'profile.header.avatarAlt': 'Avatar do usuário',
'profile.header.memberSince': 'Membro desde:',

// Account Status
'profile.status.premium': 'Premium',
'profile.status.free': 'Gratuito',

// General Stats
'profile.stats.evaluationsMade': 'Avaliações Feitas',
'profile.stats.averageRating': 'Média das Avaliações Feitas',
'profile.stats.selfEvaluation': 'Autoavaliação',

// Premium Features
'profile.premium.evaluationsReceived': 'Avaliações Recebidas',
'profile.premium.averageReceivedRating': 'Média de Avaliações Recebidas',
'profile.premium.tiltWinRate': 'Taxa de Vitória com Aliados Tóxicos',
'profile.premium.badge': 'Premium',

// Upgrade Prompts
'profile.upgrade.button': 'Assine o Premium',
'profile.upgrade.tiltWinRateTitle': 'Taxa de Vitória com "Aliados" Tóxicos',

// Match Stats
'profile.matches.mostUsedTags': 'Tags Mais Utilizadas',
'profile.matches.last20Matches': 'Últimas 20 Partidas',
'profile.matches.playersEvaluated': 'Jogadores Avaliados',
'profile.matches.wins': 'Vitórias',
'profile.matches.averageMatchTime': 'Tempo Médio de Partida',
'profile.matches.averageKda': 'KDA Médio',
'profile.matches.mostPlayedHero': 'Herói Mais Jogado',
'profile.matches.mostFacedHero': 'Herói Mais Enfrentado',

// Loading and Error States
'profile.loading.text': 'Carregando perfil...',
'profile.error.loadStats': 'Não foi possível carregar as estatísticas do perfil.',

// Data Placeholders
'profile.data.noData': '-',
// Layout Component
'layout.branding.logoAlt': 'Courier\'s Knowledge',
'layout.branding.tagline': 'Smart Notes',

// Navigation Menu
'layout.nav.evaluations': 'Avaliações',
'layout.nav.live': 'Ao Vivo',
'layout.nav.matches': 'Partidas',
'layout.nav.friends': 'Amigos',
'layout.nav.premium': 'Premium',
'layout.nav.settings': 'Configurações',

// User Profile Section
'layout.user.avatarAlt': 'Avatar',
'layout.user.statusFree': 'Gratuito',
'layout.user.updatesCounter': 'Atualizações: {{current}} / {{total}}',
'layout.user.updateTooltip': 'Cada atualização consulta dados de fontes externas para buscar seu histórico mais recente. Para garantir a estabilidade do serviço para todos, o plano gratuito possui um limite diário. Assinantes Premium apoiam o projeto e desfrutam de um limite muito maior!',

// Actions
'layout.actions.logout': 'Sair',

'matches.title': 'Partidas Recentes',
'matches.header.backButton': '← Voltar para Partidas',
'matches.header.victory': 'Vitória',
'matches.header.defeat': 'Derrota',

// Match Details
'matches.details.advancedAnalysis': 'Análise Avançada da Partida',
'matches.details.stratzDescription': 'Clique aqui para ver estatísticas detalhadas, gráficos de economia, timeline e muito mais no Stratz',
'matches.details.poweredBy': 'Powered by Stratz',
'matches.details.matchId': 'Match ID: {{matchId}}',

// Loading States
'matches.loading.title': 'Carregando suas partidas...',
'matches.loading.subtitle': 'Buscando seu histórico de partidas recentes',

// Empty States
'matches.empty.title': 'Nenhuma partida encontrada',
'matches.empty.subtitle': 'Suas partidas aparecerão aqui quando você começar a jogar',
'matches.empty.action': 'Configurar GSI',

// Table Headers
'matches.table.yourHero': 'Seu Herói',
'matches.table.result': 'Resultado',
'matches.table.heroes': 'Heróis na Partida',
'matches.table.duration': 'Duração & Data',

// Match Results
'matches.result.victory': 'Vitória',
'matches.result.defeat': 'Derrota',
'matches.result.vs': ' vs ',
'matches.result.minutes': ' min',

// Teams
'matches.teams.radiant': 'Radiant',
'matches.teams.dire': 'Dire',


'matches.teams.radiantFull': 'Time dos Iluminados',
'matches.teams.direFull': 'Time dos Temidos',

// Player Info
'matches.player.anonymous': 'Anônimo',
'matches.player.gold': 'Gold',

// Loading Details
'matches.loading.details': 'Carregando detalhes...',

// Evaluation
'matches.evaluation.evaluate': 'Avaliar',
'matches.evaluation.evaluated': 'Avaliado',

// Error Messages
'matches.errors.loadDetails': 'Não foi possível carregar os detalhes desta partida.',
'matches.errors.limitReached': 'Você atingiu o limite de avaliações. Considere assinar o Premium para avaliar mais jogadores.',
'matches.errors.anonymousPlayer': 'Não é possível avaliar jogadores anônimos.',
'matches.errors.alreadyEvaluated': 'Você já avaliou este jogador nesta partida.',
'matches.errors.saveEvaluation': 'Erro ao salvar avaliação.',

// Success Messages
'matches.success.evaluationSaved': 'Avaliação salva com sucesso!',

// === DASHBOARD SECTION ===
'dashboard.title': 'Minhas Avaliações',

// Buttons
'dashboard.buttons.import': 'Importar',
'dashboard.buttons.export': 'Exportar',
'dashboard.buttons.select': 'Selecionar',
'dashboard.buttons.exitSelection': 'Sair da Seleção',
'dashboard.buttons.newEvaluation': 'Nova Avaliação',
'dashboard.buttons.updating': 'Atualizando...',
'dashboard.buttons.updateNames': 'Atualizar Nomes',
'dashboard.buttons.limit': 'Limite',

// Search
'dashboard.search.placeholder': 'Buscar Jogador',
'dashboard.search.results': '{{count}} resultado(s)',
'dashboard.search.resultsText': 'resultado(s)',
'dashboard.search.noResults': 'Nenhum jogador encontrado',
'dashboard.search.clear': 'Limpar busca',

// Table Headers
'dashboard.table.player': 'Jogador',
'dashboard.table.hero': 'Herói & Função',
'dashboard.table.rating': 'Avaliação',
'dashboard.table.notes': 'Anotações',
'dashboard.table.tags': 'Tags',

// Player Info
'dashboard.player.unknown': 'Jogador Desconhecido',
'dashboard.player.id': 'ID: {{steamId}}',
'dashboard.player.match': 'Partida: {{matchId}}',
'dashboard.player.anonymous': 'Anônimo',

// Hero & Notes
'dashboard.hero.notInformed': 'Herói não informado',
'dashboard.notes.noNotes': 'Sem anotações',
'dashboard.notes.label': 'Nota:',

// Actions Menu
'dashboard.actions.edit': 'Editar',
'dashboard.actions.share': 'Compartilhar',
'dashboard.actions.delete': 'Deletar',

// Status
'dashboard.status.premium': 'Premium',
'dashboard.status.free': 'Grátis',

// Tooltips
'dashboard.tooltips.import': 'Importar avaliações',
'dashboard.tooltips.export': 'Exportar avaliações',
'dashboard.tooltips.selection': 'Ativar/desativar modo de seleção',
'dashboard.tooltips.newEvaluation': 'Criar nova avaliação',
'dashboard.tooltips.newEvaluationLimit': 'Limite de avaliações atingido. Faça upgrade para Premium!',
'dashboard.tooltips.updateNames': 'Atualizar nomes dos jogadores',

// Import/Export Modal Headers
'dashboard.import.title': 'Importar Avaliações',
'dashboard.export.title': 'Exportar Avaliações',

// Import Tabs
'dashboard.import.tabs.paste': 'Colar',
'dashboard.import.tabs.file': 'Arquivo',
'dashboard.import.tabs.code': 'Código',

// Import Content
'dashboard.import.paste.description': 'Cole aqui uma avaliação compartilhada:',
'dashboard.import.paste.subtitle': 'Aceita tanto texto amigável (WhatsApp/Discord) quanto dados JSON exportados!',
'dashboard.import.paste.placeholder': 'Cole aqui uma avaliação compartilhada...',

'dashboard.import.file.description': 'Selecione um arquivo JSON de avaliações exportadas:',
'dashboard.import.file.button': 'Escolher Arquivo',
'dashboard.import.file.selected': 'Arquivo selecionado:',
'dashboard.import.file.remove': 'Remover arquivo',

'dashboard.import.code.description': 'Digite o código de compartilhamento:',
'dashboard.import.code.placeholder': 'Digite o código de compartilhamento (ex: ABC12DE4)',
'dashboard.import.code.help': 'O código de compartilhamento tem 8 caracteres e é fornecido quando alguém exporta avaliações.',

// Import Preview
'dashboard.import.preview.title': 'Prévia da Importação:',
'dashboard.import.preview.total': 'Total de avaliações:',
'dashboard.import.preview.exportedBy': 'Exportado por:',
'dashboard.import.preview.exportedAt': 'Data da exportação:',
'dashboard.import.preview.version': 'Versão:',
'dashboard.import.preview.type': 'Tipo:',
'dashboard.import.preview.source': 'Fonte:',
'dashboard.import.preview.player': 'Jogador:',
'dashboard.import.preview.rating': 'Nota:',

// Import Mode
'dashboard.import.mode.title': 'Modo de Importação:',
'dashboard.import.mode.add.title': 'Adicionar (Recomendado)',
'dashboard.import.mode.add.description': 'Adiciona apenas avaliações novas, ignorando duplicatas',
'dashboard.import.mode.replace.title': 'Substituir Tudo',
'dashboard.import.mode.replace.description': 'Remove todas as suas avaliações existentes e importa as novas',

// Export Options
'dashboard.export.description': 'Escolha como exportar suas avaliações:',
'dashboard.export.all': 'Todas as avaliações',
'dashboard.export.selected': 'Apenas selecionadas',
'dashboard.export.evaluationsText': 'avaliações',
'dashboard.export.success.evaluationsExported': 'avaliações exportadas',

// Export Results
'dashboard.export.success.title': 'Exportação Concluída!',
'dashboard.export.success.code': 'Código de Compartilhamento:',
'dashboard.export.success.copyCode': 'Copiar código',
'dashboard.export.success.instructions': 'Como compartilhar:',
'dashboard.export.success.step1': 'Copie o código acima',
'dashboard.export.success.step2': 'Envie para outros jogadores via WhatsApp/Discord',
'dashboard.export.success.step3': 'Eles podem usar esse código na opção "Importar → Código"',
'dashboard.export.success.validUntil': 'Válido até:',
'dashboard.export.success.jsonFile': 'Arquivo JSON:',
'dashboard.export.success.downloaded': 'Baixado automaticamente para backup',

// Modal Actions
'dashboard.modal.import': 'Importar',
'dashboard.modal.export': 'Exportar',
'dashboard.modal.cancel': 'Cancelar',
'dashboard.modal.close': 'Fechar',

// Success Messages
'dashboard.success.importCompleted': 'Importação concluída! {{imported}} avaliação(ões) importada(s)',
'dashboard.success.importSkipped': ', {{skipped}} ignorada(s) (duplicatas)',
'dashboard.success.importErrors': '. {{errors}} erro(s) encontrado(s)',
'dashboard.success.evaluationShared': 'Avaliação compartilhada! Texto copiado para área de transferência.',
'dashboard.success.codeCopied': 'Código copiado para área de transferência!',
'dashboard.success.evaluationDeleted': 'Avaliação deletada com sucesso!',
'dashboard.success.evaluationUpdated': 'Avaliação atualizada com sucesso!',

// Error Messages
'dashboard.errors.importData': 'Erro ao importar dados.',
'dashboard.errors.importLimit': 'Limite de importações atingido.',
'dashboard.errors.shareEvaluation': 'Não foi possível compartilhar a avaliação.',
'dashboard.errors.copyCode': 'Erro ao copiar código.',
'dashboard.errors.deleteEvaluation': 'Erro ao deletar avaliação.',
'dashboard.errors.loadEvaluations': 'Erro ao carregar avaliações.',
'dashboard.errors.invalidFile': 'Arquivo inválido.',
'dashboard.errors.evaluationLimit': 'Você atingiu o limite de {{limit}} avaliações do plano gratuito.',

// Selection Controls
'dashboard.selection.count': '{{selected}}/{{total}} selecionados',
'dashboard.selection.selectAll': 'Selecionar Todos',
'dashboard.selection.clearSelection': 'Limpar Seleção',
'dashboard.selection.selectedText': 'selecionados',

// Loading
'dashboard.loading.evaluations': 'Carregando suas avaliações...',

// Tags
'dashboard.tags.noTags': 'Sem tags',

// Export Details
'dashboard.export.allCount': '{{count}} avaliações',
'dashboard.export.selectedCount': '{{count}} avaliações',
'dashboard.export.whatWillBeExported': '📋 O que será exportado:',
'dashboard.export.jsonFile': 'Arquivo JSON para backup local',
'dashboard.export.shareCode': 'Código de compartilhamento (válido por 30 dias)',
'dashboard.export.completeData': 'Dados completos das avaliações',
'dashboard.export.playerInfo': 'Informações dos jogadores e tags',
'dashboard.export.processing': 'Processando exportação...',
'dashboard.export.generating': 'Gerando arquivo e código de compartilhamento',
'dashboard.export.success.completed': '✅ Exportação realizada com sucesso!',
'dashboard.export.success.exportedCount': '{{count}} avaliações exportadas',
'dashboard.export.success.shareCodeTitle': '🔗 Código de Compartilhamento:',
'dashboard.export.success.howToShare': '📱 Como compartilhar:',
'dashboard.export.success.thirtyDays': '(30 dias)',
'dashboard.export.success.jsonFileLabel': '📄 Arquivo JSON:',
'dashboard.export.success.downloadedAutomatically': 'Baixado automaticamente para backup',
'dashboard.export.success.messageExample': '💬 Exemplo de mensagem para compartilhar:',
'dashboard.export.success.exampleText1': 'Pessoal, exportei minhas avaliações do Courier\'s Knowledge!',
'dashboard.export.success.exampleText2': 'Usem o código:',
'dashboard.export.success.exampleText3': 'Vão em Importar → Código e colem esse código.',
'dashboard.export.success.copyCodeButton': 'Copiar Código',
'dashboard.export.exporting': 'Exportando...',

// Import Details
'dashboard.import.preview.friendlyText': 'Texto Amigável',
'dashboard.import.preview.jsonData': 'Dados JSON',
'dashboard.import.preview.date': 'Data:',
'dashboard.import.paste.howToUse': '💡 Como usar:',
'dashboard.import.paste.receive': 'Receba',
'dashboard.import.paste.receiveDesc': 'Alguém compartilha uma avaliação por WhatsApp/Discord',
'dashboard.import.paste.paste': 'Cole',
'dashboard.import.paste.pasteDesc': 'Use Ctrl+V para colar o texto aqui',
'dashboard.import.paste.import': 'Importe',
'dashboard.import.paste.importDesc': 'Clique em "Importar" para adicionar à sua coleção',
'dashboard.import.paste.acceptedFormats': '📝 Formatos aceitos:',
'dashboard.import.paste.friendlyTextFormat': '✅ Texto amigável:',
'dashboard.import.paste.casualSharing': 'Compartilhamento casual via mensagem',
'dashboard.import.paste.jsonFormat': '✅ JSON exportado:',
'dashboard.import.paste.completeExport': 'Arquivo de exportação completo',
'dashboard.import.paste.shortcuts': 'Atalhos:',
'dashboard.import.paste.shortcutsList': 'Ctrl+V para colar • Ctrl+A para selecionar tudo',
'dashboard.import.file.dragHere': 'Arraste um arquivo JSON aqui',
'dashboard.import.file.orClickToSelect': 'ou clique para selecionar',
'dashboard.import.file.maxSize': 'Máximo: 10MB',
'dashboard.import.mode.merge.title': 'Mesclar',
'dashboard.import.mode.merge.description': 'Atualizar existentes, adicionar novas',
'dashboard.import.mode.details.replace.title': 'Substituir Tudo',
'dashboard.import.mode.detais.replace.description': 'Remove todas as suas avaliações existentes e importa as novas',
'dashboard.import.importing': 'Importando...',

// Empty State
'dashboard.empty.title': 'Nenhuma avaliação ainda',
'dashboard.empty.subtitle': 'Comece avaliando jogadores nas suas partidas para construir sua base de conhecimento.',
'dashboard.empty.action': 'Criar Primeira Avaliação',
'layout.nav.immortalLive': 'Análise Ao Vivo',
  'layout.nav.immortalMatches': 'Importar Partidas',

  // Layout - Immortal Section
  'layout.immortal.whyDifferent': 'Por que é diferente?',
  'layout.immortal.valveRestriction': 'A Valve restringe dados de jogadores 8.5k+ MMR para proteger estratégias profissionais.',
  'layout.immortal.exclusiveFeatures': 'Você tem acesso a funcionalidades exclusivas de importação e análise avançada.',

  // Layout - User Status
  'layout.user.status.immortal': 'Imortal',
  'layout.user.immortalPlayer': 'Jogador Imortal',

  // Tooltips específicos
  'layout.tooltips.immortalLive': 'Análise em tempo real para jogadores de elite',
  'layout.tooltips.immortalMatches': 'Importe partidas via screenshots com IA',
  'layout.tooltips.immortalRestriction': 'Histórico automático indisponível devido às restrições da Valve para 8.5k+ MMR',




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
