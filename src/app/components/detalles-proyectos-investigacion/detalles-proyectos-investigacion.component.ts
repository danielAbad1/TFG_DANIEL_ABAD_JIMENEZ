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
import { AcronymPipe } from '../../utils/acronym/acronym.pipe';

/**
 * Componente que muestra los detalles completos de un proyecto de investigación.
 *
 * Carga la información del proyecto desde el servicio.
 * Organiza a los participantes por rol (investigador principal primero),
 * determina si pertenecen a la Escuela Politécnica, y actualiza dinámicamente el título de la página.
 *
 * Si no se encuentra el identificador o hay un error en la carga, se muestra un mensaje adecuado.
 */
@Component({
  selector: 'app-detalles-proyectos-investigacion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, AcronymPipe],
  templateUrl: './detalles-proyectos-investigacion.component.html',
  styleUrls: ['./detalles-proyectos-investigacion.component.css'],
})
export class DetallesProyectosInvestigacionComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  proyectoDetalles$!: Observable<DetallesProyectoInvestigacionInterface | null>;

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

  private loadDetallesProyecto(proyectoId: string) {
    // Carga primero todos los nombres de investigadores de la Escuela Politécnica
    // para luego identificar cuáles de los participantes del proyecto pertenecen a ella
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

      switchMap((politecnicaSet: Set<string>) =>
        this.sparqlService.getDetallesProyecto(proyectoId).pipe(
          map((data) => {
            if (!data?.results?.bindings) {
              throw new Error('Formato inesperado en la respuesta SPARQL');
            }

            const groupedData = groupProjectPersons(data.results.bindings);
            if (groupedData.length === 0) {
              return null;
            }

            const proyectoTemp =
              groupedData[0] as DetallesProyectoInvestigacionInterface;

            if (
              !proyectoTemp.assignedPersons ||
              proyectoTemp.assignedPersons.length === 0
            ) {
              this.titleService.setTitle(`${proyectoTemp.nombre}`);
              return proyectoTemp;
            }

            // Ordena a los participantes colocando primero al investigador principal
            const principal = proyectoTemp.assignedPersons.filter(
              (person: AssignedPersonExtended) =>
                person.role.toLowerCase().trim() === 'investigador principal'
            );
            const resto = proyectoTemp.assignedPersons.filter(
              (person: AssignedPersonExtended) =>
                person.role.toLowerCase().trim() !== 'investigador principal'
            );
            proyectoTemp.assignedPersons = [...principal, ...resto];

            proyectoTemp.assignedPersons = proyectoTemp.assignedPersons.map(
              (person: AssignedPersonExtended) =>
                ({
                  ...person,
                  isPolitecnica: politecnicaSet.has(
                    (person.personalName || '').trim().toLowerCase()
                  ),
                } as AssignedPersonExtended)
            );

            this.titleService.setTitle(`${proyectoTemp.nombre}`);

            return proyectoTemp;
          })
        )
      ),
      catchError((error) => {
        console.error('Error al cargar detalles del proyecto:', error);
        this.errorMessage = 'No se pudieron cargar los detalles del proyecto.';
        return of(null);
      })
    );
  }

  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }
}
