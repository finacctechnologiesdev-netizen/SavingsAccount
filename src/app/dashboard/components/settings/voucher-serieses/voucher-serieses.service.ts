import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface TypeVoucherSeries {
    SeriesSno: number;
    VouType: {
        VouTypeSno: number;
    };
    Series_Name: string;
    BranchSno: number;
    Num_Method: number;
    Allow_Duplicate: number;
    Start_No: number;
    Current_No: number;
    Prefix: string;
    Suffix: string;
    Width: number;
    Prefill: string;
    MapGroup: {
        GrpSno: number;
    };
    Print_Voucher: number;
    Print_On_Save: number;
    Show_Preview: number;
    Print_Style: string;
    IsDefault: number;
    IsStd: number;
    Active_Status: number;
    Create_Date: string | number;
    UserSno: number;
    CompSno: number;
}

@Injectable({
    providedIn: 'root',
})
export class VoucherSeriesesService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getVoucherSeries';

    private readonly crudEndpoint = 'app/saveVoucherSeries';

    public seriesList: TypeVoucherSeries[] = [];

    getVoucherSeries(): Observable<TypeVoucherSeries[]> {
        const params = {
            data: JSON.stringify({
                SeriesSno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
                BranchSno: 1,
                VouTypeSno: 0
            })
        }
        return this.api.get(this.getEndpoint, params);
    }

    crudVoucherSeries(series: TypeVoucherSeries): Observable<any> {
        const payload: any = {
            ...series
        };
        
        // Ensure generic base mappings
        payload.SeriesSno = payload.SeriesSno ? Number(payload.SeriesSno) : 0;
        payload.CompSno = payload.CompSno ? Number(payload.CompSno) : 0;
        payload.UserSno = payload.UserSno ? Number(payload.UserSno) : 0;
        
        // Pass CreateDate natively as strictly empty string
        payload.Create_Date = "";

        const body = new HttpParams().set('data', JSON.stringify(payload));
        return this.api.post(this.crudEndpoint, body);
    }

    addVoucherSeries(series: TypeVoucherSeries) {
        this.seriesList.push(series);
    }

    updateVoucherSeries(series: TypeVoucherSeries) {
        const index = this.seriesList.findIndex((s) => s.SeriesSno === series.SeriesSno);
        if (index !== -1) {
            this.seriesList[index] = series;
        }
    }

    removeVoucherSeries(id: number) {
        const index = this.seriesList.findIndex((s) => s.SeriesSno === id);
        if (index !== -1) {
            this.seriesList.splice(index, 1);
        }
    }

    initializeVoucherSeries(): TypeVoucherSeries {
        return {
            SeriesSno: 0,
            VouType: {
                VouTypeSno: 0
            },
            Series_Name: '',
            BranchSno: 1,
            Num_Method: 1,
            Allow_Duplicate: 0,
            Start_No: 1,
            Current_No: 1,
            Prefix: '',
            Suffix: '',
            Width: 0,
            Prefill: '0',
            MapGroup: {
                GrpSno: 0
            },
            Print_Voucher: 0,
            Print_On_Save: 0,
            Show_Preview: 0,
            Print_Style: '',
            IsDefault: 0,
            IsStd: 0,
            Active_Status: 1,
            Create_Date: '',
            UserSno: 1,
            CompSno: Number(sessionStorage.getItem('CompSno'))
        };
    }
}
