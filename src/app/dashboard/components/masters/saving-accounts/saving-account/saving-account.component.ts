import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { SavingAccountsService,TypeSavingAccount,} from '../saving-accounts.service';
import { CustomersService,TypeCustomer,} from '../../../masters/customers/customers.service';
import { AccountTypesService,TypeAcType,} from '../../../masters/account-types/account-types.service';
import { SelectionlistComponent } from '../../../../../widgets/selectionlist/selectionlist/selectionlist.component';
import { SavingsReceiptsService,TypeSavingsReceipt,} from '../../../transactions/savings-receipts/savings-receipts.service';
import { AppsetupService,TypeSavingsSetup,} from '../../../settings/appsetup/appsetup.service';
import { PrintService } from '../../../../../services/print.service';
import { SavingAccSummaryService } from '../../../reports/saving-acc-summary/saving-acc-summary.service';

// ── Passbook physical sheet constants (calibrated to measurements) ────────
// Physical sheet (opened): width ~200mm, each section height ~87mm
// Printer: EPSON PLQ-35 dot-matrix passbook printer (Letter, Portrait)
// Row height at 8px font: ~5.5mm → 87mm section ÷ 5.5mm = ~15 rows
// We use 14 to leave breathing room for header row alignment.
const LINES_PER_SECTION = 14; // printable data rows per half-page section
const SECTIONS_PER_SHEET = 2; // top section + bottom section per physical sheet
const LINES_PER_SHEET = LINES_PER_SECTION * SECTIONS_PER_SHEET; // = 28 lines total

@Component({
  selector: 'app-saving-account',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectionlistComponent],
  providers: [DatePipe],
  templateUrl: './saving-account.component.html',
  styleUrl: './saving-account.component.scss',
})
export class SavingAccountComponent implements OnInit {
  Account!: TypeSavingAccount;
  isEditMode = false;
  submitCount = 0;
  errors: any = {};
  defaultReceiptSeriesSno: number | null = null;

  customersList: TypeCustomer[] = [];
  accountTypesList: TypeAcType[] = [];
  acTypesService: any;

  // ── Statement dialog state ──────────────────────────────────────────────
  showStatementDialog = false;
  stmtFromDate: string = '';
  stmtToDate: string = '';
  stmtLoading = false;

  constructor(
    private router: Router,
    public globals: GlobalService,
    private accountsService: SavingAccountsService,
    private customersService: CustomersService,
    private accountTypesService: AccountTypesService,
    private cdr: ChangeDetectorRef,
    private receiptsService: SavingsReceiptsService,
    private appsetupService: AppsetupService,
    private printService: PrintService,
    private summaryService: SavingAccSummaryService,
  ) {}

  setupConfig!: TypeSavingsSetup;

