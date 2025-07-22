// frontend/src/app/views/user/friends/friends.component.ts
// VERSÃO LIMPA E CORRIGIDA

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, map, Observable, combineLatest } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { FriendsService, FriendStatus, FriendsStatusResponse } from '../../../core/friends.service';
import { SteamChatService } from '../../../core/steam-chat.service';
import { EmptyStateComponent } from '../../../components/empty-state/empty-state.component';


// ✅ NOVO: Interface para o amigo unificado
interface UnifiedFriendStatus extends FriendStatus {
  status: 'using-app' | 'not-using-app';
}


@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit, OnDestroy {
  // Injeção de dependências
  protected friendsService = inject(FriendsService);
  private steamChatService = inject(SteamChatService); // ✅ NOVO SERVIÇO
  private toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();

  // ✅ OBSERVABLES PÚBLICOS PARA O TEMPLATE
  public friendsData$: Observable<FriendsStatusResponse | null>;
  public allFriends$: Observable<UnifiedFriendStatus[]>;
  public invitedFriends$: Observable<FriendStatus[]>;


    // Estado do componente
  activeTab: 'all-friends' | 'not-using-app' | 'invited' | 'using-app' | 'statistics' = 'all-friends';

  // Estados para interações
  invitingFriends = new Set<string>();
  copiedInvites = new Set<string>();
  openingSteamChat = new Set<string>();

  constructor() {
    // Inicializa os Observables
    this.friendsData$ = this.friendsService.friendsStatus$;

    // ✅ Observable para a lista de todos os amigos, combinada e ordenada
    this.allFriends$ = this.friendsData$.pipe(
      map(data => {
        if (!data) return [];
        const allFriends = [
          ...data.usingApp.map(friend => ({ ...friend, status: 'using-app' as const })),
          ...data.notUsingApp.map(friend => ({ ...friend, status: 'not-using-app' as const }))
        ];
        return allFriends.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'using-app' ? -1 : 1;
          return a.steam_username.localeCompare(b.steam_username);
        });
      })
    );

    // ✅ Observable para a lista de amigos convidados
    this.invitedFriends$ = this.friendsData$.pipe(
      map(data => data ? data.notUsingApp.filter(f => f.already_invited) : [])
    );
  }

  ngOnInit(): void {
    console.log('🚀 Iniciando componente Friends');
    // Carrega os dados se eles ainda não existirem no serviço
    if (!this.friendsService.hasData()) {
      this.loadFriendsData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega dados dos amigos
   */
  loadFriendsData(): void {
      console.log('🔍 Carregando dados dos amigos...');
      this.friendsService.getFriendsStatus()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.toastr.success(`${data.total_friends} amigos carregados!`, '', { timeOut: 2000 });
            console.log('✅ Dados carregados:', data);
          },
          error: (error) => {
            console.error('❌ Erro ao carregar amigos:', error);
            this.toastr.error('Erro ao carregar amigos', '', { timeOut: 3000 });
          }
        });
    }

  /**
   * Força atualização dos dados
   */
  refreshFriends(): void {
    console.log('🔄 Atualizando dados...');
    this.loadFriendsData();
  }

  /**
   * ✅ CORRIGIDO: Convida um amigo e abre o Steam Chat automaticamente
   * Agora espera a cópia ser completada antes de abrir o Steam
   */
  async inviteFriendWithSteamChat(friend: FriendStatus): Promise<void> {
    if (this.invitingFriends.has(friend.steam_id)) return;

    console.log('📩💬 Convidando amigo e abrindo Steam Chat:', friend.steam_username);
    this.invitingFriends.add(friend.steam_id);
    this.openingSteamChat.add(friend.steam_id);

    this.friendsService.inviteFriend(friend.steam_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          console.log('✅ Convite gerado:', response);
          const copySuccess = await this.friendsService.copyToClipboard(response.invite_data.invite_message);

          if (copySuccess) {
            setTimeout(() => this.openSteamChatWithMessage(friend, response.invite_data.invite_message), 200);
            this.toastr.success(`Steam abrindo! Mensagem copiada.`, '', { timeOut: 4000 });
          } else {
            this.openSteamChatWithMessage(friend, response.invite_data.invite_message);
            this.toastr.warning('Steam abrindo. Copie a mensagem manualmente.', '', { timeOut: 4000 });
          }
          // O serviço já força um refresh, então a UI irá atualizar reativamente
        },
        error: (error) => {
          console.error('❌ Erro ao convidar:', error);
          const errorMessage = error.error?.message || 'Erro ao gerar convite';
          this.toastr.error(errorMessage, '', { timeOut: 4000 });
        },
        complete: () => {
          this.invitingFriends.delete(friend.steam_id);
          this.openingSteamChat.delete(friend.steam_id);
        }
      });
  }

  /**
   * ✅ NOVO MÉTODO: Abre Steam Chat com mensagem pré-preenchida
   */
  private openSteamChatWithMessage(friend: FriendStatus, inviteMessage: string): void {
      this.steamChatService.openSteamChat({
        steamId: friend.steam_id,
        message: inviteMessage,
        playerName: friend.steam_username
      });
    }
  /**
   * Método original de convite (mantido para compatibilidade)
   */
   inviteFriend(friend: FriendStatus): void {
    if (this.invitingFriends.has(friend.steam_id)) {
      console.log('⚠️ Já enviando convite para:', friend.steam_username);
      return;
    }

    console.log('📩 Convidando amigo:', friend.steam_username);
    this.invitingFriends.add(friend.steam_id);

    this.friendsService.inviteFriend(friend.steam_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toastr.success(`Convite gerado!`, '', { timeOut: 3000 });
          console.log('✅ Convite gerado:', response);

          // Copia automaticamente a mensagem de convite
          this.copyInviteMessage(response.invite_data.invite_message, friend.steam_id);

          // REMOVIDO: Bloco de atualização de dados locais.
          // O service já chama o refresh, e a UI vai atualizar reativamente.
        },
        error: (error) => {
          console.error('❌ Erro ao convidar:', error);
          const errorMessage = error.error?.message || 'Não foi possível gerar o convite';
          this.toastr.error(errorMessage, 'Erro no Convite');
        },
        complete: () => {
          this.invitingFriends.delete(friend.steam_id);
        }
      });
  }

  /**
   * Copia mensagem de convite para área de transferência
   */
  async copyInviteMessage(message: string, friendSteamId: string): Promise<void> {
    const success = await this.friendsService.copyToClipboard(message);

    if (success) {
      this.copiedInvites.add(friendSteamId);
      this.toastr.info('Mensagem copiada!', '', { timeOut: 2000 });

      // Remove indicador de "copiado" após 3 segundos
      setTimeout(() => {
        this.copiedInvites.delete(friendSteamId);
      }, 3000);
    } else {
      this.toastr.warning('Copie manualmente', '', { timeOut: 3000 });
    }
  }
  /**
   * ✅ ATUALIZADO: Abre perfil Steam do amigo usando novo serviço
   */
  openSteamProfile(friend: FriendStatus): void {
    this.steamChatService.openSteamProfile(friend.steam_id, friend.steam_username);
  }

  /**
   * ✅ NOVO MÉTODO: Abre Steam Chat sem gerar convite
   */
  openSteamChatDirect(friend: FriendStatus): void {
    this.openingSteamChat.add(friend.steam_id);

    // Mensagem simples para chat direto
    const directMessage = `Olá ${friend.steam_username}! 👋

Que tal experimentar o Courier's Knowledge? É um app incrível para anotar e avaliar jogadores de Dota 2!

✅ Organize suas experiências
✅ Melhore suas partidas
✅ Compartilhe com amigos

Dá uma olhada: https://couriers-knowledge.com

🎮 #Dota2`;

    this.steamChatService.openSteamChat({
      steamId: friend.steam_id,
      message: directMessage,
      playerName: friend.steam_username
    });

    setTimeout(() => {
      this.openingSteamChat.delete(friend.steam_id);
    }, 2000);

    this.toastr.info(`Chat abrindo...`, '', { timeOut: 2000 });
  }

  /**
   * Muda aba ativa
   */
  // Linha 140 (aproximadamente)
  setActiveTab(tab: 'all-friends' | 'not-using-app' | 'invited' | 'using-app' | 'statistics'): void {
    this.activeTab = tab;
  }
  /**
   * Verifica se um amigo está sendo convidado
   */
  isInviting(steamId: string): boolean {
    return this.invitingFriends.has(steamId);
  }

  /**
   * ✅ NOVO: Verifica se Steam Chat está sendo aberto
   */
  isOpeningSteamChat(steamId: string): boolean {
    return this.openingSteamChat.has(steamId);
  }

  /**
   * Verifica se um convite foi copiado recentemente
   */
  wasRecentlyCopied(steamId: string): boolean {
    return this.copiedInvites.has(steamId);
  }

  /**
   * ✅ ATUALIZADO: Retorna texto do botão baseado no estado
   */
  getInviteButtonText(friend: FriendStatus): string {
    if (this.isInviting(friend.steam_id)) {
      return 'Gerando...';
    }

    if (this.isOpeningSteamChat(friend.steam_id)) {
      return 'Abrindo Steam...';
    }

    if (this.wasRecentlyCopied(friend.steam_id)) {
      return 'Copiado!';
    }

    if (friend.already_invited) {
      return 'Reconvidar + Steam';
    }

    return 'Convidar + Steam';
  }

  /**
   * ✅ ATUALIZADO: Retorna classe CSS do botão
   */
  getInviteButtonClass(friend: FriendStatus): string {
    if (this.isInviting(friend.steam_id) || this.isOpeningSteamChat(friend.steam_id)) {
      return 'btn-loading';
    }

    if (this.wasRecentlyCopied(friend.steam_id)) {
      return 'btn-success';
    }

    if (friend.already_invited) {
      return 'btn-secondary';
    }

    return 'btn-primary';
  }

  /**
   * Formata data para exibição
   */
  formatDate(dateString?: string): string {
    if (!dateString) {
      return ''; // Retorna uma string vazia se a data for nula
    }
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) { // Lógica ajustada para incluir "Hoje" corretamente
      return 'Hoje';
    } else if (diffDays === 2) {
      return 'Ontem';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  }

  /**
   * Retorna classe do status online
   */
  getOnlineStatusClass = (isOnline?: boolean) => isOnline ? 'online' : 'offline';
  getOnlineStatusText = (isOnline?: boolean) => isOnline ? 'Online' : 'Offline';
  /**
   * TrackBy function para performance do *ngFor
   */
  trackByFriend(index: number, friend: FriendStatus): string {
    return friend.steam_id;
  }

}
