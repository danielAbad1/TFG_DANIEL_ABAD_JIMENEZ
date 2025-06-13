import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SparqlService } from '../../services/sparql/sparql.service';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faHome,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';
import { ProyectoInvestigadorInterface } from '../../interfaces/proyectosInvestigadorInterface';

@Component({
  selector: 'app-proyectos-investigador',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './proyectos-investigador.component.html',
  styleUrls: ['./proyectos-investigador.component.css'],
})
export class ProyectosInvestigadorComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  nombreAutor: string = '';

  /** Listas separadas según el rol */
  proyectosPrincipales: ProyectoInvestigadorInterface[] = [];
  proyectosColaboracion: ProyectoInvestigadorInterface[] = [];

  /** Stream con todos los proyectos del investigador */
  proyectos$!: Observable<ProyectoInvestigadorInterface[]>;

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

    // 1) Primero leemos el parámetro 'nombre' y lo asignamos sin condiciones
    this.route.params
      .pipe(map((params) => decodeURIComponent(params['nombre'])))
      .subscribe((nombre) => {
        this.nombreAutor = nombre;

        this.titleService.setTitle(`Proyectos de ${nombre}`);

        // 2) Una vez tenemos el nombre, inicializamos el observable proyectos$
        this.proyectos$ = this.sparqlService
          .getProyectosPorInvestigador(nombre)
          .pipe(
            map(
              (res) => res.results.bindings as ProyectoInvestigadorInterface[]
            ),
            tap((list) => {
              this.proyectosPrincipales = list.filter(
                (p) => p.role.value.toLowerCase() === 'investigador principal'
              );
              this.proyectosColaboracion = list.filter(
                (p) => p.role.value.toLowerCase() !== 'investigador principal'
              );
            })
          );
      });
  }

  /** Navega a la vista de detalles del proyecto */
  verDetallesProyecto(id: string) {
    this.navigationService.navigate(['/detallesProyecto', id]);
  }
}
