import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InvestigadoresComponent } from './components/investigadores/investigadores.component';
import { DetallesInvestigadorComponent } from './components/detalles-investigador/detalles-investigador.component';
import { IndiceHInvestigadoresComponent } from './components/indice-h-investigadores/indice-h-investigadores.component';
import { PublicacionesAutorComponent } from './components/publicaciones-autor/publicaciones-autor.component';
import { DetallesPublicacionComponent } from './components/detalles-publicacion/detalles-publicacion.component';
import { GruposInvestigacionComponent } from './components/grupos-investigacion/grupos-investigacion.component';
import { DetallesGruposInvestigacionComponent } from './components/detalles-grupos-investigacion/detalles-grupos-investigacion.component';
import { ProyectosInvestigacionComponent } from './components/proyectos-investigacion/proyectos-investigacion.component';
import { DetallesProyectosInvestigacionComponent } from './components/detalles-proyectos-investigacion/detalles-proyectos-investigacion.component';
import { ScopusPublicacionesComponent } from './components/scopus/scopus-publicaciones/scopus-publicaciones.component';
import { BuscadorGeneralComponent } from './components/buscador-general/buscador-general.component';
import { ProyectosInvestigadorComponent } from './components/proyectos-investigador/proyectos-investigador.component';

/**
 * Definición de rutas de navegación del sistema.
 * Cada ruta está asociada a un componente y contiene un título informativo.
 */
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Explorador Científico' },
  },

  {
    path: 'investigadores',
    component: InvestigadoresComponent,
    data: { title: 'Investigadores' },
  },
  {
    path: 'detallesInvestigador/:nombre',
    component: DetallesInvestigadorComponent,
    data: { title: 'Detalles del Investigador' },
  },
  {
    path: 'mayorIndiceH',
    component: IndiceHInvestigadoresComponent,
    data: { title: 'Índice H de Investigadores' },
  },
  {
    path: 'publicaciones/:nombre',
    component: PublicacionesAutorComponent,
    data: { title: 'Publicaciones por Autor' },
  },
  {
    path: 'proyectosInvestigador/:nombre',
    component: ProyectosInvestigadorComponent,
    data: { title: 'Proyectos del Investigador' },
  },
  {
    path: 'detalles-publicacion/:title/:nombreAutor',
    component: DetallesPublicacionComponent,
    data: { title: 'Detalles de Publicación' },
  },
  {
    path: 'detalles-publicacion/:title',
    component: DetallesPublicacionComponent,
    data: { title: 'Detalles de Publicación' },
  },
  {
    path: 'gruposInvestigacion',
    component: GruposInvestigacionComponent,
    data: { title: 'Grupos de Investigación' },
  },
  {
    path: 'detalles-grupos-investigacion/:nombre',
    component: DetallesGruposInvestigacionComponent,
    data: { title: 'Detalles de Grupo de Investigación' },
  },
  {
    path: 'proyectosInvestigacion',
    component: ProyectosInvestigacionComponent,
    data: { title: 'Proyectos de Investigación' },
  },
  {
    path: 'detallesProyecto/:id',
    component: DetallesProyectosInvestigacionComponent,
    data: { title: 'Detalles de Proyecto' },
  },
  {
    path: 'scopus-publicaciones',
    component: ScopusPublicacionesComponent,
    data: { title: 'Publicaciones' },
  },
  {
    path: 'buscadorGeneral',
    component: BuscadorGeneralComponent,
    data: { title: 'Buscador General' },
  },

  // Ruta por defecto: redirige cualquier ruta no encontrada al inicio
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
