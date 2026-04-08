import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { SavingAccountsService, TypeSavingAccount } from '../saving-accounts.service';
import { CustomersService, TypeCustomer } from '../../../masters/customers/customers.service';
import { AccountTypesService, TypeAcType } from '../../../masters/account-types/account-types.service';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';
import { SavingsReceiptsService, TypeSavingsReceipt } from '../../../transactions/savings-receipts/savings-receipts.service';
import { AppsetupService, TypeSavingsSetup } from '../../../settings/appsetup/appsetup.service';

@Component({
  selector: 'app-saving-account',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectionlistComponent],
  providers: [DatePipe],
  templateUrl: './saving-account.component.html',
  styleUrl: './saving-account.component.scss'
})
export class SavingAccountComponent implements OnInit {

  Account!: TypeSavingAccount;
  isEditMode = false;
  submitCount = 0;
  errors: any = {};

  customersList: TypeCustomer[] = [];
  accountTypesList: TypeAcType[] = [];
  acTypesService: any;

  constructor(
    private router: Router,
    public globals: GlobalService,
    private accountsService: SavingAccountsService,
    private customersService: CustomersService,
    private accountTypesService: AccountTypesService,
    private cdr: ChangeDetectorRef,
    private receiptsService: SavingsReceiptsService,
    private appsetupService: AppsetupService
  ) { }

  setupConfig!: TypeSavingsSetup;

