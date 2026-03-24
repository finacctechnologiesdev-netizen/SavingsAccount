import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionNumberService {

  constructor(private api: DataService) { }

  getTransactionNumber(seriesSno: number, compSno: number): Observable<any> {
    const params = {
      data: JSON.stringify({
        SeriesSno: seriesSno,
        CompSno: compSno
      })
    };
    return this.api.get('app/getTransactionNumber', params);
  }
}
