import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Servicio que encapsula el acceso al punto SPARQL de la Universidad de Extremadura.
 * Permite realizar consultas SPARQL mediante métodos GET o POST, devolviendo los resultados en formato JSON.
 */
@Injectable({
  providedIn: 'root',
})
export class SparqlService {
  private endpoint = 'https://opendata.unex.es/sparql';

  constructor(private http: HttpClient) {}

  private readonly defaultGetHeaders = {
    Accept: 'application/sparql-results+json',
  };
  private readonly defaultPostHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/sparql-results+json',
  };

  /**
   * Ejecuta una consulta SPARQL mediante POST.
   * Recomendado para consultas largas que podrían exceder los límites de URL.
   */
  private postQuery(query: string): Observable<any> {
    const body = new HttpParams().set('query', query);
    return this.http.post(this.endpoint, body, {
      headers: this.defaultPostHeaders,
    });
  }

  /**
   * Ejecuta una consulta SPARQL mediante GET.
   */
  private getQuery(query: string): Observable<any> {
    const params = new HttpParams().set('query', query);
    return this.http.get(this.endpoint, {
      params,
      headers: this.defaultGetHeaders,
    });
  }

  /**
   * Obtiene los investigadores de la Escuela Politécnica.
   * @returns Un Observable con los resultados de la consulta.
   */
  getInvestigadores(): Observable<any> {
    const query = `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
      PREFIX vivo: <http://vivoweb.org/ontology/core#>
  
      SELECT ?nombre ?lastName ?scopusId ?orcidId ?dialnetId 
             (GROUP_CONCAT(DISTINCT ?nombreArea; separator=", ") AS ?areas)
      WHERE {
        ?centro a ou:Centro;
                foaf:name "Escuela Politécnica".
  
        ?persona ou:adscritoACentro ?centro;
                 foaf:name ?nombre;
                 foaf:lastName ?lastName;
                 ou:imparteDocenciaEnArea ?area.
  
        ?area foaf:name ?nombreArea.
  
        OPTIONAL { ?persona vivo:scopusId ?scopusId. }
        OPTIONAL { ?persona vivo:orcidId ?orcidId. }
        OPTIONAL { ?persona ou:dialnetId ?dialnetId. }
      }
      GROUP BY ?nombre ?lastName ?scopusId ?orcidId ?dialnetId
      ORDER BY ASC(?lastName)
    `;

    return this.getQuery(query);
  }

  /**
   * Obtiene los detalles de un investigador según su nombre.
   * @param nombre Nombre del investigador.
   * @returns Un Observable con los detalles del investigador.
   */

  getDetallesInvestigador(nombre: string): Observable<any> {
    const query = `
    PREFIX foaf:   <http://xmlns.com/foaf/0.1/>
    PREFIX vivo:   <http://vivoweb.org/ontology/core#>
    PREFIX ou:     <http://opendata.unex.es/def/ontouniversidad#>

    SELECT
      ?nombre
      ?lastName
      ?scopusId
      ?orcidId
      ?dialnetId
      ?indiceHscopus
      ?categoriaPDI
      ?nombreCentro
      ?campusCentro
      ?nombreDepartamento
      ?personalActual
      (GROUP_CONCAT(DISTINCT ?nombreArea; separator=", ") AS ?areas)
      ?nombreGrupo
    WHERE {
      ?persona foaf:name ?nombre;
               foaf:lastName ?lastName.
      FILTER (regex(?nombre, "${nombre}", "i"))

      OPTIONAL { 
        ?persona ou:adscritoACentro ?centro.
        ?centro foaf:name ?nombreCentro.
        OPTIONAL { ?centro ou:campusUniversitario ?campusCentro. }
      }

      OPTIONAL { ?persona ou:adscritoADepartamento ?departamento.
                 ?departamento foaf:name ?nombreDepartamento. }

      OPTIONAL { ?persona vivo:scopusId ?scopusId. }
      OPTIONAL { ?persona vivo:orcidId ?orcidId. }
      OPTIONAL { ?persona ou:dialnetId ?dialnetId. }
      OPTIONAL { ?persona ou:indiceHscopus ?indiceHscopus. }
      OPTIONAL { ?persona ou:categoriaPDI ?categoriaPDI. }

      OPTIONAL {
        ?persona ou:imparteDocenciaEnArea ?area.
        ?area foaf:name ?nombreArea.
      }

      OPTIONAL {
        ?persona ou:perteneceAGrupoInvestigacion ?grupo.
        ?grupo foaf:name ?nombreGrupo.
      }

      OPTIONAL { ?persona ou:personalActual ?personalActual. }
    }

    GROUP BY
      ?nombre
      ?lastName
      ?scopusId
      ?orcidId
      ?dialnetId
      ?indiceHscopus
      ?categoriaPDI
      ?nombreCentro
      ?campusCentro
      ?nombreDepartamento
      ?personalActual
      ?nombreGrupo
    ORDER BY ASC(?lastName)
  `;

    return this.postQuery(query);
  }

  /**
   * Obtiene la lista de investigadores de la Escuela Politécnica ordenados por su índice H en orden descendente
   * @returns Un Observable con los resultados de la consulta
   */
  getIndicesHOrdenados(): Observable<any> {
    const query = `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  
      SELECT ?nombre ?indiceH
      WHERE {
        ?centro a ou:Centro;
          foaf:name "Escuela Politécnica".
  
        ?persona ou:adscritoACentro ?centro;
          foaf:name ?nombre;
          ou:indiceHscopus ?indiceHString.
  
        BIND(xsd:integer(?indiceHString) AS ?indiceH)
      }
      ORDER BY DESC(?indiceH)
    `;

    return this.getQuery(query);
  }

  /**
   * Obtiene las publicaciones asociadas a un autor, identificándolo por su nombre.
   * @param nombreAutor Nombre completo del autor.
   * @returns Un Observable con los resultados de la consulta.
   */
  getPublicacionesPorAutor(nombreAutor: string): Observable<any> {
    const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX fabio: <http://purl.org/spar/fabio/>

    SELECT ?year ?titulo ?urlDialnet ?urlScopus
    WHERE {
      ?persona foaf:name "${nombreAutor}";
               ou:tienePublicacion ?publicacion.
      ?publicacion dcterms:title ?titulo.
      OPTIONAL { ?publicacion fabio:hasPublicationYear ?year. }
      OPTIONAL { ?publicacion ou:urlDialnet ?urlDialnet. }
      OPTIONAL { ?publicacion ou:urlScopus ?urlScopus. }
    }
    ORDER BY ?year
  `;
    return this.postQuery(query);
  }

  /**
   * Obtiene los detalles de una publicación a partir de su título.
   * @param publicacionTitle Título exacto de la publicación.
   * @returns Un Observable con los resultados detallados de la publicación.
   */
  getDetallesPublicacionPorTitulo(publicacionTitle: string): Observable<any> {
    const query = `
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX bibo: <http://purl.org/ontology/bibo/>
    PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
    PREFIX fabio: <http://purl.org/spar/fabio/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    
    SELECT ?title ?urlDialnet ?urlScopus ?isbn ?eissn ?tipoPublicacion 
           ?editorial ?publicadaEnRevista ?bibtex ?hasPublicationYear 
           ?publisher (GROUP_CONCAT(DISTINCT ?autorNombre; separator=", ") AS ?autores)
    WHERE {
      ?publicacion dcterms:title "${publicacionTitle}".
      
      ?publicacion dcterms:title ?title.
    
      ?persona ou:tienePublicacion ?publicacion.
      ?persona foaf:name ?autorNombre.
    
      OPTIONAL { ?publicacion ou:urlDialnet ?urlDialnet. }
      OPTIONAL { ?publicacion ou:urlScopus ?urlScopus. }
      OPTIONAL { ?publicacion bibo:isbn ?isbn. }
      OPTIONAL { ?publicacion bibo:eissn ?eissn. }
      OPTIONAL { ?publicacion ou:tipoPublicacion ?tipoPublicacion. }
      OPTIONAL { ?publicacion ou:editorial ?editorial. }
      OPTIONAL { ?publicacion ou:publicadaEnRevista ?publicadaEnRevista. }
      OPTIONAL { ?publicacion ou:tieneBIBTEX ?bibtex. }
      OPTIONAL { ?publicacion fabio:hasPublicationYear ?hasPublicationYear. }
      OPTIONAL { ?publicacion dcterms:publisher ?publisher. }
    }

    GROUP BY ?title ?urlDialnet ?urlScopus ?isbn ?eissn ?tipoPublicacion 
      ?editorial ?publicadaEnRevista ?bibtex ?hasPublicationYear ?publisher
  `;

    return this.postQuery(query);
  }

  /**
   * Obtiene los miembros actuales de la Escuela Politécnica que pertenecen a algún grupo de investigación.
   * @returns Un Observable con los resultados mapeados por grupo de investigación.
   */
  getGruposInvestigacion(): Observable<any> {
    const query = `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>

      SELECT ?nombre ?lastName ?nombreGrupo
      WHERE {
        ?centro a ou:Centro ;
                foaf:name "Escuela Politécnica".
      
        ?persona ou:adscritoACentro ?centro;
                 foaf:name ?nombre;
                 foaf:lastName ?lastName;
                 ou:personalActual true;
                 ou:perteneceAGrupoInvestigacion ?grupo.
      
        ?grupo foaf:name ?nombreGrupo.
      }
      ORDER BY ?nombreGrupo ?lastName
    `;

    return this.getQuery(query);
  }

  /**
   * Obtiene los miembros de grupos de investigación que NO pertenecen a la Escuela Politécnica.
   * @returns Un Observable con los miembros externos y sus grupos.
   */
  getMiembrosNoPolitecnica(): Observable<any> {
    const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    
    SELECT ?nombre ?lastName ?nombreGrupo
    WHERE {
      ?persona foaf:name ?nombre;
               foaf:lastName ?lastName;
               ou:perteneceAGrupoInvestigacion ?grupo;
               ou:personalActual ?activo.
      
      ?grupo foaf:name ?nombreGrupo.
    
      FILTER(?activo = true)
    
      FILTER NOT EXISTS {
        ?persona ou:adscritoACentro ?centro.
        ?centro foaf:name "Escuela Politécnica".
      }
    }
    ORDER BY ?nombreGrupo ?lastName
  `;

    return this.getQuery(query);
  }

  /**
   * Recupera la información detallada de un grupo de investigación específico, identificado por su nombre.
   * @param nombreGrupo Nombre exacto del grupo de investigación a consultar.
   * @returns Un Observable con los detalles del grupo.
   */
  getDetallesGrupoInvestigacion(nombreGrupo: string): Observable<any> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX aiiso: <http://purl.org/vocab/aiiso/schema#>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
  
      SELECT ?name ?coordinador ?coordinadorNombre ?lineaInvestigacion 
             ?title ?description ?departamentoNombre ?centroNombre ?campusCentro
      WHERE {
        ?grupo a ou:GrupoInvestigacion;
               foaf:name ?name.
  
        FILTER (STR(?name) = "${nombreGrupo}")
        
        OPTIONAL { ?grupo ou:coordinador ?coordinador. }
        OPTIONAL { ?grupo ou:tieneLineaInvestigacion ?lineaInvestigacion. }
        
        OPTIONAL { ?lineaInvestigacion dcterms:title ?title. }
        OPTIONAL { ?lineaInvestigacion dcterms:description ?description. }
        
        # Obtener el nombre del coordinador
        OPTIONAL { ?coordinador foaf:name ?coordinadorNombre. }
        
        # Obtener el departamento del coordinador
        OPTIONAL { 
          ?coordinador ou:adscritoADepartamento ?departamento.
          ?departamento foaf:name ?departamentoNombre.
        }
        
        # Obtener el centro del coordinador
        OPTIONAL { 
          ?coordinador ou:adscritoACentro ?centro.
          ?centro foaf:name ?centroNombre.
          OPTIONAL { ?centro ou:campusUniversitario ?campusCentro. }
        }
      }
    `;

    return this.getQuery(query);
  }

  /**
   * Obtiene los proyectos de investigación relacionados con personal adscrito a la Escuela Politécnica.
   * @returns Un Observable con los resultados de la consulta.
   */
  getProyectosInvestigacion(): Observable<any> {
    const query = `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
      PREFIX frapo: <http://purl.org/cerif/frapo/>
      PREFIX swrcfe: <http://www.morelab.deusto.es/ontologies/swrcfe#>
      
      SELECT DISTINCT
        ?projectIdentifier
        ?ambito
        ?nombre
        ?grantNumber
        ?projectType
        ?startDate
        ?endDate
        ?personalName
        ?role
      WHERE {
        ?proyecto a <http://vivoweb.org/ontology/core#ResearchProject>;
          foaf:name ?nombre.
      
        OPTIONAL { ?proyecto ou:ambitoProyecto ?ambito. }
        OPTIONAL { ?proyecto frapo:hasProjectIdentifier ?projectIdentifier. }
        OPTIONAL { ?proyecto swrcfe:projectType ?projectType. }
        OPTIONAL { ?proyecto frapo:hasStartDate ?startDate. }
        OPTIONAL { ?proyecto frapo:hasEndDate ?endDate. }
        OPTIONAL {
          ?grant a frapo:Grant;
                 frapo:hasGrantNumber ?grantNumber;
                 frapo:funds ?proyecto.
        }
      
        # Solo proyectos con al menos una persona de la Politécnica
        ?assignedPerson a swrcfe:AssignedPerson;
                        swrcfe:project ?proyecto;
                        swrcfe:role ?role.

        ?personal swrcfe:assignedTo ?assignedPerson;
                  foaf:name ?personalName;
                  ou:adscritoACentro ?centro.

        ?centro a ou:Centro;
          foaf:name "Escuela Politécnica".
      
        FILTER(
          LCASE(?role) = "investigador principal" ||
          LCASE(?role) = "investigador"
        )
      }
    `;

    return this.postQuery(query);
  }

  /**
   * Obtiene los detalles de un proyecto de investigación a partir de su identificador.
   * @param proyecto Identificador del proyecto (projectIdentifier).
   * @returns Un Observable con los datos del proyecto.
   */
  getDetallesProyecto(proyecto: string): Observable<any> {
    const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX frapo: <http://purl.org/cerif/frapo/>
    PREFIX swrcfe: <http://www.morelab.deusto.es/ontologies/swrcfe#>

    SELECT DISTINCT
      ?nombre
      ?ambito
      ?entidadFinanciadora
      ?identifier
      ?startDate
      ?endDate
      ?projectIdentifier
      ?projectType
      ?grantNumber
      ?assignedPerson
      ?role
      ?scopusId
      ?personalName
      ?personalCentro
      ?personalActual
    WHERE {
      ?proyecto a <http://vivoweb.org/ontology/core#ResearchProject>;
                foaf:name ?nombre.

      FILTER (STR(?projectIdentifier) = "${proyecto}")

      OPTIONAL { ?proyecto ou:ambitoProyecto ?ambito. }
      OPTIONAL { ?proyecto ou:entidadFinanciadora ?entidadFinanciadora. }
      OPTIONAL { ?proyecto dcterms:identifier ?identifier. }
      OPTIONAL { ?proyecto frapo:hasStartDate ?startDate. }
      OPTIONAL { ?proyecto frapo:hasEndDate ?endDate. }
      OPTIONAL { ?proyecto frapo:hasProjectIdentifier ?projectIdentifier. }
      OPTIONAL { ?proyecto swrcfe:projectType ?projectType. }

      OPTIONAL {
        ?grant a frapo:Grant;
               frapo:hasGrantNumber ?grantNumber;
               frapo:funds ?proyecto.
      }

      OPTIONAL {
        ?assignedPerson a swrcfe:AssignedPerson;
                        swrcfe:project ?proyecto;
                        swrcfe:role ?role.

        ?personal swrcfe:assignedTo ?assignedPerson;
                  foaf:name ?personalName.

        OPTIONAL { ?personal vivo:scopusId ?scopusId. }

        OPTIONAL {
          ?personal ou:adscritoACentro ?centroP.
          ?centroP foaf:name ?personalCentro.
        }

        OPTIONAL {
          ?personal ou:personalActual ?personalActual.
        }
      }
    }
    ORDER BY ?nombre
  `;

    return this.postQuery(query);
  }

  /**
   * Obtiene todas las publicaciones asociadas a miembros de la Escuela Politécnica.
   * @returns Un Observable con los resultados de las publicaciones.
   */
  getPublicacionesPolitecnica(): Observable<any> {
    const query = `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX fabio: <http://purl.org/spar/fabio/>
      PREFIX bibo: <http://purl.org/ontology/bibo/>
  
      SELECT DISTINCT ?eid ?titulo ?year ?tipo ?isbn ?eissn ?editorial
      WHERE {
        ?centro a ou:Centro;
                foaf:name "Escuela Politécnica".
  
        ?persona ou:adscritoACentro ?centro;
                 ou:tienePublicacion ?pub.
  
        ?pub dcterms:title ?titulo.
        OPTIONAL { ?pub fabio:hasPublicationYear ?year. }
        OPTIONAL { ?pub ou:eid ?eid. }
        OPTIONAL { ?pub ou:tipoPublicacion ?tipo. }
        OPTIONAL { ?pub bibo:isbn ?isbn. }
        OPTIONAL { ?pub bibo:eissn ?eissn. }
        OPTIONAL { ?pub ou:editorial ?editorial. }
      }
      ORDER BY DESC(?year)
    `;

    return this.getQuery(query);
  }

  /**
   * Obtiene los proyectos en los que participa un investigador,
   * junto con su rol (investigador principal o colaborador).
   * @param nombreAutor El nombre completo del investigador.
   * @returns Un Observable con los resultados de la consulta.
   */
  getProyectosPorInvestigador(nombreAutor: string): Observable<any> {
    const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX swrcfe: <http://www.morelab.deusto.es/ontologies/swrcfe#>
    PREFIX frapo: <http://purl.org/cerif/frapo/>

    SELECT ?projectIdentifier ?nombreProyecto ?role ?grantNumber
    WHERE {
      # Buscamos a la persona por nombre
      ?persona foaf:name "${nombreAutor}".
      ?persona swrcfe:assignedTo ?assigned.
      
      ?assigned a swrcfe:AssignedPerson;
                swrcfe:project ?proyecto;
                swrcfe:role ?role.

      ?proyecto frapo:hasProjectIdentifier ?projectIdentifier;
                foaf:name ?nombreProyecto.

      OPTIONAL {
        ?grant a frapo:Grant;
        frapo:funds ?proyecto;
        frapo:hasGrantNumber ?grantNumber.
      }
    }
    ORDER BY ?nombreProyecto
  `;
    return this.postQuery(query);
  }
}
