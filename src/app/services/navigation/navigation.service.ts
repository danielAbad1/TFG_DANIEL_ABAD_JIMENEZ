import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';

/**
 * Servicio de navegación centralizado para gestionar historial de rutas dentro de la aplicación.
 * Permite registrar, retroceder y navegar entre rutas de forma trazable mediante `sessionStorage`.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly STORAGE_KEY = 'appNavigationHistory';

  constructor(private router: Router) {}

  /**
   * Guarda una ruta en el historial de navegación si aún no es la última.
   */
  pushRoute(url: string): void {
    const history = this.getHistory();

    if (history.length === 0 || history[history.length - 1] !== url) {
      history.push(url);
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    }
  }

  /**
   * Navega hacia atrás en el historial de navegación registrado.
   * Si no hay historial, redirige a la raíz (`/`).
   */
  navigateBack(): void {
    const history = this.getHistory();
    history.pop();
    const previous = history.pop();

    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));

    if (previous) {
      this.router.navigateByUrl(previous);
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Navega a una ruta específica y la registra en el historial.
   */
  navigate(commands: any[], extras: NavigationExtras = {}): void {
    const url = this.router.createUrlTree(commands, extras).toString();
    this.pushRoute(url);
    this.router.navigateByUrl(url);
  }

  goHome(): void {
    this.resetHistory();
    this.router.navigate(['/']);
  }

  /**
   * Limpia por completo el historial de navegación.
   * Útil para flujos de inicio o reinicio de navegación.
   */
  resetHistory(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Obtiene el historial completo desde `sessionStorage`.
   */
  private getHistory(): string[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
