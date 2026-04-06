import { Component, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { Router, NavigationEnd } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { SavingsReceiptsService, TypeSavingsReceipt } from './savings-receipts.service';
import { SavingAccountsService, TypeSavingAccount } from '../../masters/saving-accounts/saving-accounts.service';
import { CustomersService, TypeCustomer } from '../../masters/customers/customers.service';
import { forkJoin, of } from 'rxjs';
import { PrintService } from '../../../../services/print.service';

@Component({
  selector: 'app-savings-receipts',
  standalone: true,
  imports: [TableviewComponent],
  templateUrl: './savings-receipts.component.html',
  styleUrl: './savings-receipts.component.scss'
})
export class SavingsReceiptsComponent implements OnInit {

  constructor(
    public receiptsService: SavingsReceiptsService,
    public accountsService: SavingAccountsService,
    public customersService: CustomersService,
    public globals: GlobalService,
    private printService: PrintService,
    private router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.router.url === '/dashboard/transactions/savings-receipts') {
          this.updateDataSource([...this.receiptsService.receiptsList]);
        }
      }
    });
  }

  //Date filtering vars
  fromDate:string = new Date().toISOString().split('T')[0];
  toDate: string = new Date().toISOString().split('T')[0];

  DataSource = signal<any[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Receipt_No', Data_Type: 'string' },

    { Field_Name: 'Account_No', Data_Type: 'string' },
    { Field_Name: 'Party_Name', Data_Type: 'string', Display_Name: 'Customer Name' },
    
    { Field_Name: 'Receipt_Date', Data_Type: 'date' },
    { Field_Name: 'Amount', Data_Type: 'string', Display_Name: 'Net Amount' },
    { Field_Name: 'Payment_Mode_Text', Data_Type: 'string', Display_Name: 'Payment Mode' },
    { Field_Name: 'Actions', Data_Type: 'string' },
  ]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    const receiptsObs = this.receiptsService.receiptsList.length > 0 
      ? of(this.receiptsService.receiptsList) 
      : this.receiptsService.getReceipts();
      
    const accountsObs = this.accountsService.accountsList.length > 0 
      ? of(this.accountsService.accountsList) 
      : this.accountsService.getAccounts();
      
    const customersObs = this.customersService.customersList.length > 0 
      ? of(this.customersService.customersList) 
      : this.customersService.getCustomers();

    forkJoin({
      receipts: receiptsObs,
      accounts: accountsObs,
      customers: customersObs
    }).subscribe({
      next: (res: any) => {
        let rcptList = res.receipts;
        if (res.receipts && res.receipts.apiData) {
            rcptList = typeof res.receipts.apiData === 'string' ? JSON.parse(res.receipts.apiData) : res.receipts.apiData;
        } else if (typeof res.receipts === 'string') {
            try { rcptList = JSON.parse(res.receipts); } catch(e) {}
        }
        if (!Array.isArray(rcptList)) rcptList = [];

        this.receiptsService.receiptsList = rcptList;
        // Assume accounts and customers bindings natively handled by auth cache logic for brevity if needed
        this.accountsService.accountsList = res.accounts;
        this.customersService.customersList = res.customers;

        this.updateDataSource(rcptList);
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load receipts data');
      },
    });
  }

  getPaymentModeText(mode: number | string): string {
      const pMode = Number(mode);
      switch(pMode) {
          case 1: return 'Cash';
          case 2: return 'Bank';
          case 3: return 'UPI';
          case 4: return 'Other';
          default: return 'Unknown';
      }
  }

  updateDataSource(list: TypeSavingsReceipt[]) {
    const formattedList = list.map(receipt => {
      const account = this.accountsService.accountsList.find(a => Number(a.SbAcSno) === Number(receipt.SbAcSno));
      const customer = account 
        ? this.customersService.customersList.find(c => Number(c.PartySno) === Number(account.PartySno)) 
        : null;

      return {
        ...receipt,
        Account_No: account ? account.SbAccount_No : 'Unknown',
        Party_Name: customer ? customer.Party_Name : 'Unknown',
        Payment_Mode_Text: this.getPaymentModeText(receipt.Payment_Mode),
        Receipt_Date: this.globals.formateDateForTable(receipt.Receipt_Date)
      };
    });

    this.DataSource.set(formattedList);
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }

    if (event.Action === 1) { // Edit
      this.editReceipt(event.Data);
    } else if (event.Action === 2) { // Delete
      this.deleteReceipt(event.Data);
    } else if (event.Action === 3) { // Print
      this.printReceipt(event.Data);
    } else if (event.Action === 'Email') { // Mail
      this.globals.SnackBar('info', 'Email sent successfully via ' + event.Data.Email || 'system');
    }
  }

  editReceipt(receipt: TypeSavingsReceipt) {
    const originalReceipt = this.receiptsService.receiptsList.find(r => r.ReceiptSno === receipt.ReceiptSno);
    
    this.router.navigate(['dashboard/transactions/savings-receipts/savings-receipt'], {
      state: { data: originalReceipt || receipt },
    });
  }

  createNew() {
    this.router.navigate(['dashboard/transactions/savings-receipts/savings-receipt']);
  }

  deleteReceipt(receipt: TypeSavingsReceipt) {
    this.globals.MsgBox(2, 'Are you sure you want to delete this receipt?').then((result) => {
      
      receipt.Receipt_Date = this.globals.formatDateForApi(receipt.Receipt_Date.date || receipt.Receipt_Date);
      if (result === 1) {
        this.receiptsService.crudReceipts(2, receipt).subscribe({
          next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
              this.globals.SnackBar('success', 'Receipt deleted successfully');
              this.receiptsService.removeReceipt(receipt.ReceiptSno!);
              this.updateDataSource([...this.receiptsService.receiptsList]);
            } else {
              this.globals.SnackBar('error', res.Message || 'Failed to delete receipt');
            }
          },
          error: (err) => {
            this.globals.SnackBar('error', 'Error while deleting receipt');
            console.error(err);
          }
        });
      }
    });
  }

  printReceipt(receipt: TypeSavingsReceipt) {
    const account = this.accountsService.accountsList.find(a => Number(a.SbAcSno) === Number(receipt.SbAcSno));
    let parsedCustomer: any = null;
    let customer: any = null;
    
    if (account) {
      parsedCustomer = account.Party || null;
      customer = this.customersService.customersList.find(c => Number(c.PartySno) === Number(account.PartySno));
    }

    this.receiptsService.getAccountSummary(receipt.SbAcSno).subscribe(res => {
      let data = res;
      if (res && res.apiData) {
          data = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
      } else if (typeof res === 'string') {
          try { data = JSON.parse(res); } catch(e) {}
      }
      
      const summary = Array.isArray(data) && data.length > 0 ? data[0] : null;

      const printData = {
        ...receipt,
        account,
        parsedCustomer,
        customer,
        summary
      };

      const printStr = this.generateReceiptPrintTemplate(printData);
      this.printService.printContent(printStr);
    });
  }

  generateReceiptPrintTemplate(data: any): string {
    const rootUrl = document.baseURI ? document.baseURI.replace(/\/$/, "") : window.location.origin;
    const logoUrl = rootUrl + '/assets/images/yourspay.jpeg';
    
    const extractDate = (d: any) => {
      if (!d) return '';
      if (typeof d === 'object' && d.date) return d.date;
      return d;
    };

    const accDate = data.account ? this.globals.formatDateToDDMMYYYY(extractDate(data.account.CreateDate)) : '';
    const rcptDate = this.globals.formatDateToDDMMYYYY(extractDate(data.Receipt_Date));


    let CompAddress = sessionStorage.getItem('CompAddress1') + ' ' + sessionStorage.getItem('CompAddress2') + ' ' + sessionStorage.getItem('CompAddress3');
    let PhoneNum = sessionStorage.getItem('CompPhone');
    const printBlock = (copyType: string) => `
      <div class="receipt-block">
        <div class="copy-type">${copyType}</div>
        
        <div class="header-section">
          <table class="header-table">
            <tr>
              <td class="logo-col"><img src="${logoUrl}" alt="LOGO" onerror="this.style.display='none'" /></td>
              <td class="company-col">
                <h2 class="company-name">SALEM YOURSPAY CAPITAL LIMITED</h2>
                <div class="company-address">${CompAddress} <br/>Ph:+91 ${PhoneNum}; EMAIL: support@yourspay.in</div>
                <h3 class="doc-title">RENEWAL RECEIPT</h3>
              </td>
            </tr>
          </table>
        </div>
        
        <div class="top-info">
          <table style="width: 100%; font-size: 13.5px;">
            <tr>
              <td style="width: 55%; vertical-align: top;">
                <table class="info-table">
                  <tr><td class="lbl">Customer Name</td><td class="val">: ${data.parsedCustomer?.Party_Name || data.customer?.Party_Name || 'NIL'}</td></tr>
                </table>
              </td>
              <td style="width: 45%; vertical-align: top;">
                <table class="info-table">
                  <tr><td class="lbl">D.O.J</td><td class="val">: ${accDate || 'NIL'}</td></tr>
                  <tr><td class="lbl">P.Date</td><td class="val">: ${rcptDate || 'NIL'}</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        
        <table class="receipt-table">
          <tr>
            <th class="col-no">NO</th>
            <th class="col-label">PARTICULARS</th>
            <th class="col-val">DETAILS</th>
          </tr>
          <tr>
            <td class="col-no">1</td>
            <td class="col-label">Account No</td>
            <td class="col-val">${data.account?.SbAccount_No || 'NIL'}</td>
          </tr>
          <tr>
            <td class="col-no">2</td>
            <td class="col-label">Amount</td>
            <td class="col-val">${data.Amount}</td>
          </tr>
          <tr>
            <td class="col-no">3</td>
            <td class="col-label">Pay type</td>
            <td class="col-val">${this.getPaymentModeText(data.Payment_Mode)}</td>
          </tr>
        </table>
        
        <table class="footer-sign" style="width: 100%; margin-top: 35px;">
          <tr>
             <td style="text-align: left; vertical-align: bottom; height: 35px;">Customer Signature</td>
             <td style="text-align: right; vertical-align: bottom; height: 35px;">Authorized Signature</td>
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
              size: letter portrait;
              margin: 10mm; 
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
            }
            .page-container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              position: relative;
            }
            .receipt-block {
              border: 1.5px solid #222;
              padding: 12px 15px 12px 15px;
              position: relative;
              
            }
            .copy-type {
              position: absolute;
              top: 0;
              right: 0;
              background: #0548a6;
              color: white;
              padding: 4px 12px;
              font-size: 11px;
              font-weight: bold;
              border-bottom-left-radius: 6px;
              letter-spacing: 0.5px;
            }
            .header-table {
              width: 100%;
              margin-bottom: 8px;
              border-bottom: 1px solid #777;
              padding-bottom: 8px;
              border-collapse: collapse;
            }
            .logo-col {
              width: 130px;
              text-align: center;
              vertical-align: middle;
            }
            .logo-col img {
              width: 110px;
              max-height: 75px;
              object-fit: contain;
            }
            .company-col {
              text-align: center;
              padding-right: 130px; /* Balance logo width for true center */
              vertical-align: middle;
            }
            .company-name {
              font-size: 19px;
              font-weight: 900;
              margin: 0 0 5px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .company-address {
              font-size: 11.5px;
              margin: 0 0 6px 0;
              color: #333;
            }
            .doc-title {
              font-size: 15px;
              font-weight: 700;
              margin: 0;
              text-transform: uppercase;
              text-decoration: underline;
              text-underline-offset: 3px;
            }
            .top-info {
              margin-bottom: 10px;
              padding: 5px 10px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
            }
            .info-table td {
              padding: 3px 0;
              font-size: 13.5px;
            }
            .lbl {
              width: 130px;
              font-weight: 500;
              text-transform: capitalize;
            }
            .val {
              font-weight: 700;
            }
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 5px;
            }
            .receipt-table th, .receipt-table td {
              border: 1px solid #777;
              padding: 6px 10px;
              font-size: 14px;
              text-align: left;
            }
            .receipt-table th {
              background: #f0f0f0;
              border-top: 1.5px solid #222;
              border-bottom: 1.5px solid #222;
            }
            .col-no {
              width: 50px;
              text-align: center !important;
              font-weight: 900 !important;
            }
            .col-label {
              width: 45%;
              font-weight: 500 !important;
              text-transform: capitalize;
            }
            .col-val {
              width: auto;
              font-weight: 700 !important;
            }
            .footer-sign {
              font-size: 13.5px;
              font-weight: 500;
            }
            .cut-line {
              border-top: 1px dashed #555;
              width: 100%;
              margin: 25px 0;
              position: relative;
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
