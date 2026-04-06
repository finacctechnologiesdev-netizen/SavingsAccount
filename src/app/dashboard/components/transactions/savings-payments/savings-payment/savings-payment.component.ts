import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { SavingsPaymentsService, TypeSavingsPayment } from '../savings-payments.service';
import { SavingAccountsService, TypeSavingAccount } from '../../../masters/saving-accounts/saving-accounts.service';
import { CustomersService, TypeCustomer } from '../../../masters/customers/customers.service';
import { TransactionNumberService } from '../../../../../services/transaction-number.service';
import { InputBehaviorDirective } from '../../../../../directives/input-behavior.directive';
import { ChangeDetectorRef } from '@angular/core';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';
import { AccountTypesService } from '../../../masters/account-types/account-types.service';

@Component({
  selector: 'app-savings-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, InputBehaviorDirective, SelectionlistComponent],
  providers: [DatePipe],
  templateUrl: './savings-payment.component.html',
  styleUrl: './savings-payment.component.scss'
})
export class SavingsPaymentComponent implements OnInit {

  payment!: TypeSavingsPayment;
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
    private paymentsService: SavingsPaymentsService,
    private accountsService: SavingAccountsService,
    private customersService: CustomersService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private transNumService: TransactionNumberService,
    private acTypesService: AccountTypesService
  ) { }

  get selectedAccount(): TypeSavingAccount | undefined {
    return this.accountsList.find(a => Number(a.SbAcSno) === Number(this.payment.SbAcSno));
  }

  get selectedCustomer(): TypeCustomer | undefined {
    const account = this.selectedAccount;
    if (!account) return undefined;
    return this.customersList.find(c => Number(c.PartySno) === Number(account.PartySno));
  }

  get selectedJointCustomer(): TypeCustomer | undefined {
    const account = this.selectedAccount;
    if (!account || !account.JointPartySno) return undefined;
    return this.customersList.find(c => Number(c.PartySno) === Number(account.JointPartySno));
  }

  get selectedAccountCategory(): string | undefined {
    const acTypeVal = this.acTypesService.acTypesList.find((type) => type.AcTypeSno === this.selectedAccount?.AcTypeSno);
    if (!acTypeVal) return undefined;
    const cat = Number(acTypeVal.Ac_Category);
    return cat === 1 ? 'Savings' : cat === 2 ? 'Current' : cat === 3 ? 'Other' : undefined;
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
    if (!this.payment?.SbAcSno) return undefined;
    const acc = this.accountsList.find(a => Number(a.SbAcSno) === Number(this.payment.SbAcSno));
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
      this.payment.SbAcSno = event.SbAcSno;
    } else {
      this.payment.SbAcSno = 0;
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
      this.payment = { ...stateData };
   
      this.payment.Payment_Date = this.globals.formatDate(this.payment.Payment_Date, 'yyyy-MM-dd');
      this.payment.CreateDate = this.globals.formatDate(this.payment.CreateDate, 'yyyy-MM-dd');
      
      this.onAccountSelected(); 
    } else {
      this.isEditMode = false;
      this.payment = this.paymentsService.initializePayment();
      const today = new Date();
      this.payment.Payment_Date = this.globals.formatDate(today, 'yyyy-MM-dd');
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
      this.paymentsService.getVoucherSeries().subscribe({
          next: (res: any) => {
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              
              if (!Array.isArray(list)) list = [];
              
              this.seriesList = list;
              if (!this.isEditMode && this.seriesList.length > 0 && !this.payment.SeriesSno) {
                  this.payment.SeriesSno = this.seriesList[0].SeriesSno;
              }
              this.onSeriesChange();
              this.cdr.detectChanges();
          },
          error: (err) => { console.error(err); }
      });
  }

  onSeriesChange() {
    if (!this.payment.SeriesSno) {
        if (!this.isEditMode) this.payment.Payment_No = '';
        this.isReceiptNoDisabled = false;
        return;
    }

    const selectedSeries = this.seriesList.find(s => s.SeriesSno === this.payment.SeriesSno);
    if (!selectedSeries) return;

    this.isReceiptNoDisabled = Number(selectedSeries.Num_Method) === 2;

    if (this.isEditMode) return; 

    if (Number(selectedSeries.Num_Method) === 0) {
      this.payment.Payment_No = '';
    } else if (Number(selectedSeries.Num_Method) === 2) {
      this.payment.Payment_No = 'Auto';
    } else {
      const compSno = Number(sessionStorage.getItem('CompSno')) || 1;
      this.transNumService.getTransactionNumber(Number(this.payment.SeriesSno), compSno).subscribe({
        next: (res: any) => {
          if (res && res.queryStatus === 1 && res.apiData) {
            this.payment.Payment_No = res.apiData;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  onAccountSelected() {
      if (this.payment.SbAcSno) {
          const acType = this.acTypesService.acTypesList.find((type: any) => type.AcTypeSno === this.selectedAccount?.AcTypeSno);
          this.minBalance = acType ? Number(acType.Min_Balance) || 0 : 0;
          this.isBalanceLoading = true;
          this.currentBalance = 0;
          this.availableBalance = 0;
          
          const asOnDate = this.payment.Payment_Date || this.globals.formatDate(new Date(), 'yyyy-MM-dd');
          this.paymentsService.getSavingsCurrentBalance(this.payment.SbAcSno, asOnDate).subscribe({
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
    const data = this.payment;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (!data.Payment_No) setError('Payment_No', 'payment No is Required');
    if (!data.Payment_Date) setError('Payment_Date', 'payment Date is Required');
    if (!data.SbAcSno || Number(data.SbAcSno) <= 0) setError('SbAcSno', 'Valid Account Sno is Required');
    if (!data.Amount || Number(data.Amount) <= 0) setError('Amount', 'Valid Amount is Required');
    else if (Number(data.Amount) > this.availableBalance) setError('Amount', `Amount exceeds available balance (₹${this.availableBalance})`);
    if (!data.SeriesSno) setError('SeriesSno', 'Series Sno is Required');

    return isValid;
  }

  savePayment() {
    this.submitCount++;
    if (!this.validateFields()) {
      if (this.errors['Amount'] && this.errors['Amount'].includes('available balance')) {
        this.globals.SnackBar('error', this.errors['Amount']);
      } else {
        this.globals.SnackBar('error', 'Please fill required fields');
      }
      return;
    }

    const action = this.isEditMode ? 1 : 0;
    const payload: any = { ...this.payment };
    payload.IsActive = (payload.IsActive === true || payload.IsActive === 1) ? 1 : 0;

    payload.Payment_Date = this.globals.formatDateForApi(payload.Payment_Date);

    payload.SbAcSno = Number(payload.SbAcSno);
    payload.Amount = Number(payload.Amount);
    payload.SeriesSno = Number(payload.SeriesSno);
    payload.Payment_Mode = Number(payload.Payment_Mode || 1);

    if (this.isEditMode) {
      if (payload.CreateDate) payload.CreateDate = this.globals.formatDateForApi(payload.CreateDate);
    } else {
        payload.PaymentSno = 0;
        payload.CurrentRowVer = null;
        payload.UserSno = 1;
        payload.CompSno = 1;
        payload.CreateDate = ''; 
    }

    this.paymentsService.crudPayments(action, payload).subscribe({
        next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
                this.globals.SnackBar('success', this.isEditMode ? 'payment updated successfully' : 'payment created successfully');

                if (res.CurrentRowVer) {
                    this.payment.CurrentRowVer = res.CurrentRowVer;
                }

                const receiptId = this.isEditMode ? this.payment.PaymentSno : res.RetSno;

                if (receiptId) {
                    this.paymentsService.getPayment(Number(receiptId)).subscribe({
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
                                    this.paymentsService.updatePayment(fetchedReceipt);
                                } else {
                                    this.paymentsService.addPayment(fetchedReceipt);
                                }
                            }
                            this.router.navigate(['dashboard/transactions/savings-payments']);
                        },
                        error: (err) => {
                            console.error('Failed to fetch individual payment', err);
                            this.paymentsService.paymentsList = []; 
                            this.router.navigate(['dashboard/transactions/savings-payments']);
                        }
                    });
                } else {
                    this.paymentsService.paymentsList = []; 
                    this.router.navigate(['dashboard/transactions/savings-payments']);
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

  cancelPayment() {
    this.router.navigate(['dashboard/transactions/savings-payments']);
  }
}


