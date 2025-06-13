export interface DetallesPublicacionInterface {
  title?: { value: string };
  urlDialnet?: { value: string };
  urlScopus?: { value: string };
  isbn?: { value: string };
  eissn?: { value: string };
  tipoPublicacion?: { value: string };
  editorial?: { value: string };
  publicadaEnRevista?: { value: string };
  bibtex?: { value: string };
  hasPublicationYear?: { value: string };
  publisher?: { value: string };
  autores?: { value: string };
  autoresLista: string[];
  autoresExtended?: {
    name: string;
    isPolitecnica: boolean;
  }[];
}
