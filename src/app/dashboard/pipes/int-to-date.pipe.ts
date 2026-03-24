import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'intToDate',
    standalone: true
})
export class IntToDatePipe implements PipeTransform {

    transform(value: unknown, ...args: unknown[]): Date | null {
        if (!value) return null;

        if (typeof value === 'number') {
            const strVal = value.toString();
            if (strVal.length === 8) {
                const year = parseInt(strVal.substring(0, 4), 10);
                const month = parseInt(strVal.substring(4, 6), 10) - 1;
                const day = parseInt(strVal.substring(6, 8), 10);
                return new Date(year, month, day);
            }
        } else if (typeof value === 'string') {
            // Handle "YYYYMMDD" string
            if (value.length === 8 && !isNaN(Number(value))) {
                const year = parseInt(value.substring(0, 4), 10);
                const month = parseInt(value.substring(4, 6), 10) - 1;
                const day = parseInt(value.substring(6, 8), 10);
                return new Date(year, month, day);
            }
            // Handle ISO strings or other date strings
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        return null;
    }

}
