import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterOutlet,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title
  ) {}

  /**
   * Establece el título de la página según el valor definido en `data.title` de la ruta activa.
   */
  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap((route) => route.data)
      )
      .subscribe((data: { title?: string }) => {
        const pageTitle = data.title || 'Escuela Politécnica';
        this.titleService.setTitle(pageTitle);
      });
  }
}
