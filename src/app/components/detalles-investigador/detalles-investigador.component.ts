import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SparqlService } from '../../services/sparql/sparql.service';
import { CommonModule } from '@angular/common';
import { DetallesInvestigadorInterface } from '../../interfaces/detallesInvestigadorInterface';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { getAreas, getGruposInvestigacion } from '../../utils/helpers';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faHome } from '@fortawesome/free-solid-svg-icons';
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
  // Observable que contiene los detalles del investigador, cargados desde el service
  detallesInvestigador$!: Observable<DetallesInvestigadorInterface[]>;

  constructor(
    private sparqlService: SparqlService, // Servicio SPARQL para obtener los detalles del investigador
    private route: ActivatedRoute, // Activar rutas para acceder a los parámetros de la URL
    private titleService: Title,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faHome);
  }

  /**
   * Se ejecuta al inicializar el componente. Realiza la configuración del observable
   * para obtener el nombre del investigador desde la URL, y luego cargar sus detalles
   * desde el servicio.
   */
  override ngOnInit(): void {
    super.ngOnInit();

    this.detallesInvestigador$ = this.route.params.pipe(
      map((params) => decodeURIComponent(params['nombre'])),

      tap((nombreDecodificado: string) => {
        this.titleService.setTitle(`${nombreDecodificado}`);
      }),

      switchMap((nombreDecodificado: string) =>
        this.sparqlService.getDetallesInvestigador(nombreDecodificado)
      ),

      map((data) => data?.results?.bindings || [])
    );
  }

  /**
   * Verifica si alguno de los objetos en `detallesInvestigador` contiene un valor para el campo especificado.
   * Se usa para comprobar si un campo opcional está presente en los datos obtenidos.
   *
   * @param detallesInvestigador - Array que contiene los detalles del investigador
   * @param field - El nombre del campo que se desea verificar
   * @returns `true` si al menos uno de los objetos contiene un valor para el campo, `false` en caso contrario.
   */
  hasField(
    detallesInvestigador: DetallesInvestigadorInterface[],
    field: string
  ): boolean {
    return detallesInvestigador.some((item) => item[field]?.value);
  }

  /**
   * Obtiene las áreas de conocimiento a partir de una cadena y las convierte en un array.
   * Utiliza la función `getAreas` del archivo de utilidades (helpers).
   *
   * @param areas - Cadena que contiene las áreas separadas por comas.
   * @returns Un array de áreas de conocimiento.
   */
  getAreas(areas: string | undefined): string[] {
    return getAreas(areas);
  }

  /**
   * Obtiene los grupos de investigación a partir de una cadena y los convierte en un array.
   * Utiliza la función `getGruposInvestigacion` del archivo de utilidades (helpers).
   *
   * @param grupos - Cadena que contiene los grupos de investigación separados por comas.
   * @returns Un array de grupos de investigación.
   */
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
}
