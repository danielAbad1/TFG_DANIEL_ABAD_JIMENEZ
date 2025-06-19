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

  hasField(detalles: DetallesInvestigadorInterface[], field: string): boolean {
    return detalles.some((item) => item[field]?.value);
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

  private agruparDetallesPorInvestigador(
    detalles: DetallesInvestigadorInterface[]
  ): DetallesInvestigadorInterface[] {
    if (detalles.length === 0) return [];

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
