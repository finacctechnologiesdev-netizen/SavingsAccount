import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { TypeCustomer } from '../../masters/customers/customers.service';

export interface TypeSavingAccount {
    SbAcSno?: number;
    SbAccount_No: string;
    Passbook_No: string;
    PartySno: number;
    JointPartySno: number;
    RefPartySno: number;
    AcTypeSno: number;
    Remarks: string;
    CurrentRowVer?: string | null;
    CreateDate?: any;
    IsActive: number;
    UserSno: number;
    CompSno: number;
    Party?: TypeCustomer;
}

@Injectable({
    providedIn: 'root',
})
export class SavingAccountsService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getSavingsAccounts';
    private readonly crudEndpoint = 'app/crudSavingAccount';

    public accountsList: TypeSavingAccount[] = [];

    getAccounts(): Observable<TypeSavingAccount[]> {
        const params = {
            data: JSON.stringify({
                SbAcSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }

        return this.api.get(this.getEndpoint, params).pipe(
            map((res: any) => {
                let list = res;
                if (res && res.apiData) {
                    list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
                } else if (typeof res === 'string') {
                    try { list = JSON.parse(res); } catch(e) {}
                }
                if (!Array.isArray(list)) list = [];
                return list.map((account: any) => this.parseAccountDetails(account));
            })
        );
    }

    private parseAccountDetails(account: any): TypeSavingAccount {
        if (account.Party && typeof account.Party === 'string') {
            try { account.Party = JSON.parse(account.Party); } catch (e) { }
        }
        return account;
    }

    getAccount(id: number): Observable<TypeSavingAccount[]> {
        const params = {
            data: JSON.stringify({ 
                SbAcSno: id,
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

    crudSavingsAcc(action: number, account: TypeSavingAccount): Observable<any> {
        const payload = {
            ...account,
            Action: action,
        };
        
        const body = new HttpParams()
            .set('data', JSON.stringify(payload));

        return this.api.post(this.crudEndpoint, body);
    }

    addAccount(account: TypeSavingAccount) {
        this.accountsList.push(account);
    }

    updateAccount(account: TypeSavingAccount) {
        const index = this.accountsList.findIndex(
            (a) => a.SbAcSno === account.SbAcSno
        );
        if (index !== -1) {
            this.accountsList[index] = account;
        }
    }

    removeAccount(id: number) {
        const index = this.accountsList.findIndex(
            (a) => a.SbAcSno === id
        );
        if (index !== -1) {
            this.accountsList.splice(index, 1);
        }
    }

    initializeAccount(): TypeSavingAccount {
        return {
            SbAcSno: 0,
            SbAccount_No: '',
            Passbook_No: '',
            PartySno: 0,
            JointPartySno: 0,
            RefPartySno: 0,
            AcTypeSno: 0,
            Remarks: '',
            CurrentRowVer: null,
            IsActive: 1,
            UserSno: 1,
            CompSno: Number(sessionStorage.getItem('CompSno'))
        };
    }
}
