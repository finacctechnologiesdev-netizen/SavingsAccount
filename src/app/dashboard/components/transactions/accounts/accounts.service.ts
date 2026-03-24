import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { TypeAcType as TypeScheme } from '../../masters/account-types/account-types.service';
import { TypeCustomer } from '../../masters/customers/customers.service';
import { TypeVoucherSeries } from '../../settings/voucher-serieses/voucher-serieses.service';


export interface TypeAccount {
    RdAccountSno?: number;
    Account_No: string;
    Account_Date: any;
    PartySno: number;
    RdSchemeSno: number;
    Mature_Date: any;
    SeriesSno: number | string;
    Mature_Amount: number | string;
    Reference: string;
    Remarks: string;
    CurrentRowVer?: string | null;
    CreateDate: any;
    IsActive: number;
    UserSno: number;
    CompSno: number;
    Scheme?: TypeScheme;
    Party?: TypeCustomer;
    Series?: TypeVoucherSeries;
}


@Injectable({
    providedIn: 'root',
})
export class AccountsService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getRdAccounts';
    private readonly crudEndpoint = 'app/crudRdAccounts';

    public accountsList: TypeAccount[] = [];

    getAccounts(): Observable<TypeAccount[]> {
        const params = {
            data: JSON.stringify({
                RdAccountSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }

        return this.api.get(this.getEndpoint, params).pipe(
            map((res: any) => {
                const list = Array.isArray(res) ? res : [];
                return list.map(account => this.parseAccountDetails(account));
            })
        );
    }

    private parseAccountDetails(account: any): TypeAccount {
        if (account.Scheme && typeof account.Scheme === 'string') {
            try { account.Scheme = JSON.parse(account.Scheme); } catch (e) { }
        }
        if (account.Party && typeof account.Party === 'string') {
            try { account.Party = JSON.parse(account.Party); } catch (e) { }
        }
        if (account.Series && typeof account.Series === 'string') {
            try { account.Series = JSON.parse(account.Series); } catch (e) { }
        }
        return account;
    }

    getAccount(id: number): Observable<TypeAccount[]> {
        const params = {
            data: JSON.stringify({ 
                RdAccountSno: id,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }
        return this.api.get(this.getEndpoint, params).pipe(
            map((res: any) => {
                const list = Array.isArray(res) ? res : [];
                return list.map(account => this.parseAccountDetails(account));
            })
        );
    }

    getVoucherSeries(): Observable<any> {
        const params = {
            data: JSON.stringify({
                SeriesSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
                BranchSno: 1,
                VouTypeSno: 21
            })
        }
        return this.api.get('app/getVoucherSeries', params);
    }

    crudAccounts(action: number, account: TypeAccount): Observable<any> {
        
        const payload = {
            ...account,
            Action: action,
        };
        //console.log(account.Mature_Date);
        
        const body = new HttpParams()
            .set('data', JSON.stringify(payload));

        return this.api.post(this.crudEndpoint, body);
    }

    addAccount(account: TypeAccount) {
        this.accountsList.push(account);
    }

    updateAccount(account: TypeAccount) {
        const index = this.accountsList.findIndex(
            (a) => a.RdAccountSno === account.RdAccountSno
        );
        if (index !== -1) {
            this.accountsList[index] = account;
        }
    }

    removeAccount(id: number) {
        const index = this.accountsList.findIndex(
            (a) => a.RdAccountSno === id
        );
        if (index !== -1) {
            this.accountsList.splice(index, 1);
        }
    }

    initializeAccount(): TypeAccount {
        return {
            RdAccountSno: 0,
            Account_No: '',
            Account_Date: '',
            PartySno: 0,
            RdSchemeSno: 0,
            Mature_Date: '',
            SeriesSno: 0,
            Mature_Amount: 0,
            Reference: '',
            Remarks: '',
            CurrentRowVer: null,
            CreateDate: '',
            IsActive: 1,
            UserSno: 1,
            CompSno: Number(sessionStorage.getItem('CompSno'))
        };
    }
}
