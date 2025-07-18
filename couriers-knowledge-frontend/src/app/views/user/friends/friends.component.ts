// frontend/src/app/views/user/friends/friends.component.ts
// VERSÃO CORRIGIDA - Todos os erros de tipagem resolvidos

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { FriendsService, FriendStatus, FriendsStatusResponse } from '../../../core/friends.service';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit, OnDestroy {
  // Injeção de dependências
  private friendsService = inject(FriendsService);
  private toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();

  // Estado do componente
  friendsData: FriendsStatusResponse | null = null;
  isLoading = false;
  activeTab: 'using-app' | 'not-using-app' | 'invited' | 'statistics' = 'not-using-app';

  // Estados para interações
  invitingFriends = new Set<string>(); // Steam IDs sendo convidados
  copiedInvites = new Set<string>(); // Steam IDs com link copiado recentemente

  ngOnInit(): void {
    console.log('🚀 Iniciando componente Friends');
    this.loadFriendsData();

    // Observa mudanças no estado de loading
    this.friendsService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Observa mudanças nos dados de amigos
    this.friendsService.friendsStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.friendsData = data;
        console.log('📊 Dados de amigos atualizados:', data);
      });
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
          this.friendsData = data;
          this.toastr.success(`${data.total_friends} amigos carregados da Steam!`, 'Sucesso');
          console.log('✅ Dados carregados:', data);
        },
        error: (error) => {
          console.error('❌ Erro ao carregar amigos:', error);
          this.toastr.error('Não foi possível carregar seus amigos. Verifique se seu perfil Steam não está privado.', 'Erro');
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
   * Convida um amigo específico
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
          this.toastr.success(`Convite gerado para ${friend.steam_username}!`, 'Convite Enviado');
          console.log('✅ Convite gerado:', response);

          // Copia automaticamente a mensagem de convite
          this.copyInviteMessage(response.invite_data.invite_message, friend.steam_id);

          // Atualiza dados locais (o service já faz refresh automático)
          if (this.friendsData) {
            const friendIndex = this.friendsData.notUsingApp.findIndex(f => f.steam_id === friend.steam_id);
            if (friendIndex !== -1) {
              this.friendsData.notUsingApp[friendIndex].already_invited = true;
              this.friendsData.notUsingApp[friendIndex].invited_at = new Date().toISOString();
            }
          }
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
      this.toastr.info('Mensagem copiada! Cole no chat da Steam com seu amigo.', 'Copiado');

      // Remove indicador de "copiado" após 3 segundos
      setTimeout(() => {
        this.copiedInvites.delete(friendSteamId);
      }, 3000);
    } else {
      this.toastr.warning('Não foi possível copiar automaticamente. Copie manualmente.', 'Aviso');
    }
  }

  /**
   * Abre perfil Steam do amigo
   */
  openSteamProfile(friend: FriendStatus): void {
    const url = friend.profile_url || `https://steamcommunity.com/profiles/${friend.steam_id}`;
    this.friendsService.openExternalUrl(url);
    this.toastr.info(`Abrindo perfil de ${friend.steam_username}`, 'Steam');
  }

  /**
   * Muda aba ativa - CORRIGIDO: incluído 'invited'
   */
  setActiveTab(tab: 'using-app' | 'not-using-app' | 'invited' | 'statistics'): void {
    this.activeTab = tab;
    console.log('📑 Aba ativa:', tab);
  }

  /**
   * Verifica se um amigo está sendo convidado
   */
  isInviting(steamId: string): boolean {
    return this.invitingFriends.has(steamId);
  }

  /**
   * Verifica se um convite foi copiado recentemente
   */
  wasRecentlyCopied(steamId: string): boolean {
    return this.copiedInvites.has(steamId);
  }

  /**
   * Retorna texto do botão de convite baseado no estado
   */
  getInviteButtonText(friend: FriendStatus): string {
    if (this.isInviting(friend.steam_id)) {
      return 'Gerando...';
    }

    if (this.wasRecentlyCopied(friend.steam_id)) {
      return 'Copiado!';
    }

    if (friend.already_invited) {
      return 'Convidar novamente';
    }

    return 'Convidar';
  }

  /**
   * Retorna classe CSS do botão de convite
   */
  getInviteButtonClass(friend: FriendStatus): string {
    if (this.isInviting(friend.steam_id)) {
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
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoje';
    } else if (diffDays === 2) {
      return 'Ontem';
    } else if (diffDays <= 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  }

  /**
   * Retorna classe do status online
   */
  getOnlineStatusClass(isOnline: boolean): string {
    return isOnline ? 'online' : 'offline';
  }

  /**
   * Retorna texto do status online
   */
  getOnlineStatusText(isOnline: boolean): string {
    return isOnline ? 'Online' : 'Offline';
  }

  /**
   * TrackBy function para performance do *ngFor
   */
  trackByFriend(index: number, friend: FriendStatus): string {
    return friend.steam_id;
  }

  /**
   * Conta quantos amigos foram convidados (para usar no template)
   */
  getInvitedFriendsCount(): number {
    if (!this.friendsData) return 0;
    return this.friendsData.notUsingApp.filter(f => f.already_invited).length;
  }

  /**
   * Retorna apenas os amigos que foram convidados - ADICIONADO
   */
  getInvitedFriends(): FriendStatus[] {
    if (!this.friendsData) return [];
    return this.friendsData.notUsingApp.filter(f => f.already_invited);
  }
}
