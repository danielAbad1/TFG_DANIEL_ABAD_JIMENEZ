export interface ProyectoInterface {
  projectIdentifier: string;
  ambito: string;
  nombre: string;
  grantNumber?: number | null;
  projectType: string;
  startDate?: string; 
  endDate?: string;
}