  ngOnInit(): void {
    this.loadSetup();
    this.loadCustomers();
    this.loadAccountTypes();
    this.loadDefaultVoucherSeries();

    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.Account = { ...stateData };
      this.Account.CreateDate = this.globals.formatDate(
        this.Account.CreateDate,
        'yyyy-MM-dd',
      );
    } else {
      this.isEditMode = false;
      this.Account = this.accountsService.initializeAccount();
    }
  }

  loadDefaultVoucherSeries() {
    this.receiptsService.getVoucherSeries().subscribe({
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

        const defaultSeries = list.find((s: any) => Number(s.IsDefault) === 1);
        this.defaultReceiptSeriesSno = defaultSeries
          ? Number(defaultSeries.SeriesSno)
          : null;
      },
      error: (err) => console.error('Failed to load voucher series', err),
    });
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
      error: (err) => console.log('Failed to load setup', err),
    });
  }

  loadCustomers() {
    if (
      this.customersService.customersList &&
      this.customersService.customersList.length > 0
    ) {
      this.customersList = this.customersService.customersList;
      return;
    }

    this.customersService.getCustomers().subscribe({
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

        this.customersList = list;
        this.customersService.customersList = list;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  loadAccountTypes() {
    if (
      this.accountTypesService.acTypesList &&
      this.accountTypesService.acTypesList.length > 0
    ) {
      this.accountTypesList = this.accountTypesService.acTypesList;
      return;
    }

    this.accountTypesService.getAcTypes().subscribe({
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

        this.accountTypesList = list;
        this.accountTypesService.acTypesList = list;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  get accountTypesForDropdown(): any[] {
    return this.accountTypesList.map((t) => {
      let catName = 'Unknown';
      if (t.Ac_Category === 1) catName = 'Savings';
      else if (t.Ac_Category === 2) catName = 'Current';

      return {
        ...t,
        Name: t.AcType_Name,
        Details: `Category: ${catName} | ROI: ${t.Roi}%`,
      };
    });
  }

  get selectedAccountTypeForDropdown(): any {
    if (!this.Account?.AcTypeSno) return undefined;
    const type = this.accountTypesList.find(
      (t) => t.AcTypeSno == this.Account.AcTypeSno,
    );
    if (!type) return undefined;

    let catName = 'Unknown';
    if (type.Ac_Category === 1) catName = 'Savings';
    else if (type.Ac_Category === 2) catName = 'Current';

    return {
      ...type,
      Name: type.AcType_Name,
      Details: `Category: ${catName} | ROI: ${type.Roi}%`,
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
    return this.customersList.map((c) => ({
      ...c,
      Name: c.Party_Name,
      Details: c.Mobile ? `Phone: ${c.Mobile}` : '',
    }));
  }

  get selectedCustomerForDropdown(): any {
    if (!this.Account?.PartySno) return undefined;
    const customer = this.customersList.find(
      (c) => c.PartySno == this.Account.PartySno,
    );
    if (!customer) return undefined;
    return {
      ...customer,
      Name: customer.Party_Name,
      Details: customer.Mobile ? `Phone: ${customer.Mobile}` : '',
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
    const customer = this.customersList.find(
      (c) => c.PartySno == this.Account.JointPartySno,
    );
    if (!customer) return undefined;
    return {
      ...customer,
      Name: customer.Party_Name,
      Details: customer.Mobile ? `Phone: ${customer.Mobile}` : '',
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
    const customer = this.customersList.find(
      (c) => c.PartySno == this.Account.RefPartySno,
    );
    if (!customer) return undefined;
    return {
      ...customer,
      Name: customer.Party_Name,
      Details: customer.Mobile ? `Phone: ${customer.Mobile}` : '',
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
    if (!data.AcTypeSno || Number(data.AcTypeSno) <= 0)
      setError('AcTypeSno', 'Account Type is Required');

    return isValid;
  }

  saveAccount() {
    this.submitCount++;
    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please fill required fields');
      return;
    }

    if (!this.isEditMode && this.defaultReceiptSeriesSno === null) {
      this.globals.SnackBar(
        'error',
        'Please select a default voucher series for receipts',
      );
      return;
    }

    const action = this.isEditMode ? 1 : 0;
    const payload: any = { ...this.Account };
    payload.IsActive =
      payload.IsActive === true || payload.IsActive === 1 ? 1 : 0;

    payload.PartySno = Number(payload.PartySno);
    payload.JointPartySno = Number(payload.JointPartySno) || 0;
    payload.RefPartySno = Number(payload.RefPartySno) || 0;
    payload.AcTypeSno = Number(payload.AcTypeSno) || 1;

    if (!this.isEditMode) {
      payload.SbAcSno = 0;
      payload.CurrentRowVer = 1;
      payload.UserSno = 1;
      payload.CompSno = Number(sessionStorage.getItem('CompSno'));
      delete payload.CreateDate;
    }

    this.accountsService.crudSavingsAcc(action, payload).subscribe({
      next: (res: any) => {
        if (res.Status === 'Success' || res.queryStatus === 1) {
          this.globals.SnackBar(
            'success',
            this.isEditMode
              ? 'Account updated successfully'
              : 'Account created successfully',
          );

          if (res.CurrentRowVer) {
            this.Account.CurrentRowVer = res.CurrentRowVer;
          }

          const accountId = this.isEditMode ? this.Account.SbAcSno : res.RetSno;

          //Adding minimum balance
          if (!this.isEditMode) {
            const selectedAcType = this.accountTypesList.find(
              (t) => t.AcTypeSno == payload.AcTypeSno,
            );
            const minBalance = selectedAcType
              ? Number(selectedAcType.Min_Balance) || 0
              : 0;
            const SeriesSno = this.defaultReceiptSeriesSno!;
            if (minBalance > 0) {
              const minBalReceipt: TypeSavingsReceipt = {
                SeriesSno: SeriesSno,
                ReceiptSno: 0,
                Receipt_No: 'Auto',
                Receipt_Date: this.globals.formatDateForApi(
                  this.globals.formatDate(new Date(), 'yyyy-MM-dd'),
                ),
                SbAcSno: accountId,
                Amount: minBalance,
                Payment_Mode: 4,
                Reference: 'Initial Min Balance',
                Remarks: 'Auto-generated receipt for minimum balance',
                CurrentRowVer: null,
                CreateDate: '',
                IsActive: 1,
                UserSno: 1,
                CompSno: Number(sessionStorage.getItem('CompSno')),
              };

              this.receiptsService.crudReceipts(0, minBalReceipt).subscribe({
                next: (res) => {
                  console.log('minBalReceipt', minBalReceipt);

                  const newReceiptId = res?.RetSno;
                  if (newReceiptId) {
                    this.receiptsService.getReceipt(newReceiptId).subscribe({
                      next: (receiptData: any) => {
                        const fetchedReceipt = Array.isArray(receiptData)
                          ? receiptData[0]
                          : receiptData;
                        if (fetchedReceipt) {
                          this.globals.SnackBar(
                            'success',
                            'Min balance receipt auto-created with Rcpt.No ' +
                              fetchedReceipt.Receipt_No,
                          );
                          this.receiptsService.addReceipt(fetchedReceipt);
                        }
                      },
                      error: (err) =>
                        console.error(
                          'Failed to fetch newly created min balance receipt',
                          err,
                        ),
                    });
                  }
                  //this.globals.SnackBar('success', 'Min balance receipt auto-created');
                },
                error: (err) =>
                  console.error(
                    'Failed to create min balance receipt autogenerated',
                    err,
                  ),
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
              },
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
      },
    });
  }

  cancelAccount() {
    this.router.navigate(['dashboard/masters/saving-accounts']);
  }

  printAccount() {
    const account = this.Account;
    const customer = this.customersList.find(
      (c) => c.PartySno == account.PartySno,
    );
    if (!customer) {
      this.globals.SnackBar('error', 'Customer data not found for printing');
      return;
    }

    const acType = this.accountTypesList.find(
      (t) => t.AcTypeSno == account.AcTypeSno,
    );
    const accountCategory = acType
      ? acType.Ac_Category == 1
        ? 'Saving'
        : acType.Ac_Category == 2
          ? 'Current'
          : 'Other'
      : 'Unknown';
    const accountTypeName = acType ? acType.AcType_Name : 'Unknown';

    let rawDate = account.CreateDate;
    let formattedDate = '--';
    if (rawDate) {
      if (rawDate.date) rawDate = rawDate.date;
      formattedDate = this.globals.formatDateToDDMMYYYY(rawDate);
    }

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
        .address {
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
            <h4>${account.JointPartySno > 0 ? 'Joint Account' : 'Individual Account'}</h4>
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
                <h4>${formattedDate}</h4>
            </div>
            <div class="inner-item">
                <h3>PAN No:</h3>
                <h4>${customer.Pancard_No || '--'}</h4>
            </div>
        </div>

        <div class="address">
          <div class="inner-item">
              <h3>Address:</h3>
              <h4>${customer.Address1}${customer.Address2 ? ', ' + customer.Address2 : ''}${customer.Address3 ? ', ' + customer.Address3 : ''}</h4>
          </div>
          <div class="inner-item" style="margin-top: -10px; margin-left: 140px;">
            <h4>${customer.City || ''} ${customer.Pincode || ''}</h4>
          </div>
        </div>
   </div>
</body>
</html>`;

    this.printService.printContent(printContent);
  }

  // ── Statement Dialog ──────────────────────────────────────────────────────
  openStatementDialog() {
    // Default: show from account creation date to today
    const today = new Date();
    this.stmtToDate = this.globals.formatDate(today, 'yyyy-MM-dd');
    let rawCreate = this.Account.CreateDate;
    if (rawCreate && rawCreate.date) rawCreate = rawCreate.date;
    this.stmtFromDate = rawCreate
      ? this.globals.formatDate(rawCreate, 'yyyy-MM-dd')
      : this.stmtToDate;
    this.showStatementDialog = true;
  }

  closeStatementDialog() {
    this.showStatementDialog = false;
    this.stmtLoading = false;
  }

  // ── Print Account Statement with Passbook Pagination ──────────────────────
  // Layout: each physical sheet has 2 sections (top & bottom), each fits
  // LINES_PER_SECTION rows. We track the last printed position per account in
  // sessionStorage so the next session resumes exactly where the passbook was left.
  printStatement() {
    // ── Local layout constants (mirror file-level constants for clarity) ──
    const LINES_PER_SECTION  = 14;
    const LINES_PER_SHEET    = 28;
    const SECTIONS_PER_SHEET = 2;

    if (!this.stmtFromDate || !this.stmtToDate) {
      this.globals.SnackBar('error', 'Please select From and To dates');
      return;
    }
    if (this.stmtFromDate > this.stmtToDate) {
      this.globals.SnackBar('error', 'From date cannot be after To date');
      return;
    }

    this.stmtLoading = true;

    this.summaryService.getAccountSummary(this.Account.SbAcSno!).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (!list.length) {
          this.globals.SnackBar('error', 'No account data found');
          this.stmtLoading = false;
          return;
        }

        const item = list[0];
        // Parse JSON strings from API
        try {
          if (item.Party && typeof item.Party === 'string')
            item.Party = JSON.parse(item.Party);
          if (item.AcType && typeof item.AcType === 'string')
            item.AcType = JSON.parse(item.AcType);
          if (item.AcStatement && typeof item.AcStatement === 'string')
            item.AcStatement = JSON.parse(item.AcStatement);
        } catch (e) {
          console.error('Failed to parse API response fields:', e);
          this.globals.SnackBar('error', 'Invalid data received from server');
          this.stmtLoading = false;
          return;
        }

        const customer = item.Party;
        const acType = item.AcType;
        let allStatements: any[] = Array.isArray(item.AcStatement)
          ? item.AcStatement
          : [];

        // Sort chronologically oldest → newest; secondary key = TransNo for stable same-day ordering
        // allStatements.sort((a: any, b: any) => {
        //   const dateDiff =
        //     new Date(a.TransDate).getTime() - new Date(b.TransDate).getTime();
        //   if (dateDiff !== 0) return dateDiff;
        //   return (a.TransNo || '').localeCompare(b.TransNo || '');
        // });
       

        // Filter by date range selected in dialog
        const fromMs = new Date(this.stmtFromDate).setHours(0, 0, 0, 0);
        const toMs = new Date(this.stmtToDate).setHours(23, 59, 59, 999);

        // Compute running balance for ALL transactions first (to get opening balance)
        let runningBalance = 0;
        const enriched: any[] = allStatements.map((s: any) => {
          const amt = Number(s.Amount) || 0;
          if (s.Type === 'Receipt') {
            runningBalance += amt;
          } else {
            runningBalance -= amt;
          }
          return { ...s, balance: runningBalance };
        });

        // Opening balance = balance just before fromDate
        let openingBalance = 0;
        for (const s of enriched) {
          const d = new Date(s.TransDate).getTime();
          if (d < fromMs) openingBalance = s.balance;
          else break;
        }

        // Filtered rows for the selected date range
        const rows = enriched.filter((s: any) => {
          const d = new Date(s.TransDate).getTime();
          return d >= fromMs && d <= toMs;
        });

        if (rows.length === 0) {
          this.globals.SnackBar('error', 'No transactions found in this date range');
          this.stmtLoading = false;
          return;
        }

        // ── Passbook position tracking ──
        // Key: pb_pos_{SbAcSno} → { page: number, line: number }
        const posKey = `pb_pos_${this.Account.SbAcSno}`;
        let savedPos = { page: 1, line: 0 };
        try {
          const stored = sessionStorage.getItem(posKey);
          if (stored) savedPos = JSON.parse(stored);
        } catch (e) {}

        // page: 1-based physical sheet number
        // line: 0-based row within that sheet (0..LINES_PER_SHEET-1)
        let currentPage = savedPos.page;
        let currentLineOnSheet = savedPos.line;

        // ── Build paginated row data (sections accumulate raw tbody HTML) ──
        // buildSectionTable() (defined below) wraps each section in the table/header.
        const sections: string[] = [];

        // Always prepend opening balance as first data row of this print job
        let pendingRows: any[] = [...rows];
        pendingRows = [
         
          ...pendingRows,
        ];

        let rowIndex = 0;
        while (rowIndex < pendingRows.length) {
          // How many lines remain available in the current section?
          const lineInCurrentSection = currentLineOnSheet % LINES_PER_SECTION;
          const linesLeft = LINES_PER_SECTION - lineInCurrentSection;

          let sectionRows = '';
          let filled = 0;

          while (rowIndex < pendingRows.length && filled < linesLeft) {
            const s = pendingRows[rowIndex];

            // ── Date ──────────────────────────────────────────────────────
            const dateStr = s.TransDate
              ? this.globals.formatDateToDDMMYYYY(s.TransDate)
              : '';

            // ── Trans No (Particulars col 2) ───────────────────────────────
            const transNo = s.TransNo || '';

            // ── Particulars (col 3): Type label + optional Remarks in ()  ──
            // Format: "Receipt"  or  "Receipt (Min Balance)"
            // Format: "Payment"  or  "Payment (some remark)"
            const typeLabel = s.Type === 'Receipt' ? 'Receipt'
              : s.Type === 'Payment' ? 'Payment'
              : (s.Type || '');
            const remarks = (s.Remarks || s.Reference || '').trim();
            const particulars = remarks ? `${typeLabel} (${remarks})` : typeLabel;

            // ── Amounts ────────────────────────────────────────────────────
            const withdrawals = s.Type === 'Payment' ? Number(s.Amount).toFixed(2) : '';
            const deposits    = s.Type === 'Receipt' ? Number(s.Amount).toFixed(2) : '';
            const balance     = Number(s.balance).toFixed(2);

            sectionRows += `<tr>
              <td>${dateStr}</td>
              <td>${transNo}</td>
              <td>${particulars}</td>
              <td class="r">${withdrawals}</td>
              <td class="r">${deposits}</td>
              <td class="r b">${balance}</td>
            </tr>`;


            rowIndex++;
            filled++;
            currentLineOnSheet++;
          }

          // Pad remaining lines with empty filler rows to preserve physical spacing
          for (let e = filled; e < linesLeft; e++) {
            sectionRows += `<tr class="empty"><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>`;
          }

          // Push just the tbody rows – buildSectionTable adds the full table wrapper
          sections.push(sectionRows);

          // Advance to next section or next physical sheet
          if (currentLineOnSheet >= LINES_PER_SHEET) {
            currentPage++;
            currentLineOnSheet = 0;
          }
          // If currentLineOnSheet is between LINES_PER_SECTION and LINES_PER_SHEET,
          // we're on the bottom section of the same sheet – loop naturally continues.
        }


        // NOTE: sessionStorage position update is deferred to onAfterPrint
        // (see printService.printContent second argument below) so it only
        // fires AFTER the user confirms print in the dialog, not on preview.

        // ── Build print HTML exactly sized to the physical passbook sheet ──
        // Page: Letter Portrait (215.9mm × 279.4mm), margin: 0
        // Section 1 (top):    starts at 0,   height = 87mm
        // Gap (perforation):  ~6mm empty space between sections
        // Section 2 (bottom): starts at 93mm, height = 87mm
        // Row height: 5.5mm  |  Header row: 6mm
        // No backgrounds, no colors – dot matrix safe

        const ROW_H = '5.5mm';
        const HEADER_H = '6mm';
        const SECTION_H = '87mm';
        const acTypeName = acType ? acType.AcType_Name : '';
        const customerName = customer ? customer.Party_Name : '';
        const fromDisp = this.globals.formatDateToDDMMYYYY(this.stmtFromDate);
        const toDisp = this.globals.formatDateToDDMMYYYY(this.stmtToDate);

        // showHeader = true  → renders thead (top section of each sheet, header prints once)
        // showHeader = false → colgroup only, no thead   (bottom section, no duplicate header)
        const buildSectionTable = (sectionRows: string, showHeader: boolean) => `
          <table>
            <colgroup>
              <col style="width:22mm">  <!-- Date -->
              <col style="width:24mm">  <!-- Trans No -->
              <col style="width:75mm">  <!-- Particulars -->
              <col style="width:20mm">  <!-- Withdrawals -->
              <col style="width:20mm">  <!-- Deposits -->
              <col style="width:24mm">  <!-- Balance -->
            </colgroup>
            ${showHeader ? `
            <thead>
              <tr class="hdr">
                <th>Date</th>
                <th>Trans No</th>
                <th>Particulars</th>
                <th class="r">Withdrawals</th>
                <th class="r">Deposits</th>
                <th class="r">Balance</th>
              </tr>
            </thead>` : ''}
            <tbody>${sectionRows}</tbody>
          </table>`;


        // Pair sections into sheets
        let sheetsHtml = '';
        for (let i = 0; i < sections.length; i += SECTIONS_PER_SHEET) {
          const topRows = sections[i] || '';
          const botRows = sections[i + 1] || '';
          sheetsHtml += `
            <div class="sheet">
              <div class="section">
                ${buildSectionTable(topRows, true)}
              </div>
              <div class="gap"></div>
              <div class="section">
                ${buildSectionTable(botRows, false)}
              </div>
            </div>`;

        }

        const printContent = `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Passbook Statement</title>
            <style>
              @page {
                size: letter portrait;
                margin: 0;
              }

              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }

              body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10px;
                color: #000;
                background: #fff;
                padding-top: 3mm;
              }

              /* 185mm to leave comfortable margin so Balance col stays within
                 the physical passbook boundary (passbook ~200mm, printer margins ~7mm each side) */
              .sheet {
                width: 185mm;
                margin: 0 auto;
                page-break-after: always;
              }
              .sheet:last-child { page-break-after: auto; }

              .section {
                height: ${SECTION_H};
                overflow: hidden;
                position: relative;
              }

              .gap {
                height: 6mm;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
              }

              thead tr.hdr th {
                font-size: 9px;
                font-weight: bold;
                text-align: left;
                padding: 1mm 1mm;
                height: ${HEADER_H};
                border-top: 0.4pt solid #000;
                border-bottom: 0.4pt solid #000;
                white-space: nowrap;
                overflow: hidden;
              }
              thead tr.hdr th.r { text-align: right; }

              tbody tr {
                height: ${ROW_H};
              }

              tbody td {
                font-size: 10px;
                padding: 0 1mm;
                vertical-align: middle;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              tbody td.r { text-align: right; }
              tbody td.b { font-weight: bold; }

              tr.ob td { font-style: italic; }
            </style>
          </head>
          <body>
            ${sheetsHtml}
          </body>
          </html>`;

        this.stmtLoading = false;
        this.closeStatementDialog();

        // Pass the position-save as a deferred callback — fires only after the
        // user clicks Print (or Save as PDF) in the browser print dialog,
        // NOT when they merely open the preview.
        this.printService.printContent(printContent, () => {
          sessionStorage.setItem(
            posKey,
            JSON.stringify({ page: currentPage, line: currentLineOnSheet }),
          );
        });
      },
      error: (err) => {
        console.error('Failed to load account summary for printing', err);
        this.globals.SnackBar('error', 'Failed to load statement data');
        this.stmtLoading = false;
      },
    });
  }
}
