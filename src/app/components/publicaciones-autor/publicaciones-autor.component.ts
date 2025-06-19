import { Component, OnInit } from '@angular/core';
import { SparqlService } from '../../services/sparql/sparql.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { groupByYear } from '../../utils/helpers';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NavigationTrackedComponent } from '../../shared/navigation-tracked.component';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faDownload,
  faHome,
  faSpinner,
  faBook,
} from '@fortawesome/free-solid-svg-icons';
import {
  GrupoPublicacionesAutorInterface,
  PublicacionAutorInterface,
} from '../../interfaces/publicacionesAutorInterface';

@Component({
  selector: 'app-publicaciones-autor',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './publicaciones-autor.component.html',
  styleUrls: ['./publicaciones-autor.component.css'],
})
export class PublicacionesAutorComponent
  extends NavigationTrackedComponent
  implements OnInit
{
  publicacionesAgrupadas$!: Observable<GrupoPublicacionesAutorInterface[]>;
  publicacionesAgrupadas: GrupoPublicacionesAutorInterface[] = [];
  nombreAutor!: string;
  errorMessage: string | null = null;

  /**
   * Número de años a filtrar. 0 significa que se muestran todas las publicaciones.
   */
  filtroAnios: number = 0;
  tienePublicaciones: boolean = true;

  /**
   * Opciones predefinidas para filtrar publicaciones por años.
   */
  opcionesFiltroAnios = [
    { label: 'Todos los años', value: 0 },
    { label: 'Año actual', value: 1 },
    { label: 'Último año', value: -1 },
    { label: 'Últimos 2 años', value: 2 },
    { label: 'Últimos 3 años', value: 3 },
    { label: 'Últimos 5 años', value: 5 },
    { label: 'Últimos 10 años', value: 10 },
    { label: 'Últimos 15 años', value: 15 },
    { label: 'Últimos 20 años', value: 20 },
  ];

  totalPublicaciones = 0;
  publicacionesFiltradas = 0;

  constructor(
    private sparqlService: SparqlService,
    private route: ActivatedRoute,
    navigationService: NavigationService,
    private titleService: Title,
    private library: FaIconLibrary
  ) {
    super(navigationService);
    library.addIcons(faArrowLeft, faDownload, faHome, faSpinner, faBook);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.route.params.subscribe((params) => {
      this.nombreAutor = params['nombre'];
      this.titleService.setTitle(`Publicaciones de ${this.nombreAutor}`);
      this.loadPublicaciones();
    });
  }

  loadPublicaciones() {
    this.publicacionesAgrupadas$ = this.sparqlService
      .getPublicacionesPorAutor(this.nombreAutor)
      .pipe(
        map((data) => {
          console.log(
            '🔍 Datos originales desde SPARQL:',
            data.results.bindings
          );
          const publicacionesAgrupadas: GrupoPublicacionesAutorInterface[] =
            groupByYear(data.results.bindings);

          // Verificar si el autor tiene publicaciones
          this.tienePublicaciones = publicacionesAgrupadas.length > 0;

          console.log('🔄 Datos agrupados por año:', publicacionesAgrupadas);

          const filtradas = this.filtrarPublicacionesPorAnio(
            publicacionesAgrupadas
          );

          this.totalPublicaciones = publicacionesAgrupadas.reduce(
            (acc, grupoAnual) => acc + grupoAnual.publicaciones.length,
            0
          );

          this.publicacionesFiltradas = filtradas.reduce(
            (acc, grupoAnual) => acc + grupoAnual.publicaciones.length,
            0
          );

          this.publicacionesAgrupadas = filtradas;
          return filtradas;
        }),
        catchError((error) => {
          this.errorMessage = 'No se pudieron cargar las publicaciones';
          return of([]);
        })
      );
  }

  /**
   * Filtra las publicaciones según los años seleccionados.
   * Si `filtroAnios` es 0, devuelve todas las publicaciones.
   */
  filtrarPublicacionesPorAnio(
    publicaciones: GrupoPublicacionesAutorInterface[]
  ): GrupoPublicacionesAutorInterface[] {
    if (this.filtroAnios === 0) {
      return publicaciones;
    }

    const anioActual = new Date().getFullYear();

    if (this.filtroAnios === 1) {
      return publicaciones.filter((group) => Number(group.year) === anioActual);
    }

    if (this.filtroAnios === -1) {
      return publicaciones.filter(
        (group) => Number(group.year) === anioActual - 1
      );
    }

    // Últimos N años anteriores al actual (excluyendo el actual)
    const aniosPermitidos = Array.from(
      { length: this.filtroAnios },
      (_, i) => anioActual - 1 - i
    );

    return publicaciones.filter((group) =>
      aniosPermitidos.includes(Number(group.year))
    );
  }

  /**
   * Cambia el número de años del filtro y recarga las publicaciones filtradas.
   */
  actualizarFiltroAnios(event: any) {
    this.filtroAnios = parseInt(event.target.value, 10);
    console.log('Filtro seleccionado:', this.filtroAnios);
    this.loadPublicaciones();
  }

  /**
   * Descarga las publicaciones actuales en formato CSV.
   */
  descargarCsv() {
    if (!this.publicacionesAgrupadas.length) {
      return;
    }

    let csvContent = '\ufeffAño,Publicación,URL Dialnet,URL Scopus\n'; // <-- Agregar \ufeff para BOM UTF-8

    this.publicacionesAgrupadas.forEach(
      (group: GrupoPublicacionesAutorInterface) => {
        group.publicaciones.forEach((pub: PublicacionAutorInterface) => {
          const year = group.year || 'Sin año';
          const titulo = pub.titulo?.value || 'Sin título';
          const urlDialnet = pub.urlDialnet?.value || 'N/A';
          const urlScopus = pub.urlScopus?.value || 'N/A';

          csvContent += `"${year}","${titulo}","${urlDialnet}","${urlScopus}"\n`;
        });
      }
    );

    // Nombre del archivo
    const filtroTexto =
      this.filtroAnios === 0
        ? 'todas'
        : this.filtroAnios === 1
        ? 'anio_actual'
        : this.filtroAnios === -1
        ? 'ultimo_anio'
        : `ultimos_${this.filtroAnios}_anios`;

    const fileName = `publicaciones_${filtroTexto}_${this.nombreAutor.replace(
      /\s+/g,
      ''
    )}.csv`;

    // Crear Blob con BOM UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  verDetallesPublicacion(pubTitulo: string) {
    this.navigationService.navigate([
      '/detalles-publicacion',
      pubTitulo,
      this.nombreAutor,
    ]);
  }
}
