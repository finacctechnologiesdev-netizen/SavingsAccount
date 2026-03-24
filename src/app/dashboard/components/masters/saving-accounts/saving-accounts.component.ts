import { Component, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { RouterModule, Router } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { SavingAccountsService, TypeSavingAccount } from './saving-accounts.service';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

@Component({
  selector: 'app-saving-accounts',
  standalone: true,
  imports: [TableviewComponent, CommonModule, RouterModule],
  templateUrl: './saving-accounts.component.html',
  styleUrl: './saving-accounts.component.scss'
})
export class SavingAccountsComponent implements OnInit {

  constructor(
    public accountsService: SavingAccountsService,
    public globals: GlobalService,
    private router: Router
  ) { }

  DataSource = signal<any[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'SbAccount_No', Data_Type: 'string', Display_Name: 'Account No' },
    { Field_Name: 'Passbook_No', Data_Type: 'string', Display_Name: 'Passbook No' },
    { Field_Name: 'Party_Name', Data_Type: 'string', Display_Name: 'Customer Name' },
    { Field_Name: 'Remarks', Data_Type: 'string' },
    { Field_Name: 'Actions', Data_Type: 'string' }
  ]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    const accountsObs = this.accountsService.accountsList.length > 0
      ? of(this.accountsService.accountsList)
      : this.accountsService.getAccounts();

    accountsObs.subscribe({
      next: (res) => {
        this.accountsService.accountsList = res;
        this.updateDataSource(res);
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load savings accounts data');
      },
    });
  }

  updateDataSource(list: TypeSavingAccount[]) {
    const formattedList = list.map(account => {
      let parsedCustomer: any = account.Party || null;

      return {
        ...account,
        parsedCustomer: parsedCustomer,
        Party_Name: parsedCustomer ? parsedCustomer.Party_Name : 'Unknown',
      };
    });

    this.DataSource.set(formattedList);
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }

    if (event.Action === 1) { // Edit
      this.editAccount(event.Data);
    } else if (event.Action === 2) { // Delete
      this.deleteAccount(event.Data);
    }
  }

  editAccount(account: TypeSavingAccount) {
    const originalAccount = this.accountsService.accountsList.find(a => a.SbAcSno === account.SbAcSno);

    this.router.navigate(['/dashboard/masters/saving-accounts/saving-account'], {
      state: { data: originalAccount || account },
    });
  }

  createNew() {
    this.router.navigate(['/dashboard/masters/saving-accounts/saving-account']);
  }

  deleteAccount(account: TypeSavingAccount) {
    this.globals.MsgBox(2, 'Are you sure you want to delete this account?').then((result) => {
      // Don't format dates for Savings Accounts since we aren't using dates yet
      if (result === 1) {
        this.accountsService.crudSavingsAcc(2, account).subscribe({
          next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
              this.globals.SnackBar('success', 'Account deleted successfully');
              this.accountsService.removeAccount(account.SbAcSno!);
              this.updateDataSource([...this.accountsService.accountsList]);
            } else {
              this.globals.SnackBar('error', res.Message || 'Failed to delete account');
            }
          },
          error: (err) => {
            this.globals.SnackBar('error', 'Error while deleting account');
            console.error(err);
          }
        });
      }
    });
  }
}
