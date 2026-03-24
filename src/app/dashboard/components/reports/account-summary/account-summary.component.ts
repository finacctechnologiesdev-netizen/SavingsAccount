import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalService } from '../../../../services/global.service';
import {
  AccountSummaryService,
  TypeAccountSummary,
} from './account-summary.service';
import {
  AccountsService,
  TypeAccount,
} from '../../transactions/accounts/accounts.service';
import {
  CustomersService,
  TypeCustomer,
} from '../../masters/customers/customers.service';
import {
  ReceiptsService,
  TypeReceipt,
} from '../../transactions/receipts/receipts.service';
import { SearchableDropdownComponent } from '../../../../widgets/searchable-dropdown/searchable-dropdown.component';
import { forkJoin, of } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableDropdownComponent],
  templateUrl: './account-summary.component.html',
  styleUrl: './account-summary.component.scss',
})
export class AccountSummaryComponent implements OnInit {
  constructor(
    public accountSummaryService: AccountSummaryService,
    public accountsService: AccountsService,
    public customersService: CustomersService,
    public receiptsService: ReceiptsService,
    public globals: GlobalService,
    private router: Router
  ) {}

  selectedRdAccountSno: number = 0;
  accountsList: TypeAccount[] = [];
  customersList: TypeCustomer[] = [];

  selectedAccount: TypeAccount | null = null;
  selectedCustomer: TypeCustomer | null = null;
  accountSummaryItem: TypeAccountSummary | null = null;
  activeTab: string = 'overview';

  receiptsDataSource = signal<TypeReceipt[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    const accountsReq =
      this.accountsService.accountsList.length > 0
        ? of(this.accountsService.accountsList)
        : this.accountsService.getAccounts();

    const customersReq =
      this.customersService.customersList.length > 0
        ? of(this.customersService.customersList)
        : this.customersService.getCustomers();

    forkJoin({
      accounts: accountsReq,
      customers: customersReq,
    }).subscribe({
      next: (res: any) => {
        this.customersList = res.customers;

        // Map Mobile number from customer directly onto the account object for dropdown searching
        this.accountsList = (res.accounts || []).map((acc: any) => {
          const customer = this.customersList.find(c => c.PartySno === acc.PartySno);
          let parsedCustomer = acc.Party || customer;
          
          return {
            ...acc,
            CustomerMobile: (customer?.Mobile) || (parsedCustomer?.Mobile) || 'No Mobile'
          };
        });

        if (this.accountsService.accountsList.length === 0)
          this.accountsService.accountsList = res.accounts;
        if (this.customersService.customersList.length === 0)
          this.customersService.customersList = res.customers;
      },
      error: (err) => {
        console.error('Error fetching data', err);
      },
    });
  }

  onAccountSelected() {
    if (this.selectedRdAccountSno > 0) {
      this.selectedAccount =
        this.accountsList.find(
          (a) => a.RdAccountSno === this.selectedRdAccountSno,
        ) || null;

      if (this.selectedAccount) {
        this.selectedCustomer =
          this.customersList.find(
            (c) => c.PartySno === this.selectedAccount!.PartySno,
          ) || null;
      } else {
        this.selectedCustomer = null;
      }

      this.loadSummaryData(this.selectedRdAccountSno);
    }
  }

  loadSummaryData(accountSno: number) {
    this.accountSummaryService.getAccountSummary(accountSno).subscribe({
      next: (res: any) => {
        let list = res;
        if (res && res.apiData) {
          list =
            typeof res.apiData === 'string'
              ? JSON.parse(res.apiData)
              : res.apiData;
        } else if (typeof res === 'string') {
          try {
            list = JSON.parse(res);
          } catch (e) {}
        }

        if (!Array.isArray(list)) list = [];

        let formattedItem = null;
        if (list.length > 0) {
          let item = list[0]; // Assuming account summary for a specific account returns 1 main row
          let acctDateStr = item.Account_Date;
          let matDateStr = item.Mature_Date;

          if (item.Account_Date?.date) {
            const d = new Date(item.Account_Date.date);
            acctDateStr = this.globals.formatDate(d, 'dd-MM-yyyy');
          }
          if (item.Mature_Date?.date) {
            const md = new Date(item.Mature_Date.date);
            matDateStr = this.globals.formatDate(md, 'dd-MM-yyyy');
          }

          formattedItem = {
            ...item,
            Account_Date: acctDateStr,
            Mature_Date: matDateStr,
          };
        }

        this.accountSummaryItem = formattedItem;
        this.fetchReceipts(accountSno);
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load Account Summary');
        this.accountSummaryItem = null;
      },
    });
  }

  fetchReceipts(accountSno: number) {
    this.receiptsService.getReceipts().subscribe({
      next: (res: any) => {
        let recList = res;
        if (res && res.apiData)
          recList =
            typeof res.apiData === 'string'
              ? JSON.parse(res.apiData)
              : res.apiData;
        else if (typeof res === 'string') {
          try {
            recList = JSON.parse(res);
          } catch (e) {}
        }
        if (!Array.isArray(recList)) recList = [];

        let filteredReceipts = recList.filter(
          (r: any) => r.RdAccountSno === accountSno,
        );

        // format dates
        filteredReceipts = filteredReceipts.map((r: any) => {
          let rDate = r.Receipt_Date;
          if (r.Receipt_Date?.date) {
            const d = new Date(r.Receipt_Date.date);
            rDate = this.globals.formatDate(d, 'dd-MM-yyyy');
          }
          return { ...r, Receipt_Date: rDate };
        });

        this.receiptsDataSource.set(filteredReceipts);
      },
      error: (err: any) => {
        console.error('Error fetching receipts', err);
      },
    });
  }

  editAccount(accountInfo: TypeAccountSummary) {
    // Only allow editing if account status is Live (1) or Pending/Other specific state (4)
    if (accountInfo.Account_Status !== 1 && accountInfo.Account_Status !== 4) {
      this.globals.SnackBar('error', 'Only active accounts can be edited.');
      return;
    }

    // Define navigation helper to reduce duplication
    const executeNavigation = (accountPayload: any) => {
      this.router.navigate(['/dashboard/transactions/accounts/account'], { state: { data: accountPayload } });
    };

    // Use cached list if available
    if (this.accountsService.accountsList.length > 0) {
      const originalAccount = this.accountsService.accountsList.find(a => a.RdAccountSno === accountInfo.RdAccountSno);
      if (originalAccount) {
        executeNavigation(originalAccount);
        return;
      }
    }

    // Default Fallback Payload
    const fallbackData = {
      ...accountInfo,
      Mature_Amount: accountInfo.Maturity_Amount || (accountInfo as any).MaturityAmount
    };

    // Attempt to load from API if not cached
    this.accountsService.getAccounts().subscribe({
      next: (res: any) => {
        let list = res?.apiData ? (typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData) : 
                   (typeof res === 'string' ? JSON.parse(res) : res);
                   
        list = Array.isArray(list) ? list : [];
        this.accountsService.accountsList = list;

        const originalAccount = list.find((a: any) => a.RdAccountSno === accountInfo.RdAccountSno);
        executeNavigation(originalAccount || fallbackData);
      },
      error: () => executeNavigation(fallbackData)
    });
  }
}
