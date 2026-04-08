import { Component, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import {
  SavingAccountsService,
  TypeSavingAccount,
} from './saving-accounts.service';
import { CustomersService, TypeCustomer } from '../customers/customers.service';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { PrintService } from '../../../../services/print.service';
import { AccountTypesService } from '../account-types/account-types.service';
@Component({
  selector: 'app-saving-accounts',
  standalone: true,
  imports: [TableviewComponent, CommonModule, RouterModule],
  templateUrl: './saving-accounts.component.html',
  styleUrl: './saving-accounts.component.scss',
})
export class SavingAccountsComponent implements OnInit {
  constructor(
    public accountsService: SavingAccountsService,
    public customersService: CustomersService,
    public globals: GlobalService,
    private router: Router,
    private printService: PrintService,
    public accountTypesService: AccountTypesService,
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (this.router.url === '/dashboard/masters/saving-accounts') {
          this.updateDataSource(this.accountsService.accountsList);
        }
      }
    });
  }
  printData: any[] = [];
  DataSource = signal<any[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'SbAccount_No', Data_Type: 'string', Display_Name: 'Account No' },
    { Field_Name: 'Passbook_No', Data_Type: 'string', Display_Name: 'Passbook No' },
    { Field_Name: 'Party_Name', Data_Type: 'string', Display_Name: 'Customer Name' },
    { Field_Name: 'Reference', Data_Type: 'string' },
    { Field_Name: 'CreateDate', Data_Type: 'date' },
    { Field_Name: 'Actions', Data_Type: 'string' },
  ]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    const accountsObs =
      this.accountsService.accountsList.length > 0
        ? of(this.accountsService.accountsList)
        : this.accountsService.getAccounts();

    const customersObs =
      this.customersService.customersList.length > 0
        ? of(this.customersService.customersList)
        : this.customersService.getCustomers();

    const accountTypesObs =
      this.accountTypesService.acTypesList && this.accountTypesService.acTypesList.length > 0
        ? of(this.accountTypesService.acTypesList)
        : this.accountTypesService.getAcTypes();

    forkJoin({
      accounts: accountsObs,
      customers: customersObs,
      accountTypes: accountTypesObs,
    }).subscribe({
      next: (res: any) => {
        let accList = res.accounts;
        accList.forEach((account: TypeSavingAccount) => {
          if (account.CreateDate && account.CreateDate.date) {
            account.CreateDate = account.CreateDate.date;
          }
        });
       // console.log("accList", accList);

        // if (res.accounts && res.accounts.apiData) {
        //   accList =
        //     typeof res.accounts.apiData === 'string'
        //       ? JSON.parse(res.accounts.apiData)
        //       : res.accounts.apiData;
        // } else if (typeof res.accounts === 'string') {
        //   try {
        //     accList = JSON.parse(res.accounts);
        //   } catch (e) { }
        // }
        // if (!Array.isArray(accList)) accList = res.accounts; // If it was already parsed

        let custList = res.customers;
        // if (res.customers && res.customers.apiData) {
        //   custList =
        //     typeof res.customers.apiData === 'string'
        //       ? JSON.parse(res.customers.apiData)
        //       : res.customers.apiData;
        // } else if (typeof res.customers === 'string') {
        //   try {
        //     custList = JSON.parse(res.customers);
        //   } catch (e) { }
        // }
        // if (!Array.isArray(custList)) custList = res.customers;
        // if (!Array.isArray(custList)) custList = [];

        let acTypesList = res.accountTypes;
        // console.log("account types",res.accountTypes);
        
        // if (res.accountTypes && res.accountTypes.apiData) {
        //   acTypesList =
        //     typeof res.accountTypes.apiData === 'string'
        //       ? JSON.parse(res.accountTypes.apiData)
        //       : res.accountTypes.apiData;
        // } else if (typeof res.accountTypes === 'string') {
        //   try {
        //     acTypesList = JSON.parse(res.accountTypes);
        //   } catch (e) { }
        // }
        // if (!Array.isArray(acTypesList)) acTypesList = res.accountTypes;
        // if (!Array.isArray(acTypesList)) acTypesList = [];

        this.accountsService.accountsList = accList;
        this.customersService.customersList = custList;
        this.accountTypesService.acTypesList = acTypesList;
        this.updateDataSource(accList);
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load savings accounts data');
      },
    });
  }

  updateDataSource(list: TypeSavingAccount[]) {
    const formattedList = list.map((account) => {
      let parsedCustomer: any = account.Party || null;
      const customer = this.customersService.customersList.find(
        (c) => Number(c.PartySno) === Number(account.PartySno),
      );

      return {
        ...account,
        parsedCustomer: parsedCustomer,
        Party_Name: customer
          ? customer.Party_Name
          : parsedCustomer
            ? parsedCustomer.Party_Name
            : 'Unknown',
        customer: customer
          ? customer
          : parsedCustomer
            ? parsedCustomer
            : null,
      };
    });
    this.printData = formattedList;
    //console.log(this.printData);

    this.DataSource.set(formattedList);
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }

    if (event.Action === 1) {
      // Edit
      this.editAccount(event.Data);
    } else if (event.Action === 2) {
      // Delete
      this.deleteAccount(event.Data);
    } else if (event.Action === 3) {
      // Print
      this.printAccount(event.Data);
    }
  }



  printAccount(account: any) {
    const acType = this.accountTypesService.acTypesList.find(x => x.AcTypeSno == account.AcTypeSno);
    const accountCategory = acType ? (acType.Ac_Category == 1 ? 'Saving' : acType.Ac_Category == 2 ? 'Current' : 'Other') : 'Unknown';
    const accountTypeName = acType ? acType.AcType_Name : 'Unknown';
   
    const customer = account.customer;
    account.CreateDate = this.globals.formatDateToDDMMYYYY(account.CreateDate.date);
    //  @page {
    //         size: 8cm 3.5cm;
    //         margin: 0; 
    //     }
    const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Print Account</title>
    <style>        
        @page {
            size: letter;
            margin: 0;
        }
        
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: white;
            font-family: "Times New Roman", Times, serif;
            color: #000;
        }

        * {
            padding: 0px;
            margin: 0;
            font-family: inherit;
        }

        .container {
            display: flex;
            flex-direction: column;
            width: 90%;
            max-width: 800px;
            gap: 12px;
        }

        .Htext {
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 25px;
            color: #000;
            font-weight: bold;
            font-size: 16px;
        }

        .item {
            display: flex;
            align-items: flex-start;
            width: 100%;
        }

        .item h3 {
            font-size: 13px;
            color: #000;
            min-width: 180px;
            font-weight: normal;
        }

        .item h4 {
            color: #000;
            font-weight: normal;
            font-size: 13px;
            flex: 1;
        }

        .inner-item {
            display: flex;
            align-items: flex-start;
            flex: 1;
        }

        .inner-item h3 {
            font-size: 13px;
            color: #000;
            min-width: 140px;
            font-weight: normal;
        }

        .inner-item h4 {
            color: #000;
            font-weight: normal;
            font-size: 13px;
            flex: 1;
        }
        .address{
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
    </style>
</head>
<body class="center">
   <div class="container">
    <h1 class="Htext">Salem yourspay capital limited</h1>

    <div style="margin-top: 7px;" class="item">
        <div class="inner-item">
            <h3>Name:</h3>
            <h4>${customer.Party_Name}</h4>
        </div>
        <div class="inner-item">
            <h3>Type:</h3>
            <h4>${account.JointPartySno > 0 ? 'Joint Account' : 'Individual Account'} </h4>
        </div>
    </div>

        <div class="item">
            <div class="inner-item">
                <h3>Member ID:</h3>
                <h4>${customer.Party_Code}</h4>
            </div>
            <div class="inner-item">
                <h3>Mobile:</h3>
                <h4>${customer.Mobile || '--'}</h4>
            </div>
        </div>

        <div class="item">
            <div class="inner-item">
                <h3>Account No:</h3>
                <h4>${account.SbAccount_No}</h4>
            </div>
            <div class="inner-item">
                <h3>Nominee:</h3>
                <h4>${customer.Nominee?.trim().length > 0 ? customer.Nominee : 'NIL'}</h4>
            </div>
        </div>

        <div class="item">
            <div class="inner-item">
                <h3>Account Category:</h3>
                <h4>${accountCategory} (${accountTypeName})</h4>
            </div>
            <div class="inner-item">
                <h3>Aadhaar No:</h3>
                <h4>${customer.Aadhar_No || '--'}</h4>
            </div>
        </div>

        <div class="item">
            <div class="inner-item">
                <h3>Account Opened date:</h3>
                <h4>${account.CreateDate}</h4>
            </div>
            <div class="inner-item">
                <h3>PAN No:</h3>
                <h4>${customer.Pancard_No || '--'}</h4>
            </div>
        </div>


        <div class="address">
          <div class="inner-item">
              <h3>Address:</h3>
              <h4>${customer.Address1} ${customer.Address2 ? ',' : ''} ${customer.Address2} ${customer.Address3 ? ',' : ''} ${customer.Address3}</h4>
          </div>
          <div class="inner-item" style="margin-top: -10px; margin-left: 140px;">
            <h4>${customer.City} ${customer.Pincode}</h4>
          </div>
        </div>
   </div>
</body>
</html>`;

    this.printService.printContent(printContent);
  }

  editAccount(account: TypeSavingAccount) {
    const originalAccount = this.accountsService.accountsList.find(
      (a) => a.SbAcSno === account.SbAcSno,
    );

    this.router.navigate(
      ['/dashboard/masters/saving-accounts/saving-account'],
      {
        state: { data: originalAccount || account },
      },
    );
  }

  createNew() {
    this.router.navigate(['/dashboard/masters/saving-accounts/saving-account']);
  }

  deleteAccount(account: TypeSavingAccount) {
    this.globals
      .MsgBox(2, 'Are you sure you want to delete this account?')
      .then((result) => {
        // Don't format dates for Savings Accounts since we aren't using dates yet
        if (result === 1) {
          this.accountsService.crudSavingsAcc(2, account).subscribe({
            next: (res: any) => {
              if (res.Status === 'Success' || res.queryStatus === 1) {
                this.globals.SnackBar(
                  'success',
                  'Account deleted successfully',
                );
                this.accountsService.removeAccount(account.SbAcSno!);
                this.updateDataSource([...this.accountsService.accountsList]);
              } else {
                this.globals.SnackBar(
                  'error',
                  res.Message || 'Failed to delete account',
                );
              }
            },
            error: (err) => {
              this.globals.SnackBar('error', 'Error while deleting account');
              console.error(err);
            },
          });
        }
      });
  }
}
