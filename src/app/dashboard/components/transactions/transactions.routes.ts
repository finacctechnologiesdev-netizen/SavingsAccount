import { Routes } from "@angular/router";
import { SavingsReceiptsComponent } from "./savings-receipts/savings-receipts.component";
import { SavingsReceiptComponent } from "./savings-receipts/savings-receipt/savings-receipt.component";
import { SavingsPaymentsComponent } from "./savings-payments/savings-payments.component";
import { SavingsPaymentComponent } from "./savings-payments/savings-payment/savings-payment.component";
import { SavingsIntPostingsComponent } from "./savings-int-postings/savings-int-postings.component";
import { SavingsIntPostingComponent } from "./savings-int-postings/savings-int-posting/savings-int-posting.component";

export const TRANSACTIONS_ROUTES: Routes = [
    // Receipts Routes
    {
        path: 'savings-receipts',
        component: SavingsReceiptsComponent,
        children: [
            {
                path: 'savings-receipt',
                component: SavingsReceiptComponent
            }
        ]
    },
    // Payments Routes
    {
        path: 'savings-payments',
        component: SavingsPaymentsComponent,
        children: [
            {
                path: 'savings-payment',
                component: SavingsPaymentComponent
            }
        ]
    },
    // Interest Postings Routes
    {
        path: 'savings-int-postings',
        component: SavingsIntPostingsComponent,
        children: [
            {
                path: 'savings-int-posting',
                component: SavingsIntPostingComponent
            }
        ]
    },
];