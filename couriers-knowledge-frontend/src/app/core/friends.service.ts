import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../enviroments/environment';

// Interfaces para tipagem
export interface FriendStatus {
  steam_id: string;
  steam_username: string;
  avatar_url: string;
  profile_url?: string;
  is_online?: boolean;
  already_invited?: boolean;
  invited_at?: string;
  joined_at?: string;
}

export interface FriendsStatusResponse {
  total_friends: number;
  usingApp: FriendStatus[];
  notUsingApp: FriendStatus[];
  statistics: {
    friends_using_app: number;
    friends_not_using_app: number;
    total_invites_sent: number;
    friends_joined_after_invite: number;
  };
}

export interface InviteResponse {
  message: string;
  invite_data: {
    friend_name: string;
    friend_avatar: string;
    invite_link: string;
    invite_message: string;
    steam_profile_url: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Estado reativo para cache dos dados de amigos
  private friendsStatusSubject = new BehaviorSubject<FriendsStatusResponse | null>(null);
  public friendsStatus$ = this.friendsStatusSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  /**
   * Busca o status dos amigos (quem usa e não usa o app)
   */
  getFriendsStatus(): Observable<FriendsStatusResponse> {
    console.log('🔍 Buscando status dos amigos...');
    this.isLoadingSubject.next(true);

    return this.http.get<FriendsStatusResponse>(`${this.apiUrl}/friends/status`)
      .pipe(
        tap({
          next: (response) => {
            console.log('✅ Status dos amigos carregado:', response);
            this.friendsStatusSubject.next(response);
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            console.error('❌ Erro ao carregar amigos:', error);
            this.isLoadingSubject.next(false);
          }
        })
      );
  }

  /**
   * Força o reload dos dados de amigos
   */
  refreshFriendsStatus(): Observable<FriendsStatusResponse> {
    console.log('🔄 Recarregando dados dos amigos...');
    return this.getFriendsStatus();
  }

  /**
   * Convida um amigo específico
   */
  inviteFriend(friendSteamId: string): Observable<InviteResponse> {
    console.log('📩 Enviando convite para:', friendSteamId);

    return this.http.post<InviteResponse>(`${this.apiUrl}/friends/invite`, {
      friend_steam_id: friendSteamId
    }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Convite enviado:', response);
          // Após convite, atualiza os dados automaticamente
          this.refreshFriendsStatus().subscribe();
        },
        error: (error) => {
          console.error('❌ Erro ao enviar convite:', error);
        }
      })
    );
  }

  /**
   * Copia texto para a área de transferência
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ Texto copiado para área de transferência');
      return true;
    } catch (error) {
      console.error('❌ Erro ao copiar:', error);

      // Fallback para navegadores mais antigos
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('✅ Texto copiado (fallback)');
        return true;
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Abre URL externa (perfil Steam, etc.)
   */
  openExternalUrl(url: string): void {
    console.log('🔗 Abrindo URL:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Obtém estatísticas resumidas dos amigos
   */
  getFriendsStatistics(): {
    total: number;
    usingApp: number;
    notUsingApp: number;
    invitesPending: number;
  } | null {
    const currentStatus = this.friendsStatusSubject.value;
    if (!currentStatus) return null;

    return {
      total: currentStatus.total_friends,
      usingApp: currentStatus.statistics.friends_using_app,
      notUsingApp: currentStatus.statistics.friends_not_using_app,
      invitesPending: currentStatus.notUsingApp.filter(f => f.already_invited).length
    };
  }

  /**
   * Limpa o cache de dados
   */
  clearCache(): void {
    console.log('🗑️ Limpando cache dos amigos');
    this.friendsStatusSubject.next(null);
  }

  /**
   * Verifica se tem dados carregados
   */
  hasData(): boolean {
    return this.friendsStatusSubject.value !== null;
  }
}
