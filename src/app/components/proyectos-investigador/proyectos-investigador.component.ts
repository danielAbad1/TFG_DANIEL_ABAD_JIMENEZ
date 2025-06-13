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
  faMoneyBillWave,
  faHandshake,
} from '@fortawesome/free-solid-svg-icons';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';
import { ProyectoInvestigadorInterface } from '../../interfaces/proyectosInvestigadorInterface';

/**
 * Componente que muestra los proyectos de investigación de un investigador específico.
 *
 * Se visualizan los proyectos en los que el investigador participa como "investigador principal" y los proyectos
 * en los que actúa como "colaborador" (investigador).
 *
 * Además, se calcula el total de las subvenciones de los proyectos en los que el investigador participa,
 * en función de su rol, es decir, el total de subvenciones de los proyectos donde el investigador es "investigador principal" o "colaborador".
 */
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
  totalSubvencionPrincipal: number = 0;
  totalSubvencionColaboracion: number = 0;

  proyectosPrincipales: ProyectoInvestigadorInterface[] = [];
  proyectosColaboracion: ProyectoInvestigadorInterface[] = [];

  proyectos$!: Observable<ProyectoInvestigadorInterface[]>;

  constructor(
    private sparqlService: SparqlService,
    private route: ActivatedRoute,
    private titleService: Title,
    navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(
      faArrowLeft,
      faHome,
      faSpinner,
      faMoneyBillWave,
      faHandshake
    );
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.route.params
      .pipe(map((params) => decodeURIComponent(params['nombre'])))
      .subscribe((nombre) => {
        this.nombreAutor = nombre;

        this.titleService.setTitle(`Proyectos de ${nombre}`);

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

              this.totalSubvencionPrincipal = this.proyectosPrincipales
                .map((p) => parseFloat(p.grantNumber?.value || '0'))
                .reduce((a, b) => a + b, 0);

              this.totalSubvencionColaboracion = this.proyectosColaboracion
                .map((p) => parseFloat(p.grantNumber?.value || '0'))
                .reduce((a, b) => a + b, 0);
            })
          );
      });
  }

  verDetallesProyecto(id: string) {
    this.navigationService.navigate(['/detallesProyecto', id]);
  }

  get totalPrincipalFormateado(): string {
    return this.totalSubvencionPrincipal.toLocaleString('es-ES') + ' €';
  }

  get totalColaboracionFormateado(): string {
    return this.totalSubvencionColaboracion.toLocaleString('es-ES') + ' €';
  }
}
