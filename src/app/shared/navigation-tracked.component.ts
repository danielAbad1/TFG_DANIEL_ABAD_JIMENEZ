import { OnInit, Directive } from '@angular/core';
import { NavigationService } from '../services/navigation/navigation.service';

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
