import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'intToDate',
    standalone: true
})
export class IntToDatePipe implements PipeTransform {

    transform(value: any | undefined | null): string | Date {
        if (!value) return '';

        // If the value is an object like {"date": "...", "timezone": ...}
        if (typeof value === 'object') {
            if (value.date) {
                value = value.date;
            } else {
                return ''; // unrecognized object format
            }
        }

        let argDate = value.toString().trim();

        // Standard integer YYYYMMDD length from original implementation
        if (argDate.length === 8 && !isNaN(Number(argDate))) {
            let year = argDate.substring(0, 4);
            let month = argDate.substring(4, 6);
            let day = argDate.substring(6, 8);
            return new Date(year + "/" + month + "/" + day);
        }

        // Native parsing for strings like "2026-04-03 12:03:24.000000" and general ISO dates
        const parsedNode = new Date(argDate);
        if (!isNaN(parsedNode.getTime())) {
            return parsedNode;
        }

        return '';
    }

}
