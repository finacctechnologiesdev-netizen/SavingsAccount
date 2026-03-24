import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface TypeAppSetup {
  CompSno: number;
  UserSno: number;
  SchemeCode_AutoGen: number;
  SchemeCode_Prefix: string;
  SchemeCode_CurrentNo: number;
  SchemeCode_Width: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppsetupService {
  constructor(private api: DataService) {}

  private readonly getEndpoint = 'app/getRdSetup';
  private readonly updateEndpoint = 'app/updateRdSetup';

  getRdSetup(): Observable<any> {
    const params = {
      data: JSON.stringify({
        CompSno: Number(sessionStorage.getItem('CompSno')),
      }),
    };
    return this.api.get(this.getEndpoint, params);
  }

  updateRdSetup(setup: TypeAppSetup): Observable<any> {
    const payload: any = { ...setup };
    payload.CompSno =Number(payload.CompSno) || Number(sessionStorage.getItem('CompSno')) || 0;
    payload.UserSno = Number(payload.UserSno) || 1;
    payload.SchemeCode_AutoGen = Number(payload.SchemeCode_AutoGen) || 0;
    payload.SchemeCode_CurrentNo = Number(payload.SchemeCode_CurrentNo) || 0;
    payload.SchemeCode_Width = Number(payload.SchemeCode_Width) || 0;

    const body = new HttpParams().set('data', JSON.stringify(payload));
    return this.api.post(this.updateEndpoint, body);
  }

  initializeSetup(): TypeAppSetup {
    return {
      CompSno: Number(sessionStorage.getItem('CompSno')) || 1,
      UserSno: 1,
      SchemeCode_AutoGen: 0,
      SchemeCode_Prefix: '',
      SchemeCode_CurrentNo: 0,
      SchemeCode_Width: 0,
    };
  }
}
