import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'intToDate',
    standalone: true
})
export class IntToDatePipe implements PipeTransform {

    transform(value: number | string | undefined | null): string {
        if (!value) return '';
        let argDate = value.toString();
        if (argDate.length !== 8) return ''; // Simple validation for YYYYMMDD

        let year = argDate.substring(0, 4);
        let month = argDate.substring(4, 6);
        let day = argDate.substring(6, 8);

        let newDate = year + "/" + month + "/" + day;
        return new Date(newDate).toDateString();
    }

}
