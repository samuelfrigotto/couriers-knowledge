
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { MatchDataService } from '../../../core/match-data.service';
import { UserService } from '../../../core/user.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private matchDataService = inject(MatchDataService);
  private userService = inject(UserService); // 2. INJETAMOS O USER SERVICE

  // 3. CRIAMOS UMA PROPRIEDADE PARA GUARDAR OS DADOS DO PERFIL
  public userProfile: any = null;

  // 4. CRIAMOS A PROPRIEDADE PARA A MENSAGEM DO ÍCONE DE INFORMAÇÃO
  readonly updateLimitTooltip = 'Cada atualização consulta dados de fontes externas para buscar seu histórico mais recente. Para garantir a estabilidade do serviço para todos, o plano gratuito possui um limite diário. Assinantes Premium apoiam o projeto e desfrutam de um limite muito maior!';

  ngOnInit(): void {
    // 5. BUSCAMOS OS DADOS DO PERFIL QUANDO O LAYOUT É INICIADO
    this.userService.getUserStats().subscribe(statsData => {
      this.userProfile = statsData;
    });

    // A chamada para buscar os dados das partidas continua aqui
    this.matchDataService.refreshMatchData();
  }

  logout(): void {
    this.authService.logout();
  }
}
