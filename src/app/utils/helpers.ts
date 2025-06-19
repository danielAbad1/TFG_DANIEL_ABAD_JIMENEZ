import {
  AssignedPersonExtended,
  DetallesProyectoInvestigacionInterface,
} from '../interfaces/detallesProyectosInterface';

/**
 * Divide una cadena de áreas en un array de áreas separadas por comas.
 * @param areas La cadena de áreas (separada por comas).
 * @returns Un array de áreas o un array vacío si no hay áreas.
 */
export function getAreas(areas: string | undefined): string[] {
  return areas ? areas.split(',') : [];
}

/**
 * Divide una cadena de grupos de investigación en un array de grupos separados por comas.
 * @param grupos La cadena de grupos de investigación (separada por comas).
 * @returns Un array de grupos o un array vacío si no hay grupos.
 */
export function getGruposInvestigacion(grupos: string | undefined): string[] {
  return grupos ? grupos.split(';').map((g) => g.trim()) : [];
}

/**
 * Maneja los errores en las llamadas a la API, mostrando un mensaje de error al usuario
 * y registrando el error en la consola para depuración.
 * @param component El componente donde ocurre el error.
 * @param error El error recibido.
 * @param userMessage El mensaje que se muestra al usuario.
 */
export function handleError(component: any, error: any, userMessage: string) {
  console.error('Error fetching data:', error); // Log en consola para depuración
  component.errorMessage = userMessage; // Mensaje para la UI
  component.isLoading = false; // Desactivar el indicador de carga
}

/**
 * Normaliza una cadena eliminando diacríticos (acentos, tildes, etc.).
 * @param str La cadena a normalizar.
 * @returns La cadena normalizada sin diacríticos.
 */
export function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Quitar diacríticos
}

/**
 * Ordena un array de objetos por su apellido de manera alfabética.
 * @param data El array de objetos que contienen la propiedad `lastName`.
 * @returns El array ordenado alfabéticamente por `lastName`.
 */
export function sortByLastName(data: any[]): any[] {
  return data.sort((a, b) => a.lastName.localeCompare(b.lastName));
}

/**
 * Procesa y ordena los datos recibidos, normalizando los apellidos y luego ordenando la lista.
 * @param data El array de objetos que contienen la propiedad `lastName`.
 * @returns El array procesado y ordenado alfabéticamente por `lastName`.
 */
export function processData(data: any[]): any[] {
  const normalizedData = data.map((person) => ({
    ...person,
    lastName: normalizeString(person.lastName.value), // Normaliza el apellido
  }));
  return sortByLastName(normalizedData); // Utiliza la función de ordenación
}

/**
 * Función genérica para manejar la paginación.
 * Actualiza el offset y carga los datos correspondientes basándose en la dirección de la paginación.
 * @param component El componente que tiene el offset y limit.
 * @param direction La dirección de la paginación ('next' o 'previous').
 * @param loadDataFunc La función que carga los datos después de paginar.
 * @param canGoNextFunc La función que comprueba si se puede ir a la siguiente página.
 */
export function paginate(
  component: any,
  direction: 'next' | 'previous',
  loadDataFunc: () => void,
  canGoNextFunc: () => boolean
) {
  if (component.isPaginating) return; // Evita solicitudes repetidas rápidamente
  component.isPaginating = true;

  if (direction === 'next' && canGoNextFunc()) {
    component.offset += component.limit;
  } else if (direction === 'previous' && component.offset > 0) {
    component.offset = Math.max(0, component.offset - component.limit);
  }

  loadDataFunc(); // Carga los datos después de cambiar el offset
  component.isPaginating = false; // Habilitar la paginación nuevamente
}

/**
 * Verifica si se puede avanzar a la siguiente página.
 * @param limit El número de resultados por página.
 * @param offset El índice inicial de la página actual.
 * @param totalResults El número total de resultados.
 * @returns `true` si se puede avanzar a la siguiente página, `false` en caso contrario.
 */
export function canGoNext(
  limit: number,
  offset: number,
  totalResults: number
): boolean {
  return offset + limit < totalResults;
}

/**
 * Agrupa las publicaciones por año y las ordena de más reciente a más antigua.
 * @param publicaciones Array de publicaciones que contienen la propiedad `year`.
 * @returns Un array de objetos, donde cada objeto contiene el año y un array de publicaciones.
 */
