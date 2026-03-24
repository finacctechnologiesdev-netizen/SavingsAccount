import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface TypeSavingsIntPosting {
    PostingSno?: number;
    SeriesSno: number | string;
    Posting_No: string;
    Posting_Date: any;
    SbAcSno: number;
    Amount: number | string;
    Reference: string;
    Remarks: string;
    CurrentRowVer?: string | null;
    CreateDate: any;
    IsActive: number;
    UserSno: number;
    CompSno: number;
}

@Injectable({
    providedIn: 'root',
})
export class SavingsIntPostingsService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getSavingsIntPostings';
    private readonly crudEndpoint = 'app/crudSavingsIntPosting';

    public intPostingsList: TypeSavingsIntPosting[] = [];

    getIntPostings(): Observable<TypeSavingsIntPosting[]> {
        const params = {
            data: JSON.stringify({
                SbAcSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }

        return this.api.get(this.getEndpoint, params);
    }

    getIntPosting(id: number): Observable<TypeSavingsIntPosting[]> {
        const params = {
            data: JSON.stringify({
                PostingSno: id,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        };
        return this.api.get(this.getEndpoint, params);
    }

    getAccountSummary(accountId: number): Observable<any> {
        const params = {
            data: JSON.stringify({
                SbAcSno: accountId
            })
        };
        return this.api.get('app/getSavingsAcSummary', params);
    }

    getVoucherSeries(): Observable<any> {
        const params = {
            data: JSON.stringify({
                SeriesSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
                BranchSno: 1,
                VouTypeSno: 22
            })
        }
        return this.api.get('app/getVoucherSeries', params);
    }

    crudIntPostings(action: number, intPosting: TypeSavingsIntPosting): Observable<any> {
        const payload = {
            ...intPosting,
            Action: action,
        };
        const body = new HttpParams()
            .set('data', JSON.stringify(payload));

        return this.api.post(this.crudEndpoint, body);
    }

    addIntPosting(intPosting: TypeSavingsIntPosting) {
        this.intPostingsList.push(intPosting);
    }

    updateIntPosting(intPosting: TypeSavingsIntPosting) {
        const index = this.intPostingsList.findIndex(
            (r) => r.PostingSno === intPosting.PostingSno
        );
        if (index !== -1) {
            this.intPostingsList[index] = intPosting;
        }
    }

    removeIntPosting(id: number) {
        const index = this.intPostingsList.findIndex(
            (r) => r.PostingSno === id
        );
        if (index !== -1) {
            this.intPostingsList.splice(index, 1);
        }
    }

    initializeIntPosting(): TypeSavingsIntPosting {
        return {
            PostingSno: 0,
            Posting_No: '',
            Posting_Date: '',
            SbAcSno: 0,
            Amount: 0,
            Reference: '',
            SeriesSno: 0,
            Remarks: '',
            CurrentRowVer: null,
            CreateDate: '',
            IsActive: 1,
            UserSno: 1,
            CompSno: Number(sessionStorage.getItem('CompSno'))
        };
    }
}



