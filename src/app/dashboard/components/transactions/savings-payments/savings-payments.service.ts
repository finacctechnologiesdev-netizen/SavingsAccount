import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface TypeSavingsPayment {
    PaymentSno?: number;
    SeriesSno: number | string;
    Payment_No: string;
    Payment_Date: any;
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
export class SavingsPaymentsService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getSavingsPayments';
    private readonly crudEndpoint = 'app/crudSavingsPayment';

    public paymentsList: TypeSavingsPayment[] = [];

    getPayments(): Observable<TypeSavingsPayment[]> {
        const params = {
            data: JSON.stringify({
                SbAcSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }

        return this.api.get(this.getEndpoint, params);
    }

    getPayment(id: number): Observable<TypeSavingsPayment[]> {
        const params = {
            data: JSON.stringify({
                PaymentSno: id,
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

    crudPayments(action: number, payment: TypeSavingsPayment): Observable<any> {
        const payload = {
            ...payment,
            Action: action,
        };
        const body = new HttpParams()
            .set('data', JSON.stringify(payload));

        return this.api.post(this.crudEndpoint, body);
    }

    addPayment(payment: TypeSavingsPayment) {
        this.paymentsList.push(payment);
    }

    updatePayment(payment: TypeSavingsPayment) {
        const index = this.paymentsList.findIndex(
            (r) => r.PaymentSno === payment.PaymentSno
        );
        if (index !== -1) {
            this.paymentsList[index] = payment;
        }
    }

    removePayment(id: number) {
        const index = this.paymentsList.findIndex(
            (r) => r.PaymentSno === id
        );
        if (index !== -1) {
            this.paymentsList.splice(index, 1);
        }
    }

    initializePayment(): TypeSavingsPayment {
        return {
            PaymentSno: 0,
            Payment_No: '',
            Payment_Date: '',
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


