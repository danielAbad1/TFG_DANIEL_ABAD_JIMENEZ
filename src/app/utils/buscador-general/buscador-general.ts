import { InvestigadorBuscadorInterface } from '../../interfaces/buscador-general/investigadorBuscadorInterface';
import { GrupoBuscadorInterface } from '../../interfaces/buscador-general/grupoBuscadorInterface';
import { ProyectoBuscadorInterface } from '../../interfaces/buscador-general/proyectosBuscadorInterface';
import { PublicacionBuscadorInterface } from '../../interfaces/buscador-general/publicacionBuscadorInterface';

/**
 * Funciones para transformar los resultados de las consultas SPARQL
 * en objetos específicos utilizados por el componente del Buscador General.
 */
export function formatearInvestigadores(
  bindings: any[]
): InvestigadorBuscadorInterface[] {
  return bindings.map((b) => ({
    nombre: b.nombre?.value,
    areas: b.areas?.value,
    scopusId: b.scopusId?.value || '',
    orcidId: b.orcidId?.value || '',
    dialnetId: b.dialnetId?.value || '',
  }));
}

export function formatearGrupos(bindings: any[]): GrupoBuscadorInterface[] {
  const gruposMap = new Map<string, GrupoBuscadorInterface>();

  for (const b of bindings) {
    const nombreGrupo = b.nombreGrupo?.value;
    const investigadorNombre = `${b.nombre?.value}`;

    if (!nombreGrupo) continue;

    if (!gruposMap.has(nombreGrupo)) {
      gruposMap.set(nombreGrupo, {
        nombre: nombreGrupo,
        investigadores: [investigadorNombre],
      });
    } else {
      const grupo = gruposMap.get(nombreGrupo)!;
      if (!grupo.investigadores.includes(investigadorNombre)) {
        grupo.investigadores.push(investigadorNombre);
      }
    }
  }

  return Array.from(gruposMap.values());
}

export function formatearProyectos(
  bindings: any[]
): ProyectoBuscadorInterface[] {
  return bindings.map((b) => ({
    nombre: b.nombre?.value,
    ambito: b.ambito?.value || '',
    tipo: b.projectType?.value || '',
    id: b.projectIdentifier?.value || '',
    subvencion: b.grantNumber?.value || '',
  }));
}

export function formatearPublicaciones(
  bindings: any[]
): PublicacionBuscadorInterface[] {
  return bindings.map((b) => ({
    titulo: b.titulo?.value,
    tipo: b.tipo?.value || '',
    year: b.year?.value || '',
    eid: b.eid?.value || '',
    isbn: b.isbn?.value || '',
    eissn: b.eissn?.value || '',
    editorial: b.editorial?.value || '',
  }));
}
