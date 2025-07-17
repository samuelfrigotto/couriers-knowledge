import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating-display.component.html',
  styleUrl: './rating-display.component.css'
})
export class RatingDisplayComponent {
  @Input() rating: number = 0;

  counter = Array;

  // CORREÇÃO: Novo getter para formatar o texto da nota
  get formattedRating(): string {
    const num = Number(this.rating); // Garante que estamos lidando com um número

    // Se o número não tem parte decimal (ex: 3.0), retorna só a parte inteira (ex: "3")
    if (num % 1 === 0) {
      return num.toString();
    }
    // Se tiver parte decimal (ex: 3.5), retorna como está (ex: "3.5")
    return num.toString();
  }

  getFillPercentage(index: number): number {
      const ratingValue = this.rating || 0;
      if (index < Math.floor(ratingValue)) {
          return 100; // Quadrado totalmente preenchido
      }
      if (index === Math.floor(ratingValue) && ratingValue % 1 !== 0) {
          return 50; // Metade preenchida
      }
      return 0; // Quadrado vazio
  }
}