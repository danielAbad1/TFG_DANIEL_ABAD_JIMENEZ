export interface PublicacionAutorInterface {
    titulo: { value: string };
    urlDialnet?: { value: string };
    urlScopus?: { value: string };
  }
  
  export interface GrupoPublicacionesAutorInterface {
    year: number;
    publicaciones: PublicacionAutorInterface[];
  }
  