import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface TypeSavingsReceipt {
    ReceiptSno?: number;
    SeriesSno: number | string;
    Receipt_No: string;
    Receipt_Date: any;
    SbAcSno: number;
    Amount: number | string;
    Payment_Mode: number;
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
export class SavingsReceiptsService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getSavingsReceipts';
    private readonly crudEndpoint = 'app/crudSavingsReceipt';

    public receiptsList: TypeSavingsReceipt[] = [];

    getReceipts(): Observable<TypeSavingsReceipt[]> {
        const params = {
            data: JSON.stringify({
                SbAcSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }

        return this.api.get(this.getEndpoint, params);
    }

    getReceipt(id: number): Observable<TypeSavingsReceipt[]> {
        const params = {
            data: JSON.stringify({
                ReceiptSno: id,
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

    getSavingsCurrentBalance(SbAcSno: number, asOn: string): Observable<any> {
        const params = {
            data: JSON.stringify({
                SbAcSno: SbAcSno,
                AsOn: asOn,
                CompSno: sessionStorage.getItem('CompSno')
            }),
            ClientCode: sessionStorage.getItem('ClientCode')
        };
        return this.api.get('app/getSavingsCurrentBalance', params);
    }

    getVoucherSeries(): Observable<any> {
        const params = {
            data: JSON.stringify({
                SeriesSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
                BranchSno: 1,
                VouTypeSno: 27
            })
        }
        return this.api.get('app/getVoucherSeries', params);
    }

    crudReceipts(action: number, receipt: TypeSavingsReceipt): Observable<any> {
        const payload = {
            ...receipt,
            Action: action,
        };
        const body = new HttpParams()
            .set('data', JSON.stringify(payload));

        return this.api.post(this.crudEndpoint, body);
    }

    addReceipt(receipt: TypeSavingsReceipt) {
        this.receiptsList.push(receipt);
    }

    updateReceipt(receipt: TypeSavingsReceipt) {
        const index = this.receiptsList.findIndex(
            (r) => r.ReceiptSno === receipt.ReceiptSno
        );
        if (index !== -1) {
            this.receiptsList[index] = receipt;
        }
    }

    removeReceipt(id: number) {
        const index = this.receiptsList.findIndex(
            (r) => r.ReceiptSno === id
        );
        if (index !== -1) {
            this.receiptsList.splice(index, 1);
        }
    }

    initializeReceipt(): TypeSavingsReceipt {
        return {
            ReceiptSno: 0,
            Receipt_No: '',
            Receipt_Date: '',
            SbAcSno: 0,
            Amount: 0,
            Payment_Mode: 1,
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
