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
import {
  faArrowLeft,
  faHome,
  faSpinner,
  faChartPie,
  faStar,
  faUserFriends,
} from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { ProyectoInterface } from '../../interfaces/proyectosInvestigacionInterface';

registerLocaleData(localeEs);

/**
 * Componente que muestra el listado de proyectos de investigación disponibles en la plataforma.
 *
 * Incluye funcionalidades completas de filtrado (por texto, ámbito, tipo, fechas, subvención),
 * ordenación por fecha de inicio y paginación.
 *
 * Todos los proyectos se cargan al iniciar y se procesan en memoria
 * para permitir filtrado y navegación fluidos.
 *
 * También permite acceder a los detalles individuales de cada proyecto.
 */
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
  minGrantSeleccionado: number | null = null;
  maxGrantSeleccionado: number | null = null;
  filtroSubvencionActivo: boolean = false;

  constructor(
    private sparqlService: SparqlService,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(
      faArrowLeft,
      faHome,
      faSpinner,
      faChartPie,
      faStar,
      faUserFriends
    );
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.loadTodosProyectos();
  }

  /**
   * Realiza la carga inicial de todos los proyectos de investigación.
   *
   * Una vez recibidos, se procesan para normalizar sus campos, se ordenan por fecha de inicio
   * descendente y se almacenan en memoria para permitir filtrado y paginación.
   *
   * Además, se inicializan los valores posibles para los filtros de ámbito, tipo de proyecto
   * y rango de subvención.
   */
  loadTodosProyectos() {
    this.isLoading = true;
    this.sparqlService.getProyectosInvestigacion().subscribe({
      next: (data) => {
        this.proyectos = processProjectData(
          data.results.bindings
        ) as ProyectoInterface[];

        this.proyectos.sort((a, b) => {
          const ta = a.startDate ? this.parseEuropeanDate(a.startDate) : 0;
          const tb = b.startDate ? this.parseEuropeanDate(b.startDate) : 0;
          return tb - ta;
        });

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
   * Aplica todos los filtros seleccionados sobre la lista completa de proyectos.
   *
   * Los filtros incluyen: texto (id o nombre), ámbito, tipo de proyecto,
   * intervalo de fechas (inicio y fin) y rango de subvención.
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
    const filtroTexto = this.filtro.toLowerCase().trim();
    return (
      proyecto.nombre.toLowerCase().includes(filtroTexto) ||
      proyecto.projectIdentifier.toLowerCase().includes(filtroTexto)
    );
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
    if (!this.filtroSubvencionActivo) return true;

    const grant = proyecto.grantNumber ?? 0;

    if (
      this.minGrantSeleccionado !== null &&
      grant < this.minGrantSeleccionado
    ) {
      return false;
    }

    if (
      this.maxGrantSeleccionado !== null &&
      grant > this.maxGrantSeleccionado
    ) {
      return false;
    }
    return true;
  }

  /**
   * Genera un resumen de los proyectos, diferenciando el rol de participación
   * como investigador principal o colaborador (investigador).
   *
   * Devuelve el número total de proyectos y la suma de subvenciones asociadas a cada tipo de rol,
   * considerando únicamente los investigadores de la Escuela Politécnica.
   *
   * Se actualiza dinámicamente según los proyectos filtrados.
   */
  getResumenPorRol(proyectos: ProyectoInterface[]) {
    const resumen = {
      principal: { count: 0, total: 0 },
      colaborador: { count: 0, total: 0 },
    };

    for (const proyecto of proyectos) {
      const cantidad = proyecto.grantNumber ?? 0;
      const tieneIPep = proyecto.epParticipants.some(
        (p) => p.role.toLowerCase() === 'investigador principal'
      );

      if (tieneIPep) {
        resumen.principal.count++;
        resumen.principal.total += cantidad;
      } else {
        resumen.colaborador.count++;
        resumen.colaborador.total += cantidad;
      }
    }

    return resumen;
  }

  actualizarPaginacion() {
    this.proyectosPaginados = this.proyectosFiltrados.slice(
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
    this.actualizarPaginacion();
  }

  get canGoNextPage(): boolean {
    return this.offset + this.limit < this.proyectosFiltrados.length;
  }

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

  onMinGrantChange(value: number) {
    this.minGrantSeleccionado = value;
    this.validarRangoSubvencion();
    this.filtrarProyectos();
  }

  onMaxGrantChange(value: number) {
    this.maxGrantSeleccionado = value;
    this.validarRangoSubvencion();
    this.filtrarProyectos();
  }

  parseEuropeanDate(d: string): number {
    const [day, month, year] = d.split('/').map((s) => Number(s));
    return new Date(year, month - 1, day).getTime();
  }

  validarRangoSubvencion() {
    if (
      this.minGrantSeleccionado !== null &&
      this.maxGrantSeleccionado !== null &&
      this.minGrantSeleccionado > this.maxGrantSeleccionado
    ) {
      this.maxGrantSeleccionado = this.minGrantSeleccionado;
    }
  }
}
