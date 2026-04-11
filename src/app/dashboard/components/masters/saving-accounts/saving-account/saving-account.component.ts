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
  showStatementDialog  = false;
  stmtFromDate: string = '';
  stmtToDate: string   = '';
  stmtLoading          = false;
  /** true when Last_Print_Date is set — user cannot change the from date */
  stmtFromDateReadOnly = false;
  /** AcStatement rows loaded when the dialog opens (chronological order: oldest first) */
  stmtCachedStatements: any[] = [];
  /** true after print preview is opened — shows confirm/skip buttons */
  stmtPrintDone        = false;
  /** The formatted datetime string to persist when user confirms print status */
  stmtPendingPrintDate = '';

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
          const DateNow = this.globals.formatDate(new Date(), 'yyyy-MM-dd');
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
                Receipt_Date: this.globals.buildIstDateTime(DateNow),
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

  /** Safely returns the last print date as 'yyyy-MM-dd' for display.
   *  Handles both PHP date object { date: "..." } and plain string. */
  get lastPrintDateDisplay(): string {
    return this.globals.extractDateString(this.Account?.Last_Print_Date);
  }

  // ── Statement Dialog ──────────────────────────────────────────────────────
  openStatementDialog() {
    this.stmtLoading = true;
    this.stmtCachedStatements = [];

    // ── From Date: same day as Last_Print_Date (time-based filter handles exclusion) ──
    const lastPrint = this.Account.Last_Print_Date;
    if (lastPrint) {
      // Show the date of last print; rows filter uses EXACT time so same-day
      // transactions after the print time will correctly appear in the next job.
      this.stmtFromDate     = this.globals.extractDateString(lastPrint);
      this.stmtFromDateReadOnly = true;
    } else {
      // No previous print — user enters from date manually
      this.stmtFromDate     = '';
      this.stmtFromDateReadOnly = false;
    }

    // ── To Date: default to today, will be overridden by last entry date ──
    this.stmtToDate = this.globals.formatDate(new Date(), 'yyyy-MM-dd');
    this.showStatementDialog = true;

    // ── Load AcStatement to find last entry date for toDate ──
    this.summaryService.getAccountSummary(this.Account.SbAcSno!).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (list.length) {
          const item = list[0];
          try {
            if (item.AcStatement && typeof item.AcStatement === 'string')
              item.AcStatement = JSON.parse(item.AcStatement);
          } catch (e) { console.error('AcStatement parse error', e); }

          const raw: any[] = Array.isArray(item.AcStatement) ? item.AcStatement : [];
          // Reverse to chronological order (oldest → newest)
          this.stmtCachedStatements = [...raw].reverse();

          // Set toDate = last entry date in the statement
          if (this.stmtCachedStatements.length > 0) {
            const lastItem = this.stmtCachedStatements[this.stmtCachedStatements.length - 1];
            const lastDateStr = (lastItem.TransDate || '').toString().substring(0, 10);
            if (lastDateStr) this.stmtToDate = lastDateStr;
          }
        }
        this.stmtLoading = false;
      },
      error: (err) => {
        console.error('Failed to load statement data for dialog', err);
        this.stmtLoading = false;
      },
    });
  }

  closeStatementDialog() {
    this.showStatementDialog  = false;
    this.stmtLoading          = false;
    this.stmtPrintDone        = false;
    this.stmtPendingPrintDate = '';
  }

  /** User confirmed the print succeeded — persist Last_Print_Date to DB. */
  confirmPrintStatus() {
    // Build datetime at the EXACT moment user clicks 'Update Print Status',
    // using stmtToDate as the date part and current IST clock for the time.
    // e.g. clicked at 14:20:16 IST on Apr 11 → '2026-04-11 14:20:16'
    const dateToSave = this.globals.buildIstDateTime(this.stmtToDate);
    this.stmtLoading = true;

    const payload: any = {
      ...this.Account,
      Last_Print_Date: dateToSave,
      IsActive:      Number(this.Account.IsActive) === 1 ? 1 : 0,
      PartySno:      Number(this.Account.PartySno),
      JointPartySno: Number(this.Account.JointPartySno) || 0,
      RefPartySno:   Number(this.Account.RefPartySno)   || 0,
      AcTypeSno:     Number(this.Account.AcTypeSno)     || 1,
    };

    this.accountsService.crudSavingsAcc(1, payload).subscribe({
      next: (res: any) => {
        if (res?.CurrentRowVer) this.Account.CurrentRowVer = res.CurrentRowVer;
        this.Account.Last_Print_Date = dateToSave;
        this.globals.SnackBar('success', 'Print status updated successfully');
        this.closeStatementDialog();
      },
      error: (e) => {
        console.error('Failed to update Last_Print_Date:', e);
        this.globals.SnackBar('error', 'Failed to update print status');
        this.stmtLoading = false;
      },
    });
  }

  /** User chose not to update — just close the dialog without any DB change. */
  skipPrintStatus() {
    this.closeStatementDialog();
  }

  // ── Print Account Statement with Passbook Pagination ──────────────────────
  // Position is computed from Last_Print_Date + total transaction count —
  // no sessionStorage needed. The physical passbook position is deterministic.
  printStatement() {
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
    if (this.stmtCachedStatements.length === 0) {
      this.globals.SnackBar('error', 'Statement data not loaded yet, please wait');
      return;
    }

    this.stmtLoading = true;

    // ── Reload fresh data to guarantee accuracy ──
    this.summaryService.getAccountSummary(this.Account.SbAcSno!).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : [];
        if (!list.length) {
          this.globals.SnackBar('error', 'No account data found');
          this.stmtLoading = false;
          return;
        }

        const item = list[0];
        try {
          if (item.Party      && typeof item.Party      === 'string') item.Party      = JSON.parse(item.Party);
          if (item.AcType     && typeof item.AcType     === 'string') item.AcType     = JSON.parse(item.AcType);
          if (item.AcStatement && typeof item.AcStatement === 'string') item.AcStatement = JSON.parse(item.AcStatement);
        } catch (e) {
          console.error('Failed to parse API response fields:', e);
          this.globals.SnackBar('error', 'Invalid data received from server');
          this.stmtLoading = false;
          return;
        }

        const customer = item.Party;
        const acType   = item.AcType;
        // Chronological order: oldest → newest (reverse API's descending order)
        const allStatements: any[] = Array.isArray(item.AcStatement)
          ? [...item.AcStatement].reverse()
          : [];
        // ── Helper: parse the API's datetime format reliably ─────────────────
        // API returns: "2026-04-11 14:02:21.000000" (space + 6-digit microseconds)
        // new Date("YYYY-MM-DD HH:...") → Invalid Date in Firefox / inconsistent Chrome
        // Fix: normalise to "YYYY-MM-DDTHH:MM:SS" which browsers parse as LOCAL time (IST)
        const parseApiDate = (transDate: any): number => {
          // Handle PHP date object: { date: "YYYY-MM-DD HH:MM:SS.ffffff", timezone: "UTC" }
          const raw = (transDate?.date || transDate || '').toString().trim();
          if (!raw) return 0;
          // "2026-04-11 14:02:21.000000" → "2026-04-11T14:02:21" → parsed as local IST
          const iso = raw.replace(' ', 'T').replace(/\.\d+$/, '');
          const d = new Date(iso);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        };

        // ── 1. Position tracking via Last_Print_Date (EXACT time) ─────────
        // printedCount = all transactions with TransDate ≤ Last_Print_Date time.
        // Using exact ms — not end-of-day — so mid-day reprints work correctly.
        const lastPrint        = this.Account.Last_Print_Date;
        const lpRaw            = lastPrint
          ? (lastPrint.date || lastPrint).toString().replace(' ', 'T').replace(/\.\d+$/, '')
          : '';
        const lastPrintExactMs = lpRaw ? new Date(lpRaw).getTime() : 0;

        const printedCount = allStatements.filter((s: any) =>
          parseApiDate(s.TransDate) <= lastPrintExactMs
        ).length;

        // Where in the passbook are we?
        //to calculate the current line on the sheet
        const currentLineOnSheet    = printedCount % LINES_PER_SHEET;
        //how many lines we need to skip in current page
        const lineInCurrentSection  = currentLineOnSheet % LINES_PER_SECTION;
        //to check whether we in top or bottom page
        const isOnBottomSection     = currentLineOnSheet >= LINES_PER_SECTION;
        // Column header was physically printed on the FIRST section of the FIRST print job.
        // Never print it again on subsequent print jobs.
        const headerAlreadyPrinted  = printedCount > 0;

        // ── 2. Filter rows for this print job (EXACT time boundary) ──────────
        // fromMs = 1ms AFTER Last_Print_Date time  → strictly excludes already-printed rows
        // If no last print → from midnight of the user-selected from date
        const fromMs = lastPrint
          ? lastPrintExactMs + 1
          : new Date(this.stmtFromDate).setHours(0, 0, 0, 0);
        const toMs   = new Date(this.stmtToDate).setHours(23, 59, 59, 999);

        const rows = allStatements.filter((s: any) => {
          const d = parseApiDate(s.TransDate);
          return d >= fromMs && d <= toMs;
        });

        if (rows.length === 0) {
          this.globals.SnackBar('error', 'No transactions found in this date range');
          this.stmtLoading = false;
          return;
        }

        // ── 3. Build sections ─────────────────────────────────────────────
        // First section may start at an OFFSET (lineInCurrentSection skip rows)
        // so the data aligns with the correct physical row in the passbook.
        const sections: string[] = [];
        let rowIndex  = 0;
        let startSkip = lineInCurrentSection; // skip rows only for first section

        const buildRow = (s: any): string => {
          const dateStr     = s.TransDate ? this.globals.formatDateToDDMMYYYY(s.TransDate) : '';
          const transNo     = s.TransNo || '';
          const typeLabel   = s.Type === 'Receipt' ? 'Receipt' : s.Type === 'Payment' ? 'Payment' : (s.Type || '');
          const remarks     = (s.Remarks || s.Reference || '').trim();
          const particulars = remarks ? `${typeLabel} (${remarks})` : typeLabel;
          const withdrawals = s.Type === 'Payment' ? Number(s.Amount).toFixed(2) : '';
          const deposits    = s.Type === 'Receipt' ? Number(s.Amount).toFixed(2) : '';
          const balance     = Number(s.Current_Balance).toFixed(2);
          return `<tr>
              <td>${dateStr}</td>
              <td>${transNo}</td>
              <td>${particulars}</td>
              <td class="r">${withdrawals}</td>
              <td class="r">${deposits}</td>
              <td class="r b">${balance}</td>
            </tr>`;
        };

          const emptyRow = `
          <tr class="empty">
            <td>&nbsp;</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>`;
          const skipRow  = `
          <tr class="skip">
            <td>&nbsp;</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>`;

        while (rowIndex < rows.length) {
          const linesAvail = LINES_PER_SECTION - startSkip; // data rows available in this section
          let sectionRows  = '';

          // Skip rows = blank space representing already-printed rows at start of section
          for (let f = 0; f < startSkip; f++) sectionRows += skipRow;

          // Fill available data slots
          let filled = 0;
          while (rowIndex < rows.length && filled < linesAvail) {
            sectionRows += buildRow(rows[rowIndex++]);
            filled++;
          }

          // Pad remaining slots with empty filler (paper must advance full section height)
          for (let e = filled; e < linesAvail; e++) sectionRows += emptyRow;

          sections.push(sectionRows);
          startSkip = 0; // only first section has skip rows
        }

        // ── 4. Build table wrapper ────────────────────────────────────────
        const ROW_H    = '5.5mm';
        const HEADER_H = '6mm';
        const SECTION_H = '87mm';
        const acTypeName   = acType   ? acType.AcType_Name   : '';
        const customerName = customer ? customer.Party_Name  : '';

        // showHeader: column headings appear ONLY on the first section of the
        // first-ever print job (when the passbook has never been printed before).
        const buildSectionTable = (sectionRows: string, showHeader: boolean) => `
          <table>
            <colgroup>
              <col style="width:20mm"><!-- Date: compact, "10-04-2026" fits in 20mm -->
              <col style="width:22mm"><!-- Trans No -->
              <col style="width:75mm"><!-- Particulars -->
              <col style="width:20mm"><!-- Withdrawals -->
              <col style="width:20mm"><!-- Deposits -->
              <col style="width:28mm"><!-- Balance: wider to prevent clip -->
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

        // Empty section HTML (for the top-section skip when resuming in bottom section)
        const emptySection = buildSectionTable(
          Array(LINES_PER_SECTION).fill(emptyRow).join(''), false
        );

        // ── 5. Pair sections into sheets ──────────────────────────────────
        // If resuming in the bottom section, the first physical sheet needs:
        //   top (87mm blank, already printed) + gap + bottom (sections[0])
        // All subsequent sheets: top=sections[i] + gap + bottom=sections[i+1]
        let sheetsHtml = '';
        let sIdx = 0; // current index into sections[]

        if (isOnBottomSection && sections.length > 0) {
          // Top area was already printed — output empty top to advance paper
          sheetsHtml += `
            <div class="sheet">
              <div class="section">${emptySection}</div>
              <div class="gap"></div>
              <div class="section">${buildSectionTable(sections[0], false)}</div>
            </div>`;
          sIdx = 1;
        }

        for (; sIdx < sections.length; sIdx += SECTIONS_PER_SHEET) {
          const topRows = sections[sIdx]     || '';
          const botRows = sections[sIdx + 1] || '';
          // Header only on the very first top-section of the very first print job
          const isFirstTopSection = sIdx === 0 && !isOnBottomSection;
          const showHeader        = isFirstTopSection && !headerAlreadyPrinted;
          sheetsHtml += `
            <div class="sheet">
              <div class="section">${buildSectionTable(topRows, showHeader)}</div>
              <div class="gap"></div>
              <div class="section">${buildSectionTable(botRows, false)}</div>
            </div>`;
        }

        // ── 6. Compose full print HTML ─────────────────────────────────────
        const printContent = `<!DOCTYPE html>
          <html lang="en"><head><meta charset="UTF-8"><title>Passbook Statement</title>
          <style>
            @page { size: letter portrait; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000; background: #fff; padding-top: 5mm; }
            /* Left-align to physical passbook edge — margin:0 auto shifts ~15mm right, clipping Balance */
            .sheet { width: 185mm; margin: 0 0 0 3mm; page-break-after: always; }
            .sheet:last-child { page-break-after: auto; }
            .section { height: ${SECTION_H}; overflow: hidden; position: relative; }
            .gap     { height: 6mm; }
            table    { width: 100%; border-collapse: collapse; table-layout: fixed; }
            thead tr.hdr th {
              font-size: 9px; font-weight: bold; text-align: left; padding: 1mm 1mm;
              height: ${HEADER_H}; border-top: 0.4pt solid #000; border-bottom: 0.4pt solid #000;
              white-space: nowrap; overflow: hidden;
            }
            thead tr.hdr th.r { text-align: right; }
            tbody tr  { height: ${ROW_H}; }
            tbody td  { font-size: 10px; padding: 0 1mm; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            tbody td.r { text-align: right; }
            tbody td.b { font-weight: bold; }
            /* skip rows are blank rows advancing paper over already-printed area */
            tr.skip td, tr.empty td { }
          </style></head>
          <body>${sheetsHtml}</body></html>`;

        this.stmtLoading = false;
        // stmtPendingPrintDate is built at actual click time in confirmPrintStatus()
        this.stmtPrintDone = true;
        this.printService.printContent(printContent);


      },
      error: (err) => {
        console.error('Failed to load account summary for printing', err);
        this.globals.SnackBar('error', 'Failed to load statement data');
        this.stmtLoading = false;
      },
    });
  }
}

