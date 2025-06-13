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
 * El título de la publicación y (opcionalmente) su autor llegan por la URL.
 * Cambia el <title> de la pestaña para reflejar “Publicación: <Título>”.
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
  /**
   * Observable que emite los detalles de la publicación o `null` si no existe.
   */
  detallesPublicacion$!: Observable<DetallesPublicacionInterface | null>;

  /**
   * Título (literal) de la publicación (percent-encoded en la URL).
   */
  publicacionTitle!: string;

  /**
   * Nombre del autor (percent-encoded en la URL). Puede venir o no.
   */
  nombreAutor!: string;

  /**
   * Mensaje de error para mostrar en pantalla si la consulta falla.
   */
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

  /**
   * Al inicializar, leemos los parámetros 'title' y 'nombreAutor' de la URL,
   * decodificamos el título, actualizamos el <title> de la pestaña, y cargamos datos.
   */
  override ngOnInit(): void {
    super.ngOnInit();

    this.route.params.subscribe((params) => {
      // 1) Leemos y decodificamos el parámetro “title”
      const rawTitle = params['title'];
      if (!rawTitle) {
        console.error('El título de la publicación no está disponible.');
        return;
      }
      const decodedTitle = decodeURIComponent(rawTitle);
      this.publicacionTitle = decodedTitle;

      // 2) (Opcional) Si llega “nombreAutor” en la URL, decodificamos también
      this.nombreAutor = params['nombreAutor']
        ? decodeURIComponent(params['nombreAutor'])
        : '';

      // 3) Actualizamos el <title> de la pestaña:
      //      “Publicación: <Título decodificado>”
      this.titleService.setTitle(`${decodedTitle}`);

      // 4) Cargamos los detalles a partir del título decodificado
      this.loadDetallesPublicacion();
    });
  }

  /**
   * Llama al servicio SPARQL pasando `this.publicacionTitle` (texto legible).
   * Si hay al menos un resultado, formatea la lista de autores.
   */
  loadDetallesPublicacion(): void {
    this.isLoadingPublicacion = true;

    // 1) Primero pedimos todos los investigadores de la Politécnica
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

      // 2) Con ese Set en mano, pedimos los detalles de la publicación
      switchMap((poliSet: Set<string>) =>
        this.sparqlService
          .getDetallesPublicacionPorTitulo(this.publicacionTitle)
          .pipe(
            map((data) => {
              const bindings = data.results.bindings;
              if (!bindings.length) return null;

              const detalles = bindings[0] as DetallesPublicacionInterface;
              // formateo autoresLista
              if (detalles.autores?.value) {
                detalles.autoresLista = detalles.autores.value
                  .split(', ')
                  .map((a) => formatName(a.trim()));
              } else {
                detalles.autoresLista = [];
              }

              // construimos autoresExtended
              detalles.autoresExtended = detalles.autoresLista.map((name) => ({
                name,
                isPolitecnica: poliSet.has(name.toLowerCase()),
              }));

              return detalles;
            })
          )
      ),

      catchError((err) => {
        console.error('Error al cargar detalles:', err);
        this.errorMessage =
          'No se pudieron cargar los detalles de la publicación.';
        return of(null);
      }),

      finalize(() => {
        this.isLoadingPublicacion = false;
      })
    );
  }

  /**
   * Navega a la vista de detalles del investigador especificado por nombre.
   */
  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }
}
