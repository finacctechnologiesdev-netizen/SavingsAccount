import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { TypeAcType } from '../../masters/account-types/account-types.service';
import { TypeCustomer } from '../../masters/customers/customers.service';

export interface TypeAcStatement {
  Type: "Receipt" | "Payment";
  Sno: number;
  TransNo: string;
  TransDate: string; 
  Amount: number;
  Payment_Mode: number;
  Reference: string;
}
export interface TypeSavingAccSummary {
    SbAcSno: number;
    SbAccount_No: string;
    Passbook_No: string;
    Remarks: string;
    CreateDate: any;
    Current_Balance: string | number;
    Party: TypeCustomer;
    JointParty: TypeCustomer;
    RefParty: TypeCustomer;
    AcStatement: TypeAcStatement[];
    AcType: TypeAcType;
}

@Injectable({
    providedIn: 'root'
})
export class SavingAccSummaryService {
    constructor(private api: DataService) { }

    getAccountSummary(accountSno: number): Observable<any> {
        const params = {
            data: JSON.stringify({
                SbAcSno: accountSno,
                CompSno: sessionStorage.getItem('CompSno')
            }),
            ClientCode: sessionStorage.getItem('ClientCode')
        };

        return this.api.get('app/getSavingsAcSummary', params);
    }
}
