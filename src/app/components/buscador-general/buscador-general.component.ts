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

// Interfaces tipadas para el buscador
import { InvestigadorBuscadorInterface } from '../../interfaces/buscador-general/investigadorBuscadorInterface';
import { GrupoBuscadorInterface } from '../../interfaces/buscador-general/grupoBuscadorInterface';
import { PublicacionBuscadorInterface } from '../../interfaces/buscador-general/publicacionBuscadorInterface';
import { ProyectoBuscadorInterface } from '../../interfaces/buscador-general/proyectosBuscadorInterface';

import { normalizarTexto, paginar } from '../../utils/helpers';

// Métodos de formateo
import {
  formatearInvestigadores,
  formatearGrupos,
  formatearProyectos,
  formatearPublicaciones,
} from '../../utils/buscador-general/buscador-general';

import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';

import { debounceTime } from 'rxjs/operators';

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

  // Subject para debouncing
  private terminoSubject = new Subject<string>();
  private terminoSub!: Subscription;

  // Datos originales cargados desde SPARQL
  datos = {
    investigadores: [] as InvestigadorBuscadorInterface[],
    grupos: [] as GrupoBuscadorInterface[],
    proyectos: [] as ProyectoBuscadorInterface[],
    publicaciones: [] as PublicacionBuscadorInterface[],
  };

  // Resultados filtrados en tiempo real
  resultados = {
    investigadores: [] as InvestigadorBuscadorInterface[],
    grupos: [] as GrupoBuscadorInterface[],
    proyectos: [] as ProyectoBuscadorInterface[],
    publicaciones: [] as PublicacionBuscadorInterface[],
  };

  // Resultados paginados para mostrar
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

    // Suscribirse al Subject con debounceTime para diferir la búsqueda
    this.terminoSub = this.terminoSubject
      .pipe(debounceTime(700))
      .subscribe((term) => {
        this.ejecutarBusqueda(term);
      });
  }

  ngOnDestroy(): void {
    this.terminoSub.unsubscribe();
  }

  /**
   * Carga todos los datos necesarios al iniciar el componente desde SPARQL.
   */
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
    } catch (error) {
      console.error(
        '❌ Error al cargar los datos del buscador general:',
        error
      );
    }
  }

  /**
   * Método para emitir el término en el Subject (con debounce).
   * Se llama desde el HTML en el (input).
   */
  onTerminoCambio(value: string): void {
    this.terminoBusqueda = value;
    this.terminoSubject.next(value);
    this.isLoading = true;
  }

  /**
   * Ejecuta la lógica de búsqueda (mismo cuerpo que antes en buscar()).
   */
  private ejecutarBusqueda(termino: string): void {
    const term = termino.toLowerCase().trim();
    if (!term) {
      this.limpiarResultados();
      return;
    }

    // 1. Buscar investigadores directos e indirectos
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

    // 2. Buscar grupos que tengan al menos un investigador filtrado
    this.resultados.grupos = this.datos.grupos
      .map((grupo) => {
        const investigadoresCoinciden = grupo.investigadores.filter((nombre) =>
          investigadores.some((inv) => inv.nombre === nombre)
        );
        return investigadoresCoinciden.length > 0
          ? { nombre: grupo.nombre, investigadores: investigadoresCoinciden }
          : null;
      })
      .filter(Boolean) as GrupoBuscadorInterface[];

    // 3. Buscar proyectos y publicaciones
    this.resultados.proyectos = this.filtrarPorTermino(
      this.datos.proyectos,
      ['nombre', 'ambito', 'tipo', 'id', 'subvencion'],
      term
    );

    this.resultados.publicaciones = this.filtrarPorTermino(
      this.datos.publicaciones,
      ['titulo', 'tipo', 'year', 'eid', 'isbn', 'eissn', 'editorial'],
      term
    );

    this.resetOffsets();
    this.actualizarPaginacion();

    this.isLoading = false;
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

  /**
   * Filtra una lista de objetos por los atributos indicados usando el término de búsqueda.
   */
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

  /**
   * Limpia todos los resultados cuando no hay término de búsqueda.
   */
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

  /**
   * Reinicia los offsets de paginación.
   */
  private resetOffsets(): void {
    this.offset = {
      investigadores: 0,
      grupos: 0,
      proyectos: 0,
      publicaciones: 0,
    };
  }

  /**
   * Actualiza las listas paginadas para cada sección.
   */
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

  /**
   * Mueve la paginación en una dirección para la sección indicada.
   */
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

  /**
   * Navega a la vista de detalles del investigador especificado por nombre.
   */
  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }

  /**
   * Navega a la vista de detalles del proyecto, usando su identificador.
   */
  verDetallesProyecto(identifier: string) {
    this.navigationService.navigate(['/detallesProyecto', identifier]);
  }

  /**
   * Navega a la vista de detalles del grupo de investigación.
   */
  verDetallesGrupo(grupo: string) {
    this.navigationService.navigate(['/detalles-grupos-investigacion', grupo]);
  }

  /**
   * Navega a la vista de detalles de la publicación, usando su título como parámetro.
   */
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
