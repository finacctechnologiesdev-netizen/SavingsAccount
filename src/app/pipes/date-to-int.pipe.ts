import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dateToInt',
    standalone: true
})
export class DateToIntPipe implements PipeTransform {

    transform(value: Date | string | undefined | null): number {
        if (!value) return 0;

        // Handle string input if it's already a date string or ISO format
        let dateObj: Date;
        if (typeof value === 'string') {
            dateObj = new Date(value);
        } else {
            dateObj = value;
        }

        if (isNaN(dateObj.getTime())) return 0;

        let month: string = (dateObj.getMonth() + 1).toString();
        let day: string = dateObj.getDate().toString();
        if (month.length === 1) { month = "0" + month; }
        if (day.length === 1) { day = "0" + day; }

        return parseInt(dateObj.getFullYear().toString() + month + day);
    }

}
