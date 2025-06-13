import { Component } from '@angular/core';
import { NavigationService } from '../../services/navigation/navigation.service';

/**
 * Componente principal de la aplicación (pantalla de inicio).
 * Muestra una vista general con accesos directos a las principales secciones:
 * Investigadores, Grupos de investigación, Proyectos, Publicaciones y Buscador General.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private navigationService: NavigationService) {}

  /** Navegar a la pantalla de inicio */
  navigateToHome() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/']);
  }

  /** Navegar a la sección de investigadores */
  navigateToResearchers() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/investigadores']);
  }

  /** Navegar a la sección de grupos de investigación */
  navigateToResearchGroups() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/gruposInvestigacion']);
  }

  /**  Navegar a la sección de proyectos de investigación */
  navigateToResearchProjects() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/proyectosInvestigacion']);
  }

  /** Navegar a la sección de publicaciones */
  navigateToScopusPublicaciones() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/scopus-publicaciones']);
  }

  /** Navegar a la vista del buscador general */
  navigateToBuscadorGeneral() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/buscadorGeneral']);
  }
}
