import { Component, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { Router } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { AccountsService, TypeAccount } from './accounts.service';
import { CustomersService, TypeCustomer } from '../../masters/customers/customers.service';
//import { SchemesService, TypeScheme } from '../../masters/schemes/schemes.service';
import { forkJoin, of } from 'rxjs';
import { CommonModule, getLocaleMonthNames } from '@angular/common';
import { PrintService } from '../../../../services/print.service';
import { NumberToWordsPipe } from '../../../../pipes/number-to-words.pipe';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [TableviewComponent, CommonModule, NumberToWordsPipe],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent implements OnInit {

  constructor(
    public accountsService: AccountsService,
    public customersService: CustomersService,
    //public schemesService: SchemesService,
    public globals: GlobalService,
    private router: Router,
    private printService: PrintService
  ) {
  }
  // Date filters
  fromDate: string = new Date().toISOString().split('T')[0];
  toDate: string = new Date().toISOString().split('T')[0];



  DataSource = signal<any[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Account_No', Data_Type: 'string' },
    { Field_Name: 'Party_Name', Data_Type: 'string', Display_Name: 'Customer Name' },
    { Field_Name: 'RdScheme_Name', Data_Type: 'string', Display_Name: 'Scheme Name' },
    { Field_Name: 'Account_Date', Data_Type: 'date' },
    { Field_Name: 'Mature_Date', Data_Type: 'date' },
    { Field_Name: 'Mature_Amount', Data_Type: 'string' },
    { Field_Name: 'Reference', Data_Type: 'string' },
    { Field_Name: 'Actions', Data_Type: 'string' },
  ]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    const accountsObs = this.accountsService.accountsList.length > 0
      ? of(this.accountsService.accountsList)
      : this.accountsService.getAccounts();

    accountsObs.subscribe({
      next: (res) => {
        this.accountsService.accountsList = res;
        this.updateDataSource(res);
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load accounts data');
      },
    });
  }

  updateDataSource(list: TypeAccount[]) {
    const formattedList = list.map(account => {
      let accDate = account.Account_Date;
      let matDate = account.Mature_Date;

      let parsedCustomer: any = account.Party || null;
      let parsedScheme: any = account.Scheme || null;

      return {
        ...account,
        parsedCustomer: parsedCustomer,
        parsedScheme: parsedScheme,
        Party_Name: parsedCustomer ? parsedCustomer.Party_Name : 'Unknown',
        RdScheme_Name: parsedScheme ? parsedScheme.RdScheme_Name : 'Unknown',
        Account_Date: this.globals.formateDateForTable(accDate),
        Mature_Date: this.globals.formateDateForTable(matDate),
      };
    });

    this.DataSource.set(formattedList);
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }

    if (event.Action === 1) { // Edit
      this.editAccount(event.Data);
    } else if (event.Action === 2) { // Delete
      this.deleteAccount(event.Data);
    } else if (event.Action === 3) { // Print
      // Clone the record so we don't accidentally mutate the original table integer dates into strings
      const printData = { ...event.Data };
      //console.log("the data from the table is : ",printData);


      printData.Account_Date = this.globals.formatDateToDDMMYYYY(printData.Account_Date);
      printData.Mature_Date = this.globals.formatDateToDDMMYYYY(printData.Mature_Date);

      console.log("print data is :", printData.Account_Date, printData.Mature_Date);

      const printInput = this.generateAccountPrintTemplate(printData);
      this.printService.printContent(printInput);
    } else if (event.Action === 'Email') { // Mail
      this.globals.SnackBar('info', 'Email sent successfully');
    }
  }

  editAccount(account: TypeAccount) {
    const originalAccount = this.accountsService.accountsList.find(a => a.RdAccountSno === account.RdAccountSno);

    this.router.navigate(['dashboard/transactions/accounts/account'], {
      state: { data: originalAccount || account },
    });
  }

  createNew() {
    this.router.navigate(['dashboard/transactions/accounts/account']);
  }



  deleteAccount(account: TypeAccount) {
    this.globals.MsgBox(2, 'Are you sure you want to delete this account?').then((result) => {
      account.Mature_Date = this.globals.formatDateForApi(account.Mature_Date);
      account.CreateDate = this.globals.formatDateForApi(account.CreateDate.date);
      account.Account_Date = this.globals.formatDateForApi(account.Account_Date.date);
      if (result === 1) {
        this.accountsService.crudAccounts(2, account).subscribe({
          next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
              this.globals.SnackBar('success', 'Account deleted successfully');
              this.accountsService.removeAccount(account.RdAccountSno!);
              this.updateDataSource([...this.accountsService.accountsList]);
            } else {
              this.globals.SnackBar('error', res.Message || 'Failed to delete account');
              //console.log("account deletion message is :",res.Message);
            }
          },
          error: (err) => {
            this.globals.SnackBar('error', 'Error while deleting account');
            console.error(err);
          }
        });
      }
    });
  }



  generateAccountPrintTemplate(data: any): string {
    const rootUrl = document.baseURI ? document.baseURI.replace(/\/$/, "") : window.location.origin;
    const logoUrl = rootUrl + '/assets/images/yourspay.jpeg';
    const BGUrl = rootUrl + '/assets/images/Acc-printBG.jpeg';
    const ntw = new NumberToWordsPipe();
    const DueamountWords = ntw.transform(data.parsedScheme?.DueAmount);
    const MaturityamountWords = ntw.transform(data.parsedScheme?.Maturity_Amount || data.Mature_Amount || 0);

    const frequencyMap: { [key: number]: string } = {
      1: 'Days',
      2: 'Weeks',
      3: 'Bi-Monthly',
      4: 'Month',
      5: 'Quarterly',
      6: 'Half-Yearly',
      7: 'Years'
    };
    const freqString = data.parsedScheme?.Due_Frequency ? frequencyMap[data.parsedScheme.Due_Frequency] : '';

    const matureAmt = parseFloat(data.parsedScheme?.Maturity_Amount || data.Mature_Amount || 0);
    const duePeriod = parseFloat(data.parsedScheme?.Due_Period || 0);
    const dueAmt = parseFloat(data.parsedScheme?.DueAmount || 0);
    const totalDeposits = duePeriod * dueAmt;
    const interestAmount = Math.round(Math.max(0, matureAmt - totalDeposits));
    let CompAddress = sessionStorage.getItem('CompAddress1') + ' ' + sessionStorage.getItem('CompAddress2') + ' ' + sessionStorage.getItem('CompAddress3');
    let PhoneNum = sessionStorage.getItem('CompPhone');
    return `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap');
            @page {
              size: A4 portrait;
              margin: 5mm; 
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body { 
              font-family: 'Roboto', Tahoma, Geneva, Verdana, sans-serif; 
              color: #111; 
              margin: 0; 
              padding: 0; 
              letter-spacing: 0.4px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .account-print-document { 
              width: 100%; 
              max-width: 780px; 
              margin: 0 auto; 
              border: 5px solid #0548a6; 
              padding: 10px 15px 10px 15px;
              position: relative;
              box-sizing: border-box;
              height: 295mm; /* strictly bound it exactly inside A4 safe limits */
              max-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .doc-header-wrapper {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .logo-container {
              flex: 0 0 140px;
              text-align: center;
            }
            .logo-container img {
              width: 100%;
              max-height: 120px;
              object-fit: contain;
            }
            .company-info {
              flex: 1;
              padding-left: 15px;
            }
            .company-name {
              color: #0548a6;
              font-size: 21px;
              font-weight: 900;
              margin: 0 0 8px 0;
              text-align: center;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .address-box {
              background-color: #0548a6 !important;
              color: #fff !important;
              padding: 8px 10px;
              font-size: 13px;
              font-weight: 700;
              text-align: center;
              line-height: 1.4;
            }
            .contact-info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12.5px;
              font-weight: 700;
              margin-top: 10px;
            }
            .divider {
              border: 0;
              border-top: 2px solid #0548a6;
              margin-left: -15px;
              width: calc(100% + 30px);
              margin-bottom: 15px;
            }
            .title-section {
              text-align: center;
              position: relative;
              margin-bottom: 15px;
            }
            .doc-title {
              font-size: 20px;
              font-weight: 900;
              text-decoration: underline;
              text-underline-offset: 4px;
              display: inline-block;
              margin: 0;
            }
            .serial-no {
              position: absolute;
              right: 0;
              top: 50%;
              transform: translateY(-50%);
              font-weight: 700;
              font-size: 12px;
            }
            
            /* Watermark */
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              opacity: 0.15;
              width: 50%;
              z-index: 0;
              pointer-events: none;
            }

            .info-table {
              width: 90%;
              margin: 0 auto;
              border-collapse: collapse;
              position: relative;
              z-index: 2;
            }
            .info-table td {
              padding: 6.5px 5px; /* tight spacing to recover vertical allowance */
              font-weight: 700;
              vertical-align: top;
            }
            .label-col {
              width: 35%;
              text-transform: uppercase;
              padding-left: 20px !important;
              font-size: 15px;
            }
            .colon-col {
              width: 5%;
              text-align: center;
              font-size: 16px;
            }
            .val-col {
              width: 60%;
              font-size: 16px;
              font-weight: normal !important;
            }
            .address-text {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }

            .bottom-wrapper {
              margin-top: auto;
              width: 100%;
            }
            .for-company-container {
              text-align: right;
              padding-right: 10px;
              margin-bottom: 60px; /* highly reduced space to accommodate extra rows below */
            }
            .for-company {
              font-weight: 900;
              font-size: 12px;
              color: #0548a6;
            }
            .footer-section {
              display: flex;
              justify-content: space-between;
              position: relative;
              z-index: 2;
              padding: 0 10px;
              margin-bottom: 10px;
            }
            .clerk-sign {
              margin-left: 20px;
              font-weight: 900;
              font-size: 14px;
              align-self: flex-end;
            }
            .auth-sign-box {
              text-align: center;
            }
            .auth-sign-label {
              font-weight: 900;
              font-size: 14px;
            }
            .auth-sign-sub {
              font-size: 11px;
              color: #444;
              margin-top: 3px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="account-print-document">
            
            <img src="${BGUrl}" class="watermark" alt="LOGO" onerror="this.style.display='none'" />
            
            <div class="doc-header-wrapper">
              <div class="logo-container">
                <img src="${logoUrl}" alt="LOGO" onerror="this.style.display='none'" />
              </div>
              <div class="company-info">
                <div style="text-align: right; font-size: 11.5px; font-weight: 700; margin-top: -12px; margin-bottom: 8px; color: #333;">Regd.No. U64191TZ2026PLC038146</div>
                <p class="company-name">Salem Yourspay Capital Limited.,</p>
                <div class="address-box">
                  ADDRESS: ${CompAddress}
                </div>
              </div>
            </div>

            <div class="contact-info-row">
              <span> www.yourspay.in</span>
              <span>PHONE NO. +91 ${PhoneNum}</span>
              <span>MAIL ID: support@yourspay.in</span>
            </div>

            <hr class="divider" style="margin-top: 8px;">

            <div class="title-section">
              <h2 class="doc-title">RECURRING DEPOSIT</h2>
              <span class="serial-no">MEMBER ID : ${data.parsedCustomer?.Party_Code || 'NIL'}</span>
            </div>

            <table class="info-table">
             <tr>
              <td class="label-col">POLICY NO</td><td class="colon-col">:</td><td class="val-col">${data.Account_No || 'NIL'}</td>
             </tr>
             <tr>
              <td class="label-col">NAME</td><td class="colon-col">:</td><td class="val-col">${data.Party_Name || 'NIL'}</td>
             </tr>
             <tr>
              <td class="label-col">ADDRESS</td><td class="colon-col">:</td><td class="val-col"><div class="address-text">${data.parsedCustomer?.Address1 ? (data.parsedCustomer.Address1 + ' ' + (data.parsedCustomer.City || '') + ' ' + (data.parsedCustomer.State || '') + ' ' + (data.parsedCustomer.Pincode || '')) : 'NIL'}</div></td>
             </tr>
             <tr>
              <td class="label-col">MOBILE NO</td><td class="colon-col">:</td><td class="val-col">${data.parsedCustomer?.Mobile ? '+91 ' + data.parsedCustomer.Mobile : 'NIL'}</td>
             </tr>
             <tr>
                <td class="label-col">BRANCH</td><td class="colon-col">:</td><td class="val-col">${data.Branch_Name || 'ATTUR'}</td>
              </tr>
              <tr>
                <td class="label-col">DATE</td><td class="colon-col">:</td><td class="val-col">${data.Account_Date || 'NIL'}</td>
              </tr>
               
               <tr>
                <td class="label-col">NOMINEE NAME</td><td class="colon-col">:</td><td class="val-col">${data.parsedCustomer?.Nominee || 'NIL'}</td>
              </tr>
              <tr>
                <td class="label-col">RELATION</td><td class="colon-col">:</td><td class="val-col">${data.parsedCustomer?.Nominee_Rel || 'NIL'}</td>
              </tr>
              <tr>
              <td class="label-col">DEPOSIT ACCOUNT NUMBER</td><td class="colon-col">:</td><td class="val-col">${data.parsedCustomer?.Bank_AccountNo || 'NIL'}</td>
             </tr>
                <tr>
                <td class="label-col">DEPOSIT AMOUNT</td><td class="colon-col">:</td><td class="val-col">${data.parsedScheme?.DueAmount || 'NIL'} /-</td>
              </tr>
              <tr>
                <td class="label-col">DEPOSIT AMOUNT IN WORDS</td><td class="colon-col">:</td><td class="val-col"><div class="address-text">${DueamountWords || 'NIL'}</div></td>
              </tr>

               <tr>
                <td class="label-col">Rate of Interest</td><td class="colon-col">:</td><td class="val-col">${data.parsedScheme?.Roi|| 'NIL'}%</td>
              </tr>
               <tr>
                <td class="label-col">PERIOD</td><td class="colon-col">:</td><td class="val-col">${data.parsedScheme?.Due_Period || 'NIL'} ${freqString || 'NIL'}</td>
              </tr>
               <tr>
                <td class="label-col">INTEREST AMOUNT</td><td class="colon-col">:</td><td class="val-col">${interestAmount} /-</td>
              </tr>
              <tr>
                <td class="label-col">MATURITY AMOUNT</td><td class="colon-col">:</td><td class="val-col">${data.parsedScheme?.Maturity_Amount || data.Mature_Amount || 'NIL'} /-</td>
              </tr>
              <tr>
                <td class="label-col">MATURITY AMOUNT IN WORDS</td><td class="colon-col">:</td><td class="val-col"><div class="address-text">${MaturityamountWords || 'NIL'}</div></td>
              </tr>
               <tr>
                <td class="label-col">MATURITY DATE</td><td class="colon-col">:</td><td class="val-col">${data.Mature_Date || 'NIL'}</td>
              </tr>
              
              <tr>
                <td class="label-col">STATUS</td><td class="colon-col">:</td><td class="val-col">${data.IsActive ? 'ACTIVE' : 'INACTIVE'}</td>
              </tr>

              <tr>
                <td class="label-col">PAY MODE</td><td class="colon-col">:</td><td class="val-col">${data.Pay_Mode || 'CASH'}</td>
              </tr>

    
            </table>

            <div class="bottom-wrapper">
              <hr class="divider" style="margin-bottom: 5px;">
              <div class="for-company-container">
                <span class="for-company">Salem Yourspay Capital Limited.,</span>
              </div>
  
              <div class="footer-section">
                <div class="clerk-sign">CLERK</div>
                <div class="auth-sign-box">
                  <div class="auth-sign-label">Authorised Signatory</div>
                  
                </div>
              </div>
            </div>

          </div>
        </body>
      </html>
    `;
  }
}
