import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SparqlService } from '../../services/sparql/sparql.service';
import { CommonModule } from '@angular/common';
import { DetallesGruposInvestigacionInterface } from '../../interfaces/detallesGrupoInvestigacionInterface';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
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
 * Componente que muestra los detalles de un grupo de investigación específico.
 *
 * Presenta información como el coordinador, su sede principal
 * (centro y departamento) y las líneas de investigación asociadas al grupo.
 *
 * También permite navegar a los detalles del coordinador.
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
  grupoDetalles$!: Observable<DetallesGruposInvestigacionInterface[]>;

  isLoading = true;
  errorMessage = '';

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

  override ngOnInit(): void {
    super.ngOnInit();

    const nombreParam = this.route.snapshot.paramMap.get('nombre');

    if (nombreParam) {
      const nombreDecodificado = decodeURIComponent(nombreParam);

      this.titleService.setTitle(`${nombreDecodificado}`);

      this.cargarDetallesGrupo(nombreDecodificado);
    } else {
      this.errorMessage = 'No se proporcionó un nombre de grupo válido.';
      this.isLoading = false;
    }
  }

  private cargarDetallesGrupo(nombreGrupo: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.grupoDetalles$ = this.sparqlService
      .getDetallesGrupoInvestigacion(nombreGrupo)
      .pipe(
        map(
          (resp: any) =>
            resp.results.bindings as DetallesGruposInvestigacionInterface[]
        ),

        map((detalles) =>
          detalles.map((detalle) => {
            if (detalle.description?.value) {
              detalle.description.value = detalle.description.value.replace(
                /<\/?[^>]+(>|$)/g,
                ''
              );
            }
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

            return detalle;
          })
        ),

        tap(() => (this.isLoading = false)),

        catchError((error) => {
          console.error('Error al cargar detalles del grupo:', error);
          this.errorMessage = 'No se pudieron cargar los detalles del grupo.';
          this.isLoading = false;
          return of([] as DetallesGruposInvestigacionInterface[]);
        })
      );
  }

  verDetallesInvestigador(nombre: string) {
    this.navigationService.navigate(['/detallesInvestigador', nombre]);
  }
}
