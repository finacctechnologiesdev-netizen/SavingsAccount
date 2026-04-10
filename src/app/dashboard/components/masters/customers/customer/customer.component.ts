import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { CustomersService, TypeCustomer } from '../customers.service';
import { InputBehaviorDirective } from '../../../../../directives/input-behavior.directive';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, InputBehaviorDirective],
  providers: [DatePipe],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})
export class CustomerComponent implements OnInit {

  Customer!: TypeCustomer;
  isEditMode = false;
  submitCount = 0;
  errors: any = {};
  activeTab = 1;

  constructor(
    private router: Router,
    public globals: GlobalService,
    private customersService: CustomersService,
    private datePipe: DatePipe,
  ) { }

  ngOnInit(): void {
    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.Customer = { ...stateData };
      // Handle date formatting for HTML <input type="date"> (requires YYYY-MM-DD)
      this.Customer.Create_Date = this.globals.ConvertApiDateToInput(this.Customer.Create_Date);
      this.Customer.Dob = this.globals.ConvertApiDateToInput(this.Customer.Dob);

    } else {
      this.isEditMode = false;
      this.Customer = this.customersService.initializeCustomer();
      this.Customer.Party_Code = 'Auto';
    }
  }

  validateFields(): boolean {
    this.errors = {};
    let isValid = true;
    const data = this.Customer;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (!data.Party_Code) setError('Party_Code', 'Code is Required');
    if (!data.Party_Name) setError('Party_Name', 'Name is Required');
    
    // Mobile Validation
    if (!data.Mobile) {
      setError('Mobile', 'Mobile is Required');
    } else if (!/^\d{10}$/.test(data.Mobile)) {
      setError('Mobile', 'Must be exactly 10 digits');
    }

    // DOB Validation
   // if (!data.Dob) setError('Dob', 'DOB is Required');
    
    // Alternative Phone Validation
    if (data.Phone && !/^\d{10}$/.test(data.Phone)){
      setError('Phone', 'Must be exactly 10 digits');
    }
    if (data.Phone == data.Mobile){
      setError('Phone', 'Must be different from Mobile');
    }

    //Nominee mobile Validation
    if (data.Nominee_Mobile && !/^\d{10}$/.test(data.Nominee_Mobile)) {
      setError('Nominee_Mobile', 'Must be exactly 10 digits');
    }
    if (data.Nominee_Mobile && data.Nominee_Mobile == data.Mobile){
      setError('Nominee_Mobile', 'Must be different from Mobile');
    }

    if (data.Nominee_Mobile && data.Nominee_Mobile == data.Phone){
      setError('Nominee_Mobile', 'Must be different from Phone');
    }

    // Email Validation
    if (data.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) {
      setError('Email', 'Invalid Email Format');
    }

    // Pincode Validation
    if (data.Pincode && !/^\d{6}$/.test(data.Pincode)) {
      setError('Pincode', 'Must be exactly 6 digits');
    }

    // Aadhar Validation
    if (data.Aadhar_No && !/^\d{12}$/.test(data.Aadhar_No)) {
      setError('Aadhar_No', 'Must be exactly 12 digits');
    }

    if (data.Nominee_Aadhar && !/^\d{12}$/.test(data.Nominee_Aadhar)) {
      setError('Nominee_Aadhar', 'Must be exactly 12 digits');
    }

    if (data.Nominee_Mobile && !/^\d{10}$/.test(data.Nominee_Mobile)) {
      setError('Nominee_Mobile', 'Must be exactly 10 digits');
    }

    // PAN Validation
    if (data.Pancard_No && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(data.Pancard_No)) {
      setError('Pancard_No', 'Invalid PAN format');
    }
    
    return isValid;
  }

  saveCustomer() {
    this.submitCount++;
    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please fill required fields');
      return;
    }

    const action = this.isEditMode ? 1 : 0;
    const payload: any = { ...this.Customer };
    
    // Convert numerical dropdown values explicitly
    // payload.Sex = Number(payload.Sex || 0);
    // payload.Rel = Number(payload.Rel || 0);

    // Convert string inputs to safe numbers for API
   // payload.Monthly_Income = Number(payload.Monthly_Income || 0);
   // payload.Loan_Value_Limit = Number(payload.Loan_Value_Limit || 0);
    // payload.MaxLoans = Number(payload.MaxLoans || 0);
    // payload.PartySno = Number(payload.PartySno || 0);
    // payload.AreaSno = Number(payload.AreaSno || 0);

    // Convert booleans
    payload.Active_Status = (payload.Active_Status === true || payload.Active_Status === 1) ? 1 : 0;

    // Convert DOB to integer format YYYYMMDD for backend
    payload.Dob = this.globals.ConvertInputDateToApi(payload.Dob);

    // Protect system properties over update
    if (this.isEditMode) {
      payload.CurrentRowVer = this.Customer.CurrentRowVer;
      
      payload.Create_Date = this.globals.ConvertInputDateToApi(payload.Create_Date);
    } else {
      payload.UserSno = 1;
      payload.CompSno = sessionStorage.getItem('CompSno');
      delete payload.CurrentRowVer;
      delete payload.Create_Date;
    }

   // console.log("Cust data sending is:",payload);
    

    this.customersService.crudCustomer(action, payload).subscribe({     
      next: (res: any) => {
        console.log(payload);
        if (res.Status === 'Success' || res.queryStatus === 1) {
          this.globals.SnackBar('success', this.isEditMode ? 'Customer updated successfully' : 'Customer created successfully');
          if (res.CurrentRowVer) {
             payload.CurrentRowVer = res.CurrentRowVer;
          }

          if (this.isEditMode) {
             this.customersService.updateCustomer(payload);
             this.router.navigate(['dashboard/masters/customers']);
          } 
          else {
             if (res.RetSno) {
              this.customersService.getCustomer(res.RetSno).subscribe({
                next: (customerRes: TypeCustomer[]) =>{
                  this.customersService.addCustomer(customerRes[0]);
                  this.router.navigate(['dashboard/masters/customers']);
                },
                error: (err) => {
                    console.error("Failed to fetch new customer:", err);
                    this.customersService.addCustomer(payload);
                    this.router.navigate(['dashboard/masters/customers']);
                  }
              })
             }
             else {
                this.customersService.addCustomer(payload);
                this.router.navigate(['dashboard/masters/customers']);
             }
          }
        } else {
          this.globals.SnackBar('error', res.Message || res.apiData || 'Operation failed');
        }
      },
      error: (err) => {
        this.globals.SnackBar('error', 'Network error or server unavailable');
        console.error(err);
      }
    });
  }

  cancelCustomer() {
    this.router.navigate(['dashboard/masters/customers']);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.Customer.ProfileImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.Customer.ProfileImage = null;
  }
}
