import { Component, OnInit } from '@angular/core';
import { SparqlService } from '../../services/sparql/sparql.service';
import { CommonModule } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';
import { handleError, processProjectData } from '../../utils/helpers';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faHome, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { ProyectoInterface } from '../../interfaces/proyectosInvestigacionInterface';

registerLocaleData(localeEs);

@Component({
  selector: 'app-proyectos-investigacion',
  standalone: true,
  templateUrl: './proyectos-investigacion.component.html',
  styleUrls: ['./proyectos-investigacion.component.css'],
  imports: [CommonModule, FontAwesomeModule, FormsModule],
})
export class ProyectosInvestigacionComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  proyectos: ProyectoInterface[] = [];
  proyectosFiltrados: ProyectoInterface[] = [];
  proyectosPaginados: ProyectoInterface[] = [];

  filtro: string = '';
  limit = 9;
  offset = 0;
  isLoading = true;
  errorMessage = '';

  ambitosDisponibles: string[] = [];
  ambitoSeleccionado: string = 'Todos';

  tiposProyectoDisponibles: string[] = [];
  tipoProyectoSeleccionado: string = 'Todos';

  fechaInicioSeleccionada: string = '';
  fechaFinSeleccionada: string = '';

  minGrant: number = 0;
  maxGrant: number = 100000;
  minGrantSeleccionado: number = 0;
  maxGrantSeleccionado: number = this.maxGrant;
  filtroSubvencionActivo: boolean = false;

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

    this.loadTodosProyectos();
  }

  actualizarMinGrant(event: any) {
    this.minGrantSeleccionado = parseFloat(event.target.value);
    this.validarRangoSubvencion();
    this.filtrarProyectos();
  }

  actualizarMaxGrant(event: any) {
    this.maxGrantSeleccionado = parseFloat(event.target.value);
    this.validarRangoSubvencion();
    this.filtrarProyectos();
  }

  validarRangoSubvencion() {
    if (this.minGrantSeleccionado > this.maxGrantSeleccionado) {
      this.maxGrantSeleccionado = this.minGrantSeleccionado;
    }
  }

  /**
   * Carga todos los proyectos sin paginación para poder filtrarlos en memoria.
   */
  loadTodosProyectos() {
    this.isLoading = true;
    this.sparqlService.getProyectosInvestigacion().subscribe({
      next: (data) => {
        this.proyectos = processProjectData(data.results.bindings).map(
          (proyecto): ProyectoInterface => ({
            nombre: proyecto.nombre || 'Nombre no disponible',
            ambito: proyecto.ambito?.trim() || 'Sin ámbito',
            projectType: proyecto.projectType || 'Sin tipo',
            startDate: proyecto.startDate || '',
            endDate: proyecto.endDate || '',
            projectIdentifier: proyecto.projectIdentifier || '',
            grantNumber: Number(proyecto.grantNumber) || 0,
          })
        );

        this.proyectosFiltrados = [...this.proyectos];

        this.obtenerAmbitosDisponibles();
        this.obtenerTiposProyectoDisponibles();
        this.calcularRangoSubvencion();

        this.actualizarPaginacion();
        this.isLoading = false;
      },
      error: (error) =>
        handleError(this, error, 'No se pudo cargar la lista de proyectos'),
    });
  }

  obtenerAmbitosDisponibles() {
    const ambitosSet = new Set<string>(this.proyectos.map((p) => p.ambito));
    this.ambitosDisponibles = ['Todos', ...Array.from(ambitosSet)];
  }

  obtenerTiposProyectoDisponibles() {
    const tiposProyectoSet = new Set<string>(
      this.proyectos.map((p) => p.projectType)
    );
    this.tiposProyectoDisponibles = ['Todos', ...Array.from(tiposProyectoSet)];
  }

  calcularRangoSubvencion() {
    const grantValues = this.proyectos
      .map((p) => p.grantNumber ?? 0)
      .filter((g) => g > 0);
    this.minGrant = grantValues.length ? Math.min(...grantValues) : 0;
    this.maxGrant = grantValues.length ? Math.max(...grantValues) : 0;
  }

  /**
   * Filtra la lista de proyectos según el input de búsqueda.
   */
  filtrarProyectos() {
    this.proyectosFiltrados = this.proyectos.filter(
      (proyecto) =>
        this.cumpleFiltroTexto(proyecto) &&
        this.cumpleFiltroAmbito(proyecto) &&
        this.cumpleFiltroTipo(proyecto) &&
        this.cumpleFiltroFechas(proyecto) &&
        this.cumpleFiltroSubvencion(proyecto)
    );
    this.offset = 0;
    this.actualizarPaginacion();
  }

  cumpleFiltroTexto(proyecto: ProyectoInterface): boolean {
    return proyecto.nombre
      .toLowerCase()
      .includes(this.filtro.toLowerCase().trim());
  }

  cumpleFiltroAmbito(proyecto: ProyectoInterface): boolean {
    return (
      this.ambitoSeleccionado === 'Todos' ||
      proyecto.ambito === this.ambitoSeleccionado
    );
  }

  cumpleFiltroTipo(proyecto: ProyectoInterface): boolean {
    return (
      this.tipoProyectoSeleccionado === 'Todos' ||
      proyecto.projectType === this.tipoProyectoSeleccionado
    );
  }

  cumpleFiltroFechas(proyecto: ProyectoInterface): boolean {
    const fechaInicioProyecto = proyecto.startDate
      ? new Date(proyecto.startDate)
      : null;
    const fechaFinProyecto = proyecto.endDate
      ? new Date(proyecto.endDate)
      : null;

    const fechaInicioFiltro = this.fechaInicioSeleccionada
      ? new Date(this.fechaInicioSeleccionada)
      : null;
    const fechaFinFiltro = this.fechaFinSeleccionada
      ? new Date(this.fechaFinSeleccionada)
      : null;

    if (!fechaInicioFiltro && !fechaFinFiltro) {
      return true;
    }

    let cumpleFiltroFecha = true;

    if (fechaInicioFiltro && fechaInicioProyecto) {
      cumpleFiltroFecha = fechaInicioProyecto >= fechaInicioFiltro;
    }

    if (fechaFinFiltro && fechaFinProyecto) {
      cumpleFiltroFecha =
        cumpleFiltroFecha && fechaFinProyecto <= fechaFinFiltro;
    }

    return cumpleFiltroFecha;
  }

  cumpleFiltroSubvencion(proyecto: ProyectoInterface): boolean {
    if (!this.filtroSubvencionActivo) {
      return true;
    }

    return (
      proyecto.grantNumber !== null &&
      proyecto.grantNumber !== undefined &&
      proyecto.grantNumber >= this.minGrantSeleccionado &&
      proyecto.grantNumber <= this.maxGrantSeleccionado
    );
  }

  actualizarPaginacion() {
    this.proyectosPaginados = this.proyectosFiltrados.slice(
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
    this.actualizarPaginacion();
  }

  /**
   * Verifica si hay más páginas disponibles.
   */
  get canGoNextPage(): boolean {
    return this.offset + this.limit < this.proyectosFiltrados.length;
  }

  /**
   * Redirige a los detalles de un proyecto seleccionado.
   */
  verDetallesProyecto(identifier: string) {
    this.navigationService.navigate(['/detallesProyecto', identifier]);
  }

  actualizarFiltroAmbito(event: any) {
    this.ambitoSeleccionado = event.target.value;
    this.filtrarProyectos();
  }

  actualizarFiltroTipoProyecto(event: any) {
    this.tipoProyectoSeleccionado = event.target.value;
    this.filtrarProyectos();
  }
}
