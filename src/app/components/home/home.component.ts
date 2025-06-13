import { Component } from '@angular/core';
import { NavigationService } from '../../services/navigation/navigation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private navigationService: NavigationService) {}

  navigateToHome() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/']);
  }

  navigateToResearchers() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/investigadores']);
  }

  navigateToResearchGroups() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/gruposInvestigacion']);
  }

  navigateToResearchProjects() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/proyectosInvestigacion']);
  }

  navigateToScopusPublicaciones() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/scopus-publicaciones']);
  }

  navigateToBuscadorGeneral() {
    this.navigationService.resetHistory();
    this.navigationService.navigate(['/buscadorGeneral']);
  }
}
