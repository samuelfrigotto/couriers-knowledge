// profile.component.ts - COM NAVEGAÇÃO AO PREMIUM

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router'; // ✨ Adicionado para navegação
import { UserService } from '../../../core/user.service';
import { GameDataService } from '../../../core/game-data.service';
import { I18nService } from '../../../core/i18n.service';
import { SecondsToTimePipe } from '../../../pipes/seconds-to-time.pipe';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, SecondsToTimePipe, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private i18nService = inject(I18nService);
  private router = inject(Router); // ✨ Injeção do Router
  public gameDataService = inject(GameDataService);

  public isLoading = true;
  public stats: any = null;

  ngOnInit(): void {
    this.userService.getUserStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;

        // ✨ Debug para verificar campos importantes
        console.log('📊 [Profile] Dados recebidos:', {
          accountStatus: data.accountStatus,
          receivedEvals: data.receivedEvaluationsCount,
          avgReceived: data.averageReceivedRating,
          tiltWinRate: data.tiltAnalysis?.tiltWinRate,
          wins: data.winsLast20,
          totalMatches: data.totalMatches,
          evalPercentage: data.evaluationPercentage
        });
      },
      error: (err) => {
        console.error('❌ [Profile] Erro ao buscar estatísticas:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Retorna o status da conta traduzido
   */
  getAccountStatusTranslated(status: string): string {
    if (status === 'Premium') {
      return this.i18nService.translate('profile.status.premium');
    }
    return this.i18nService.translate('profile.status.free');
  }

  /**
   * ✨ Navega para a página Premium
   */
  goToPremium(): void {
    this.router.navigate(['/app/premium']);
  }
}
