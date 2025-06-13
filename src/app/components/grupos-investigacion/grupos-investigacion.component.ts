import { Component, OnInit } from '@angular/core';
import { SparqlService } from '../../services/sparql/sparql.service';
import { GrupoInvestigacionInterface } from '../../interfaces/grupoInvestigacionInterface';
import { CommonModule } from '@angular/common';
import { handleError, processGroupData } from '../../utils/helpers';
import { forkJoin, BehaviorSubject } from 'rxjs';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faChevronDown,
  faChevronUp,
  faHome,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';

/**
 * Componente que muestra el listado de grupos de investigación.
 * Permite filtrar por nombre del grupo o por nombre de algún investigador asociado a dichos grupos.
 * Ofrece paginación, expansión de tarjetas para ver detalles, y navegación
 * a los detalles de un grupo o a los detalles de cada uno de sus miembros.
 */
@Component({
  selector: 'app-grupos-investigacion',
  standalone: true,
  templateUrl: './grupos-investigacion.component.html',
  styleUrls: ['./grupos-investigacion.component.css'],
  imports: [CommonModule, FontAwesomeModule],
})
export class GruposInvestigacionComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  grupos: GrupoInvestigacionInterface[] = [];
  gruposFiltrados: GrupoInvestigacionInterface[] = [];
  gruposPaginados: GrupoInvestigacionInterface[] = [];

  isLoading = true;
  errorMessage = '';

  filtroNombreGrupo$ = new BehaviorSubject<string>('');
  filtroNombreInvestigador$ = new BehaviorSubject<string>('');

  limit = 3;
  offset = 0;

  grupoExpandido: string | null = null;

  constructor(
    private sparqlService: SparqlService,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(
      faArrowLeft,
      faChevronDown,
      faChevronUp,
      faHome,
      faSpinner
    );
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.loadGrupos();
    this.filtroNombreGrupo$.subscribe(() => this.aplicarFiltros());
    this.filtroNombreInvestigador$.subscribe(() => this.aplicarFiltros());
  }

  loadGrupos() {
    this.isLoading = true;

    // Se usa forkJoin para ejecutar en paralelo ambas consultas
    // y esperar a que ambas terminen antes de procesar los resultados.
    forkJoin({
      miembrosEscuela: this.sparqlService.getGruposInvestigacion(),
      otrosMiembros: this.sparqlService.getMiembrosNoPolitecnica(),
    }).subscribe({
      next: ({ miembrosEscuela, otrosMiembros }) => {
        const datosEscuela = miembrosEscuela.results.bindings;
        const datosOtros = otrosMiembros.results.bindings;

        this.grupos = processGroupData(datosEscuela, datosOtros);
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error) => {
        handleError(this, error, 'Ocurrió un error al cargar los grupos.');
      },
    });
  }

  obtenerFiltros() {
    return {
      filtroGrupo: this.filtroNombreGrupo$.value.toLowerCase().trim(),
      filtroInvestigador: this.filtroNombreInvestigador$.value
        .toLowerCase()
        .trim(),
    };
  }

  aplicarFiltros() {
    const { filtroGrupo, filtroInvestigador } = this.obtenerFiltros();

    this.gruposFiltrados = this.grupos.filter((grupo) => {
      return [
        !filtroGrupo || grupo.grupo.toLowerCase().includes(filtroGrupo),
        !filtroInvestigador ||
          [...grupo.personasEscuela, ...grupo.otrosMiembros].some(
            (persona: string) =>
              persona.toLowerCase().includes(filtroInvestigador)
          ),
      ].every(Boolean);
    });

    this.offset = 0;
    this.paginar();
  }

  actualizarFiltroGrupo(event: any) {
    this.filtroNombreGrupo$.next(event.target.value);
  }

  actualizarFiltroInvestigador(event: any) {
    this.filtroNombreInvestigador$.next(event.target.value);
  }

  toggleGrupo(grupo: string) {
    this.grupoExpandido = this.grupoExpandido === grupo ? null : grupo;
  }

  trackByPersona(index: number, persona: string): string {
    return persona;
  }

  verDetallesGrupo(grupo: string) {
    this.navigationService.navigate(['/detalles-grupos-investigacion', grupo]);
  }

  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate([
      '/detallesInvestigador',
      encodeURIComponent(nombre.trim()),
    ]);
  }

  paginar() {
    this.gruposPaginados = this.gruposFiltrados.slice(
      this.offset,
      this.offset + this.limit
    );
  }

  paginate(direction: 'next' | 'previous') {
    if (direction === 'next' && this.canGoNextPage) {
      this.offset += this.limit;
    } else if (direction === 'previous' && this.offset > 0) {
      this.offset -= this.limit;
    }
    this.paginar();
  }

  get canGoNextPage(): boolean {
    return this.offset + this.limit < this.gruposFiltrados.length;
  }

  get canGoPreviousPage(): boolean {
    return this.offset > 0;
  }
}
