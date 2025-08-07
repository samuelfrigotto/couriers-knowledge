// src/app/views/user/pro/pro.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { I18nService } from '../../../core/i18n.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

interface ProFeature {
  title: string;
  description: string;
  status: 'available' | 'beta' | 'planned' | 'manual';
  technicalDetails: string;
}

interface ProcessStep {
  number: number;
  title: string;
  description: string;
  details: string[];
  timeframe: string;
}

@Component({
  selector: 'app-pro',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './pro.component.html',
  styleUrls: ['./pro.component.css']
})
export class ProComponent implements OnInit {
  private userService = inject(UserService);
  private i18nService = inject(I18nService);
  private router = inject(Router);

  // Estado da página
  isLoading = true;
  userProfile: any = null;

  // Formulário de contato
  showContactForm = false;
  contactForm = {
    mmrScreenshot: null as File | null,
    steamProfile: '',
    message: '',
    currentMMR: 0
  };
  isSubmittingRequest = false;

  // Dados informativos
  proFeatures: ProFeature[] = [];
  processSteps: ProcessStep[] = [];

  ngOnInit(): void {
    this.loadUserProfile();
    this.initializeProFeatures();
    this.initializeProcessSteps();
  }

  private loadUserProfile(): void {
    this.userService.getUserStats().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.isLoading = false;
      }
    });
  }

  private initializeProFeatures(): void {
    this.proFeatures = [
      {
        title: 'Cross-Reference com Leaderboard',
        description: 'Sistema que verifica automaticamente jogadores contra as leaderboards atuais para identificar players de alto nível em suas partidas.',
        status: 'available',
        technicalDetails: 'Como grande parte do processo ainda é manual, os próprios jogadores alimentam nossa base de conhecimento. Quanto mais o app se expandir, melhor ficará o cross-reference para todos.'
      },
      {
        title: 'Análise de Partidas Ao Vivo',
        description: 'Ferramenta para análise de partidas em tempo real onde o jogador preenche manualmente as avaliações dos companheiros de equipe.',
        status: 'manual',
        technicalDetails: 'Interface otimizada para jogadores de alto nível onde você pode avaliar seus teammates durante ou após a partida, criando um histórico personalizado.'
      },
      {
        title: 'Reconhecimento Automático de Partidas',
        description: 'Sistema de reconhecimento de screenshots de partidas para preenchimento automático dos dados usando inteligência artificial.',
        status: 'planned',
        technicalDetails: 'Ferramenta que permitirá fazer upload de uma screenshot da partida e automaticamente identificar todos os jogadores e seus heróis para avaliação rápida.'
      }
    ];
  }

  private initializeProcessSteps(): void {
    this.processSteps = [
      {
        number: 1,
        title: 'Verificação de Elegibilidade',
        description: 'Confirmar que você atende os requisitos para acessar as funcionalidades Pro',
        details: [
          'MMR atual superior a 8500 pontos ou posição no leaderboard',
          'Perfil Steam público para verificação',
          'Conta ativa no Courier\'s Knowledge'
        ],
        timeframe: 'Imediato'
      },
      {
        number: 2,
        title: 'Envio da Documentação',
        description: 'Submeter sua solicitação com os documentos necessários',
        details: [
          'Screenshot claro da tela de MMR no jogo',
          'Link do seu perfil Steam público',
          'Preenchimento do formulário de solicitação'
        ],
        timeframe: '5-10 minutos'
      },
      {
        number: 3,
        title: 'Análise e Verificação',
        description: 'Nossa equipe faz a verificação manual das informações enviadas',
        details: [
          'Verificação da autenticidade do screenshot',
          'Confirmação do perfil Steam',
          'Validação do MMR quando possível'
        ],
        timeframe: '1-2 dias úteis'
      },
      {
        number: 4,
        title: 'Ativação do Período de Teste',
        description: 'Liberação das funcionalidades Pro por 14 dias gratuitos',
        details: [
          'Notificação por email da liberação',
          'Acesso imediato às funcionalidades Pro',
          'Suporte prioritário durante o teste'
        ],
        timeframe: 'Imediato após aprovação'
      }
    ];
  }

  // Ações do usuário
  openContactForm(): void {
    this.showContactForm = true;
  }

  closeContactForm(): void {
    this.showContactForm = false;
    this.resetContactForm();
  }

  private resetContactForm(): void {
    this.contactForm = {
      mmrScreenshot: null,
      steamProfile: '',
      message: '',
      currentMMR: 0
    };
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.contactForm.mmrScreenshot = file;
    } else {
      alert('Por favor, selecione apenas arquivos de imagem.');
    }
  }

  submitProRequest(): void {
    if (!this.validateContactForm()) {
      return;
    }

    this.isSubmittingRequest = true;

    // Aqui você implementaria a chamada real para o backend
    const formData = new FormData();
    if (this.contactForm.mmrScreenshot) {
      formData.append('screenshot', this.contactForm.mmrScreenshot);
    }
    formData.append('steamProfile', this.contactForm.steamProfile);
    formData.append('message', this.contactForm.message);
    formData.append('currentMMR', this.contactForm.currentMMR.toString());

    // Simulação de envio (substituir por chamada real)
    setTimeout(() => {
      this.isSubmittingRequest = false;
      this.closeContactForm();
      alert('Solicitação enviada com sucesso! Nossa equipe entrará em contato em 1-2 dias úteis.');
    }, 2000);
  }

  private validateContactForm(): boolean {
    if (!this.contactForm.mmrScreenshot) {
      alert('Por favor, envie um screenshot do seu MMR.');
      return false;
    }
    if (!this.contactForm.steamProfile.trim()) {
      alert('Por favor, forneça o link do seu perfil Steam.');
      return false;
    }
    if (this.contactForm.currentMMR < 8500) {
      alert('As funcionalidades Pro são destinadas para jogadores com 8500+ MMR.');
      return false;
    }
    return true;
  }

  // Navegação
  goToPremium(): void {
    this.router.navigate(['/app/get-premium']);
  }

  goToSettings(): void {
    this.router.navigate(['/app/settings']);
  }

  // Helpers para template
  getStatusText(status: string): string {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'beta':
        return 'Em Beta';
      case 'manual':
        return 'Manual';
      case 'planned':
        return 'Planejado';
      default:
        return 'Em desenvolvimento';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'available':
        return 'status-available';
      case 'beta':
        return 'status-beta';
      case 'manual':
        return 'status-manual';
      case 'planned':
        return 'status-planned';
      default:
        return 'status-development';
    }
  }

  getCurrentUserMMR(): string {
    if (this.userProfile?.mmr) {
      return this.userProfile.mmr.toString();
    }
    return 'Não verificado';
  }

  isEligibleUser(): boolean {
    return this.userProfile?.mmr >= 8500 || this.userProfile?.isImmortal;
  }
}
