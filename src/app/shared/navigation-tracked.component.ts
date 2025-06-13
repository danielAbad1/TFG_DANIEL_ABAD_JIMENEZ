import { OnInit, Directive } from '@angular/core';
import { NavigationService } from '../services/navigation/navigation.service';

/**
 * Clase base abstracta para componentes que requieren trazabilidad de navegación.
 * Registra automáticamente la ruta actual al inicializarse y expone métodos de navegación comunes.
 */
@Directive()
export abstract class NavigationTrackedComponent implements OnInit {
  constructor(protected navigationService: NavigationService) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname;
      this.navigationService.pushRoute(currentUrl);
    }
  }

  navigateBack(): void {
    this.navigationService.navigateBack();
  }

  goHome(): void {
    this.navigationService.goHome();
  }
}
