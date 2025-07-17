import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { UserService } from '../../../core/user.service';
import { GameDataService } from '../../../core/game-data.service';
import { SecondsToTimePipe } from '../../../pipes/seconds-to-time.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, SecondsToTimePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  public gameDataService = inject(GameDataService);

  public isLoading = true;
  // CORREÇÃO: A propriedade 'stats' precisa ser declarada na classe.
  public stats: any = null;

  ngOnInit(): void {
    this.userService.getUserStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar estatísticas', err);
        this.isLoading = false;
        // Futuramente, podemos mostrar uma mensagem de erro na tela
      }
    });
  }
}