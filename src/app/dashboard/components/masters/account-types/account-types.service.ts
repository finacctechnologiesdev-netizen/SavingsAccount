import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service'
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface TypeAcType {
    AcTypeSno?: number; 
    AcType_Code: string;
    AcType_Name: string;
    Min_Balance: number | string;
    Roi: number | string;
    Ac_Category: number;
    Remarks: string;
    CurrentRowVer?: string | null;
    CreateDate?: any;
    IsActive: number;
    UserSno: number;
    CompSno: number;

    RdSchemeSno?: any;
    RdScheme_Code?: any;
    RdScheme_Name?: any;
    DueAmount?: any;
    Due_Period?: any;
    Maturity_Amount?: any;
    Due_Frequency?: any;
    Default_Charges?: any;
}

@Injectable({
    providedIn: 'root',
})
export class AccountTypesService {
    constructor(private api: DataService) { }

    private readonly getEndpoint = 'app/getAcTypes';
    private readonly crudEndpoint = 'app/crudAcType';

    public acTypesList: TypeAcType[] = [];

    // Legacy aliases for compilation (will be removed when migrating transactions)
    get schemesList() { return this.acTypesList; }
    set schemesList(val) { this.acTypesList = val; }
    getSchemes() { return this.getAcTypes(); }

    getAcTypes(): Observable<TypeAcType[]> {
        const params = {
            data: JSON.stringify({
                SbAcSno: 0, // Following current api quirk
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }
        return this.api.get(this.getEndpoint, params);
    }

    crudAcType( action: number, acType: TypeAcType): Observable<any> {
        const payload: any = { 
            Action: action,
            ...acType, 
        };
        
        const body = new HttpParams()
            .set('data', JSON.stringify(payload));
            
        return this.api.post(this.crudEndpoint, body);
    }

    addAcType(acType: TypeAcType) {
        this.acTypesList.push(acType);
    }

    updateAcType(acType: TypeAcType) {
        const index = this.acTypesList.findIndex(
            (s) => s.AcTypeSno === acType.AcTypeSno
        );
        if (index !== -1) {
            this.acTypesList[index] = acType;
        }
    }

    removeAcType(id: number) {
        const index = this.acTypesList.findIndex(
            (s) => s.AcTypeSno === id
        );
        if (index !== -1) {
            this.acTypesList.splice(index, 1);
        }
    }

    initializeAcType(): TypeAcType {
        return {
            AcTypeSno: 0,
            AcType_Code: '',
            AcType_Name: '',
            Min_Balance: '',
            Roi: '',
            Ac_Category: 1, // Defaulting to Savings Account assuming 1
            Remarks: '',
            CurrentRowVer: '',
            CreateDate: '',
            IsActive: 1,
            UserSno: 1,
            CompSno: Number(sessionStorage.getItem('CompSno'))
        };
    }
}
