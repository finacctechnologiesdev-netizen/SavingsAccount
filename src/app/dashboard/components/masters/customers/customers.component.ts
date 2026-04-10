import { Component, effect, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { CustomersService, TypeCustomer } from './customers.service';
import { PrintService } from '../../../../services/print.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [TableviewComponent, RouterOutlet],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {

  constructor(
    public customersService: CustomersService,
    public globals: GlobalService,
    private router: Router,
    public printService: PrintService,
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.router.url === '/dashboard/masters/customers') {
          this.DataSource.set([...this.customersService.customersList]);
        }
      }
    });
  }

  DataSource = signal<TypeCustomer[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Party_Code', Data_Type: 'string' },
    { Field_Name: 'Party_Name', Data_Type: 'string' },
    // { Field_Name: 'Phone', Data_Type: 'string' },
    { Field_Name: 'Mobile', Data_Type: 'string' },
    { Field_Name: 'Reference', Data_Type: 'string' },
    { Field_Name: 'Create_Date', Data_Type: 'date' },
    { Field_Name: 'Active_Status', Data_Type: 'boolean' },
    { Field_Name: 'Actions', Data_Type: 'string' },
  ]);

  ngOnInit(): void {
    if (this.customersService.customersList.length === 0) {
      this.loadCustomers();
    } else {
      this.DataSource.set([...this.customersService.customersList]);
    }
  }

  loadCustomers(){
    this.customersService.getCustomers().subscribe({
      next: (res) =>{
        this.customersService.customersList = res;
        res.forEach((customer: TypeCustomer) => {
          customer.Create_Date = customer.Create_Date;
        });
        this.DataSource.set(res);
      },
      error: (err) => {
        console.error('Network Error', err);
      },
    })
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }

    if (event.Action === 1) { // Edit
      this.editCustomer(event.Data);
    } else if (event.Action === 2) { // Delete
      this.deleteCustomer(event.Data);
    } else if (event.Action === 3) { // Print
      //this.globals.SnackBar('error', 'Print feature not implemented yet');
      const printdata = { ...event.Data };
      console.log(printdata);
      const printInput = this.generateAccountPrintTemplate(printdata);
      this.printService.printContent(printInput);
    } else if (event.Action === 'Email') { // Mail
      this.globals.SnackBar('info', 'Email sent successfully via ' + event.Data.Email || 'system');
    }
  }
  generateAccountPrintTemplate(data: any): string {
    const rootUrl = document.baseURI
      ? document.baseURI.replace(/\/$/, '')
      : window.location.origin;
    const logoUrl = rootUrl + '/assets/images/yourspay.jpeg';
    data.Create_Date = this.globals.formatDateToDDMMYYYY(data.Create_Date);
    let gender = '';
    if (data.Sex === 0) gender = 'Male';
    else if (data.Sex === 1) gender = 'Female';
    else if (data.Sex === 2) gender = 'Other';

    const dobFormatted = data.Dob
      ? this.globals.formatDateToDDMMYYYY(data.Dob)
      : '';

    let CompAddress =
      sessionStorage.getItem('CompAddress1') +
      ', ' +
      (sessionStorage.getItem('CompAddress2') || '') +
      ', ' +
      (sessionStorage.getItem('CompAddress3') || '');
    if (!sessionStorage.getItem('CompAddress1')) {
      CompAddress =
        'RAJ COMPLEX, GROUND FLOOR, NO. 21, YERCAUD MAIN ROAD, HASTHAMPATTI, SALEM-636008.';
    }

    let compName = sessionStorage.getItem('Comp_Name') || '';
    console.log(compName);
    
    // if (!compName) {
    //   compName = 'Salem Yourspay Capital Limited';
    // }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer KYC Form - Print Ready</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
        /* General Styles */
        body {
            font-family: 'Roboto', Arial, sans-serif;
            background-color: #f0f0f0;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .form-container {
            width: 794px; /* A4 Width roughly */
            background-color: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
            min-height: 1123px; /* A4 height roughly */
            display: flex;
            flex-direction: column;
        }

        /* Header Section */
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 0px;
            flex-shrink: 0;
        }

        .logo-section {
            width: 120px;
            text-align: center;
        }
        
        .logo-section img {
            max-width: 100%;
            height: auto;
            max-height: 100px;
        }

        .header-details {
            flex-grow: 1;
            text-align: center;
            padding: 0 15px;
        }

        .company-name {
            font-size: 28px;
            font-weight: 800;
            color: #333;
            margin-bottom: 8px;
        }

        .address-bar {
            font-size: 14px;
            font-weight: 700;
            font-style: bold;
            background-color: #4a86e8 !important; /* Blue background */
            color: white !important;
            padding: 6px;
            -webkit-print-color-adjust: exact; /* Forces color in print */
        }

        .photo-box {
            width: 100px;
            height: 100px;
            border: 1px solid #666;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #999;
            margin-left: 0px;
            overflow: hidden;
        }

        h2.form-title {
            text-align: center;
            font-size: 20px;
            margin: 10px 0 20px 0;
            font-weight: 600;
            color: #333;
            flex-shrink: 0;
        }

        /* Form Row Logic */
        .form-row {
            display: flex;
            align-items: flex-end; /* Align to bottom */
            margin-bottom: 20px;
            flex-shrink: 0;
        }

        .label {
            width: 220px;
            font-size: 16px;
            font-style: bold;
            color: #333;
            font-weight: 500;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .colon {
            width: 10px;
            font-weight: 600;
            text-align: center;
            flex-shrink: 0;
            margin-right: 15px; /* Creates the space AFTER the colon */
        }

        /* Value area */
        .value-area {
            flex-grow: 1; /* By default fills the rest of the row */
            border: 0.5px solid #ccc;
            height: 24px;
            padding: 2px 8px;
            font-size: 14px;
            color: #111;
            background: #fff;
            display: flex;
            align-items: center;
            box-sizing: border-box;
        }
        
        .half-row {
            display: flex;
            flex-grow: 1;
            justify-content: space-between;
        }

        .half-col {
            display: flex;
            align-items: flex-end;
            flex: 1;
        }

        .half-col:nth-child(2) {
            margin-left: 20px;
        }

        .half-col .label { 
            width: 120px; 
            flex-shrink: 0;
        }

        /* Fixed width modifiers for exact match */
        .w-60 { width: 60%; flex-grow: 0; }
        .w-80 { width: 80%; flex-grow: 0; }
        .w-50 { width: 50%; flex-grow: 0; }
        .w-40 { width: 40%; flex-grow: 0; }
        
        .full-width { flex-grow: 1; width: 100%; }

        /* Footer */
        .footer {
            margin-top: 45px;
            display: flex;
            justify-content: space-between;
            font-weight: 700;
            font-size: 16px;
            font-style: bold;
            color: #333;
            padding-top: 50px;
        }

        /* PRINT SETTINGS */
        @media print {
            body { background: none; padding: 0; }
            .form-container { box-shadow: none; width: 100%; border: none; min-height: 100vh; padding: 20px; }
            .address-bar { background-color: #4a86e8 !important; color: white !important; }
            .value-area { border: 1px solid #333 !important; }
            .photo-box { border: 1px solid #333 !important; }
        }
    </style>
</head>
<body>

<div class="form-container">
    <div class="header">
         <div class="logo-section">
            <img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"> 
        </div>
        <div class="header-details">
            <div class="company-name">${sessionStorage.getItem('CompName') || 'Salem Yourspay Capital Limited'}</div>
            <div class="address-bar">
                ADDRESS: ${CompAddress}
            </div>
        </div>
        <div class="photo-box">
            ${data.ProfileImage ? `<img src="${data.ProfileImage}" style="width: 100%; height: 100%; object-fit: cover;">` : 'Photo'}
        </div>
    </div>

    <h2 class="form-title">Customer KYC Form</h2>

    <div class="form-row">
        <div class="label">Branch Name</div><div class="colon">:</div>
        <div class="value-area w-50">${compName}</div>
    </div>

    <div class="form-row">
        <div class="label">Customer ID</div><div class="colon">:</div>
        <div class="value-area w-50">${data.Party_Code || 'NIL'}</div>
    </div>

    <div class="form-row">
        <div class="label">Customer Date</div><div class="colon">:</div>
        <div class="value-area w-50">${data.Create_Date || 'NIL'}</div>
    </div>

    <div class="form-row">
        <div class="label">Customer Name</div><div class="colon">:</div>
        <div class="value-area w-60">${data.Party_Name || 'NIL'}</div>
    </div>

    <div class="form-row">
        <div class="label">Customer Mobile Number</div><div class="colon">:</div>
        <div class="value-area w-40">${data.Mobile || 'NIL'}</div>
    </div>

    <div class="form-row">
        <div class="label">Aadhar no</div><div class="colon">:</div>
        <div class="value-area w-40">${data.Aadhar_No || 'NIL'}</div>
    </div>

    <div class="form-row">
        <div class="half-col">
            <div class="label">PAN No</div><div class="colon">:</div>
            <div class="value-area">${data.Pancard_No || 'NIL'}</div>
        </div>
        <div class="half-col">
            <div class="label" style="width: auto; padding-right: 10px;">Date Of Birth</div><div class="colon">:</div>
            <div class="value-area">${dobFormatted || 'NIL'}</div>
        </div>
    </div>

    <div class="form-row" style="margin-top: 18px; margin-bottom: 5px;">
        <div class="label">Address</div><div class="colon">:</div>
        <div class="value-area full-width">${data.Address1 || 'NIL'} ${data.Address1? "," : ""} ${data.Address2}</div>
    </div>
    <div class="form-row">
        <div class="value-area" style="width: 100%;">${data.City} ${data.City? "," : ""}  ${data.State} ${data.State? "," : ""} ${data.Pincode}</div>
    </div>

    <div class="form-row">
        <div class="half-col">
            <div class="label">City</div><div class="colon">:</div>
            <div class="value-area">${data.City || 'NIL'}</div>
        </div>
        <div class="half-col">
            <div class="label" style="width: auto; padding-right: 10px;">State</div><div class="colon">:</div>
            <div class="value-area">${data.State || 'NIL'}</div>
        </div>
    </div>

    <div class="form-row">
        <div class="half-col">
            <div class="label">Pin Code</div><div class="colon">:</div>
            <div class="value-area">${data.Pincode || 'NIL'}</div>
        </div>
        <div class="half-col">
            <div class="label" style="width: auto; padding-right: 10px;">Voter ID</div><div class="colon">:</div>
            <div class="value-area">${data.Voterid_No || 'NIL'}</div>
        </div>
    </div>

    <div class="form-row">
        <div class="half-col">
            <div class="label">Occupation</div><div class="colon">:</div>
            <div class="value-area">${data.Occupation || 'NIL'}</div>
        </div>
        <div class="half-col">
            <div class="label" style="width: auto; padding-right: 10px;">Gender</div><div class="colon">:</div>
            <div class="value-area">${gender || 'NIL'}</div>
        </div>
    </div>

    <div class="form-row" style="margin-top: 25px;">
        <div class="label">Nominee Name </div><div class="colon">:</div>
        <div class="value-area w-60">${data.RelName || 'NIL'}</div>
    </div>

    <div class="form-row">
        <div class="label">Nominee Mobile Number</div><div class="colon">:</div>
        <div class="value-area w-40">${data.Nominee_Mobile || 'NIL'}</div>
    </div>

    <div class="form-row">
        <div class="label">Nominee Relation</div><div class="colon">:</div>
        <div class="value-area w-40">${data.Nominee_Rel || 'NIL'}</div>
    </div>

    <div class="footer">
        <div>Branch Office</div>
        <div>Customer Signature</div>
    </div>
</div>

</body>
</html>
    `;
  }


  editCustomer(customer: TypeCustomer) {
    this.router.navigate(['dashboard/masters/customers/customer'], {
      state: { data: customer },
    });
  }

  createNew() {
    this.router.navigate(['dashboard/masters/customers/customer']);
  }

  deleteCustomer(customer: TypeCustomer) {
    this.globals.MsgBox(2, 'Are you sure you want to delete this customer?').then((result) => {
      if (result === 1) {
        const payload = { ...customer };
        payload.PartySno = Number(payload.PartySno || 0);
        payload.CompSno = 1;
        payload.UserSno = 1;

        this.customersService.crudCustomer(2, payload).subscribe({
          next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
              this.globals.SnackBar('success', 'Customer deleted successfully');
              this.customersService.removeCustomer(payload.PartySno!);
              this.DataSource.set([...this.customersService.customersList]);
            } else {
              this.globals.SnackBar('error',res.Message || 'Failed to delete customer');
            }
          },
          error: (err) => {
            this.globals.SnackBar('error', 'Error while deleting customer');
            console.error(err);
          }
        });
      }
    });
  }
}
