import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { SavingsReceiptsService, TypeSavingsReceipt } from '../savings-receipts.service';
import { SavingAccountsService, TypeSavingAccount } from '../../../masters/saving-accounts/saving-accounts.service';
import { CustomersService, TypeCustomer } from '../../../masters/customers/customers.service';
import { TransactionNumberService } from '../../../../../services/transaction-number.service';
import { InputBehaviorDirective } from '../../../../../directives/input-behavior.directive';
import { ChangeDetectorRef } from '@angular/core';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';
import { AccountTypesService } from '../../../masters/account-types/account-types.service';

@Component({
  selector: 'app-savings-receipt',
  standalone: true,
  imports: [CommonModule, FormsModule, InputBehaviorDirective, SelectionlistComponent],
  providers: [DatePipe],
  templateUrl: './savings-receipt.component.html',
  styleUrl: './savings-receipt.component.scss'
})
export class SavingsReceiptComponent implements OnInit {

  Receipt!: TypeSavingsReceipt;
  isEditMode = false;
  isReceiptNoDisabled = false;
  submitCount = 0;
  errors: any = {};

  accountsList: TypeSavingAccount[] = [];
  customersList: TypeCustomer[] = [];
  seriesList: any[] = [];
  currentBalance: number = 0;
  minBalance: number = 0;
  availableBalance: number = 0;
  isBalanceLoading: boolean = false;

  constructor(
    private router: Router,
    public globals: GlobalService,
    private receiptsService: SavingsReceiptsService,
    private accountsService: SavingAccountsService,
    private customersService: CustomersService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private transNumService: TransactionNumberService,
    private acTypesService: AccountTypesService
  ) { }

  get selectedAccount(): TypeSavingAccount | undefined {
    return this.accountsList.find(a => Number(a.SbAcSno) === Number(this.Receipt.SbAcSno));
  }

  get selectedCustomer(): TypeCustomer | undefined {
    const account = this.selectedAccount;
    if (!account) return undefined;
    return this.customersList.find(c => Number(c.PartySno) === Number(account.PartySno));
  }

  get selectedAccountCategory(): string | undefined {
    const acTypeVal = this.acTypesService.acTypesList.find((type: any) => type.AcTypeSno === this.selectedAccount?.AcTypeSno);
    if (!acTypeVal) return undefined;
    const cat = Number(acTypeVal.Ac_Category);
    return cat === 1 ? 'Savings' : cat === 2 ? 'Current' : cat === 3 ? 'Other' : undefined;
  }

  get selectedJointCustomer(): TypeCustomer | undefined {
    const account = this.selectedAccount;
    if (!account || !account.JointPartySno) return undefined;
    return this.customersList.find(c => Number(c.PartySno) === Number(account.JointPartySno));
  }

  get accountsForDropdown(): any[] {
    return this.accountsList.map(a => {
      const customer = this.customersList.find(c => Number(c.PartySno) === Number(a.PartySno));
      return {
        ...a,
        SbAcSno: a.SbAcSno,
        Name: a.SbAccount_No,
        Details: customer?.Party_Name ?? ''
      };
    });
  }

  get selectedAccountForDropdown(): any {
    if (!this.Receipt?.SbAcSno) return undefined;
    const acc = this.accountsList.find(a => Number(a.SbAcSno) === Number(this.Receipt.SbAcSno));
    if (!acc) return undefined;
    const customer = this.customersList.find(c => Number(c.PartySno) === Number(acc.PartySno));
    return {
      ...acc,
      SbAcSno: acc.SbAcSno,
      Name: acc.SbAccount_No,
      Details: customer?.Party_Name ?? ''
    };
  }

  onAccountItemSelected(event: any) {
    if (event && event.SbAcSno) {
      this.Receipt.SbAcSno = event.SbAcSno;
    } else {
      this.Receipt.SbAcSno = 0;
    }
    this.onAccountSelected();
    if (this.submitCount > 0) this.validateFields();
  }


