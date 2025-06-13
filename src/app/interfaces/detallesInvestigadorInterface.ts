export interface DetallesInvestigadorInterface {
    nombre: { value: string };
    lastName: { value: string };
    scopusId?: { value: string };
    orcidId?: { value: string };
    dialnetId?: { value: string };
    indiceHscopus?: { value: string };
    categoriaPDI?: { value: string };
    nombreDepartamento: { value: string };
    areas: { value: string };
    gruposInvestigacion?: { value:string };
    [key: string]: any; // Permite acceder dinámicamente a las propiedades
}
