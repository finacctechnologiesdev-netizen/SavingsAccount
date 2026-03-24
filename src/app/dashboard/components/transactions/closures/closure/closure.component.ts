import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { ClosuresService, TypeClosure } from '../closures.service';
import { AccountsService, TypeAccount } from '../../accounts/accounts.service';
import { AccountTypesService as SchemesService, TypeAcType as TypeScheme } from '../../../masters/account-types/account-types.service';
import { CustomersService, TypeCustomer } from '../../../masters/customers/customers.service';
import { TransactionNumberService } from '../../../../../services/transaction-number.service';
import { InputBehaviorDirective } from '../../../../../directives/input-behavior.directive';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';

@Component({
  selector: 'app-closure',
  standalone: true,
  imports: [CommonModule, FormsModule, InputBehaviorDirective, SelectionlistComponent],
  providers: [DatePipe],
  templateUrl: './closure.component.html',
  styleUrl: './closure.component.scss'
})
export class ClosureComponent implements OnInit {

  Closure!: TypeClosure;
  errors: any = {};
  submitCount = 0;
  isEditMode = false;
  isClosureNoDisabled = false;

  accountsList: TypeAccount[] = [];
  schemesList: TypeScheme[] = [];
  customersList: TypeCustomer[] = [];
  seriesList: any[] = [];
  accountSummary: any = null;

  constructor(
    private closuresService: ClosuresService,
    private accountsService: AccountsService,
    private schemesService: SchemesService,
    private customersService: CustomersService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    public globals: GlobalService,
    private router: Router,
    private transNumService: TransactionNumberService
  ) { 
    this.Closure = this.closuresService.getNewClosure();
  }

  get selectedAccount(): TypeAccount | undefined {
    return this.accountsList.find(a => a.RdAccountSno == this.Closure.RdAccountSno);
  }

  get selectedCustomer(): TypeCustomer | undefined {
    const acc = this.selectedAccount;
    if (!acc) return undefined;
    return this.customersList.find(c => c.PartySno == acc.PartySno);
  }

  get selectedScheme(): TypeScheme | undefined {
    const acc = this.selectedAccount;
    if (!acc) return undefined;
    return this.schemesList.find(s => s.RdSchemeSno == acc.RdSchemeSno);
  }

  get accountsForDropdown(): any[] {
    return this.accountsList.map(a => {
      const customer = this.customersList.find(c => c.PartySno == a.PartySno);
      return {
        ...a,
        Name: a.Account_No,
        Details: customer?.Party_Name ?? ''
      };
    });
  }

  get selectedAccountForDropdown(): any {
    if (!this.Closure?.RdAccountSno) return undefined;
    const acc = this.accountsList.find(a => a.RdAccountSno == this.Closure.RdAccountSno);
    if (!acc) return undefined;
    const customer = this.customersList.find(c => c.PartySno == acc.PartySno);
    return {
      ...acc,
      Name: acc.Account_No,
      Details: customer?.Party_Name ?? ''
    };
  }

