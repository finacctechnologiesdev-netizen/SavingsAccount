import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface TypeReceipt {
    RdReceiptSno?: number;
    Receipt_No: string;
    Receipt_Date: any;
    RdAccountSno: number;
    DueCount: number;
    Amount: number | string;
    SeriesSno: number | string;
    Default_Amount: number | string;
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
export class ReceiptsService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getRdReceipts';
    private readonly crudEndpoint = 'app/crudRdReceipts';

    public receiptsList: TypeReceipt[] = [];

    getReceipts(): Observable<TypeReceipt[]> {
        const params = {
            data: JSON.stringify({
                RdReceiptSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }

        return this.api.get(this.getEndpoint, params);
    }

    getReceipt(id: number): Observable<TypeReceipt[]> {
        const params = {
            data: JSON.stringify({
                RdReceiptSno: id,
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
                VouTypeSno: 22
            })
        }
        return this.api.get('app/getVoucherSeries', params);
    }

    crudReceipts(action: number, receipt: TypeReceipt): Observable<any> {
        const payload = {
            ...receipt,
            Action: action,
        };
        const body = new HttpParams()
            .set('data', JSON.stringify(payload));

        return this.api.post(this.crudEndpoint, body);
    }

    addReceipt(receipt: TypeReceipt) {
        this.receiptsList.push(receipt);
    }

    updateReceipt(receipt: TypeReceipt) {
        const index = this.receiptsList.findIndex(
            (r) => r.RdReceiptSno === receipt.RdReceiptSno
        );
        if (index !== -1) {
            this.receiptsList[index] = receipt;
        }
    }

    removeReceipt(id: number) {
        const index = this.receiptsList.findIndex(
            (r) => r.RdReceiptSno === id
        );
        if (index !== -1) {
            this.receiptsList.splice(index, 1);
        }
    }

    initializeReceipt(): TypeReceipt {
        return {
            RdReceiptSno: 0,
            Receipt_No: '',
            Receipt_Date: '',
            RdAccountSno: 0,
            DueCount: 1,
            Amount: 0,
            SeriesSno: 0,
            Default_Amount: 0,
            Remarks: '',
            CurrentRowVer: null,
            CreateDate: '',
            IsActive: 1,
            UserSno: 1,
            CompSno: Number(sessionStorage.getItem('CompSno'))
        };
    }
}
