import { Routes } from "@angular/router";
import { AccountTypesComponent } from "./account-types/account-types.component";
import { AccountTypeComponent } from "./account-types/account-type/account-type.component";
import { SavingAccountsComponent } from "./saving-accounts/saving-accounts.component";
import { SavingAccountComponent } from "./saving-accounts/saving-account/saving-account.component";
import { CustomersComponent } from "./customers/customers.component";
import { CustomerComponent } from "./customers/customer/customer.component";

export const MASTER_ROUTES: Routes = [
    // Account Types Routes
    {
        path: 'account-types',
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
        path: 'saving-accounts',
        component: SavingAccountsComponent,
        children: [
            {
                path: 'saving-account',
                component: SavingAccountComponent
            }
        ]
    },
    // Customers Routes
    {
        path: 'customers',
        component: CustomersComponent,
        children: [
            {
                path: 'customer',
                component: CustomerComponent
            }
        ]
    },
];