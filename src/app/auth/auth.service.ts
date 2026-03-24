import { Injectable } from '@angular/core';
import { DataService } from '../services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface Client {
  ClientSno: number;
  Client_Code: string;
  Client_Name: string;
  Address: string;
  State: string;
  Mobile: string;
  Alternate_Mobile: string;
  Email: string;
  Contact_Person: string;
  Creation_Date: number;
  Subscription_Start: number;
  Subscription_End: number;
  App_Login: string;
  App_Pwd: string;
  Db_Name: string;
  Status: number;
  Version_Type: number;
  Own_Server: number;
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private api: DataService) { }

  ClientInfo: Client[] = [];

  private authUrl = 'auth/CheckUserandgetCompanies';

  login(
    App_Login: string,
    App_Pwd: string,
    ClientCode: string,
  ): Observable<any> {
    const body = new HttpParams().set(
      'data',
      JSON.stringify({ App_Login, App_Pwd }),
    );

    return this.api.post<any>(this.authUrl, body, { ClientCode });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('AuthToken');
  }
}