  ngOnInit(): void {
    this.loadAccounts();
    this.loadCustomers();
    this.loadVoucherSeries();
    this.loadAcTypes();

    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.Receipt = { ...stateData };
   
      this.Receipt.Receipt_Date = this.globals.formatDate(this.Receipt.Receipt_Date, 'yyyy-MM-dd');
      this.Receipt.CreateDate = this.globals.formatDate(this.Receipt.CreateDate, 'yyyy-MM-dd');
      
      this.onAccountSelected(); 
    } else {
      this.isEditMode = false;
      this.Receipt = this.receiptsService.initializeReceipt();
      const today = new Date();
      this.Receipt.Receipt_Date = this.globals.formatDate(today, 'yyyy-MM-dd');
    }
  }

  loadAcTypes() {
      if (this.acTypesService.acTypesList && this.acTypesService.acTypesList.length > 0) {
          return;
      }
      this.acTypesService.getAcTypes().subscribe({
          next: (res: any) => {
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              if (!Array.isArray(list)) list = [];
              this.acTypesService.acTypesList = list;
          },
          error: (err) => console.error(err)
      });
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
              // if (!this.isEditMode && this.seriesList.length > 0 && !this.Receipt.SeriesSno) {
              //     this.Receipt.SeriesSno = this.seriesList[0].SeriesSno;
              // }
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
      const compSno = Number(sessionStorage.getItem('CompSno'));
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

  onAccountSelected() {
      if (this.Receipt.SbAcSno) {
          const acType = this.acTypesService.acTypesList.find((type: any) => type.AcTypeSno === this.selectedAccount?.AcTypeSno);
          this.minBalance = acType ? Number(acType.Min_Balance) || 0 : 0;
          this.isBalanceLoading = true;
          this.currentBalance = 0;
          this.availableBalance = 0;
          
          const asOnDate = this.Receipt.Receipt_Date || this.globals.formatDate(new Date(), 'yyyy-MM-dd');
          this.receiptsService.getSavingsCurrentBalance(this.Receipt.SbAcSno, asOnDate).subscribe({
              next: (res: any) => {
                  let bal = res;
                  if (res && res.apiData !== undefined) {
                      bal = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
                  } else if (typeof res === 'string') {
                      try { bal = JSON.parse(res); } catch(e) {}
                  }
                  this.currentBalance = Number(bal) || 0;
                  this.availableBalance = this.currentBalance - this.minBalance;
                  this.isBalanceLoading = false;
                  this.cdr.detectChanges();
              },
              error: (err) => {
                  console.error(err);
                  this.isBalanceLoading = false;
                  this.cdr.detectChanges();
              }
          });
      } else {
          this.currentBalance = 0;
          this.minBalance = 0;
          this.availableBalance = 0;
      }
  }

  isBalanceLow(): boolean {
      return this.availableBalance <= (this.minBalance * 0.1) || this.availableBalance <= 0;
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
    if (!data.SbAcSno || Number(data.SbAcSno) <= 0) setError('SbAcSno', 'Valid Account Sno is Required');
    if (!data.Amount || Number(data.Amount) <= 0) setError('Amount', 'Valid Amount is Required');
    if (!data.SeriesSno) setError('SeriesSno', 'Series Sno is Required');

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

    payload.Receipt_Date = this.globals.formatDateForApi(payload.Receipt_Date);

    payload.SbAcSno = Number(payload.SbAcSno);
    payload.Amount = Number(payload.Amount);
    payload.SeriesSno = Number(payload.SeriesSno);
    payload.Payment_Mode = Number(payload.Payment_Mode || 1);

    if (this.isEditMode) {
      if (payload.CreateDate) payload.CreateDate = this.globals.formatDateForApi(payload.CreateDate);
    } else {
        payload.ReceiptSno = 0;
        payload.CurrentRowVer = null;
        payload.UserSno = 1;
        payload.CompSno = Number(sessionStorage.getItem('CompSno'));
        payload.CreateDate = ''; 
    }

    this.receiptsService.crudReceipts(action, payload).subscribe({
        next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
                this.globals.SnackBar('success', this.isEditMode ? 'Receipt updated successfully' : 'Receipt created successfully');

                if (res.CurrentRowVer) {
                    this.Receipt.CurrentRowVer = res.CurrentRowVer;
                }

                const receiptId = this.isEditMode ? this.Receipt.ReceiptSno : res.RetSno;

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
                            this.router.navigate(['dashboard/transactions/savings-receipts']);
                        },
                        error: (err) => {
                            console.error('Failed to fetch individual receipt', err);
                            this.receiptsService.receiptsList = []; 
                            this.router.navigate(['dashboard/transactions/savings-receipts']);
                        }
                    });
                } else {
                    this.receiptsService.receiptsList = []; 
                    this.router.navigate(['dashboard/transactions/savings-receipts']);
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
    this.router.navigate(['dashboard/transactions/savings-receipts']);
  }
}
