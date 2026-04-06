import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalService } from '../../../../services/global.service';
import { SavingAccSummaryService, TypeSavingAccSummary, TypeAcStatement } from './saving-acc-summary.service';
import { SavingAccountsService } from '../../masters/saving-accounts/saving-accounts.service';
import { CustomersService, TypeCustomer } from '../../masters/customers/customers.service';
import { SelectionlistComponent } from '../../../../widgets/selectionlist/selectionlist/selectionlist.component';
import { forkJoin, of } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-saving-acc-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectionlistComponent],
  templateUrl: './saving-acc-summary.component.html',
  styleUrl: './saving-acc-summary.component.scss',
})
export class SavingAccSummaryComponent implements OnInit {
  constructor(
    public accountSummaryService: SavingAccSummaryService,
    public accountsService: SavingAccountsService,
    public customersService: CustomersService,
    public globals: GlobalService,
    private router: Router
  ) { }

  selectedSbAcSno: number = 0;
  accountsList: any[] = [];
  customersList: TypeCustomer[] = [];

  selectedAccount: any | null = null;
  selectedCustomer: TypeCustomer | null = null;
  accountSummaryItem: TypeSavingAccSummary | null = null;
  activeTab: string = 'overview';
  statementTab: 'receipts' | 'payments' = 'receipts';

  // ─── Dropdown Getters ─────────────────────────────────────────────────────
  get accountsForDropdown(): any[] {
    return this.accountsList.map(a => {
      const customer = this.customersList.find(c => Number(c.PartySno) === Number(a.PartySno));
      return {
        ...a,
        Name: a.SbAccount_No,
        Details: customer?.Party_Name ?? a.CustomerMobile ?? ''
      };
    });
  }

  get selectedAccountForDropdown(): any {
    if (!this.selectedSbAcSno) return undefined;
    const acc = this.accountsList.find(a => Number(a.SbAcSno) === Number(this.selectedSbAcSno));
    if (!acc) return undefined;
    const customer = this.customersList.find(c => Number(c.PartySno) === Number(acc.PartySno));
    return {
      ...acc,
      Name: acc.SbAccount_No,
      Details: customer?.Party_Name ?? acc.CustomerMobile ?? ''
    };
  }

  onAccountItemSelected(event: any) {
    this.selectedSbAcSno = (event && event.SbAcSno) ? event.SbAcSno : 0;
    this.onAccountSelected();
  }

  // ─── Statement Data ────────────────────────────────────────────────────────
  AccStatementData = signal<any[]>([]);

  get receiptsStatement(): any[] {
    return this.AccStatementData().filter(r => r.Type === 'Receipt');
  }

  get paymentsStatement(): any[] {
    return this.AccStatementData().filter(r => r.Type === 'Payment');
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  // ─── Load accounts & customers lists ──────────────────────────────────────
  loadData() {
    const accountsReq =
      this.accountsService.accountsList.length > 0
        ? of(this.accountsService.accountsList)
        : this.accountsService.getAccounts();

    const customersReq =
      this.customersService.customersList.length > 0
        ? of(this.customersService.customersList)
        : this.customersService.getCustomers();

    forkJoin({ accounts: accountsReq, customers: customersReq }).subscribe({
      next: (res: any) => {
        this.customersList = res.customers;

        this.accountsList = (res.accounts || []).map((acc: any) => {
          const customer = this.customersList.find(c => Number(c.PartySno) === Number(acc.PartySno));
          return {
            ...acc,
            CustomerMobile: customer?.Mobile || 'No Mobile'
          };
        });

        if (!this.accountsService.accountsList.length)
          this.accountsService.accountsList = res.accounts;
        if (!this.customersService.customersList.length)
          this.customersService.customersList = res.customers;
      },
      error: (err) => console.error('Error fetching data', err),
    });
  }

  // ─── Account selection ────────────────────────────────────────────────────
  onAccountSelected() {
    if (this.selectedSbAcSno > 0) {
      this.selectedAccount =
        this.accountsList.find(a => Number(a.SbAcSno) === Number(this.selectedSbAcSno)) || null;

      this.selectedCustomer = this.selectedAccount
        ? this.customersList.find(c => Number(c.PartySno) === Number(this.selectedAccount!.PartySno)) || null
        : null;

      this.loadSummaryData(this.selectedSbAcSno);
    }
  }

  // ─── Load summary data for selected account ───────────────────────────────
  loadSummaryData(accountSno: number) {
    this.accountSummaryService.getAccountSummary(accountSno).subscribe({
      next: (res: TypeSavingAccSummary[]) => {
        
        const list: TypeSavingAccSummary[] = Array.isArray(res) ? res : [];
        
        if (list.length > 0) {
          const item = list[0];
          
          // Party / JointParty / RefParty ,AcType and AcStatement may arrive as JSON strings
          try {
            if (item.Party && typeof item.Party === 'string') item.Party = JSON.parse(item.Party);
            if (item.JointParty && typeof item.JointParty === 'string') item.JointParty = JSON.parse(item.JointParty);
            if (item.RefParty && typeof item.RefParty === 'string') item.RefParty = JSON.parse(item.RefParty);
            if (item.AcType && typeof item.AcType == 'string') item.AcType = JSON.parse(item.AcType);
            if (item.AcStatement && typeof item.AcStatement == 'string') item.AcStatement = JSON.parse(item.AcStatement);
          } catch (e) { }
          
          console.log("Acc summary data from Api : ", item);

          this.selectedCustomer = item.Party || this.selectedCustomer;

          let statements: TypeAcStatement[] = item.AcStatement || [];
          this.AccStatementData.set(
            statements.map((r: any) => ({
              ...r,
              TransDate: r.TransDate
                ? this.globals.formatDateToDDMMYYYY(r.TransDate)
                : ''
            }))
          );
          this.accountSummaryItem = { ...item };
        } else {
          this.AccStatementData.set([]);
          this.accountSummaryItem = null;
        }
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load Account Summary');
        this.accountSummaryItem = null;
      },
    });
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  editAccount(accountInfo: TypeSavingAccSummary) {
    this.router.navigate(
      ['/dashboard/masters/saving-accounts/saving-account'],
      { state: { data: { ...accountInfo } } }
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  getPaymentModeText(mode: number | string): string {
    switch (Number(mode)) {
      case 1: return 'Cash';
      case 2: return 'Bank';
      case 3: return 'UPI';
      case 4: return 'Other';
      default: return 'Unknown';
    }
  }
}
