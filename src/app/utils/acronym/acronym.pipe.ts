import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizada para generar un acrónimo a partir de una cadena de texto.
 * Por ejemplo, "Escuela Politécnica" se transforma en "EP".
 *
 * Esta pipe se utiliza para mostrar acrónimos en los badges
 * de los centros asociados a investigadores
 * en el componente de detalles de un proyecto.
 */
@Pipe({
  name: 'acronym',
  standalone: true,
})
export class AcronymPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
  }
}