export function groupByYear(publicaciones: any[]): any[] {
  const grouped: { [year: string]: any[] } = {};

  publicaciones.forEach((pub) => {
    const year = pub.year?.value || 'Sin año';
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(pub);
  });

  // Convertimos el objeto a un array y ordenamos por año en orden descendente
  return Object.keys(grouped)
    .sort((a, b) => {
      // Manejo especial para "Sin año" (lo dejamos al final)
      if (a === 'Sin año') return 1;
      if (b === 'Sin año') return -1;
      return parseInt(b) - parseInt(a); // Orden descendente
    })
    .map((year) => ({
      year,
      publicaciones: grouped[year],
    }));
}

/**
 * Procesa los datos recibidos de grupos de investigación y clasifica los miembros
 * entre los que pertenecen a la Escuela Politécnica y los que no.
 *
 * @param miembrosEscuela Array de miembros que pertenecen a la Escuela Politécnica.
 * @param otrosMiembros Array de miembros que pertenecen al grupo pero no a la Escuela Politécnica.
 * @returns Un array de objetos con nombre del grupo, miembros de la Escuela y otros miembros.
 */
export function processGroupData(
  miembrosEscuela: any[],
  otrosMiembros: any[]
): any[] {
  const gruposMap: {
    [grupo: string]: {
      personasEscuela: string[];
      otrosMiembros: string[];
    };
  } = {};

  // Procesar miembros de la Escuela Politécnica
  miembrosEscuela.forEach((item) => {
    const grupo = item.nombreGrupo?.value;
    const nombre = item.nombre?.value;
    if (!grupo || !nombre) return;

    if (!gruposMap[grupo]) {
      gruposMap[grupo] = { personasEscuela: [], otrosMiembros: [] };
    }
    gruposMap[grupo].personasEscuela.push(nombre);
  });

  // Procesar otros miembros
  otrosMiembros.forEach((item) => {
    const grupo = item.nombreGrupo?.value;
    const nombre = item.nombre?.value;
    if (!grupo || !nombre) return;

    if (!gruposMap[grupo]) {
      gruposMap[grupo] = { personasEscuela: [], otrosMiembros: [] };
    }
    gruposMap[grupo].otrosMiembros.push(nombre);
  });

  // Convertir el mapa a array
  return Object.keys(gruposMap)
    .filter((grupo) => gruposMap[grupo].personasEscuela.length > 0)
    .map((grupo) => ({
      grupo,
      personasEscuela: gruposMap[grupo].personasEscuela,
      otrosMiembros: gruposMap[grupo].otrosMiembros,
    }));
}

/**
 * Controla la lógica de paginación de los grupos de investigación y establece la página actual.
 * @param component El componente que tiene la propiedad `pageIndex` y `grupos`.
 * @param direction La dirección de la paginación ('next' o 'previous').
 */
export function paginateGroup(component: any, direction: 'next' | 'previous') {
  const groupCount = component.grupos.length;

  if (direction === 'next' && component.pageIndex < groupCount - 1) {
    component.pageIndex++;
    preloadNextGroup(component); // Pre-carga el siguiente grupo
  } else if (direction === 'previous' && component.pageIndex > 0) {
    component.pageIndex--;
  }
  component.paginateSubject.next(); // Notifica el cambio de página
}

/**
 * Pre-carga el siguiente grupo para mejorar la experiencia de usuario.
 * @param component El componente que contiene la lista de grupos y el índice de página.
 */
export function preloadNextGroup(component: any) {
  const nextIndex = component.pageIndex + 1;
  if (component.grupos[nextIndex]) {
    console.log(
      'Pre-cargando datos del siguiente grupo:',
      component.grupos[nextIndex]
    );
  }
}

/**
 * Verifica si es posible avanzar a la siguiente página de los grupos de investigación.
 * @param pageIndex El índice actual de la página.
 * @param totalItems El número total de grupos.
 * @returns true si se puede avanzar a la siguiente página, false si no.
 */
export function canGoNextGroup(pageIndex: number, totalItems: number): boolean {
  return pageIndex < totalItems - 1;
}

/**
 * Verifica si es posible retroceder a la página anterior de los grupos de investigación.
 * @param pageIndex El índice actual de la página.
 * @returns true si se puede retroceder a la página anterior, false si no.
 */
export function canGoPreviousGroup(pageIndex: number): boolean {
  return pageIndex > 0;
}

/**
 * Procesa los datos de los proyectos de investigación, verificando que las propiedades existan y normalizando los valores.
 * @param data El array de objetos que contienen las propiedades de los proyectos.
 * @returns El array procesado con los valores necesarios de los proyectos.
 */
