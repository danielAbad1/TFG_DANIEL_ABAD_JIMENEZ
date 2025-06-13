import { Component, OnInit, OnDestroy } from '@angular/core';
import { SparqlService } from '../../services/sparql/sparql.service';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faInfoCircle,
  faXmark,
  faHome,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

import { InvestigadorBuscadorInterface } from '../../interfaces/buscador-general/investigadorBuscadorInterface';
import { GrupoBuscadorInterface } from '../../interfaces/buscador-general/grupoBuscadorInterface';
import { PublicacionBuscadorInterface } from '../../interfaces/buscador-general/publicacionBuscadorInterface';
import { ProyectoBuscadorInterface } from '../../interfaces/buscador-general/proyectosBuscadorInterface';

import { normalizarTexto, paginar } from '../../utils/helpers';

import {
  formatearInvestigadores,
  formatearGrupos,
  formatearProyectos,
  formatearPublicaciones,
} from '../../utils/buscador-general/buscador-general';

import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';

import { debounceTime } from 'rxjs/operators';

/**
 * Componente que permite realizar una búsqueda general de investigadores, grupos,
 * proyectos y publicaciones relacionados con la Escuela Politécnica.
 *
 * Utiliza ´SparqlService´ para cargar los datos de investigadores, grupos, proyectos
 * y publicaciones, y permite aplicar filtros de búsqueda con paginación.
 * Los resultados se actualizan dinámicamente mientras el usuario escribe,
 * con un pequeño retardo para evitar búsquedas excesivas.
 */
