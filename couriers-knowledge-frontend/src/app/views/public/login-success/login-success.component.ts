import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';


@Component({
  selector: 'app-login-success',
  standalone: true,
  imports: [],
  template: '<p>Autenticando...</p>',
  styleUrl: './login-success.component.css'
})
export class LoginSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService); // <-- Injete o serviço

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.saveToken(token); // <-- Use o serviço para salvar o token
        this.router.navigate(['/app/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
