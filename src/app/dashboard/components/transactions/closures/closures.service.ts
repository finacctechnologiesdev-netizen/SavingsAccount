import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface TypeClosure {
    RdClosureSno?: number;
    Closure_No: string;
    Closure_Date: any;
    RdAccountSno: number | string;
    Closure_Method: number;
    Total_Amount: number | string;
    Interest_Amount: number | string;
    Nett_Amount: number | string;
    SeriesSno: number | string;
    Remarks: string;
    CurrentRowVer?: string | null;
    CreateDate?: any;
    IsActive: number;
    UserSno: number;
    CompSno: number;
}

@Injectable({
    providedIn: 'root',
})
export class ClosuresService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getRdClosures';
    private readonly crudEndpoint = 'app/crudRdClosures';

    public closuresList: TypeClosure[] = [];

    getClosures(): Observable<TypeClosure[]> {
        const params = {
            data: JSON.stringify({
                RdClosureSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        };
        return this.api.get(this.getEndpoint, params);
    }

    getClosure(id: number): Observable<TypeClosure[]> {
        const params = {
            data: JSON.stringify({
                RdClosureSno: id,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        };
        return this.api.get(this.getEndpoint, params);
    }

    getAccountSummary(accountId: number): Observable<any> {
        const params = {
            data: JSON.stringify({
                RdAccountSno: accountId
            })
        };
        return this.api.get('app/getRdAccountSummary', params);
    }

    getVoucherSeries(): Observable<any> {
        const params = {
            data: JSON.stringify({
                SeriesSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
                BranchSno: 1,
                VouTypeSno: 23
            })
        };
        return this.api.get('app/getVoucherSeries', params);
    }

    crudClosures(action: number, closure: any): Observable<any> {
        const payload = {
            ...closure,
            Action: action,
        };
        const body = new HttpParams()
            .set('data', JSON.stringify(payload));
        return this.api.post(this.crudEndpoint, body);
    }

    addClosure(closure: TypeClosure) {
        this.closuresList.push(closure);
    }

    updateClosure(closure: TypeClosure) {
        const index = this.closuresList.findIndex(
            (c) => c.RdClosureSno === closure.RdClosureSno
        );
        if (index !== -1) {
            this.closuresList[index] = closure;
        }
    }

    removeClosure(id: number) {
        const index = this.closuresList.findIndex(
            (c) => c.RdClosureSno === id
        );
        if (index !== -1) {
            this.closuresList.splice(index, 1);
        }
    }

    getNewClosure(): TypeClosure {
        return {
            RdClosureSno: 0,
            Closure_No: '',
            Closure_Date: '',
            RdAccountSno: 0,
            Closure_Method: 1,
            Total_Amount: '',
            Interest_Amount: '',
            Nett_Amount: '',
            SeriesSno: '',
            Remarks: '',
            CurrentRowVer: null,
            IsActive: 1,
            UserSno: 1,
            CompSno: Number(sessionStorage.getItem('CompSno')),
        };
    }
}