@Component({
  selector: 'app-buscador-general',
  standalone: true,
  templateUrl: './buscador-general.component.html',
  styleUrls: ['./buscador-general.component.css'],
  imports: [FormsModule, CommonModule, FontAwesomeModule],
})
export class BuscadorGeneralComponent
  extends NavigationTrackedComponent
  implements OnInit, OnDestroy
{
  terminoBusqueda: string = '';
  isLoading: boolean = false;
  private datosCargados = false;

  private terminoSubject = new Subject<string>();
  private terminoSub!: Subscription;

  datos = {
    investigadores: [] as InvestigadorBuscadorInterface[],
    grupos: [] as GrupoBuscadorInterface[],
    proyectos: [] as ProyectoBuscadorInterface[],
    publicaciones: [] as PublicacionBuscadorInterface[],
  };

  resultados = {
    investigadores: [] as InvestigadorBuscadorInterface[],
    grupos: [] as GrupoBuscadorInterface[],
    proyectos: [] as ProyectoBuscadorInterface[],
    publicaciones: [] as PublicacionBuscadorInterface[],
  };

  paginados = {
    investigadores: [] as InvestigadorBuscadorInterface[],
    grupos: [] as GrupoBuscadorInterface[],
    proyectos: [] as ProyectoBuscadorInterface[],
    publicaciones: [] as PublicacionBuscadorInterface[],
  };

  limit = 3;
  offset: Record<keyof typeof this.resultados, number> = {
    investigadores: 0,
    grupos: 0,
    proyectos: 0,
    publicaciones: 0,
  };

  constructor(
    private sparqlService: SparqlService,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faInfoCircle, faXmark, faHome, faSpinner);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.cargarDatosIniciales();

    this.terminoSub = this.terminoSubject
      .pipe(debounceTime(700))
      .subscribe((term) => {
        this.ejecutarBusqueda(term);
      });
  }

  ngOnDestroy(): void {
    this.terminoSub.unsubscribe();
  }

  private async cargarDatosIniciales(): Promise<void> {
    try {
      const [invest, grupos, proyectos, publicaciones] = await Promise.all([
        firstValueFrom(this.sparqlService.getInvestigadores()),
        firstValueFrom(this.sparqlService.getGruposInvestigacion()),
        firstValueFrom(this.sparqlService.getProyectosInvestigacion()),
        firstValueFrom(this.sparqlService.getPublicacionesPolitecnica()),
      ]);

      this.datos.investigadores = formatearInvestigadores(
        invest.results.bindings
      );
      this.datos.grupos = formatearGrupos(grupos.results.bindings);
      this.datos.proyectos = formatearProyectos(proyectos.results.bindings);
      this.datos.publicaciones = formatearPublicaciones(
        publicaciones.results.bindings
      );

      for (const inv of this.datos.investigadores) {
        const nombreCompleto = `${inv.nombre}`;
        const grupo = this.datos.grupos.find((g) =>
          g.investigadores.includes(nombreCompleto)
        );
        if (grupo) {
          inv.grupo = grupo.nombre;
        }
      }
      this.datosCargados = true;
    } catch (error) {
      console.error('Error al cargar los datos del buscador general:', error);
    }
  }

  /**
   * Detecta el cambio en el término de búsqueda y lo pasa al ´Subject´
   * para ejecutar la búsqueda con un pequeño retraso.
   */
  onTerminoCambio(value: string): void {
    this.terminoBusqueda = value;
    this.terminoSubject.next(value);
    this.isLoading = true;
  }

  private ejecutarBusqueda(termino: string): void {
    try {
      if (!this.datosCargados) return;

      const term = termino.toLowerCase().trim();
      if (!term) {
        this.limpiarResultados();
        return;
      }

      const investigadoresDirectos = this.filtrarPorTermino(
        this.datos.investigadores,
        ['nombre', 'areas', 'scopusId', 'orcidId', 'dialnetId'],
        term
      );

      const gruposFiltrados = this.filtrarPorTermino(
        this.datos.grupos,
        ['nombre'],
        term
      );

      const investigadoresIndirectos =
        this.obtenerInvestigadoresDesdeGrupos(gruposFiltrados);

      const investigadores = this.fusionarInvestigadores(
        investigadoresDirectos,
        investigadoresIndirectos
      );
      this.resultados.investigadores = investigadores;

      this.resultados.grupos = this.datos.grupos
        .map((grupo) => {
          const investigadoresCoinciden = grupo.investigadores.filter(
            (nombre) => investigadores.some((inv) => inv.nombre === nombre)
          );
          return investigadoresCoinciden.length > 0
            ? { nombre: grupo.nombre, investigadores: investigadoresCoinciden }
            : null;
        })
        .filter(Boolean) as GrupoBuscadorInterface[];

      this.resultados.proyectos = this.filtrarPorTermino(
        this.datos.proyectos,
        ['nombre', 'ambito', 'tipo', 'id', 'subvencion'],
        term
      );

      const proyectosUnicos = new Map<string, ProyectoBuscadorInterface>();
      this.resultados.proyectos.forEach((proyecto) => {
        proyectosUnicos.set(proyecto.id, proyecto); 
      });

      this.resultados.proyectos = Array.from(proyectosUnicos.values());

      this.resultados.publicaciones = this.filtrarPorTermino(
        this.datos.publicaciones,
        ['titulo', 'tipo', 'year', 'eid', 'isbn', 'eissn', 'editorial'],
        term
      );

      this.resetOffsets();
      this.actualizarPaginacion();
    } finally {
      this.isLoading = false;
    }
  }

  private obtenerInvestigadoresDesdeGrupos(
    grupos: GrupoBuscadorInterface[]
  ): InvestigadorBuscadorInterface[] {
    const nombres = grupos.flatMap((grupo) => grupo.investigadores);
    return this.datos.investigadores.filter((inv) =>
      nombres.includes(inv.nombre!)
    );
  }

  private fusionarInvestigadores(
    directos: InvestigadorBuscadorInterface[],
    indirectos: InvestigadorBuscadorInterface[]
  ): InvestigadorBuscadorInterface[] {
    const mapa = new Map<string, InvestigadorBuscadorInterface>();

    [...directos, ...indirectos].forEach((inv) => {
      const key = inv.nombre!;
      if (!mapa.has(key)) {
        mapa.set(key, inv);
      } else {
        const existente = mapa.get(key)!;
        const yaCoincide =
          existente.orcidId === inv.orcidId ||
          existente.scopusId === inv.scopusId;

        if (!yaCoincide) {
          const extendedKey = `${key}__${
            inv.orcidId || inv.scopusId || Math.random()
          }`;
          mapa.set(extendedKey, inv);
        }
      }
    });

    return Array.from(mapa.values());
  }

  private filtrarPorTermino<T>(
    lista: T[],
    campos: (keyof T)[],
    termino: string
  ): T[] {
    return lista.filter((item) =>
      campos.some((campo) => {
        const valor = item[campo];
        return (
          typeof valor === 'string' &&
          normalizarTexto(valor).includes(normalizarTexto(termino))
        );
      })
    );
  }

  private limpiarResultados(): void {
    this.resultados = {
      investigadores: [],
      grupos: [],
      proyectos: [],
      publicaciones: [],
    };
    this.resetOffsets();
    this.actualizarPaginacion();
  }

  resetBusqueda(): void {
    this.terminoBusqueda = '';
    this.limpiarResultados();
  }

  private resetOffsets(): void {
    this.offset = {
      investigadores: 0,
      grupos: 0,
      proyectos: 0,
      publicaciones: 0,
    };
  }

  actualizarPaginacion(): void {
    this.paginados.investigadores = paginar(
      this.resultados.investigadores,
      this.offset.investigadores,
      this.limit
    );

    this.paginados.grupos = paginar(
      this.resultados.grupos,
      this.offset.grupos,
      this.limit
    );

    this.paginados.proyectos = paginar(
      this.resultados.proyectos,
      this.offset.proyectos,
      this.limit
    );

    this.paginados.publicaciones = paginar(
      this.resultados.publicaciones,
      this.offset.publicaciones,
      this.limit
    );
  }

  paginate(
    section: keyof typeof this.offset,
    direction: 'next' | 'previous'
  ): void {
    const incremento = direction === 'next' ? this.limit : -this.limit;
    const nuevoOffset = this.offset[section] + incremento;

    if (nuevoOffset >= 0 && nuevoOffset < this.resultados[section].length) {
      this.offset[section] = nuevoOffset;
      this.actualizarPaginacion();
    }
  }

  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }

  verDetallesProyecto(identifier: string) {
    this.navigationService.navigate(['/detallesProyecto', identifier]);
  }

  verDetallesGrupo(grupo: string) {
    this.navigationService.navigate(['/detalles-grupos-investigacion', grupo]);
  }

  verDetallesPublicacion(pubTitulo: string): void {
    this.navigationService.navigate(['/detalles-publicacion', pubTitulo]);
  }

  get todosVacios(): boolean {
    return (
      this.resultados.investigadores.length === 0 &&
      this.resultados.grupos.length === 0 &&
      this.resultados.proyectos.length === 0 &&
      this.resultados.publicaciones.length === 0
    );
  }

  trackByNombre(index: number, item: InvestigadorBuscadorInterface): string {
    return item.nombre;
  }
}
