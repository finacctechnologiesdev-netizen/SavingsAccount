import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { ReceiptsService, TypeReceipt } from '../receipts.service';
import { AccountsService, TypeAccount } from '../../accounts/accounts.service';
import { AccountTypesService as SchemesService, TypeAcType as TypeScheme } from '../../../masters/account-types/account-types.service';
import { CustomersService, TypeCustomer } from '../../../masters/customers/customers.service';
import { TransactionNumberService } from '../../../../../services/transaction-number.service';
import { InputBehaviorDirective } from '../../../../../directives/input-behavior.directive';
import { ChangeDetectorRef } from '@angular/core';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule, FormsModule, InputBehaviorDirective, SelectionlistComponent],
  providers: [DatePipe],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.scss'
})
export class ReceiptComponent implements OnInit {

  Receipt!: TypeReceipt;
  isEditMode = false;
  isReceiptNoDisabled = false;
  submitCount = 0;
  errors: any = {};

  accountsList: TypeAccount[] = [];
  schemesList: TypeScheme[] = [];
  customersList: TypeCustomer[] = [];
  seriesList: any[] = [];
  accountSummary: any = null;

  constructor(
    private router: Router,
    public globals: GlobalService,
    private receiptsService: ReceiptsService,
    private accountsService: AccountsService,
    private schemesService: SchemesService,
    private customersService: CustomersService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private transNumService: TransactionNumberService,
  ) { }

  get selectedAccount(): TypeAccount | undefined {
    return this.accountsList.find(a => a.RdAccountSno === this.Receipt.RdAccountSno);
  }

  get selectedCustomer(): TypeCustomer | undefined {
    const account = this.selectedAccount;
    if (!account) return undefined;
    return this.customersList.find(c => c.PartySno === account.PartySno);
  }

  get accountsForDropdown(): any[] {
    return this.accountsList.map(a => {
      const customer = this.customersList.find(c => c.PartySno === a.PartySno);
      return {
        ...a,
        Name: a.Account_No,
        Details: customer?.Party_Name ?? ''
      };
    });
  }

  get selectedAccountForDropdown(): any {
    if (!this.Receipt?.RdAccountSno) return undefined;
    const acc = this.accountsList.find(a => a.RdAccountSno === this.Receipt.RdAccountSno);
    if (!acc) return undefined;
    const customer = this.customersList.find(c => c.PartySno === acc.PartySno);
    return {
      ...acc,
      Name: acc.Account_No,
      Details: customer?.Party_Name ?? ''
    };
  }

  onAccountItemSelected(event: any) {
    if (event && event.RdAccountSno) {
      this.Receipt.RdAccountSno = event.RdAccountSno;
    } else {
      this.Receipt.RdAccountSno = 0;
    }
    this.onAccountSelected();
    if (this.submitCount > 0) this.validateFields();
  }

  get netPayable(): number {
    return Number(this.Receipt.Amount) || 0;
  }

  get calculatedDueAmount(): number {
    return (Number(this.Receipt.Amount) || 0) - (Number(this.Receipt.Default_Amount) || 0);
  }

