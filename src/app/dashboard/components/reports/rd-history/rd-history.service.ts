import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';

export interface TypeRdHistory {
    RdAccountSno: number;
    Account_No: string;
    Account_Date: any;
    Mature_Date: any;
    PartySno: number;
    Party_Name: string;
    Mobile: string;
    RdSchemeSno: number;
    RdScheme_Code: string;
    RdScheme_Name: string;
    Due_Period: number;
    DueAmount: string | number;
    Due_Frequency: number;
    Roi: string | number;
    Maturity_Amount: string | number;
    Paid_Dues: number;
    Balance_Dues: number;
    Paid_Amount: string | number;
    Balance_Amount: string | number;
    Pending_Dues: number;
    Pending_Amount: string | number;
    Account_Status: number;
    CompSno: number;
    UserSno: number;
    MaturityAmount: string | number;
}

@Injectable({
    providedIn: 'root'
})
export class RdHistoryService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getRdHistory';

    public historyList: TypeRdHistory[] = [];

    getRdHistory(fromDate: string, toDate: string): Observable<TypeRdHistory[]> {
        const params = {
            data: JSON.stringify({
                FromDate: fromDate,
                ToDate: toDate,
                AccountStatus: 0,
                CompSno: sessionStorage.getItem('CompSno')
            })
        };

        return this.api.get(this.getEndpoint, params);
    }
}