  onAccountItemSelected(event: any) {
    if (event && event.RdAccountSno) {
      this.Closure.RdAccountSno = event.RdAccountSno;
    } else {
      this.Closure.RdAccountSno = 0;
    }
    this.onAccountSelected();
    if (this.submitCount > 0) this.validateFields();
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadSchemes();
    this.loadCustomers();
    this.loadVoucherSeries();

    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.Closure = { ...stateData };
      if (this.Closure.Closure_Date && this.Closure.Closure_Date.date) {
        this.Closure.Closure_Date = this.datePipe.transform(new Date(this.Closure.Closure_Date.date), 'yyyy-MM-dd') || '';
      } else if (this.Closure.Closure_Date) {
        this.Closure.Closure_Date = this.datePipe.transform(new Date(this.Closure.Closure_Date), 'yyyy-MM-dd') || '';
      }
      this.onAccountSelected(false);
    } else {
      this.Closure.Closure_Date = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
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
          try { list = JSON.parse(res); } catch (e) { }
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
          try { list = JSON.parse(res); } catch (e) { }
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
          try { list = JSON.parse(res); } catch (e) { }
        }
        if (!Array.isArray(list)) list = [];
        this.customersList = list;
        this.customersService.customersList = list;
      },
      error: (err) => console.error(err)
    });
  }

  loadVoucherSeries() {
      this.closuresService.getVoucherSeries().subscribe({
          next: (res: any) => {
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              
              if (!Array.isArray(list)) list = [];
              
              this.seriesList = list;
              if (!this.isEditMode && this.seriesList.length > 0 && !this.Closure.SeriesSno) {
                  this.Closure.SeriesSno = this.seriesList[0].SeriesSno;
              }
              this.onSeriesChange();
              this.cdr.detectChanges();
          },
          error: (err) => { console.error(err); }
      });
  }

  onSeriesChange() {
    if (!this.Closure.SeriesSno) {
        if (!this.isEditMode) this.Closure.Closure_No = '';
        this.isClosureNoDisabled = false;
        return;
    }

    const selectedSeries = this.seriesList.find(s => s.SeriesSno === this.Closure.SeriesSno);
    if (!selectedSeries) return;

    this.isClosureNoDisabled = Number(selectedSeries.Num_Method) === 2;

    if (this.isEditMode) return; 

    if (Number(selectedSeries.Num_Method) === 0) {
      this.Closure.Closure_No = '';
    } else if (Number(selectedSeries.Num_Method) === 2) {
      this.Closure.Closure_No = 'Auto';
    } else {
      const compSno = Number(sessionStorage.getItem('CompSno')) || 1;
      this.transNumService.getTransactionNumber(Number(this.Closure.SeriesSno), compSno).subscribe({
        next: (res: any) => {
          if (res && res.queryStatus === 1 && res.apiData) {
            this.Closure.Closure_No = res.apiData;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  calculateAmount() {
    // Math to automatically sum up total, interest and determine Net
    const totalAmount = Number(this.Closure.Total_Amount) || 0;
    const intAmount = Number(this.Closure.Interest_Amount) || 0;
    this.Closure.Nett_Amount = totalAmount + intAmount;
  }

  onAccountSelected(calcAmount: boolean = true) {
      if (calcAmount) this.calculateAmount();

      if (this.Closure.RdAccountSno) {
          this.closuresService.getAccountSummary(Number(this.Closure.RdAccountSno)).subscribe({
              next: (res: any) => {
                  let data = res;
                  if (res && res.apiData) {
                      data = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
                  } else if (typeof res === 'string') {
                      try { data = JSON.parse(res); } catch(e) {}
                  }

                  if (Array.isArray(data) && data.length > 0) {
                      this.accountSummary = data[0];
                      
                      if (calcAmount) {
                          const scheme = this.selectedScheme;
                          const dueCount = scheme ? Number(scheme.Due_Period || 0) : 0;
                          const dueAmount = scheme ? Number(scheme.DueAmount || 0) : 0;
                          const maturityAmount = scheme ? Number(scheme.Maturity_Amount || 0) : 0;

                          this.Closure.Total_Amount = Math.round(dueCount * dueAmount);
                          
                          // Avoid negative interest if Total Amount is somehow larger
                          const interest = maturityAmount - Number(this.Closure.Total_Amount);
                          this.Closure.Interest_Amount = interest > 0 ? Math.round(interest) : 0;
                          
                          this.calculateAmount();
                      }

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
    const data = this.Closure;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (!data.Closure_No) setError('Closure_No', 'Closure No is Required');
    if (!data.Closure_Date) setError('Closure_Date', 'Closure Date is Required');
    if (!data.RdAccountSno || data.RdAccountSno === 0) setError('RdAccountSno', 'Account Selection is Required');
    if (!data.SeriesSno) setError('SeriesSno', 'Series Sno is Required');

    if (this.submitCount > 0) {
      this.cdr.detectChanges();
    }
    return isValid;
  }

  saveClosure() {
    
    
    this.submitCount++;

    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please resolve the errors before saving.');
      return;
    }

    if (!this.checkCanClose()) {
      return;
    }

    const payload: any = { ...this.Closure };
    payload.AccountSno = Number(payload.RdAccountSno);
    payload.Closure_Method = Number(payload.Closure_Method);
    payload.Total_Amount = Number(payload.Total_Amount || 0);
    payload.Interest_Amount = Number(payload.Interest_Amount || 0);
    payload.Nett_Amount = Number(payload.Nett_Amount || 0);
    payload.SeriesSno = Number(payload.SeriesSno || 0);

    const action = this.isEditMode ? 1 : 0;

    this.closuresService.crudClosures(action, payload).subscribe({
      next: (res: any) => {
        if (res.Status === 'Success') {
          this.globals.SnackBar('success', 'Closure generated successfully.');

          if (res.CurrentRowVer) {
            payload.CurrentRowVer = res.CurrentRowVer;
          }

          const closureId = this.isEditMode ? payload.RdClosureSno : res.RetSno;

          if (closureId) {
            this.closuresService.getClosure(Number(closureId)).subscribe({
              next: (closureData: any) => {
                let list = closureData;
                if (closureData && closureData.apiData) {
                  list = typeof closureData.apiData === 'string' ? JSON.parse(closureData.apiData) : closureData.apiData;
                } else if (typeof closureData === 'string') {
                  try { list = JSON.parse(closureData); } catch (e) {}
                }
                const fetchedClosure = Array.isArray(list) ? list[0] : list;
                if (fetchedClosure) {
                  if (this.isEditMode) {
                    this.closuresService.updateClosure(fetchedClosure);
                  } else {
                    this.closuresService.addClosure(fetchedClosure);
                  }
                }
                this.router.navigate(['dashboard/transactions/closures']);
              },
              error: (err) => {
                console.error('Failed to fetch individual closure', err);
                this.closuresService.closuresList = []; // Fallback to full fetch next time
                this.router.navigate(['dashboard/transactions/closures']);
              }
            });
          } else {
            this.closuresService.closuresList = []; // Fallback
            this.router.navigate(['dashboard/transactions/closures']);
          }
        } else {
          this.globals.SnackBar('error', res.Message || 'Failed to save closure.');
        }
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.globals.SnackBar('error', 'Network error while saving.');
      }
    });
  }

  cancelClosure() {
    this.router.navigate(['dashboard/transactions/closures']);
  }

  checkCanClose(): boolean {
    // Guard: account must be selected
    if (!this.selectedAccount) {
      this.globals.SnackBar('error', 'Please select an account before saving.');
      return false;
    }

    // For Premature Closure (method 2), enforce the 3-month minimum rule
    if (Number(this.Closure.Closure_Method) ) {
      // Account_Date from the API is { date: "YYYY-MM-DD HH:mm:ss.000000" }
      // After edit-mode parse it may already be a plain string "YYYY-MM-DD"
      const rawAccountDate = this.selectedAccount.Account_Date?.date
        ?? this.selectedAccount.Account_Date;

      if (!rawAccountDate) {
        this.globals.SnackBar('error', 'Account Date is missing. Cannot validate closure.');
        return false;
      }

      // Build the minimum allowed closure date = Account_Date + 3 months
      const minCloseDate = new Date(rawAccountDate);
      if (isNaN(minCloseDate.getTime())) {
        this.globals.SnackBar('error', 'Invalid Account Date. Cannot validate closure.');
        return false;
      }
      minCloseDate.setMonth(minCloseDate.getMonth() + 3);

      // Closure_Date is always a plain "YYYY-MM-DD" string (set by the date input)
      const closureDate = new Date(this.Closure.Closure_Date);
      if (isNaN(closureDate.getTime())) {
        this.globals.SnackBar('error', 'Please enter a valid Closure Date.');
        return false;
      }

      if (closureDate < minCloseDate) {
        const minDateStr = this.globals.formatDateToDDMMYYYY(minCloseDate);
        this.globals.SnackBar(
          'error',
          `Closure is only allowed from ${minDateStr} (3 months after Account Date).`
        );
        return false;
      }
    }

    return true;
  }
}
