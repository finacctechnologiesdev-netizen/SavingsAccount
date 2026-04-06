import { Injectable } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';


export interface TypeCustomer {
    PartySno?: number;
    Party_Code: string;
    Party_Name: string;
    Print_Name: string;
    Party_Cat: number;
    AreaSno: number;
    Rel: number;
    RelName: string;
    Address1: string;
    Address2: string;
    Address3: string;
    Address4: string;
    Communication_Address: string;
    City: string;
    State: string;
    Pincode: string;
    Phone: string;
    Mobile: string;
    Email: string;
    Reference: string;
    Dob: any; // Can be number format 20030515 or string later
    Sex: number; // 0-malem, 1, female , 2 -other 
    Rating: number;
    Aadhar_No: string;
    Pancard_No: string;
    Smartcard_No: string;
    Voterid_No: string;
    Nominee: string;
    Nominee_Rel: string;
    Nominee_Aadhar: string;
    Nominee_Mobile: string;
    Remarks: string;
    Occupation: string;
    Monthly_Income: number ; // | string
    MaxLoans: number;
    Loan_Value_Limit: number;  // | string
    Allow_More_Value: number;
    Verify_Code: string;
    Verify_Status: number;
    Fp_Status: number;
    Active_Status: number;
    IsFavorite: number;
    BlackListed: number;
    Create_Date?: any;
    LedSno?: number;
    Bank_AccName: string;
    Bank_Name: string;
    Bank_Branch_Name: string;
    Bank_AccountNo: string;
    Bank_Ifsc: string;
    UserSno: number;
    CompSno: number;
    Search_Index_Col?: string;
    UserName?: string;
    RelInfo?: string;
    RelGroup?: string;
    Name?: string;
    Details?: string;
    ProfileImage?: any;
    OpenLoans?: number;
    ClosedLoans?: number;
    MaturedLoans?: number;
    AuctionedLoans?: number;
    Area_Json?: string;
    CurrentRowVer?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class CustomersService {
    private getEndpoint = 'app/getSavingsCustomers';
    private crudEndpoint = 'app/crudSavingsCustomer';

    customersList: TypeCustomer[] = [];

    constructor(private api: DataService) { }

    getCustomers(): Observable<TypeCustomer[]> {
        const params = {
            data: JSON.stringify({
                PartySno: 0,
                CompSno: sessionStorage.getItem('CompSno'),
            })
        }

        return this.api.get(this.getEndpoint, params);
    }

    getCustomer(partysno:number):Observable<TypeCustomer[]>{
        const params = {
            data: JSON.stringify(
                {
                    PartySno: partysno,
                    CompSno: sessionStorage.getItem('CompSno'),
                }
            )
        }

        return this.api.get(this.getEndpoint, params);
    }

    crudCustomer(action: number, customer: TypeCustomer): Observable<any> {
        const payload: any = { 
            ...customer, 
            Action: action,
        };

        const body = new HttpParams()
            .set('data', JSON.stringify(payload));
            
        return this.api.post(this.crudEndpoint, body);
    }

    addCustomer(customer: TypeCustomer) {
        this.customersList.push(customer);
    }

    updateCustomer(customer: TypeCustomer) {
        const index = this.customersList.findIndex(
            (c) => c.PartySno === customer.PartySno
        );
        if (index !== -1) {
            this.customersList[index] = customer;
        }
    }

    removeCustomer(id: number) {
        const index = this.customersList.findIndex(
            (c) => c.PartySno === id
        );
        if (index !== -1) {
            this.customersList.splice(index, 1);
        }
    }

    initializeCustomer(): TypeCustomer {
        return {
            PartySno: 0,
            Party_Code: '',
            Party_Name: '',
            Print_Name: '',
            Party_Cat: 0,
            AreaSno: 0,
            Rel: 0,
            RelName: '',
            Address1: '',
            Address2: '',
            Address3: '',
            Address4: '',
            Communication_Address: '',
            City: '',
            State: '',
            Pincode: '',
            Phone: '',
            Mobile: '',
            Email: '',
            Reference: '',
            Dob: '',
            Sex: 0,
            Rating: 0,
            Aadhar_No: '',
            Pancard_No: '',
            Smartcard_No: '',
            Voterid_No: '',
            Nominee: '',
            Nominee_Rel: '',
            Nominee_Aadhar: '',
            Nominee_Mobile: '',
            Remarks: '',
            Occupation: '',
            Monthly_Income: 0,
            MaxLoans: 0,
            Loan_Value_Limit: 0,
            Allow_More_Value: 0,
            Verify_Code: '',
            Verify_Status: 0,
            Fp_Status: 0,
            Active_Status: 1,
            IsFavorite: 0,
            BlackListed: 0,
            Bank_AccName: '',
            Bank_Name: '',
            Bank_Branch_Name: '',
            Bank_AccountNo: '',
            Bank_Ifsc: '',
            UserSno: 1,
            CompSno: Number(sessionStorage.getItem('CompSno')),
            CurrentRowVer: null
        };
    }
}
