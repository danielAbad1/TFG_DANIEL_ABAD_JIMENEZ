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

/**
 * Componente que muestra el listado de investigadores de la Escuela Politécnica
 * ordenado por índice H. Permite filtrar por nombre y por rango de índice H,
 * así como paginar y descargar los resultados en formato CSV.
 */
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
  investigadores: any[] = [];
  investigadoresFiltrados: any[] = [];
  investigadoresPaginados: any[] = [];

  filtroNombre$ = new BehaviorSubject<string>('');
  filtroMinIndiceH$ = new BehaviorSubject<number | null>(null);
  filtroMaxIndiceH$ = new BehaviorSubject<number | null>(null);
  maxHIndex: number = 0;

  limit = 8;
  offset = 0;
  totalInvestigadores = 0;
  isLoading = true;

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
    this.loadInvestigadoresIndiceH();
  }

  loadInvestigadoresIndiceH() {
    this.isLoading = true;
    this.sparqlService.getIndicesHOrdenados().subscribe({
      next: (data) => {
        this.investigadores = data['results']['bindings'] || [];
        this.totalInvestigadores = this.investigadores.length;

        this.maxHIndex = Math.max(
          ...this.investigadores.map((inv) => parseInt(inv.indiceH.value, 10))
        );

        this.filtrarInvestigadores();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar los investigadores Indice H:', error);
        this.isLoading = false;
      },
    });
  }

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

  actualizarFiltroNombre(event: any) {
    this.filtroNombre$.next(event.target.value);
    this.filtrarInvestigadores();
  }

  actualizarFiltroMinIndiceH(event: any) {
    let valor = event.target.value ? parseInt(event.target.value, 10) : null;

    if (valor !== null && valor < 0) {
      valor = 0;
    }

    if (
      valor !== null &&
      this.filtroMaxIndiceH$.value !== null &&
      valor > this.filtroMaxIndiceH$.value
    ) {
      valor = this.filtroMaxIndiceH$.value;
    }

    event.target.value = valor;
    this.filtroMinIndiceH$.next(valor);
    this.filtrarInvestigadores();
  }

  actualizarFiltroMaxIndiceH(event: any) {
    let valor = event.target.value ? parseInt(event.target.value, 10) : null;

    if (valor !== null && valor < 0) {
      valor = 0;
    }

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
