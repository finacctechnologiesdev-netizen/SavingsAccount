import { Component, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { Router } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { ClosuresService, TypeClosure } from './closures.service';
import { AccountsService } from '../accounts/accounts.service';
import { CustomersService } from '../../masters/customers/customers.service';
import { PrintService } from '../../../../services/print.service';
import { CommonModule } from '@angular/common';
import { NumberToWordsPipe } from '../../../../pipes/number-to-words.pipe';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-closures',
  standalone: true,
  imports: [TableviewComponent, CommonModule],
  templateUrl: './closures.component.html',
  styleUrl: './closures.component.scss'
})
export class ClosuresComponent implements OnInit {

  constructor(
    public closuresService: ClosuresService,
    public accountsService: AccountsService,
    public customersService: CustomersService,
    public globals: GlobalService,
    private printService: PrintService,
    private router: Router
  ) {
  }
  //Date filtering vars
  fromDate:string = new Date().toISOString().split('T')[0];
  toDate: string = new Date().toISOString().split('T')[0];

  DataSource = signal<any[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Closure_No', Data_Type: 'string' },
    { Field_Name: 'SeriesSno', Data_Type: 'string' },
    { Field_Name: 'Closure_Date', Data_Type: 'date' },
    { Field_Name: 'Total_Amount', Data_Type: 'string' },
    { Field_Name: 'Interest_Amount', Data_Type: 'string' },
    //{ Field_Name: 'Closure_Date', Data_Type: 'date' },
    { Field_Name: 'Nett_Amount', Data_Type: 'string' },
    { Field_Name: 'Actions', Data_Type: 'string' },
  ]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    const closuresObs = this.closuresService.closuresList.length > 0
      ? of(this.closuresService.closuresList)
      : this.closuresService.getClosures();

