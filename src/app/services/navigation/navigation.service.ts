import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  static navigate(arg0: string[]) {
    throw new Error('Method not implemented.');
  }
  private readonly STORAGE_KEY = 'appNavigationHistory';

  constructor(private router: Router) {}

  /**
   * Guarda una ruta en el historial de navegación si aún no es la última.
   * Útil para registrar la ruta actual (por ejemplo en `ngOnInit`) o rutas externas al servicio.
   */
  pushRoute(url: string): void {
    const history = this.getHistory();

    // Evitar duplicados consecutivos
    if (history.length === 0 || history[history.length - 1] !== url) {
      history.push(url);
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    }
  }

  /**
   * Navega hacia atrás en el historial de navegación registrado.
   * Si no hay historial suficiente, redirige a la raíz (`/`).
   */
  navigateBack(): void {
    const history = this.getHistory();
    history.pop(); // Eliminar ruta actual
    const previous = history.pop(); // Obtener anterior

    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));

    if (previous) {
      this.router.navigateByUrl(previous);
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Navega a una ruta específica y la registra automáticamente en el historial.
   * Este método debe usarse en lugar de `router.navigate(...)` cuando se desea mantener la trazabilidad.
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
