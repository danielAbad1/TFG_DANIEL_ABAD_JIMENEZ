import { Component, OnInit } from '@angular/core';
import { SparqlService } from '../../services/sparql/sparql.service';
import { CommonModule } from '@angular/common';
import { handleError, processData, normalizeString } from '../../utils/helpers';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faHome,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { InvestigadorInterface } from '../../interfaces/investigadorInterface';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';

/**
 * Componente que muestra el listado de investigadores de la Escuela Politécnica.
 * Permite:
 *  - Consultar los datos básicos de cada investigador.
 *  - Filtrar investigadores por nombre o área de conocimiento.
 *  - Navegar entre páginas de resultados.
 *  - Acceder a detalles individuales o al ranking por índice H.
 */
@Component({
  selector: 'app-investigadores',
  standalone: true,
  templateUrl: './investigadores.component.html',
  styleUrls: ['./investigadores.component.css'],
  imports: [CommonModule, FontAwesomeModule, FormsModule],
})
export class InvestigadoresComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  investigadores: InvestigadorInterface[] = [];
  investigadoresFiltrados: InvestigadorInterface[] = [];
  investigadoresPaginados: InvestigadorInterface[] = [];

  filtro: string = '';
  limit = 9;
  offset = 0;
  isLoading = true;
  errorMessage = '';

  constructor(
    private sparqlService: SparqlService,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faHome, faSpinner);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadTodosInvestigadores();
  }

  loadTodosInvestigadores() {
    this.isLoading = true;
    this.sparqlService.getInvestigadores().subscribe({
      next: (data) => {
        this.investigadores = processData(data['results']['bindings']);
        this.investigadoresFiltrados = [...this.investigadores];
        this.paginar();
        this.isLoading = false;
      },
      error: (error) =>
        handleError(
          this,
          error,
          'No se pudo cargar la lista de investigadores'
        ),
    });
  }

  filtrarInvestigadores() {
    const filtroNormalizado = normalizeString(this.filtro.toLowerCase());

    this.investigadoresFiltrados = this.investigadores.filter(
      (investigador: InvestigadorInterface) =>
        normalizeString(investigador.nombre.value.toLowerCase()).includes(
          filtroNormalizado
        ) ||
        normalizeString(investigador.areas.value.toLowerCase()).includes(
          filtroNormalizado
        )
    );

    this.offset = 0;
    this.paginar();
  }

  paginar() {
    this.investigadoresPaginados = this.investigadoresFiltrados.slice(
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
    return this.offset + this.limit < this.investigadoresFiltrados.length;
  }

  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }

  navigateToMoreIndiceH() {
    this.navigationService.navigate(['/mayorIndiceH']);
  }
}
