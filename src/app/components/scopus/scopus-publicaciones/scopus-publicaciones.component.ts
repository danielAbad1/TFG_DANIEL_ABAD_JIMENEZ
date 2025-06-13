import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SparqlService } from '../../../services/sparql/sparql.service';
import { ScopusService } from '../../../services/scopus/scopus.service';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faHome,
  faSpinner,
  faChartPie,
} from '@fortawesome/free-solid-svg-icons';
import { NavigationService } from '../../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../../shared/navigation-tracked.component';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PublicacionInterface } from '../../../interfaces/publicacionesInterface';

/**
 * Componente que muestra el listado de publicaciones de Scopus pertenecientes
 * a investigadores de la Escuela Politécnica.
 *
 * Permite filtrar las publicaciones por texto, año, tipo y keywords, además de paginarlas y acceder a los detalles
 * de cada publicación.
 *
 * Único componente que utiliza ambos servicios (´SparqlService´ y ´ScopusService´) para cargar y filtrar los datos.
 */
@Component({
  selector: 'app-scopus-publicaciones',
  standalone: true,
  templateUrl: './scopus-publicaciones.component.html',
  styleUrls: ['./scopus-publicaciones.component.css'],
  imports: [CommonModule, FontAwesomeModule, FormsModule],
})
export class ScopusPublicacionesComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  publicaciones: PublicacionInterface[] = [];
  publicacionesFiltradas: PublicacionInterface[] = [];
  publicacionesPaginadas: PublicacionInterface[] = [];

  cargando = false;
  filtroBusquedaGeneral = '';
  filtroAnio: number | null = null;
  filtroKeyword = '';

  tiposPublicacionDisponibles: string[] = [];
  tipoSeleccionado: string = 'Todos';

  totalResultadosEsperados = 0;

  offset = 0;
  limit = 5;

  minAnio: number = 1900;
  maxAnio: number = 2100;

  private timeoutAnio: any = null;
  mensajeErrorAnio: string = '';

  scopusMatchedEids: string[] = [];
  scopusMatchedTitles: string[] = [];

  constructor(
    private sparqlService: SparqlService,
    private scopusService: ScopusService,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faHome, faSpinner, faChartPie);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadPublicacionesPolitecnica();
  }

  async loadPublicacionesPolitecnica(): Promise<void> {
    this.cargando = true;
    this.publicaciones = [];
    this.publicacionesFiltradas = [];
    this.publicacionesPaginadas = [];

    try {
      const resultado: any = await firstValueFrom(
        this.sparqlService.getPublicacionesPolitecnica()
      );

      const bindings = resultado?.results?.bindings || [];

      this.totalResultadosEsperados = bindings.length;

      this.publicaciones = bindings.map((b: any) => ({
        titulo: b.titulo?.value,
        eid: b.eid?.value,
        year: b.year?.value,
        tipo: b.tipo?.value,
      }));

      this.calcularRangoAnios();
      this.obtenerTiposPublicacionDisponibles();
      this.aplicarFiltro();
    } catch (err) {
      console.error('Error al cargar las publicaciones:', err);
    } finally {
      this.cargando = false;
    }
  }

  obtenerTiposPublicacionDisponibles(): void {
    const tiposSet = new Set<string>(
      this.publicaciones.map((p) => p.tipo?.trim() || 'Sin tipo')
    );
    this.tiposPublicacionDisponibles = ['Todos', ...Array.from(tiposSet)];
  }

  cumpleFiltroTipo(pub: PublicacionInterface): boolean {
    const tipo = pub.tipo?.trim() || 'Sin tipo';
    return this.tipoSeleccionado === 'Todos' || tipo === this.tipoSeleccionado;
  }

  esNoDisponible(valor?: string): boolean {
    return !valor || valor.trim() === '';
  }

  anioValido(anio: number | null): boolean {
    return (
      anio === null ||
      (typeof anio === 'number' && anio >= this.minAnio && anio <= this.maxAnio)
    );
  }

  validarYAplicarFiltroAnio(): void {
    if (this.timeoutAnio) {
      clearTimeout(this.timeoutAnio);
    }

    this.timeoutAnio = setTimeout(() => {
      const anio = this.filtroAnio;

      if (!this.anioValido(anio)) {
        this.mensajeErrorAnio = `Introduce un año entre ${this.minAnio} y ${this.maxAnio}`;
        this.filtroAnio = null;
      } else {
        this.mensajeErrorAnio = '';
      }

      this.aplicarFiltro();
    }, 1000);
  }

  aplicarFiltro(): void {
    const texto = this.filtroBusquedaGeneral.toLowerCase().trim();

    this.publicacionesFiltradas = this.publicaciones.filter((pub) => {
      const titulo = pub.titulo?.toLowerCase() || '';
      const eid = pub.eid?.toLowerCase() || '';
      const anio = pub.year?.trim() || '';

      const coincideConEID = eid.includes(texto);
      const coincideConTitulo = titulo.includes(texto);
      const quiereBuscarNoDisponible = texto.startsWith('no');
      const coincideConNoDisponible =
        quiereBuscarNoDisponible && this.esNoDisponible(pub.eid);
      const coincideConAnio =
        !this.filtroAnio ||
        (this.anioValido(this.filtroAnio) && anio === String(this.filtroAnio));
      const coincideConTipo = this.cumpleFiltroTipo(pub);

      const coincideConKeyword =
        this.filtroKeyword.trim() === '' ||
        (pub.eid && this.scopusMatchedEids.includes(pub.eid)) ||
        (pub.titulo &&
          this.scopusMatchedTitles.includes(pub.titulo.trim().toLowerCase()));

      return (
        (coincideConEID || coincideConTitulo || coincideConNoDisponible) &&
        coincideConAnio &&
        coincideConTipo &&
        coincideConKeyword
      );
    });

    this.offset = 0;
    this.actualizarPaginacion();
  }

  /**
   * Aplica un filtro por keywords usando el servicio ´ScopusService´.
   * Busca publicaciones relacionadas con las keywords proporcionadas y actualiza el filtro de publicaciones.
   */
  async aplicarFiltroPorKeyword(): Promise<void> {
    const keywords = this.filtroKeyword
      .split(';')
      .map((k) => k.trim())
      .filter((k) => k !== '');

    this.scopusMatchedEids = [];
    this.scopusMatchedTitles = [];

    if (keywords.length === 0) {
      this.aplicarFiltro();
      return;
    }

    this.cargando = true;
    try {
      const response = await firstValueFrom(
        this.scopusService.buscarPorKeywords(keywords)
      );

      const resultados = response?.['search-results']?.entry || [];

      this.scopusMatchedEids = resultados.map((r: any) => r.eid);
      this.scopusMatchedTitles = resultados.map((r: any) =>
        (r['dc:title'] || '').trim().toLowerCase()
      );

      this.aplicarFiltro();
    } catch (err: any) {
      if (err.status === 400) {
        console.warn('No se encontraron resultados para las keywords.');
      } else {
        console.error('Error al filtrar por keywords de Scopus:', err);
      }
      this.scopusMatchedEids = [];
      this.scopusMatchedTitles = [];
      this.aplicarFiltro();
    } finally {
      this.cargando = false;
    }
  }

  calcularRangoAnios(): void {
    const aniosValidos = this.publicaciones
      .map((p) => parseInt(p.year || '', 10))
      .filter((anio) => !isNaN(anio));

    if (aniosValidos.length > 0) {
      this.minAnio = Math.min(...aniosValidos);
      this.maxAnio = Math.max(...aniosValidos);
    } else {
      this.minAnio = 1900;
      this.maxAnio = new Date().getFullYear();
    }
  }

  actualizarPaginacion(): void {
    this.publicacionesPaginadas = this.publicacionesFiltradas.slice(
      this.offset,
      this.offset + this.limit
    );
  }

  paginate(direction: 'next' | 'previous'): void {
    if (direction === 'next' && this.canGoNext) {
      this.offset += this.limit;
    } else if (direction === 'previous' && this.offset > 0) {
      this.offset -= this.limit;
    }
    this.actualizarPaginacion();
  }

  limpiarFiltros(): void {
    this.filtroBusquedaGeneral = '';
    this.filtroAnio = null;
    this.tipoSeleccionado = 'Todos';
    this.filtroKeyword = '';
    this.scopusMatchedEids = [];
    this.scopusMatchedTitles = [];
    this.mensajeErrorAnio = '';
    this.aplicarFiltro();
  }

  hayFiltrosActivos(): boolean {
    return (
      this.filtroBusquedaGeneral.trim() !== '' ||
      this.filtroKeyword.trim() !== '' ||
      this.tipoSeleccionado !== 'Todos' ||
      this.filtroAnio !== null
    );
  }

  get canGoNext(): boolean {
    return this.offset + this.limit < this.publicacionesFiltradas.length;
  }

  get canGoPrevious(): boolean {
    return this.offset > 0;
  }

  verDetallesPublicacion(pubTitulo: string): void {
    this.navigationService.navigate(['/detalles-publicacion', pubTitulo]);
  }
}
