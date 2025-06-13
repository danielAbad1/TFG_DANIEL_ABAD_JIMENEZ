import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SparqlService } from '../../services/sparql/sparql.service';
import { CommonModule } from '@angular/common';
import { normalizeString } from '../../utils/helpers';
import { NavigationService } from '../../services/navigation/navigation.service';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faDownload,
  faHome,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';

@Component({
  selector: 'app-indice-h-investigadores',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './indice-h-investigadores.component.html',
  styleUrls: ['./indice-h-investigadores.component.css'],
})
export class IndiceHInvestigadoresComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  investigadores: any[] = []; // Todos los investigadores cargados
  investigadoresFiltrados: any[] = []; // Filtrados según el input
  investigadoresPaginados: any[] = []; // Paginados

  filtroNombre$ = new BehaviorSubject<string>(''); // Estado del filtro de búsqueda
  filtroMinIndiceH$ = new BehaviorSubject<number | null>(null); // Mínimo índice H
  filtroMaxIndiceH$ = new BehaviorSubject<number | null>(null); // Máximo índice H
  maxHIndex: number = 0;

  limit = 8; // Número de resultados por página
  offset = 0; // Offset inicial
  totalInvestigadores = 0; // Número total de investigadores
  isLoading = true; // Control de carga

  constructor(
    private sparqlService: SparqlService,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faDownload, faHome, faSpinner);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadInvestigadoresIndiceH(); // Cargar todos los investigadores con índice H
  }

  /**
   * Carga todos los investigadores con índice H sin paginar para poder aplicar filtros correctamente.
   */
  loadInvestigadoresIndiceH() {
    this.isLoading = true;
    this.sparqlService.getMayorIndiceH().subscribe({
      next: (data) => {
        this.investigadores = data['results']['bindings'] || [];
        this.totalInvestigadores = this.investigadores.length;

        // Obtener el índice H más alto para resaltarlo
        this.maxHIndex = Math.max(
          ...this.investigadores.map((inv) => parseInt(inv.indiceH.value, 10))
        );

        this.filtrarInvestigadores();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar los investigadores:', error);
        this.isLoading = false;
      },
    });
  }

  /**
   * Filtra la lista de investigadores según el input de búsqueda y el rango de índice H.
   */
  filtrarInvestigadores() {
    const filtroNormalizado = normalizeString(
      this.filtroNombre$.value.toLowerCase()
    );

    this.investigadoresFiltrados = this.investigadores.filter(
      (investigador) => {
        const nombre = normalizeString(investigador.nombre.value.toLowerCase());
        const indiceH = parseInt(investigador.indiceH.value, 10);

        const coincideNombre = nombre.includes(filtroNormalizado);
        const minH = this.filtroMinIndiceH$.value;
        const maxH = this.filtroMaxIndiceH$.value;

        const dentroDelRango =
          (minH === null || indiceH >= minH) &&
          (maxH === null || indiceH <= maxH);

        return coincideNombre && dentroDelRango;
      }
    );

    this.offset = 0;
    this.paginar();
  }

  /**
   * Controla la paginación de los resultados filtrados.
   */
  paginar() {
    this.investigadoresPaginados = this.investigadoresFiltrados.slice(
      this.offset,
      this.offset + this.limit
    );
  }

  /**
   * Paginación manual (siguiente/anterior página).
   */
  paginate(direction: 'next' | 'previous') {
    if (direction === 'next' && this.canGoNextPage) {
      this.offset += this.limit;
    } else if (direction === 'previous' && this.offset > 0) {
      this.offset -= this.limit;
    }
    this.paginar();
  }

  /**
   * Verifica si hay más páginas disponibles.
   */
  get canGoNextPage(): boolean {
    return this.offset + this.limit < this.investigadoresFiltrados.length;
  }

  /**
   * Actualiza el filtro de búsqueda con el nuevo valor ingresado en el input.
   * @param event Evento del input de búsqueda
   */
  actualizarFiltroNombre(event: any) {
    this.filtroNombre$.next(event.target.value);
    this.filtrarInvestigadores();
  }

  /**
   * Actualiza el filtro de mínimo índice H asegurando que:
   * - No sea negativo.
   * - No sea mayor que el máximo índice H.
   */
  actualizarFiltroMinIndiceH(event: any) {
    let valor = event.target.value ? parseInt(event.target.value, 10) : null;

    // Evita valores negativos
    if (valor !== null && valor < 0) {
      valor = 0;
    }

    // Evita que el mínimo sea mayor que el máximo
    if (
      valor !== null &&
      this.filtroMaxIndiceH$.value !== null &&
      valor > this.filtroMaxIndiceH$.value
    ) {
      valor = this.filtroMaxIndiceH$.value;
    }

    event.target.value = valor; // Corrige el valor en el input
    this.filtroMinIndiceH$.next(valor);
    this.filtrarInvestigadores();
  }

  actualizarFiltroMaxIndiceH(event: any) {
    let valor = event.target.value ? parseInt(event.target.value, 10) : null;

    // Evita valores negativos
    if (valor !== null && valor < 0) {
      valor = 0;
    }

    // Evita que el máximo sea menor que el mínimo
    if (
      valor !== null &&
      this.filtroMinIndiceH$.value !== null &&
      valor < this.filtroMinIndiceH$.value
    ) {
      valor = this.filtroMinIndiceH$.value;
    }

    event.target.value = valor;
    this.filtroMaxIndiceH$.next(valor);
    this.filtrarInvestigadores();
  }

  descargarCsvIndiceH() {
    if (!this.investigadoresFiltrados.length) {
      return;
    }

    let csvContent = '\ufeffNombre,Índice H\n';

    this.investigadoresFiltrados.forEach((investigador) => {
      const nombre = investigador.nombre?.value || 'Sin nombre';
      const indiceH = investigador.indiceH?.value || 'N/A';

      csvContent += `"${nombre}","${indiceH}"\n`;
    });

    // Construcción del nombre del archivo CSV según los filtros aplicados
    let fileName = 'investigadores_indiceH';

    const nombreFiltro = this.filtroNombre$.value.trim();
    const minH = this.filtroMinIndiceH$.value;
    const maxH = this.filtroMaxIndiceH$.value;

    const filtros = [];

    if (nombreFiltro) {
      filtros.push(`nombre-${nombreFiltro.replace(/\s+/g, '_')}`);
    }
    if (minH !== null) {
      filtros.push(`minH-${minH}`);
    }
    if (maxH !== null) {
      filtros.push(`maxH-${maxH}`);
    }

    if (filtros.length > 0) {
      fileName += `_${filtros.join('_')}`;
    }

    fileName += '.csv';

    // Creación y descarga del archivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  verDetallesInvestigadorDesdeIndiceH(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }
}
