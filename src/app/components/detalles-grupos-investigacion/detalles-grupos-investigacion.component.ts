import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SparqlService } from '../../services/sparql/sparql.service';
import { CommonModule } from '@angular/common';
import { DetallesGruposInvestigacionInterface } from '../../interfaces/detallesGrupoInvestigacionInterface';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { formatName } from '../../utils/helpers';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faSpinner,
  faHome,
} from '@fortawesome/free-solid-svg-icons';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';

/**
 * Componente DetallesGruposInvestigacion.
 * Se encarga de obtener y mostrar los detalles de un grupo de investigación específico.
 * Los datos se obtienen de una consulta SPARQL.
 */
@Component({
  selector: 'app-detalles-grupos-investigacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './detalles-grupos-investigacion.component.html',
  styleUrls: ['./detalles-grupos-investigacion.component.css'],
})
export class DetallesGruposInvestigacionComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  /**
   * Observable que contiene los detalles del grupo de investigación.
   * Este observable se manejará asíncronamente en el template usando el pipe 'async'.
   */
  grupoDetalles$!: Observable<
    (DetallesGruposInvestigacionInterface & {
      coordinadorIsPolitecnica: boolean;
    })[]
  >;

  isLoading = true;
  errorMessage = '';

  /**
   * Constructor del componente.
   * Inyecta los servicios necesarios: SparqlService para realizar las consultas,
   * ActivatedRoute para obtener parámetros de la ruta y Title para cambiar el <title>.
   * @param sparqlService Servicio para realizar consultas SPARQL
   */
  constructor(
    private sparqlService: SparqlService,
    private route: ActivatedRoute,
    private titleService: Title,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faSpinner, faHome);
  }

  /**
   * Método que se ejecuta al inicializar el componente.
   * Lee el parámetro 'nombre' de la URL, decodifica, actualiza el título de la pestaña
   * y finalmente invoca la consulta SPARQL para cargar los detalles.
   */
  override ngOnInit(): void {
    super.ngOnInit();

    // 1) Leemos el parámetro "nombre" desde la ruta (percent-encoded)
    const nombreParam = this.route.snapshot.paramMap.get('nombre');

    if (nombreParam) {
      // 2) Decodificamos para mostrar correctamente espacios y acentos
      const nombreDecodificado = decodeURIComponent(nombreParam);

      // 3) Actualizamos el <title> de la pestaña con el nombre decodificado
      this.titleService.setTitle(`${nombreDecodificado}`);

      // 4) Llamamos al servicio usando el nombre **decodificado** (sin formatear),
      //    para que el SPARQL reciba exactamente el string que espera
      this.cargarDetallesGrupo(nombreDecodificado);
    } else {
      this.errorMessage = 'No se proporcionó un nombre de grupo válido.';
      this.isLoading = false;
    }
  }

  /**
   * Carga los detalles del grupo de investigación llamando al servicio SPARQL.
   * Formatea algunos campos para mostrarlos de forma legible y elimina HTML innecesario.
   * @param nombreGrupo El nombre del grupo de investigación que se va a consultar
   */
  private cargarDetallesGrupo(nombreGrupo: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.grupoDetalles$ = this.sparqlService
      // 1) Traemos todos los investigadores de la Politécnica
      .getInvestigadores()
      .pipe(
        map((res) => {
          const setPoli = new Set<string>();
          res.results.bindings.forEach((b: any) => {
            if (b.nombre?.value) {
              setPoli.add(b.nombre.value.trim().toLowerCase());
            }
          });
          return setPoli;
        }),

        // 2) Con ese Set, cargamos los detalles del grupo
        switchMap((setPoli: Set<string>) =>
          this.sparqlService.getDetallesGrupoInvestigacion(nombreGrupo).pipe(
            // 2.a) Extraemos bindings
            map(
              (resp: any) =>
                resp.results.bindings as DetallesGruposInvestigacionInterface[]
            ),

            // 2.b) Limpiamos/formateamos y marcamos coordinadorIsPolitecnica
            map((detalles) =>
              detalles.map((detalle) => {
                // Limpieza de HTML
                if (detalle.description?.value) {
                  detalle.description.value = detalle.description.value.replace(
                    /<\/?[^>]+(>|$)/g,
                    ''
                  );
                }
                // Formateo de nombres
                if (detalle.coordinadorNombre?.value) {
                  detalle.coordinadorNombre.value = formatName(
                    detalle.coordinadorNombre.value
                  );
                }
                if (detalle.centroNombre?.value) {
                  detalle.centroNombre.value = formatName(
                    detalle.centroNombre.value
                  );
                }
                if (detalle.departamentoNombre?.value) {
                  detalle.departamentoNombre.value = formatName(
                    detalle.departamentoNombre.value
                  );
                }
                // Marcamos si el coordinador pertenece a la Politécnica
                const isPoli =
                  !!detalle.coordinadorNombre?.value &&
                  setPoli.has(
                    detalle.coordinadorNombre.value.trim().toLowerCase()
                  );

                // Devolvemos el objeto extendido
                return {
                  ...detalle,
                  coordinadorIsPolitecnica: isPoli,
                };
              })
            ),

            // 2.c) Cuando llegan los detalles, ya no estamos cargando
            tap(() => (this.isLoading = false))
          )
        ),

        // 3) En caso de error global
        catchError((error) => {
          console.error('Error al cargar detalles del grupo:', error);
          this.errorMessage = 'No se pudieron cargar los detalles del grupo.';
          this.isLoading = false;
          // devolvemos un array vacío para que la plantilla no rompa
          return of(
            [] as Array<
              DetallesGruposInvestigacionInterface & {
                coordinadorIsPolitecnica: boolean;
              }
            >
          );
        })
      );
  }

  /**
   * Navega a la vista de detalles del investigador especificado por nombre.
   */
  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }
}
