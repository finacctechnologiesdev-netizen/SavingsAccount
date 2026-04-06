import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

// --- Import Components Eagerly ---
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserDashboardComponent } from './dashboard/components/user-dashboard/user-dashboard.component';
import { AccountTypesComponent } from './dashboard/components/masters/account-types/account-types.component';
import { AccountTypeComponent } from './dashboard/components/masters/account-types/account-type/account-type.component';
import { SavingAccountsComponent } from './dashboard/components/masters/saving-accounts/saving-accounts.component';
import { SavingAccountComponent } from './dashboard/components/masters/saving-accounts/saving-account/saving-account.component';

import { SavingsReceiptsComponent } from './dashboard/components/transactions/savings-receipts/savings-receipts.component';
import { SavingsReceiptComponent } from './dashboard/components/transactions/savings-receipts/savings-receipt/savings-receipt.component';
import { SavingsPaymentsComponent } from './dashboard/components/transactions/savings-payments/savings-payments.component';
import { SavingsPaymentComponent } from './dashboard/components/transactions/savings-payments/savings-payment/savings-payment.component';
import { SavingsIntPostingsComponent } from './dashboard/components/transactions/savings-int-postings/savings-int-postings.component';
import { SavingsIntPostingComponent } from './dashboard/components/transactions/savings-int-postings/savings-int-posting/savings-int-posting.component';
import { CustomersComponent } from './dashboard/components/masters/customers/customers.component';
import { CustomerComponent } from './dashboard/components/masters/customers/customer/customer.component';

import { CompaniesComponent } from './dashboard/components/settings/companies/companies.component';
import { CompanyComponent } from './dashboard/components/settings/companies/company/company.component';
import { VoucherSeriesesComponent } from './dashboard/components/settings/voucher-serieses/voucher-serieses.component';
import { VoucherSeriesComponent } from './dashboard/components/settings/voucher-serieses/voucher-series/voucher-series.component';
import { AppsetupComponent } from './dashboard/components/settings/appsetup/appsetup.component';
import { ClientInfoComponent } from './dashboard/components/client-info/client-info.component';
import { RdHistoryComponent } from './dashboard/components/reports/rd-history/rd-history.component';
import { PendingReportComponent } from './dashboard/components/reports/pending-report/pending-report.component';
import { CustomerSummaryComponent } from './dashboard/components/reports/customer-summary/customer-summary.component';
import { SavingAccSummaryComponent } from './dashboard/components/reports/saving-acc-summary/saving-acc-summary.component';
import { CompanySelectionComponent } from './dashboard/components/company-selection/company-selection.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        component: DashboardComponent,
        children: [
            {
                path: 'company-selection',
                component: CompanySelectionComponent
            },
            {
                path: 'user-dashboard',
                component: UserDashboardComponent
            },
            // Account Types Routes
            {
                path: 'masters/account-types',
                component: AccountTypesComponent,
                children: [
                    {
                        path: 'account-type',
                        component: AccountTypeComponent
                    }
                ]
            },
            // Saving Accounts Routes
            {
                path: 'masters/saving-accounts',
                component: SavingAccountsComponent,
                children: [
                    {
                        path: 'saving-account',
                        component: SavingAccountComponent
                    }
                ]
            },
            // Receipts Routes
            {
                path: 'transactions/savings-receipts',
                component: SavingsReceiptsComponent
            },
            {
                path: 'transactions/savings-receipts/savings-receipt',
                component: SavingsReceiptComponent
            },
            // Payments Routes
            {
                path: 'transactions/savings-payments',
                component: SavingsPaymentsComponent
            },
            {
                path: 'transactions/savings-payments/savings-payment',
                component: SavingsPaymentComponent
            },
            // Interest Postings Routes
            {
                path: 'transactions/savings-int-postings',
                component: SavingsIntPostingsComponent
            },
            {
                path: 'transactions/savings-int-postings/savings-int-posting',
                component: SavingsIntPostingComponent
            },
            // Customers Routes
            {
                path: 'masters/customers',
                component: CustomersComponent,
                children: [
                    {
                        path: 'customer',
                        component: CustomerComponent
                    }
                ]
            },
            // Settings Routes
            {
                path: 'settings/companies',
                component: CompaniesComponent
            },
            {
                path: 'settings/companies/company',
                component: CompanyComponent
            },
            {
                path: 'settings/voucher-serieses',
                component: VoucherSeriesesComponent
            },
            {
                path: 'settings/voucher-serieses/voucher-series',
                component: VoucherSeriesComponent
            },
            {
                path: 'settings/appsetup',
                component: AppsetupComponent
            },
            {
                path: 'client-info',
                component: ClientInfoComponent
            },
            {
                path: 'reports/rd-history',
                component: RdHistoryComponent
            },
            {
                path: 'reports/pending-report',
                component: PendingReportComponent
            },
            {
                path: 'reports/customer-summary',
                component: CustomerSummaryComponent
            },
            {
                path: 'reports/saving-acc-summary',
                component: SavingAccSummaryComponent
            }
        ]
    }
];
