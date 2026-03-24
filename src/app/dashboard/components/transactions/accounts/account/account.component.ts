import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { AccountsService, TypeAccount } from '../accounts.service';
import { AccountTypesService as SchemesService, TypeAcType as TypeScheme } from '../../../masters/account-types/account-types.service';
import { CustomersService, TypeCustomer } from '../../../masters/customers/customers.service';
import { TransactionNumberService } from '../../../../../services/transaction-number.service';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectionlistComponent],
  providers: [DatePipe],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit {

  Account!: TypeAccount;
  isEditMode = false;
  isAccountNoDisabled = false;
  submitCount = 0;
  errors: any = {};
  
  schemesList: TypeScheme[] = [];
  customersList: TypeCustomer[] = [];
  seriesList: any[] = [];
  
  selectedFrequency: number = 0;
  frequencies = [
    { value: 1, label: 'Daily' },
    { value: 2, label: 'Weekly' },
    { value: 3, label: 'Bi-Monthly' },
    { value: 4, label: 'Monthly' },
    { value: 5, label: 'Quarterly' },
    { value: 6, label: 'Half-Yearly' },
    { value: 7, label: 'Yearly' }
  ];

  get instDate(): string {
      if (!this.Account?.Account_Date || !this.Account?.RdSchemeSno) return '';
      const selectedScheme = this.schemesList.find(s => s.RdSchemeSno == this.Account.RdSchemeSno);
      if (!selectedScheme) return '';

      // Add precisely 1 cycle length based on scheme frequency type natively
      const instDateObj = this.globals.addDuePeriodToDate(
        this.Account.Account_Date, 
        selectedScheme.Due_Frequency, 
        1 
      );
      instDateObj.setDate(instDateObj.getDate());
      return this.globals.formatDate(instDateObj, 'yyyy-MM-dd');
  }
  constructor(
    private router: Router,
    public globals: GlobalService,
    private accountsService: AccountsService,
    private schemesService: SchemesService,
    private customersService: CustomersService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private transNumService: TransactionNumberService,
  ) { }

  ngOnInit(): void {
    // Load lists
    this.loadSchemes();
    this.loadCustomers();
    this.loadVoucherSeries();

    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.Account = { ...stateData };

      this.Account.Account_Date = this.globals.formatDateForInput(this.Account.Account_Date);
      this.Account.Mature_Date = this.globals.formatDateForInput(this.Account.Mature_Date);
      // CreateDate
      this.Account.CreateDate = this.globals.formatDateForInput(this.Account.CreateDate);

    } else {
      this.isEditMode = false;
      this.Account = this.accountsService.initializeAccount();
      const today = new Date();
      this.Account.Account_Date = this.globals.formatDate(today, 'yyyy-MM-dd');
      // Maturity date will be calculated when scheme is selected
    }
    
    // Evaluate in case the cached list loads instantly before we get here
    this.updateFrequencyForEditMode();
  }

  loadSchemes() {
      // Use cached list if available to ensure immediate rendering
      if (this.schemesService.schemesList && this.schemesService.schemesList.length > 0) {
          this.schemesList = this.schemesService.schemesList;
          this.updateFrequencyForEditMode();
          return;
      }

      this.schemesService.getSchemes().subscribe({
          next: (res: any) => {
              // Extract the array correctly based on how the API responds
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              
              if (!Array.isArray(list)) list = [];
              
              this.schemesList = list;
              this.schemesService.schemesList = list;
              this.updateFrequencyForEditMode();
              this.cdr.detectChanges(); // Force UI update
          },
          error: (err) => { console.error(err); }
      });
  }

  updateFrequencyForEditMode() {
      if (this.isEditMode && this.Account?.RdSchemeSno) {
          const scheme = this.schemesList.find(s => s.RdSchemeSno == this.Account.RdSchemeSno);
          if (scheme) {
              this.selectedFrequency = Number(scheme.Due_Frequency);
              this.cdr.detectChanges();
          }
      }
  }

  loadCustomers() {
      // Use cached list if available to ensure immediate rendering
      if (this.customersService.customersList && this.customersService.customersList.length > 0) {
          this.customersList = this.customersService.customersList;
          return;
      }

      this.customersService.getCustomers().subscribe({
          next: (res: any) => {
              // Extract the array correctly based on how the API responds
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              
              if (!Array.isArray(list)) list = [];
              
              this.customersList = list;
              this.customersService.customersList = list;
              this.cdr.detectChanges(); // Force UI update
          },
          error: (err) => { console.error(err); }
      });
  }

  loadVoucherSeries() {
      this.accountsService.getVoucherSeries().subscribe({
          next: (res: any) => {
            console.log("data",res);
            
              let list = res;
              if (res && res.apiData) {
                  list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
              } else if (typeof res === 'string') {
                  try { list = JSON.parse(res); } catch(e) {}
              }
              
              if (!Array.isArray(list)) list = [];
              
              this.seriesList = list;
              // default to active series
              if (!this.isEditMode && this.seriesList.length > 0 && !this.Account.SeriesSno) {
                  this.Account.SeriesSno = this.seriesList[0].SeriesSno;
              }
              // Always evaluate disabled logic + potentially auto-generate
              this.onSeriesChange();
              this.cdr.detectChanges();
          },
          error: (err) => { console.error(err); }
      });
  }

  onSeriesChange() {
    if (!this.Account.SeriesSno) {
        if (!this.isEditMode) this.Account.Account_No = '';
        this.isAccountNoDisabled = false;
        return;
    }

    const selectedSeries = this.seriesList.find(s => s.SeriesSno === this.Account.SeriesSno);
    if (!selectedSeries) return;

    // Apply strict UI disabled rules uniformly for Edit and Create
    this.isAccountNoDisabled = Number(selectedSeries.Num_Method) === 2;

    // Prevent overwriting existing voucher numbers during Edit Mode
    if (this.isEditMode) return; 

    if (Number(selectedSeries.Num_Method) === 0) {
      // Manual Method
      this.Account.Account_No = '';
    } else if (Number(selectedSeries.Num_Method) === 2) {
      // Auto Method
      this.Account.Account_No = 'Auto';
    } else {
      // Semi Method (1)
      const compSno = Number(sessionStorage.getItem('CompSno')) || 1;
      this.transNumService.getTransactionNumber(Number(this.Account.SeriesSno), compSno).subscribe({
        
        next: (res: any) => {
          if (res && res.queryStatus === 1 && res.apiData) {
            this.Account.Account_No = res.apiData;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  get selectedCustomer(): TypeCustomer | undefined {
    return this.customersList.find(c => c.PartySno == this.Account.PartySno);
  }

  get customersForDropdown(): any[] {
    return this.customersList.map(c => ({
      ...c,
      Name: c.Party_Name,
      Details: c.Mobile ? `Phone: ${c.Mobile}` : ''
    }));
  }

  get selectedCustomerForDropdown(): any {
    if (!this.Account?.PartySno) return undefined;
    const customer = this.customersList.find(c => c.PartySno == this.Account.PartySno);
    if (!customer) return undefined;
    return {
      ...customer,
      Name: customer.Party_Name,
      Details: customer.Mobile ? `Phone: ${customer.Mobile}` : ''
    };
  }

  onCustomerSelected(event: any) {
    if (event && event.PartySno) {
      this.Account.PartySno = event.PartySno;
    } else {
      this.Account.PartySno = 0;
    }
    if(this.submitCount > 0) this.validateFields();
  }

  get selectedScheme(): TypeScheme | undefined {
    return this.schemesList.find(s => s.RdSchemeSno == this.Account.RdSchemeSno);
  }

  get filteredSchemesList(): TypeScheme[] {
    if (!this.selectedFrequency) return [];
    return this.schemesList.filter(s => Number(s.Due_Frequency) === Number(this.selectedFrequency));
  }
  get filteredSchemesForDropdown(): any[] {
    if (!this.selectedFrequency) return [];
    return this.schemesList
      .filter(s => Number(s.Due_Frequency) === Number(this.selectedFrequency))
      .map(s => ({
        ...s,
        Name: s.RdScheme_Name,
        Details: (s as any).Details || ''
      }));
  }

  get selectedSchemeForDropdown(): any {
    if (!this.Account?.RdSchemeSno) return undefined;
    const scheme = this.schemesList.find(s => s.RdSchemeSno == this.Account.RdSchemeSno);
    if (!scheme) return undefined;
    return {
      ...scheme,
      Name: scheme.RdScheme_Name,
      Details: (scheme as any).Details || ''
    };
  }

  onSchemeSelected(event: any) {
    if (event && event.RdSchemeSno) {
      this.Account.RdSchemeSno = event.RdSchemeSno;
    } else {
      this.Account.RdSchemeSno = 0;
    }
    this.onSchemeChange();
    if(this.submitCount > 0) this.validateFields();
  }

  onFrequencyChange() {
    this.Account.RdSchemeSno = 0; // Reset scheme selection if frequency changes
    this.Account.Mature_Amount = 0;
    this.Account.Mature_Date = '';
  }

  getFrequencyLabel(freq: number | string): string {
    const frequency = Number(freq);
    switch (frequency) {
        case 1: return 'Daily';
        case 2: return 'Weekly';
        case 3: return 'Bi-Monthly';
        case 4: return 'Monthly';
        case 5: return 'Quarterly';
        case 6: return 'Half-Yearly';
        case 7: return 'Yearly';
        default: return 'Unknown';
    }
  }

  onSchemeChange() {
      if (!this.Account.RdSchemeSno) return;
      
      const selectedScheme = this.schemesList.find(s => s.RdSchemeSno == this.Account.RdSchemeSno);
      if (!selectedScheme) return;

      // Extract Maturity Amount directly from Scheme
      this.Account.Mature_Amount = Number(selectedScheme.Maturity_Amount) || 0;

      // Calculate Maturity Date
      if (this.Account.Account_Date) { 
          // Dynamically compute exact calendar leap natively
          const matDateObj = this.globals.addDuePeriodToDate(
            this.Account.Account_Date,
            selectedScheme.Due_Frequency,
            selectedScheme.Due_Period
          );

          matDateObj.setDate(matDateObj.getDate() - 1); // Subtract 1 day for final maturity date

          this.Account.Mature_Date = this.globals.formatDate(matDateObj, 'yyyy-MM-dd');
      }
  }


  validateFields(): boolean {
    this.errors = {};
    let isValid = true;
    const data = this.Account;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (!data.Account_No) setError('Account_No', 'Account No is Required');
    if (!data.Account_Date) setError('Account_Date', 'Account Date is Required');
    if (!data.Mature_Date) setError('Mature_Date', 'Maturity Date is Required');
    if (!data.Mature_Amount || Number(data.Mature_Amount) <= 0) setError('Mature_Amount', 'Valid Maturity Amount is Required');
    if (!data.PartySno) setError('PartySno', 'Customer is Required');
    if (!data.RdSchemeSno) setError('RdSchemeSno', 'Scheme Sno is Required');

    if (!data.SeriesSno) setError('SeriesSno', 'Series Sno is Required');

    return isValid;
  }

  saveAccount() {
    this.submitCount++;
    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please fill required fields');
      return;
    }

    const action = this.isEditMode ? 1 : 0;
    const payload: any = { ...this.Account };
    payload.IsActive = (payload.IsActive === true || payload.IsActive === 1) ? 1 : 0;


    payload.Account_Date = this.globals.formatDateForApi(payload.Account_Date);
    payload.Mature_Date = this.globals.formatDateForApi(payload.Mature_Date);
    
    // Ensure numeric values
    payload.SeriesSno = Number(payload.SeriesSno);
    payload.Mature_Amount = Number(payload.Mature_Amount);
    payload.PartySno = Number(payload.PartySno);
    payload.RdSchemeSno = Number(payload.RdSchemeSno);

    if (this.isEditMode) {
      if (payload.CreateDate) payload.CreateDate = this.globals.formatDateForApi(payload.CreateDate);
    } else {
        payload.RdAccountSno = 0;
        payload.CurrentRowVer = null;
        payload.UserSno = 1;
        payload.CompSno = 1;
        payload.CreateDate = ''; 
    }


    this.accountsService.crudAccounts(action, payload).subscribe({
        next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
                this.globals.SnackBar('success', this.isEditMode ? 'Account updated successfully' : 'Account created successfully');
                
                if (res.CurrentRowVer) {
                    this.Account.CurrentRowVer = res.CurrentRowVer;
                }
                
                const accountId = this.isEditMode ? this.Account.RdAccountSno : res.RetSno;
                
                if (accountId) {
                    this.accountsService.getAccount(accountId).subscribe({
                        next: (accountData: any) => {
                            let list = accountData;
                            // if (accountData && accountData.apiData) {
                            //     list = typeof accountData.apiData === 'string' ? JSON.parse(accountData.apiData) : accountData.apiData;
                            // } else if (typeof accountData === 'string') {
                            //     try { list = JSON.parse(accountData); } catch(e) {}
                            // }
                            
                            const fetchedAccount = Array.isArray(list) ? list[0] : list;
                            
                            if (fetchedAccount) {
                                if (this.isEditMode) {
                                    this.accountsService.updateAccount(fetchedAccount);
                                } else {
                                    this.accountsService.addAccount(fetchedAccount);
                                }
                            }
                            this.router.navigate(['dashboard/transactions/accounts']);
                        },
                        error: (err) => {
                            console.error('Failed to fetch individual account', err);
                            this.accountsService.accountsList = []; // Fallback to full fetch next time
                            this.router.navigate(['dashboard/transactions/accounts']);
                        }
                    });
                } else {
                    this.accountsService.accountsList = []; // Fallback
                    this.router.navigate(['dashboard/transactions/accounts']);
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
  


  cancelAccount() {
    this.router.navigate(['dashboard/transactions/accounts']);
  }

}