  ngOnInit(): void {
    this.loadSetup();
    this.loadCustomers();
    this.loadAccountTypes();

    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.Account = { ...stateData };
      this.Account.CreateDate = this.globals.formatDate(this.Account.CreateDate, 'yyyy-MM-dd');
    } else {
      this.isEditMode = false;
      this.Account = this.accountsService.initializeAccount();
    }
  }

  loadSetup() {
    this.appsetupService.getRdSetup().subscribe({
      next: (res: TypeSavingsSetup[]) => {
        if (res) {
          this.setupConfig = res[0];
          // If Auto Generate is enabled (1) and we are creating a new account:
          if (this.setupConfig.AccCode_AutoGen === 1 && !this.isEditMode) {
            this.Account.SbAccount_No = 'Auto';
          }
        }
      },
      error: (err) => console.log('Failed to load setup', err)
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
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); }
    });
  }

  loadAccountTypes() {
    if (this.accountTypesService.acTypesList && this.accountTypesService.acTypesList.length > 0) {
      this.accountTypesList = this.accountTypesService.acTypesList;
      return;
    }

    this.accountTypesService.getAcTypes().subscribe({
      next: (res: any) => {
        let list = res;
        if (res && res.apiData) {
          list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
        } else if (typeof res === 'string') {
          try { list = JSON.parse(res); } catch (e) { }
        }
        if (!Array.isArray(list)) list = [];

        this.accountTypesList = list;
        this.accountTypesService.acTypesList = list;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); }
    });
  }

  get accountTypesForDropdown(): any[] {
    return this.accountTypesList.map(t => {
      let catName = 'Unknown';
      if (t.Ac_Category === 1) catName = 'Savings';
      else if (t.Ac_Category === 2) catName = 'Current';

      return {
        ...t,
        Name: t.AcType_Name,
        Details: `Category: ${catName} | ROI: ${t.Roi}%`
      };
    });
  }

  get selectedAccountTypeForDropdown(): any {
    if (!this.Account?.AcTypeSno) return undefined;
    const type = this.accountTypesList.find(t => t.AcTypeSno == this.Account.AcTypeSno);
    if (!type) return undefined;

    let catName = 'Unknown';
    if (type.Ac_Category === 1) catName = 'Savings';
    else if (type.Ac_Category === 2) catName = 'Current';

    return {
      ...type,
      Name: type.AcType_Name,
      Details: `Category: ${catName} | ROI: ${type.Roi}%`
    };
  }

  onAccountTypeSelected(event: any) {
    if (event && event.AcTypeSno) {
      this.Account.AcTypeSno = event.AcTypeSno;
    } else {
      this.Account.AcTypeSno = 0;
    }
    if (this.submitCount > 0) this.validateFields();
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
      this.Account.Passbook_No = event.Party_Code;
    } else {
      this.Account.PartySno = 0;
    }
    if (this.submitCount > 0) this.validateFields();
  }

  get selectedJointCustomerForDropdown(): any {
    if (!this.Account?.JointPartySno) return undefined;
    const customer = this.customersList.find(c => c.PartySno == this.Account.JointPartySno);
    if (!customer) return undefined;
    return {
      ...customer,
      Name: customer.Party_Name,
      Details: customer.Mobile ? `Phone: ${customer.Mobile}` : ''
    };
  }

  onJointCustomerSelected(event: any) {
    if (event && event.PartySno) {
      this.Account.JointPartySno = event.PartySno;
    } else {
      this.Account.JointPartySno = 0;
    }
  }

  get selectedRefCustomerForDropdown(): any {
    if (!this.Account?.RefPartySno) return undefined;
    const customer = this.customersList.find(c => c.PartySno == this.Account.RefPartySno);
    if (!customer) return undefined;
    return {
      ...customer,
      Name: customer.Party_Name,
      Details: customer.Mobile ? `Phone: ${customer.Mobile}` : ''
    };
  }

  onRefCustomerSelected(event: any) {
    if (event && event.PartySno) {
      this.Account.RefPartySno = event.PartySno;
    } else {
      this.Account.RefPartySno = 0;
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

    if (!data.SbAccount_No) setError('SbAccount_No', 'Account No is Required');
    if (!data.PartySno) setError('PartySno', 'Customer is Required');
    if (!data.AcTypeSno || Number(data.AcTypeSno) <= 0) setError('AcTypeSno', 'Account Type is Required');

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

    payload.PartySno = Number(payload.PartySno);
    payload.JointPartySno = Number(payload.JointPartySno) || 0;
    payload.RefPartySno = Number(payload.RefPartySno) || 0;
    payload.AcTypeSno = Number(payload.AcTypeSno) || 1;

    if (!this.isEditMode) {
      payload.SbAcSno = 0;
      payload.CurrentRowVer = 1;
      payload.UserSno = 1;
      payload.CompSno = Number(sessionStorage.getItem('CompSno')) || 1;
      delete payload.CreateDate;
    }

    this.accountsService.crudSavingsAcc(action, payload).subscribe({
      next: (res: any) => {
        if (res.Status === 'Success' || res.queryStatus === 1) {
          this.globals.SnackBar('success', this.isEditMode ? 'Account updated successfully' : 'Account created successfully');

          if (res.CurrentRowVer) {
            this.Account.CurrentRowVer = res.CurrentRowVer;
          }

          const accountId = this.isEditMode ? this.Account.SbAcSno : res.RetSno;

          //Adding minimum balance
          if (!this.isEditMode) {
            const selectedAcType = this.accountTypesList.find(t => t.AcTypeSno == payload.AcTypeSno);
            const minBalance = selectedAcType ? Number(selectedAcType.Min_Balance) || 0 : 0;
            
            if (minBalance > 0) {
              const minBalReceipt: TypeSavingsReceipt = {
                ReceiptSno: 0,
                Receipt_No: 'Auto',
                Receipt_Date: this.globals.formatDateForApi(this.globals.formatDate(new Date(), 'yyyy-MM-dd')),
                SbAcSno: accountId,
                Amount: minBalance,
                Payment_Mode: 4,
                Reference: 'Initial Min Balance',
                SeriesSno: 54,
                Remarks: 'Auto-generated receipt for minimum balance',
                CurrentRowVer: null,
                CreateDate: '',
                IsActive: 1,
                UserSno: 1,
                CompSno: Number(sessionStorage.getItem('CompSno')) || 1
              };

              this.receiptsService.crudReceipts(0, minBalReceipt).subscribe({
                next: (res) => {
                  //console.log('Min balance receipt auto-created', res)
                  this.receiptsService.addReceipt(minBalReceipt);
                  this.globals.SnackBar('success', 'Min balance receipt auto-created');
                },
                error: (err) => console.error('Failed to create min balance receipt autogenerated', err)
              });
            }
          }

          if (accountId) {
            this.accountsService.getAccount(accountId).subscribe({
              next: (accountData: any) => {
                let list = accountData;
                const fetchedAccount = Array.isArray(list) ? list[0] : list;

                if (fetchedAccount) {
                  if (this.isEditMode) {
                    this.accountsService.updateAccount(fetchedAccount);
                  } else {
                    this.accountsService.addAccount(fetchedAccount);
                  }
                }
                this.router.navigate(['dashboard/masters/saving-accounts']);
              },
              error: (err) => {
                console.error('Failed to fetch individual account', err);
                this.accountsService.accountsList = [];
                this.router.navigate(['dashboard/masters/saving-accounts']);
              }
            });
          } else {
            this.accountsService.accountsList = [];
            this.router.navigate(['dashboard/masters/saving-accounts']);
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
    this.router.navigate(['dashboard/masters/saving-accounts']);
  }

}