    closuresObs.subscribe({
      next: (res: any) => {
        let list = res;
        if (res && res.apiData) {
          list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
        } else if (typeof res === 'string') {
          try { list = JSON.parse(res); } catch (e) { }
        }
        if (!Array.isArray(list)) list = [];
        this.closuresService.closuresList = list;
        this.updateDataSource(list);
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load closures');
      },
    });
  }

  updateDataSource(list: any[]) {
    const formattedList = (list || []).map(closure => {
      // API returns Closure_Date as { date: '...' }; local payload is a plain string
      const rawDate = closure.Closure_Date?.date ?? closure.Closure_Date;
      return {
        ...closure,
        Closure_Date: this.globals.formateDateForTable(rawDate)
      };
    });
    this.DataSource.set(formattedList);
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }

    if (event.Action === 1) { // Edit
      this.editClosure(event.Data);
    } else if (event.Action === 2) { // Delete
      this.globals.MsgBox(2, 'Are you sure you want to delete this closure?').then((result) => {
        if (result === 1) {
          this.deleteClosure(event.Data);
        }
      });
    } else if (event.Action === 3) { // Print
      this.printClosure(event.Data);
    }
  }

  deleteClosure(row: any) {
    if (!row || !row.RdClosureSno || !row.CurrentRowVer) {
      this.globals.SnackBar('error', 'Invalid closure data for deletion');
      return;
    }
    console.log("row is :",row);
    row.Closure_Date = this.globals.formatDateForApi(row.Closure_Date.date);

    this.closuresService.crudClosures(2, row).subscribe({
      next: (res: any) => {
        if (res.Status === 'Success') {
          this.closuresService.removeClosure(row.RdClosureSno);
          this.updateDataSource([...this.closuresService.closuresList]);
          this.globals.SnackBar('success', 'Closure deactivated successfully');
        } else {
          this.globals.SnackBar('error', res.Message || 'Failed to delete closure');
        // console.log("closure deletion message is :",res.Message);
        }
      },
      error: (err: any) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Network error during deletion');
      }
    });
  }

  editClosure(closure: TypeClosure) {
    const originalClosure = this.closuresService.closuresList.find(c => c.RdClosureSno === closure.RdClosureSno);
    
    this.router.navigate(['dashboard/transactions/closures/closure'], {
      state: { data: originalClosure || closure },
    });
  }

  createNew() {
    this.router.navigate(['dashboard/transactions/closures/closure']);
  }

  printClosure(closure: any) {
    const acc$ = !this.accountsService.accountsList.length ? this.accountsService.getAccounts() : of(this.accountsService.accountsList);
    const cus$ = !this.customersService.customersList.length ? this.customersService.getCustomers() : of(this.customersService.customersList);

    if (!this.accountsService.accountsList.length || !this.customersService.customersList.length) {
      this.globals.SnackBar('info', 'Loading data for print...');
    }

    forkJoin([acc$, cus$]).subscribe(([accRes, cusRes]) => {
      // Process Accounts
      if (!this.accountsService.accountsList.length && accRes) {
        let list = accRes;
        if ((accRes as any).apiData) list = typeof (accRes as any).apiData === 'string' ? JSON.parse((accRes as any).apiData) : (accRes as any).apiData;
        else if (typeof accRes === 'string') try { list = JSON.parse(accRes); } catch(e) {}
        this.accountsService.accountsList = Array.isArray(list) ? list : [];
      }
      
      // Process Customers
      if (!this.customersService.customersList.length && cusRes) {
        let list = cusRes;
        if ((cusRes as any).apiData) list = typeof (cusRes as any).apiData === 'string' ? JSON.parse((cusRes as any).apiData) : (cusRes as any).apiData;
        else if (typeof cusRes === 'string') try { list = JSON.parse(cusRes); } catch(e) {}
        this.customersService.customersList = Array.isArray(list) ? list : [];
      }

      this.executePrint(closure);
    });
  }

  private executePrint(closure: any) {
    const account = this.accountsService.accountsList.find((a: any) => a.RdAccountSno === closure.RdAccountSno);
    let parsedCustomer: any = null;
    let customer: any = null;

    if (account) {
      parsedCustomer = account.Party || null;
      customer = this.customersService.customersList.find((c: any) => c.PartySno === account.PartySno);
    }

    const ntw = new NumberToWordsPipe();
    const amountWords = ntw.transform(closure.Nett_Amount);
    
    const printData = {
      ...closure,
      account,
      parsedCustomer,
      customer,
      amountWords
    };

    const printStr = this.generateClosurePrintTemplate(printData);
    this.printService.printContent(printStr);
  }

  generateClosurePrintTemplate(data: any): string {
    const rootUrl = document.baseURI ? document.baseURI.replace(/\/$/, "") : window.location.origin;
    const logoUrl = rootUrl + '/assets/images/yourspay.jpeg';
    const cDate = this.globals.formatDateToDDMMYYYY(data.Closure_Date);
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const custName = data.parsedCustomer?.Party_Name || data.customer?.Party_Name || 'NIL';
    const custCode = data.parsedCustomer?.Party_Code || data.customer?.Party_Code || 'NIL';
    const accNo = data.account?.Account_No || 'NIL';
    let CompAddress = sessionStorage.getItem('CompAddress1') + ' ' + sessionStorage.getItem('CompAddress2') + ' ' + sessionStorage.getItem('CompAddress3');
    let PhoneNum = sessionStorage.getItem('CompPhone');

    const printBlock = (copyType: string) => `
      <div class="receipt-block">
        <!-- HEADER ROW -->
        <table class="header-table">
          <tr>
            <td class="logo-cell">
              <img src="${logoUrl}" alt="LOGO" onerror="this.style.display='none'" />
            </td>
            <td class="company-cell">
              <div class="doc-type">Redemption Receipt</div>
              <div class="company-name">SalemYours - Pay</div>
              <div class="company-address">${CompAddress}</div>
              <div class="company-contact">Ph:+91 ${PhoneNum}; EMAIL : support@yourspay.in</div>
            </td>
            <td class="form-h">
             
            </td>
          </tr>
        </table>

        <!-- METADATA ROW -->
        <table class="meta-table">
          <tr>
            <td style="width: 33.33%; text-align: center;">${copyType || 'NIL'}</td>
            <td style="width: 33.33%; text-align: center;">DATE : ${cDate || 'NIL'}</td>
            <td style="width: 33.33%; text-align: center;">TIME:${timeNow || 'NIL'}</td>
          </tr>
        </table>

        <!-- CUSTOMER ROW -->
        <table class="customer-table">
          <tr>
            <td style="width: 120px;">Customer Name:</td>
            <td>${custName}</td>
            <td style="width: 120px;">Customer Code :</td>
            <td style="width: 150px;">${custCode}</td>
          </tr>
          <tr>
            <td>Dues</td>
            <td>: AC Closed</td>
            <td>Account Number :</td>
            <td>${accNo}</td>
          </tr>
        </table>

        <!-- PARTICULARS TABLE -->
        <table class="particulars-table">
          <thead>
            <tr>
              <th style="padding-left: 50px;">PARTICULARS</th>
              <th style="text-align: right; padding-right: 50px; width: 30%;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding-left: 50px;">Principal</td>
              <td style="text-align: right; padding-right: 50px;">${data.Total_Amount || 'NIL'}</td>
            </tr>
            <tr>
              <td style="padding-left: 50px;">Interest</td>
              <td style="text-align: right; padding-right: 50px;">${data.Interest_Amount || 'NIL'}</td>
            </tr>
            <tr class="spacer-row"><td colspan="2"></td></tr>
            <tr>
              <td style="padding-left: 50px;">TOTAL</td>
              <td style="text-align: right; padding-right: 50px;">${data.Nett_Amount ? Number(data.Nett_Amount).toFixed(0) : 'NIL'}</td>
            </tr>
            <tr class="spacer-row"><td colspan="2"></td></tr>
            <tr>
              <td colspan="2" style="padding-left: 50px;">Rupees : &nbsp;&nbsp;&nbsp;${data.amountWords || 'NIL'}</td>
            </tr>
          </tbody>
        </table>

        <!-- FOOTER SIG ROW -->
        <table class="footer-table">
          <tr>
            <td style="width: 50%; padding-left: 20px;"></td>
            <td style="text-align: right; padding-right: 20px;">For SalemYours - Pay</td>
          </tr>
          <tr>
            <td style="padding-left: 20px; padding-top: 50px;">Customer Sign</td>
            <td style="text-align: right; padding-right: 20px; padding-top: 50px;">(Authority)</td>
          </tr>
        </table>
      </div>
    `;

    return `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: 'Roboto', Arial, sans-serif;
              color: #000;
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              position: relative;
            }
            .receipt-block {
              border: 1px solid #777;
              display: block;
              overflow: hidden;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td, th {
              padding: 5px;
            }
            
            /* Header */
            .header-table {
              border-bottom: 1px solid #777;
            }
            .logo-cell {
              width: 150px;
              text-align: center;
              padding: 10px;
            }
            .logo-cell img {
              width: 130px;
              max-height: 70px;
              object-fit: contain;
            }
            .company-cell {
              text-align: center;
            }
            .doc-type {
              font-size: 11.5px;
              margin-bottom: 3px;
            }
            .company-name {
              font-size: 18px;
              font-weight: 900;
              margin-bottom: 4px;
            }
            .company-address, .company-contact {
              font-size: 10px;
              margin-bottom: 2px;
            }
            .form-h {
              width: 150px;
              text-align: right;
              vertical-align: top;
              padding: 10px;
              font-size: 9px;
              font-weight: 700;
            }
            
            /* Meta Row */
            .meta-table {
              border-bottom: 1px solid #777;
            }
            .meta-table td {
               font-size: 13.5px;
               padding: 10px 5px;
            }
            .meta-table td:not(:last-child) {
               border-right: 1px solid #777;
            }

            /* Customer Row */
            .customer-table {
              border-bottom: 1px solid #777;
              font-size: 13.5px;
            }
            .customer-table td {
               padding: 8px 10px;
            }

            /* Particulars */
            .particulars-table {
              border-bottom: 1px solid #777;
              font-size: 13.5px;
            }
            .particulars-table th {
              text-align: left;
              padding-top: 10px;
              padding-bottom: 10px;
              font-weight: normal;
            }
            .particulars-table td {
              padding-top: 6px;
              padding-bottom: 6px;
            }
            .spacer-row td {
               padding: 5px 0 !important;
               height: 10px;
            }

            /* Footer */
            .footer-table {
              font-size: 13.5px;
              padding-bottom: 8px;
            }
            .footer-table td {
               padding-top: 25px;
               padding-bottom: 10px;
            }

            .cut-line {
              border-top: 1px dashed #555;
              width: 100%;
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            ${printBlock('OFFICE COPY')}
            <div class="cut-line"></div>
            ${printBlock('CUSTOMER COPY')}
          </div>
        </body>
      </html>
    `;
  }
}
