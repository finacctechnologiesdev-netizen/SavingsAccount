import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';


export interface TypeSavingsSetup {
  SetupSno: number;
  CompSno: number;
  AccCode_AutoGen: number;   // 1 or 0 (boolean-like)
  AccCode_Prefix: string;
  AccCode_CurrentNo: number;
  AccCode_Width: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppsetupService {
  constructor(private api: DataService) { }

  private readonly getEndpoint = 'app/getSavingsSetup';
  private readonly updateEndpoint = 'app/updateSavingsSetup';

  getRdSetup(): Observable<any> {
    const params = {
      data: JSON.stringify({
        CompSno: Number(sessionStorage.getItem('CompSno')),
      }),
    };
    return this.api.get(this.getEndpoint, params);
  }

  updateRdSetup(setup: TypeSavingsSetup): Observable<any> {
    const payload: any = { ...setup };
    const body = new HttpParams().set('data', JSON.stringify(payload));
    return this.api.post(this.updateEndpoint, body);
  }
 
  initializeSetup(): TypeSavingsSetup {
    return {
      SetupSno: 0,
      CompSno: Number(sessionStorage.getItem('CompSno')) || 1,
      AccCode_AutoGen: 0,
      AccCode_Prefix: '',
      AccCode_CurrentNo: 0,
      AccCode_Width: 0,
    };
  }
}
