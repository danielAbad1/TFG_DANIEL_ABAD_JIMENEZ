export interface DetallesInvestigadorInterface {
  nombre: { value: string };
  lastName: { value: string };
  scopusId?: { value: string };
  orcidId?: { value: string };
  dialnetId?: { value: string };
  indiceHscopus?: { value: string };
  categoriaPDI?: { value: string };
  nombreCentro?: { value: string };
  campusCentro?: { value: string };
  nombreDepartamento?: { value: string };
  areas?: { value: string };
  nombreGrupo?: { value: string };
  gruposInvestigacion?: { value: string };
  personalActual?: { value: string };
  [key: string]: any;
}
