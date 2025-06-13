import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SparqlService } from '../../services/sparql/sparql.service';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faHome,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';
import { groupProjectPersons } from '../../utils/helpers';
import {
  DetallesProyectoInvestigacionInterface,
  AssignedPersonExtended,
} from '../../interfaces/detallesProyectosInterface';

@Component({
  selector: 'app-detalles-proyectos-investigacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './detalles-proyectos-investigacion.component.html',
  styleUrls: ['./detalles-proyectos-investigacion.component.css'],
})
export class DetallesProyectosInvestigacionComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  /**
   * Observable que emite el detalle del proyecto (o null si no existe/error).
   */
  proyectoDetalles$!: Observable<DetallesProyectoInvestigacionInterface | null>;

  /**
   * Mensaje de error para mostrar en pantalla si algo falla.
   */
  errorMessage: string | null = null;

  constructor(
    private sparqlService: SparqlService,
    private route: ActivatedRoute,
    private titleService: Title,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faHome, faSpinner);
  }

  /**
   * Al inicializar, leemos el parámetro 'id' de la ruta (projectIdentifier),
   * y lanzamos la carga de detalles. Si no existe 'id', mostramos un error.
   */
  override ngOnInit(): void {
    super.ngOnInit();

    this.route.params.subscribe((params) => {
      const proyectoId = params['id'];

      if (proyectoId) {
        this.loadDetallesProyecto(proyectoId);
      } else {
        this.errorMessage = 'No se pudo cargar el identificador del proyecto.';
      }
    });
  }

  /**
   * Carga de forma encadenada:
   *  1) Obtener lista de investigadores de Politécnica para formar un Set<string> lowercase
   *  2) Obtener detalles del proyecto con getDetallesProyecto(proyectoId)
   *  3) Agrupar personas, reordenar al “Investigador Principal” arriba, y marcar isPolitecnica
   *  4) Actualizar el título de la pestaña usando el nombre del proyecto
   */
  private loadDetallesProyecto(proyectoId: string) {
    // 1) Primero pedimos todos los investigadores de la Politécnica
    this.proyectoDetalles$ = this.sparqlService.getInvestigadores().pipe(
      map((data) => {
        const politecnicaSet = new Set<string>();
        data.results.bindings.forEach((b: any) => {
          if (b.nombre && b.nombre.value) {
            politecnicaSet.add(b.nombre.value.trim().toLowerCase());
          }
        });
        return politecnicaSet;
      }),

      // 2) Con el Set en mano, pedimos detalles del proyecto
      switchMap((politecnicaSet: Set<string>) =>
        this.sparqlService.getDetallesProyecto(proyectoId).pipe(
          map((data) => {
            const groupedData = groupProjectPersons(data.results.bindings);
            if (groupedData.length === 0) {
              return null;
            }

            // Proyecto original con assignedPersons, pero sin bandera isPolitecnica
            const proyectoTemp =
              groupedData[0] as DetallesProyectoInvestigacionInterface;

            // 2.a) Si no hay assignedPersons, devolvemos tal cual
            if (
              !proyectoTemp.assignedPersons ||
              proyectoTemp.assignedPersons.length === 0
            ) {
              // 2.a.i) Actualizamos el título de la pestaña con el nombre de proyecto
              this.titleService.setTitle(`${proyectoTemp.nombre}`);
              return proyectoTemp;
            }

            // 3) Reordenamos para que “Investigador Principal” quede primero
            const principal = proyectoTemp.assignedPersons.filter(
              (person: AssignedPersonExtended) =>
                person.role.toLowerCase().trim() === 'investigador principal'
            );
            const resto = proyectoTemp.assignedPersons.filter(
              (person: AssignedPersonExtended) =>
                person.role.toLowerCase().trim() !== 'investigador principal'
            );
            proyectoTemp.assignedPersons = [...principal, ...resto];

            // 4) Marcamos isPolitecnica para cada persona
            proyectoTemp.assignedPersons = proyectoTemp.assignedPersons.map(
              (person: AssignedPersonExtended) =>
                ({
                  ...person,
                  isPolitecnica: politecnicaSet.has(
                    person.personalName.trim().toLowerCase()
                  ),
                } as AssignedPersonExtended)
            );

            // 5) Actualizamos el título de la pestaña con el nombre del proyecto
            this.titleService.setTitle(`${proyectoTemp.nombre}`);

            return proyectoTemp;
          })
        )
      ),

      // 6) Si ocurre cualquier error en las llamadas, capturamos y devolvemos null
      catchError((error) => {
        console.error('Error al cargar detalles del proyecto:', error);
        this.errorMessage = 'No se pudieron cargar los detalles del proyecto.';
        return of(null);
      })
    );
  }

  /**
   * Navega a la vista de detalles de un investigador (solo si pertenece a Politécnica).
   */
  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }
}
