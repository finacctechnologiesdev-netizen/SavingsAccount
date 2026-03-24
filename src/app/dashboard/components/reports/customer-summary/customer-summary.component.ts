import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { CustomerSummaryService, TypeCustomerSummary } from './customer-summary.service';
import { CustomersService, TypeCustomer } from '../../masters/customers/customers.service';
import { AccountsService } from '../../transactions/accounts/accounts.service';
import { SearchableDropdownComponent } from '../../../../widgets/searchable-dropdown/searchable-dropdown.component';
import { IntToDatePipe } from '../../../../pipes/int-to-date.pipe';

@Component({
  selector: 'app-customer-summary',
  standalone: true,
  imports: [CommonModule, TableviewComponent, FormsModule, SearchableDropdownComponent, IntToDatePipe],
  templateUrl: './customer-summary.component.html',
  styleUrl: './customer-summary.component.scss'
})
export class CustomerSummaryComponent implements OnInit {

  constructor(
    public customerSummaryService: CustomerSummaryService,
    public customersService: CustomersService,
    public globals: GlobalService,
    public accountsService: AccountsService,
    private router: Router
  ) {}

  selectedPartySno: number = 0;
  customersList: TypeCustomer[] = [];
  selectedCustomer: TypeCustomer | null = null;
  selectedAccountData: TypeCustomerSummary | null = null;
  activeTab: string = 'overview';

  DataSource = signal<TypeCustomerSummary[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Account_No', Data_Type: 'string' },
    { Field_Name: 'Party_Name', Data_Type: 'string' },
    { Field_Name: 'RdScheme_Name', Data_Type: 'string' },
    { Field_Name: 'Account_Date', Data_Type: 'string' },
    { Field_Name: 'Mature_Date', Data_Type: 'string' },
    { Field_Name: 'DueAmount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Maturity_Amount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Paid_Amount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Balance_Amount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Pending_Amount', Data_Type: 'number', Decimals: 2 }
  ]);

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers() {
     this.customersService.getCustomers().subscribe({
         next: (res) => {
             this.customersList = res;
         },
         error: (err) => {
             console.error('Error fetching customers', err);
         }
     })
  }

  onCustomerSelected() {
    if (this.selectedPartySno > 0) {
       this.selectedCustomer = this.customersList.find(c => c.PartySno === this.selectedPartySno) || null;
       this.selectedAccountData = null; // Reset selection right here
       this.loadSummaryData(this.selectedPartySno);
    } else {
       this.selectedCustomer = null;
       this.selectedAccountData = null;
       this.DataSource.set([]);
    }
  }

  onAccountClick(accountData: TypeCustomerSummary) {
    this.selectedAccountData = accountData;
  }

  loadSummaryData(partySno: number) {
    this.customerSummaryService.getCustomerSummary(partySno).subscribe({
      next: (res: any) => {
        let list = res;
        if (res && res.apiData) {
            list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
        } else if (typeof res === 'string') {
            try { list = JSON.parse(res); } catch(e) {}
        }
        
        if (!Array.isArray(list)) list = [];
        
        // Flatten nested object dates so standard table components can parse/display them properly
        const formattedList = list.map((item: any) => {
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

            return {
                ...item,
                Account_Date: acctDateStr,
                Mature_Date: matDateStr,
            }
        });

        this.customerSummaryService.summaryList = formattedList;
        this.DataSource.set(formattedList);
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load Customer Summary');
      },
    });
  }

  handleAction(event: any) {
    // any future action handling here
  }

  editAccount(accountInfo: TypeCustomerSummary) {
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
