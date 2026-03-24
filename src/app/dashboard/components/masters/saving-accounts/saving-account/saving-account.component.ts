import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { SavingAccountsService, TypeSavingAccount } from '../saving-accounts.service';
import { CustomersService, TypeCustomer } from '../../../masters/customers/customers.service';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';

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

  constructor(
    private router: Router,
    public globals: GlobalService,
    private accountsService: SavingAccountsService,
    private customersService: CustomersService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadCustomers();

    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.Account = { ...stateData };

    } else {
      this.isEditMode = false;
      this.Account = this.accountsService.initializeAccount();
    }
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
              this.cdr.detectChanges();
          },
          error: (err) => { console.error(err); }
      });
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
        payload.CurrentRowVer = null;
        payload.UserSno = 1;
        payload.CompSno = Number(sessionStorage.getItem('CompSno')) || 1;
        payload.CreateDate = ''; 
    }

    this.accountsService.crudSavingsAcc(action, payload).subscribe({
        next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
                this.globals.SnackBar('success', this.isEditMode ? 'Account updated successfully' : 'Account created successfully');
                
                if (res.CurrentRowVer) {
                    this.Account.CurrentRowVer = res.CurrentRowVer;
                }
                
                const accountId = this.isEditMode ? this.Account.SbAcSno : res.RetSno;
                
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
