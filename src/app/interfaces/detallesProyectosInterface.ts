export interface AssignedPersonExtended {
  personalName: string;
  role: string;
  scopusId?: string;
  isPolitecnica: boolean;
  personalCentro?: string;
  personalActual: string;
}

export interface DetallesProyectoInvestigacionInterface {
  nombre?: { value: string };
  ambito?: { value: string };
  entidadFinanciadora?: { value: string };
  identifier?: { value: string };
  startDate?: { value: string };
  endDate?: { value: string };
  projectIdentifier?: { value: string };
  projectType?: { value: string };
  grantNumber?: { value: string };
  assignedPersons?: AssignedPersonExtended[];
}
