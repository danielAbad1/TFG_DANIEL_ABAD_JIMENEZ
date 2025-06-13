import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SparqlService } from '../../services/sparql/sparql.service';
import { CommonModule } from '@angular/common';
import { DetallesInvestigadorInterface } from '../../interfaces/detallesInvestigadorInterface';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getAreas, getGruposInvestigacion } from '../../utils/helpers';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faHome,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';

/**
 * Componente que muestra los detalles de un investigador en concreto.
 * Recupera y agrupa su información desde el servicio SPARQL, incluyendo
 * áreas de conocimiento, grupos de investigación, publicaciones y proyectos.
 * Permite navegar a sus publicaciones, proyectos y a los detalles de su grupo.
 *
 * El investigador se identifica mediante un parámetro en la URL (`nombre`).
 */
@Component({
  selector: 'app-detalles-investigador',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './detalles-investigador.component.html',
  styleUrls: ['./detalles-investigador.component.css'],
})
export class DetallesInvestigadorComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  detallesInvestigador$!: Observable<DetallesInvestigadorInterface[]>;
  isLoading = true;
  errorMessage = '';

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

    const nombreParam = this.route.snapshot.paramMap.get('nombre');

    if (nombreParam) {
      const nombreDecodificado = decodeURIComponent(nombreParam);
      this.titleService.setTitle(`${nombreDecodificado}`);

      this.detallesInvestigador$ = this.sparqlService
        .getDetallesInvestigador(nombreDecodificado)
        .pipe(
          map((data) =>
            this.agruparDetallesPorInvestigador(data?.results?.bindings || [])
          ),
          tap(() => (this.isLoading = false)),
          catchError((err) => {
            console.error('Error al cargar detalles del investigador:', err);
            this.errorMessage =
              'No se pudieron cargar los detalles del investigador.';
            this.isLoading = false;
            return of([]);
          })
        );
    } else {
      this.errorMessage = 'No se proporcionó un nombre de investigador válido.';
      this.isLoading = false;
      this.detallesInvestigador$ = of([]);
    }
  }

  getAreas(areas: string | undefined): string[] {
    return getAreas(areas);
  }

  getGruposInvestigacion(grupos: string | undefined): string[] {
    return getGruposInvestigacion(grupos);
  }

  verPublicaciones(nombre: string) {
    this.navigationService.navigate(['/publicaciones', nombre]);
  }

  verGrupoInvestigacion(nombreGrupo: string) {
    this.navigationService.navigate([
      '/detalles-grupos-investigacion',
      nombreGrupo,
    ]);
  }

  verProyectos(nombre: string) {
    this.navigationService.navigate(['/proyectosInvestigador', nombre]);
  }

  /**
   * Consolida los detalles de un investigador que aparecen repetidos por pertenecer a varios grupos.
   * A partir de la lista de resultados (uno por cada grupo), construye un único objeto
   * que mantiene toda la información del investigador y agrupa los nombres de grupo en un solo campo.
   *
   * @param detalles Lista de objetos con los detalles del investigador (uno por cada grupo al que pertenece)
   * @returns Un único objeto con la información consolidada del investigador
   */
  private agruparDetallesPorInvestigador(
    detalles: DetallesInvestigadorInterface[]
  ): DetallesInvestigadorInterface[] {
    if (detalles.length === 0) return [];

    // Se toma el primer objeto como base, ya que toda la información (excepto el grupo) es idéntica en los duplicados
    const base = { ...detalles[0] };
    const grupos = new Set<string>();

    for (const item of detalles) {
      const grupo = item.nombreGrupo?.value?.trim();
      if (grupo) grupos.add(grupo);
    }

    base.gruposInvestigacion = { value: Array.from(grupos).join(';') };
    return [base];
  }
}
