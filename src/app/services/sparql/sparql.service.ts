import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SparqlService {
  private endpoint = 'https://opendata.unex.es/sparql'; // URL del punto de acceso SPARQL

  constructor(private http: HttpClient) {}

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

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

  /**
   * Obtiene el número total de investigadores de la Escuela Politécnica.
   * @returns Un Observable con el número total de investigadores.
   */
  getTotalInvestigadores(): Observable<any> {
    const query = `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
  
      SELECT (COUNT(DISTINCT ?persona) AS ?totalResults)
      WHERE {
        ?centro a ou:Centro;
          foaf:name "Escuela Politécnica".
  
        ?persona ou:adscritoACentro ?centro;
          foaf:name ?nombre;
          foaf:lastName ?lastName.
  
        ?persona ou:imparteDocenciaEnArea ?area.
          ?area foaf:name ?nombreArea.
      }
    `;

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

  /**
   * Obtiene los detalles de un investigador en particular, utilizando su nombre para realizar la búsqueda.
   * @param nombre El nombre del investigador para realizar la búsqueda.
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
      ?nombreDepartamento
      (GROUP_CONCAT(DISTINCT ?nombreArea; separator=", ") AS ?areas)
      (GROUP_CONCAT(DISTINCT ?nombreGrupo; separator=", ") AS ?gruposInvestigacion)
    
      WHERE {
      ?persona foaf:name ?nombre;
               foaf:lastName ?lastName.
      FILTER (regex(?nombre, "${nombre}", "i"))

      OPTIONAL {
        ?persona ou:adscritoACentro ?centro.
        ?centro foaf:name ?nombreCentro.
      }

      OPTIONAL {
        ?persona ou:adscritoADepartamento ?departamento.
        ?departamento foaf:name ?nombreDepartamento.
      }

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
      ?nombreDepartamento
    ORDER BY ASC(?lastName)
  `;

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };
    return this.http.get(this.endpoint, { params, headers });
  }

  getMayorIndiceH(): Observable<any> {
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

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

  /**
   * Obtiene el número total de investigadores de la Escuela Politécnica que tienen índice H.
   * @returns Un Observable con el número total de investigadores con índice H.
   */
  getTotalInvestigadoresIndiceH(): Observable<any> {
    const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>

    SELECT (COUNT(DISTINCT ?persona) AS ?totalResults)
    WHERE {
      ?centro a ou:Centro;
        foaf:name "Escuela Politécnica".

      ?persona ou:adscritoACentro ?centro;
        foaf:name ?nombre;
        ou:indiceHscopus ?indiceH.  
    }
  `;

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

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

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

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

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

  getGruposInvestigacion(): Observable<any> {
    const query = `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>

      SELECT ?nombre ?lastName ?nombreGrupo
      WHERE {
        ?centro a ou:Centro ;
                foaf:name "Escuela Politécnica" .
      
        ?persona ou:adscritoACentro ?centro ;
                 foaf:name ?nombre ;
                 foaf:lastName ?lastName ;
                 ou:personalActual true ;
                 ou:perteneceAGrupoInvestigacion ?grupo .
      
        ?grupo foaf:name ?nombreGrupo .
      }
      ORDER BY ?nombreGrupo ?lastName
    `;

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
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
      ?persona foaf:name ?nombre ;
               foaf:lastName ?lastName ;
               ou:perteneceAGrupoInvestigacion ?grupo ;
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

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

  getTotalGrupos(): Observable<any> {
    const query = `
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
  
      SELECT (COUNT(DISTINCT ?grupo) AS ?totalResults)
      WHERE {
        # Filtrar por el centro "Escuela Politécnica"
        ?centro a ou:Centro;
          foaf:name "Escuela Politécnica".
  
        # Obtener personas adscritas al centro y grupos de investigación
        ?persona ou:adscritoACentro ?centro;
          foaf:name ?nombre;
          foaf:lastName ?lastName.
  
        ?persona ou:perteneceAGrupoInvestigacion ?grupo.    
        ?grupo foaf:name ?nombreGrupo.
      }
    `;

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

  getDetallesGrupoInvestigacion(nombreGrupo: string): Observable<any> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX aiiso: <http://purl.org/vocab/aiiso/schema#>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX ou: <http://opendata.unex.es/def/ontouniversidad#>
  
      SELECT ?name ?coordinador ?coordinadorNombre ?lineaInvestigacion 
             ?title ?description ?departamentoNombre ?centroNombre
      WHERE {
        ?grupo a ou:GrupoInvestigacion;
               foaf:name ?name.
  
        # Filtro para asegurar que el grupo sea el especificado
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
        }
      }
    `;

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

  getProyectosInvestigacion(): Observable<any> {
    const query = `
      PREFIX foaf:   <http://xmlns.com/foaf/0.1/>
      PREFIX ou:     <http://opendata.unex.es/def/ontouniversidad#>
      PREFIX frapo:  <http://purl.org/cerif/frapo/>
      PREFIX swrcfe: <http://www.morelab.deusto.es/ontologies/swrcfe#>
      
      SELECT DISTINCT
        ?projectIdentifier
        ?ambito
        ?nombre
        ?grantNumber
        ?projectType
        ?startDate
        ?endDate
      WHERE {
        # Datos básicos de cada proyecto
        ?proyecto a <http://vivoweb.org/ontology/core#ResearchProject> ;
                  foaf:name            ?nombre .
      
        OPTIONAL { ?proyecto ou:ambitoProyecto        ?ambito. }
        OPTIONAL { ?proyecto frapo:hasProjectIdentifier ?projectIdentifier. }
        OPTIONAL { ?proyecto swrcfe:projectType        ?projectType. }
        OPTIONAL { ?proyecto frapo:hasStartDate        ?startDate. }
        OPTIONAL { ?proyecto frapo:hasEndDate          ?endDate. }
        OPTIONAL {
          ?grant a frapo:Grant ;
                 frapo:hasGrantNumber  ?grantNumber ;
                 frapo:funds           ?proyecto .
        }
      
        # Solo proyectos con al menos un AssignedPerson de la Politécnica
        ?assignedPerson a swrcfe:AssignedPerson ;
                        swrcfe:project ?proyecto ;
                        swrcfe:role    ?role .
        ?personal swrcfe:assignedTo    ?assignedPerson ;
                  foaf:name            ?personalName ;
                  ou:adscritoACentro   ?centro .
        ?centro   a ou:Centro ;
                  foaf:name           "Escuela Politécnica" .
      
        FILTER(
          LCASE(?role) = "investigador principal" ||
          LCASE(?role) = "investigador"
        )
      }
    `;

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

  getDetallesProyecto(proyecto: string): Observable<any> {
    const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX ou:   <http://opendata.unex.es/def/ontouniversidad#>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX frapo:   <http://purl.org/cerif/frapo/>
    PREFIX swrcfe:  <http://www.morelab.deusto.es/ontologies/swrcfe#>

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

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }

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

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
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
  
      SELECT ?projectIdentifier ?nombreProyecto ?role
      WHERE {
        # Buscamos a la persona por nombre
        ?persona foaf:name "${nombreAutor}" .
  
          # La persona está “assignedTo” un AssignedPerson, de ahí obtenemos proyecto y rol
          ?persona swrcfe:assignedTo ?assigned .
          ?assigned a swrcfe:AssignedPerson ;
            swrcfe:project ?proyecto ;
            swrcfe:role ?role .
  
        # Del proyecto sacamos su identificador y nombre
        ?proyecto frapo:hasProjectIdentifier ?projectIdentifier ;
                  foaf:name ?nombreProyecto .
      }
      ORDER BY ?nombreProyecto
  `;

    const params = new HttpParams().set('query', query);
    const headers = { Accept: 'application/sparql-results+json' };

    return this.http.get(this.endpoint, { params, headers });
  }
}
