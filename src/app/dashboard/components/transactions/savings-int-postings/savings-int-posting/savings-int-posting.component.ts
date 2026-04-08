import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { SavingsIntPostingsService, TypeSavingsIntPosting } from '../savings-int-postings.service';
import { SavingAccountsService, TypeSavingAccount } from '../../../masters/saving-accounts/saving-accounts.service';
import { CustomersService, TypeCustomer } from '../../../masters/customers/customers.service';
import { TransactionNumberService } from '../../../../../services/transaction-number.service';
import { InputBehaviorDirective } from '../../../../../directives/input-behavior.directive';
import { ChangeDetectorRef } from '@angular/core';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';

@Component({
  selector: 'app-savings-int-posting',
  standalone: true,
  imports: [CommonModule, FormsModule, InputBehaviorDirective, SelectionlistComponent],
  providers: [DatePipe],
  templateUrl: './savings-int-posting.component.html',
  styleUrl: './savings-int-posting.component.scss'
})
export class SavingsIntPostingComponent implements OnInit {

  intPosting!: TypeSavingsIntPosting;
  isEditMode = false;
  isReceiptNoDisabled = false;
  submitCount = 0;
  errors: any = {};

  accountsList: TypeSavingAccount[] = [];
  customersList: TypeCustomer[] = [];
  seriesList: any[] = [];
  accountSummary: any = null;

  constructor(
    private router: Router,
    public globals: GlobalService,
    private intPostingsService: SavingsIntPostingsService,
    private accountsService: SavingAccountsService,
    private customersService: CustomersService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private transNumService: TransactionNumberService,
  ) { }

  get selectedAccount(): TypeSavingAccount | undefined {
    return this.accountsList.find(a => Number(a.SbAcSno) === Number(this.intPosting.SbAcSno));
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
    if (!this.intPosting?.SbAcSno) return undefined;
    const acc = this.accountsList.find(a => Number(a.SbAcSno) === Number(this.intPosting.SbAcSno));
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
      this.intPosting.SbAcSno = event.SbAcSno;
    } else {
      this.intPosting.SbAcSno = 0;
    }
    this.onAccountSelected();
    if (this.submitCount > 0) this.validateFields();
  }


  ngOnInit(): void {
    this.loadAccounts();
    this.loadCustomers();
    this.loadVoucherSeries();

    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.intPosting = { ...stateData };
   
      this.intPosting.Posting_Date = this.globals.formatDate(this.intPosting.Posting_Date, 'yyyy-MM-dd');
      this.intPosting.CreateDate = this.globals.formatDate(this.intPosting.CreateDate, 'yyyy-MM-dd');
      
      this.onAccountSelected(); 
    } else {
      this.isEditMode = false;
      this.intPosting = this.intPostingsService.initializeIntPosting();
      const today = new Date();
      this.intPosting.Posting_Date = this.globals.formatDate(today, 'yyyy-MM-dd');
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
      this.intPostingsService.getVoucherSeries().subscribe({
          next: (res: any) => {
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              
              if (!Array.isArray(list)) list = [];
              
              this.seriesList = list;
              // if (!this.isEditMode && this.seriesList.length > 0 && !this.intPosting.SeriesSno) {
              //     this.intPosting.SeriesSno = this.seriesList[0].SeriesSno;
              // }
              this.onSeriesChange();
              this.cdr.detectChanges();
          },
          error: (err) => { console.error(err); }
      });
  }

  onSeriesChange() {
    if (!this.intPosting.SeriesSno) {
        if (!this.isEditMode) this.intPosting.Posting_No = '';
        this.isReceiptNoDisabled = false;
        return;
    }

    const selectedSeries = this.seriesList.find(s => s.SeriesSno === this.intPosting.SeriesSno);
    if (!selectedSeries) return;

    this.isReceiptNoDisabled = Number(selectedSeries.Num_Method) === 2;

    if (this.isEditMode) return; 

    if (Number(selectedSeries.Num_Method) === 0) {
      this.intPosting.Posting_No = '';
    } else if (Number(selectedSeries.Num_Method) === 2) {
      this.intPosting.Posting_No = 'Auto';
    } else {
      const compSno = Number(sessionStorage.getItem('CompSno'));
      this.transNumService.getTransactionNumber(Number(this.intPosting.SeriesSno), compSno).subscribe({
        next: (res: any) => {
          if (res && res.queryStatus === 1 && res.apiData) {
            this.intPosting.Posting_No = res.apiData;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  onAccountSelected() {
      if (this.intPosting.SbAcSno) {
          this.intPostingsService.getAccountSummary(this.intPosting.SbAcSno).subscribe({
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
    const data = this.intPosting;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (!data.Posting_No) setError('Posting_No', 'intPosting No is Required');
    if (!data.Posting_Date) setError('Posting_Date', 'intPosting Date is Required');
    if (!data.SbAcSno || Number(data.SbAcSno) <= 0) setError('SbAcSno', 'Valid Account Sno is Required');
    if (!data.Amount || Number(data.Amount) <= 0) setError('Amount', 'Valid Amount is Required');
    if (!data.SeriesSno) setError('SeriesSno', 'Series Sno is Required');

    return isValid;
  }

  saveIntPosting() {
    this.submitCount++;
    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please fill required fields');
      return;
    }

    const action = this.isEditMode ? 1 : 0;
    const payload: any = { ...this.intPosting };
    payload.IsActive = (payload.IsActive === true || payload.IsActive === 1) ? 1 : 0;

    payload.Posting_Date = this.globals.formatDateForApi(payload.Posting_Date);

    payload.SbAcSno = Number(payload.SbAcSno);
    payload.Amount = Number(payload.Amount);
    payload.SeriesSno = Number(payload.SeriesSno);


    if (this.isEditMode) {
      if (payload.CreateDate) payload.CreateDate = this.globals.formatDateForApi(payload.CreateDate);
    } else {
        payload.PostingSno = 0;
        payload.CurrentRowVer = null;
        payload.UserSno = 1;
        payload.CompSno = Number(sessionStorage.getItem('CompSno'));
        payload.CreateDate = ''; 
    }

    this.intPostingsService.crudIntPostings(action, payload).subscribe({
        next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
                this.globals.SnackBar('success', this.isEditMode ? 'intPosting updated successfully' : 'intPosting created successfully');

                if (res.CurrentRowVer) {
                    this.intPosting.CurrentRowVer = res.CurrentRowVer;
                }

                const receiptId = this.isEditMode ? this.intPosting.PostingSno : res.RetSno;

                if (receiptId) {
                    this.intPostingsService.getIntPosting(Number(receiptId)).subscribe({
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
                                    this.intPostingsService.updateIntPosting(fetchedReceipt);
                                } else {
                                    this.intPostingsService.addIntPosting(fetchedReceipt);
                                }
                            }
                            this.router.navigate(['dashboard/transactions/savings-int-postings']);
                        },
                        error: (err) => {
                            console.error('Failed to fetch individual intPosting', err);
                            this.intPostingsService.intPostingsList = []; 
                            this.router.navigate(['dashboard/transactions/savings-int-postings']);
                        }
                    });
                } else {
                    this.intPostingsService.intPostingsList = []; 
                    this.router.navigate(['dashboard/transactions/savings-int-postings']);
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

  cancelIntPosting() {
    this.router.navigate(['dashboard/transactions/savings-int-postings']);
  }
}



