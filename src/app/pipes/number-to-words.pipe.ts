import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberToWords',
  standalone: true
})
export class NumberToWordsPipe implements PipeTransform {
  transform(value: any): string {
    if (value === null || value === undefined) return '';
    const num = Math.round(Number(value));
    if (isNaN(num)) return '';
    if (num === 0) return 'ZERO ONLY /-';

    return this.convertToWords(num).toUpperCase() + ' ONLY /-';
  }

  private convertToWords(num: number): string {
    const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const doubleDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const formatTens = (n: number): string => {
      let str = '';
      if (n < 10) {
        str = singleDigits[n];
      } else if (n >= 10 && n < 20) {
        str = doubleDigits[n - 10];
      } else {
        str = tens[Math.floor(n / 10)];
        if (n % 10 !== 0) {
          str += ' ' + singleDigits[n % 10];
        }
      }
      return str;
    };

    if (num < 100) return formatTens(num);
    
    let res = '';
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const remainder = num % 100;

    if (crore > 0) res += formatTens(crore) + ' Crore ';
    if (lakh > 0) res += formatTens(lakh) + ' Lakh ';
    if (thousand > 0) res += formatTens(thousand) + ' Thousand ';
    if (hundred > 0) res += formatTens(hundred) + ' Hundred ';
    
    if (remainder > 0) {
      if (res !== '') res += 'And ';
      res += formatTens(remainder);
    }
    
    return res.trim();
  }
}