export function processProjectData(data: any[]): any[] {
  return data.map((item) => {
    return {
      projectIdentifier: item.projectIdentifier?.value || 'No disponible',
      ambito: item.ambito?.value || 'No disponible',
      nombre: item.nombre?.value || 'No disponible',
      grantNumber: item.grantNumber?.value
        ? parseFloat(item.grantNumber.value) || 0
        : 0,
      projectType: item.projectType?.value || 'No disponible',
      startDate: item.startDate?.value || null,
      endDate: item.endDate?.value || null,
    };
  });
}

/**
 * Transforma un nombre en formato oración (capitaliza la primera letra de cada palabra).
 * @param name El nombre a transformar.
 * @returns El nombre en formato oración.
 */
export function formatName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Agrupa los datos de proyectos de investigación con las personas asignadas.
 *
 * Esta función agrupa a las personas asignadas (nombre, rol, Scopus ID)
 * bajo cada proyecto correspondiente. Además, inicializa una bandera
 * isPolitecnica = false para cada persona, que luego se actualizará
 * desde el componente según corresponda.
 *
 * @param data Array de objetos que contienen los datos de proyectos y personas asignadas.
 *             Cada objeto puede incluir:
 *               - item.nombre?.value         (Nombre del proyecto)
 *               - item.identifier?.value     (Identificador interno)
 *               - item.projectIdentifier?.value (Identificador de proyecto)
 *               - item.ambito?.value         (Ámbito)
 *               - item.projectType?.value    (Tipo de proyecto)
 *               - item.entidadFinanciadora?.value (Entidad financiadora)
 *               - item.grantNumber?.value    (Subvención)
 *               - item.startDate?.value      (Fecha de inicio)
 *               - item.endDate?.value        (Fecha de fin)
 *               - item.personalName?.value   (Nombre de la persona asignada)
 *               - item.role?.value           (Rol de la persona en este proyecto)
 *               - item.scopusId?.value       (Scopus ID de la persona)
 *
 * @returns Un array de proyectos, donde cada objeto tiene:
 *           - sus propios campos (nombre, identifier, ambito, etc.)
 *           - assignedPersons: array de objetos { personalName, role, scopusId, isPolitecnica }
 */
export function groupProjectPersons(
  data: any[]
): DetallesProyectoInvestigacionInterface[] {
  const groupedProjects: Record<string, any> = {};

  data.forEach((item) => {
    const projectName = item.nombre?.value || 'Proyecto sin nombre';

    if (!groupedProjects[projectName]) {
      groupedProjects[projectName] = {
        nombre: projectName,
        identifier: item.identifier?.value || 'No disponible',
        projectIdentifier: item.projectIdentifier?.value || 'No disponible',
        ambito: item.ambito?.value || 'No disponible',
        projectType: item.projectType?.value || 'No disponible',
        entidadFinanciadora: item.entidadFinanciadora?.value || 'No disponible',
        grantNumber: item.grantNumber?.value || 'No disponible',
        startDate: item.startDate?.value || 'No disponible',
        endDate: item.endDate?.value || 'No disponible',
        assignedPersons: [] as AssignedPersonExtended[],
      };
    }

    if (item.personalName && item.role) {
      const lit = item.personalActual?.value ?? '';
      const isActual = lit === '1' || lit.toLowerCase() === 'true';
      groupedProjects[projectName].assignedPersons.push({
        personalName: item.personalName.value,
        role: item.role.value,
        scopusId: item.scopusId?.value,
        isPolitecnica: false,
        personalCentro: item.personalCentro?.value,
        personalActual: isActual,
      });
    }
  });

  return Object.values(
    groupedProjects
  ) as DetallesProyectoInvestigacionInterface[];
}

/**
 * Pagina una lista de elementos.
 * @param lista Lista completa de elementos.
 * @param offset Índice inicial.
 * @param limit Número máximo de elementos por página.
 * @returns Sublista paginada.
 */
export function paginar<T>(lista: T[], offset: number, limit: number): T[] {
  return lista.slice(offset, offset + limit);
}

/**
 * Normaliza un texto eliminando tildes y convirtiendo a minúsculas.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD') // separa caracteres base de acentos
    .replace(/[\u0300-\u036f]/g, '') // elimina los acentos
    .toLowerCase(); // conversión a minúsculas para igualdad
}