  ngOnInit(): void {
    // Load dropdown items caching across screens
    this.loadAccounts();
    this.loadSchemes();
    this.loadCustomers();
    this.loadVoucherSeries();

    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.Receipt = { ...stateData };
   
       this.Receipt.Receipt_Date = this.globals.formatDate(this.Receipt.Receipt_Date, 'yyyy-MM-dd');
      // CreateDate
      this.Receipt.CreateDate = this.globals.formatDate(this.Receipt.CreateDate, 'yyyy-MM-dd');
      
      this.onAccountSelected(false); // Fetch summary data for the edit state without recalculating amount

    } else {
      this.isEditMode = false;
      this.Receipt = this.receiptsService.initializeReceipt();
      const today = new Date();
      this.Receipt.Receipt_Date = this.globals.formatDate(today, 'yyyy-MM-dd');
    }
  }

  loadAccounts() {
      if (this.accountsService.accountsList && this.accountsService.accountsList.length > 0) {
          this.accountsList = this.accountsService.accountsList;
          return;
      }
      this.accountsService.getAccounts().subscribe({
          next: (res: any) => {
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              if (!Array.isArray(list)) list = [];
              this.accountsList = list;
              this.accountsService.accountsList = list;
              this.cdr.detectChanges();
          },
          error: (err) => console.error(err)
      });
  }

  loadSchemes() {
      if (this.schemesService.schemesList && this.schemesService.schemesList.length > 0) {
          this.schemesList = this.schemesService.schemesList;
          return;
      }
      this.schemesService.getSchemes().subscribe({
          next: (res: any) => {
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              if (!Array.isArray(list)) list = [];
              this.schemesList = list;
              this.schemesService.schemesList = list;
          },
          error: (err) => console.error(err)
      });
  }

  loadCustomers() {
      if (this.customersService.customersList && this.customersService.customersList.length > 0) {
          this.customersList = this.customersService.customersList;
          return;
      }
      this.customersService.getCustomers().subscribe({
          next: (res: any) => {
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              if (!Array.isArray(list)) list = [];
              this.customersList = list;
              this.customersService.customersList = list;
          },
          error: (err) => console.error(err)
      });
  }

  loadVoucherSeries() {
      this.receiptsService.getVoucherSeries().subscribe({
          next: (res: any) => {
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              
              if (!Array.isArray(list)) list = [];
              
              this.seriesList = list;
              if (!this.isEditMode && this.seriesList.length > 0 && !this.Receipt.SeriesSno) {
                  this.Receipt.SeriesSno = this.seriesList[0].SeriesSno;
              }
              this.onSeriesChange();
              this.cdr.detectChanges();
          },
          error: (err) => { console.error(err); }
      });
  }

  onSeriesChange() {
    if (!this.Receipt.SeriesSno) {
        if (!this.isEditMode) this.Receipt.Receipt_No = '';
        this.isReceiptNoDisabled = false;
        return;
    }

    const selectedSeries = this.seriesList.find(s => s.SeriesSno === this.Receipt.SeriesSno);
    if (!selectedSeries) return;

    this.isReceiptNoDisabled = Number(selectedSeries.Num_Method) === 2;

    if (this.isEditMode) return; 

    if (Number(selectedSeries.Num_Method) === 0) {
      this.Receipt.Receipt_No = '';
    } else if (Number(selectedSeries.Num_Method) === 2) {
      this.Receipt.Receipt_No = 'Auto';
    } else {
      const compSno = Number(sessionStorage.getItem('CompSno')) || 1;
      this.transNumService.getTransactionNumber(Number(this.Receipt.SeriesSno), compSno).subscribe({
        next: (res: any) => {
          if (res && res.queryStatus === 1 && res.apiData) {
            this.Receipt.Receipt_No = res.apiData;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  calculateAmount() {
      if (!this.Receipt.RdAccountSno) return;
      
      const defaultAmount = Number(this.Receipt.Default_Amount) || 0;
      
      // If dueCount is completely empty/null, default to 1 so the baseline DueAmount is assigned.
      // If user deliberately typed 0, it must correctly evaluate to 0 instead of falling back to 1.
      let dueCount: number;
      if (this.Receipt.DueCount === undefined || this.Receipt.DueCount === null || String(this.Receipt.DueCount).trim() === '') {
          dueCount = 1;
      } else {
          dueCount = Number(this.Receipt.DueCount);
      }

      const selectedAccount = this.accountsList.find(a => Number(a.RdAccountSno) === Number(this.Receipt.RdAccountSno));
      if (!selectedAccount) return;

      const selectedScheme = this.schemesList.find(s => Number(s.RdSchemeSno) === Number(selectedAccount.RdSchemeSno));
      if (!selectedScheme) return;

      // Pull base due amount straight from the nested Scheme
      const dueAmount = Number(selectedScheme.DueAmount) || 0;

      // Multiply scheme amount strictly by the localized count
      const expectedAmount = dueAmount * dueCount;
      const calculatedTotal = expectedAmount + defaultAmount;
      
      this.Receipt.Amount = calculatedTotal;
  }

  onAccountSelected(calcAmount: boolean = true) {
      if (calcAmount) this.calculateAmount();

      if (this.Receipt.RdAccountSno) {
          this.receiptsService.getAccountSummary(this.Receipt.RdAccountSno).subscribe({
              next: (res: any) => {
                  let data = res;
                  if (res && res.apiData) {
                      data = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
                  } else if (typeof res === 'string') {
                      try { data = JSON.parse(res); } catch(e) {}
                  }
                  
                  if (Array.isArray(data) && data.length > 0) {
                      this.accountSummary = data[0];
                  } else {
                      this.accountSummary = null;
                  }
                  this.cdr.detectChanges();
              },
              error: (err) => console.error(err)
          });
      } else {
          this.accountSummary = null;
      }
  }

  validateFields(): boolean {
    this.errors = {};
    let isValid = true;
    const data = this.Receipt;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (!data.Receipt_No) setError('Receipt_No', 'Receipt No is Required');
    if (!data.Receipt_Date) setError('Receipt_Date', 'Receipt Date is Required');
    if (!data.RdAccountSno || Number(data.RdAccountSno) <= 0) setError('RdAccountSno', 'Valid RD Account Sno is Required');
    if (!data.DueCount || Number(data.DueCount) < 0) setError('DueCount', 'Due Count is Required');
    if (!data.Amount || Number(data.Amount) <= 0) setError('Amount', 'Valid Amount is Required');
    if (!data.SeriesSno) setError('SeriesSno', 'Series Sno is Required');
    
    // Default_Amount is optional but should not be negative if provided
    if (data.Default_Amount && Number(data.Default_Amount) < 0) setError('Default_Amount', 'Invalid Amount');


    return isValid;
  }

  saveReceipt() {
    this.submitCount++;
    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please fill required fields');
      return;
    }

    const action = this.isEditMode ? 1 : 0;
    const payload: any = { ...this.Receipt };
    payload.IsActive = (payload.IsActive === true || payload.IsActive === 1) ? 1 : 0;

    // Convert dates for API using GlobalService helper (matches Accounts implementation)
    payload.Receipt_Date = this.globals.formatDateForApi(payload.Receipt_Date);

    // Ensure numeric values
    payload.RdAccountSno = Number(payload.RdAccountSno);
    payload.DueCount = Number(payload.DueCount);
    payload.Amount = Number(payload.Amount);
    payload.SeriesSno = Number(payload.SeriesSno);
    payload.Default_Amount = payload.Default_Amount ? Number(payload.Default_Amount) : 0;

    if (this.isEditMode) {
      if (payload.CreateDate) payload.CreateDate = this.globals.formatDateForApi(payload.CreateDate);
    } else {
        payload.RdReceiptSno = 0;
        payload.CurrentRowVer = null;
        payload.UserSno = 1;
        payload.CompSno = 1;
        // Explicitly set to empty string as per AccountComponent pattern
        payload.CreateDate = ''; 
    }

    this.receiptsService.crudReceipts(action, payload).subscribe({
        next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
                this.globals.SnackBar('success', this.isEditMode ? 'Receipt updated successfully' : 'Receipt created successfully');

                if (res.CurrentRowVer) {
                    this.Receipt.CurrentRowVer = res.CurrentRowVer;
                }

                const receiptId = this.isEditMode ? this.Receipt.RdReceiptSno : res.RetSno;

                if (receiptId) {
                    this.receiptsService.getReceipt(Number(receiptId)).subscribe({
                        next: (receiptData: any) => {
                            let list = receiptData;
                            if (receiptData && receiptData.apiData) {
                                list = typeof receiptData.apiData === 'string' ? JSON.parse(receiptData.apiData) : receiptData.apiData;
                            } else if (typeof receiptData === 'string') {
                                try { list = JSON.parse(receiptData); } catch (e) {}
                            }
                            const fetchedReceipt = Array.isArray(list) ? list[0] : list;
                            if (fetchedReceipt) {
                                if (this.isEditMode) {
                                    this.receiptsService.updateReceipt(fetchedReceipt);
                                } else {
                                    this.receiptsService.addReceipt(fetchedReceipt);
                                }
                            }
                            this.router.navigate(['dashboard/transactions/receipts']);
                        },
                        error: (err) => {
                            console.error('Failed to fetch individual receipt', err);
                            this.receiptsService.receiptsList = []; // Fallback to full fetch next time
                            this.router.navigate(['dashboard/transactions/receipts']);
                        }
                    });
                } else {
                    this.receiptsService.receiptsList = []; // Fallback
                    this.router.navigate(['dashboard/transactions/receipts']);
                }
            } else {
                 this.globals.SnackBar('error', res.Message || 'Operation failed');
            }
        },
        error: (err) => {
             this.globals.SnackBar('error', 'Network Error');
             console.error(err);
        }
    });
  }

  cancelReceipt() {
    this.router.navigate(['dashboard/transactions/receipts']);
  }
}
