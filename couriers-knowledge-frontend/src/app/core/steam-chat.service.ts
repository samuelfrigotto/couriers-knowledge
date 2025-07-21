// src/app/core/steam-chat.service.ts
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

export interface SteamChatOptions {
  steamId: string;
  message: string;
  playerName: string;
}

@Injectable({
  providedIn: 'root'
})
export class SteamChatService {

  constructor(private toastr: ToastrService) {}

  /**
   * Abre o chat da Steam com uma mensagem pré-definida
   * ✅ CORRIGIDO: Agora retorna Promise para controlar timing
   */
  async openSteamChat(options: SteamChatOptions): Promise<boolean> {
    const { steamId, message, playerName } = options;

    try {
      // 1. Primeiro, copiar a mensagem
      const copySuccess = await this.copyMessageToClipboard(message, playerName);

      if (!copySuccess) {
        this.showFallbackInstructions(playerName);
        return false;
      }

      // 2. Aguardar um pouco para garantir que a cópia foi concluída
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. Só então tentar abrir o Steam
      const steamUrl = `steam://friends/message/${steamId}`;

      const link = document.createElement('a');
      link.href = steamUrl;
      link.style.display = 'none';
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);

      // 4. Mostrar instruções de sucesso
      this.showSteamChatInstructions(playerName);

      return true;

    } catch (error) {
      console.error('Erro ao abrir Steam Chat:', error);

      // Fallback: tentar copiar novamente e mostrar instruções
      await this.copyMessageToClipboard(message, playerName);
      this.showFallbackInstructions(playerName);
      return false;
    }
  }

  /**
   * Abre o perfil da Steam do jogador
   */
  openSteamProfile(steamId: string, playerName: string): void {
    try {
      const profileUrl = `steam://url/SteamIDPage/${steamId}`;

      const link = document.createElement('a');
      link.href = profileUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.toastr.info(`Abrindo perfil de ${playerName} na Steam`, 'Steam');

    } catch (error) {
      // Fallback: abrir no navegador
      const webUrl = `https://steamcommunity.com/profiles/${steamId}`;
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      this.toastr.info(`Abrindo perfil de ${playerName} no navegador`, 'Steam');
    }
  }

  /**
   * Copia mensagem para área de transferência
   */
  private async copyMessageToClipboard(message: string, playerName: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(message);
      this.toastr.success(
        `Mensagem copiada!`,
        '',
        { timeOut: 2000 }
      );
      return true;
    } catch (error) {
      console.error('Erro ao copiar mensagem:', error);
      this.showManualCopyInstructions(message, playerName);
      return false;
    }
  }

  /**
   * Mostra instruções quando Steam é aberta com sucesso
   */
  private showSteamChatInstructions(playerName: string): void {
    this.toastr.info(
      `Steam abrindo! Mensagem copiada para ${playerName}.`,
      '',
      {
        timeOut: 6000,
        closeButton: true,
        tapToDismiss: false
      }
    );
  }

  /**
   * Mostra instruções quando Steam não pode ser aberta
   */
  private showFallbackInstructions(playerName: string): void {
    this.toastr.warning(
      `Steam não abriu. Abra manualmente e cole a mensagem em ${playerName}.`,
      '',
      {
        timeOut: 8000,
        closeButton: true,
        tapToDismiss: false
      }
    );
  }

  /**
   * Mostra instruções para cópia manual quando clipboard falha
   */
  private showManualCopyInstructions(message: string, playerName: string): void {
    // Criar modal temporário com a mensagem para cópia manual
    const modal = this.createManualCopyModal(message, playerName);
    document.body.appendChild(modal);
  }

  /**
   * Cria modal para cópia manual da mensagem
   */
  private createManualCopyModal(message: string, playerName: string): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #1e1e1e;
      color: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 500px;
      width: 90%;
      border: 1px solid #3a86ff;
    `;

    const title = document.createElement('h3');
    title.textContent = `Mensagem para ${playerName}`;
    title.style.marginBottom = '15px';

    const textarea = document.createElement('textarea');
    textarea.value = message;
    textarea.style.cssText = `
      width: 100%;
      height: 120px;
      background: #2a2a2a;
      color: white;
      border: 1px solid #4a5568;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 15px;
      resize: vertical;
      font-family: inherit;
      box-sizing: border-box;
    `;
    textarea.readOnly = true;

    const instructions = document.createElement('p');
    instructions.textContent = 'Selecione o texto acima (Ctrl+A) e copie (Ctrl+C) para usar no chat da Steam.';
    instructions.style.cssText = `
      margin-bottom: 20px;
      color: #a0aec0;
      font-size: 14px;
    `;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    `;

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Tentar Copiar Novamente';
    copyButton.style.cssText = `
      background: #3a86ff;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    closeButton.style.cssText = `
      background: #4a5568;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
    `;

    // Event listeners
    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(message);
        this.toastr.success('Mensagem copiada!', 'Sucesso');
        document.body.removeChild(overlay);
      } catch (error) {
        textarea.select();
        this.toastr.info('Texto selecionado. Use Ctrl+C para copiar.', 'Selecionado');
      }
    };

    closeButton.onclick = () => {
      document.body.removeChild(overlay);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    };

    // Montar modal
    buttonsDiv.appendChild(copyButton);
    buttonsDiv.appendChild(closeButton);

    modal.appendChild(title);
    modal.appendChild(textarea);
    modal.appendChild(instructions);
    modal.appendChild(buttonsDiv);

    overlay.appendChild(modal);

    // Auto-selecionar texto
    setTimeout(() => textarea.select(), 100);

    return overlay;
  }

  /**
   * Detecta se a Steam está instalada (melhor esforço)
   */
  isSteamAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 2000);

      try {
        const link = document.createElement('a');
        link.href = 'steam://open/main';
        link.style.display = 'none';

        const beforeTime = Date.now();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Se a Steam abrir, a janela pode perder foco
        setTimeout(() => {
          clearTimeout(timeout);
          resolve(true);
        }, 500);

      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  /**
   * Cria mensagem de convite formatada
   */
  createInviteMessage(inviterName: string, friendName: string, inviteLink: string): string {
    return `🎮 Olá ${friendName}!

${inviterName} te convidou para usar o Courier's Knowledge - o app que permite fazer anotações sobre jogadores de Dota 2!

✅ Avalie jogadores nas suas partidas
✅ Veja avaliações de outros usuários
✅ Compartilhe experiências com amigos
✅ Melhore sua experiência no Dota 2

Acesse agora: ${inviteLink}

#Dota2 #CouriersKnowledge`;
  }
}
