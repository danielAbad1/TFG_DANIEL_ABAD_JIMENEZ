import { Component, OnInit } from '@angular/core';
import { SparqlService } from '../../services/sparql/sparql.service';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { formatName } from '../../utils/helpers';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faHome,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { DetallesPublicacionInterface } from '../../interfaces/detallesPublicacionInterface';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';

/**
 * Componente que muestra los detalles de una publicación específica.
 *
 * Carga los detalles de la publicación, incluidos los autores, tipo de publicación 
 * y la revista donde fue publicada.
 * 
 * Permite acceder a los detalles de los investigadores asociados a la publicación.
 */
@Component({
  selector: 'app-detalles-publicacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './detalles-publicacion.component.html',
  styleUrls: ['./detalles-publicacion.component.css'],
})
export class DetallesPublicacionComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  isLoadingPublicacion = false;
  detallesPublicacion$!: Observable<DetallesPublicacionInterface | null>;
  publicacionTitle!: string;
  nombreAutor!: string;
  errorMessage: string | null = null;

  constructor(
    private sparqlService: SparqlService,
    private route: ActivatedRoute,
    private titleService: Title,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faHome, faSpinner);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.route.params.subscribe((params) => {
      const rawTitle = params['title'];
      if (!rawTitle) {
        console.error('El título de la publicación no está disponible.');
        return;
      }
      const decodedTitle = decodeURIComponent(rawTitle);
      this.publicacionTitle = decodedTitle;

      this.nombreAutor = params['nombreAutor']
        ? decodeURIComponent(params['nombreAutor'])
        : '';

      this.titleService.setTitle(`${decodedTitle}`);

      this.loadDetallesPublicacion();
    });
  }

  loadDetallesPublicacion(): void {
    this.isLoadingPublicacion = true;

    this.detallesPublicacion$ = this.sparqlService.getInvestigadores().pipe(
      map((data) => {
        const poliSet = new Set<string>();
        data.results.bindings.forEach((b: any) => {
          if (b.nombre?.value) {
            poliSet.add(b.nombre.value.trim().toLowerCase());
          }
        });
        return poliSet;
      }),

      switchMap((poliSet: Set<string>) =>
        this.sparqlService
          .getDetallesPublicacionPorTitulo(this.publicacionTitle)
          .pipe(
            map((data) => {
              const bindings = data.results.bindings;
              if (!bindings.length) return null;

              const detalles = bindings[0] as DetallesPublicacionInterface;
              if (detalles.autores?.value) {
                detalles.autoresLista = detalles.autores.value
                  .split(', ')
                  .map((a) => formatName(a.trim()));
              } else {
                detalles.autoresLista = [];
              }

              detalles.autoresExtended = detalles.autoresLista.map((name) => ({
                name,
                isPolitecnica: poliSet.has(name.toLowerCase()),
              }));

              return detalles;
            })
          )
      ),

      catchError((err) => {
        console.error('Error al cargar los detalles de la publicación:', err);
        this.errorMessage =
          'No se pudieron cargar los detalles de la publicación.';
        return of(null);
      }),

      finalize(() => {
        this.isLoadingPublicacion = false;
      })
    );
  }

  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }
}
