import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

interface MenuItem {
  label: string;
  icon?: string;
  route?: string;
  id?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  expandedMenu: string | null = null;

  @ViewChild('sidebarToggle') sidebarToggle!: ElementRef<HTMLInputElement>;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'bx bxs-dashboard',
      route: '/dashboard/user-dashboard'
    },
    {
      label: 'Masters',
      id: 'Masters',
      icon: 'bx bx-data',
      children: [
        { label: 'Customers', route: '/dashboard/masters/customers', icon: 'bx bx-user' },
        { label: 'Savings Accounts', route: '/dashboard/masters/saving-accounts', icon: 'bx bx-user-circle' },
        { label: 'Account Types', route: '/dashboard/masters/account-types', icon: 'bx bx-list-ul' }
      ]
    },
    {
      label: 'Transactions',
      id: 'Transactions',
      icon: 'bx bx-transfer',
      children: [
        //{ label: 'Accounts', route: '/dashboard/transactions/accounts', icon: 'bx bx-user-circle' },
        { label: 'Savings Receipts', route: '/dashboard/transactions/savings-receipts', icon: 'bx bx-receipt' },
        { label: 'Savings Payments', route: '/dashboard/transactions/savings-payments', icon: 'bx bx-credit-card' },
        { label: 'Interest Postings', route: '/dashboard/transactions/savings-int-postings', icon: 'bx bx-bar-chart' },
        //{ label: 'Closures', route: '/dashboard/transactions/closures', icon: 'bx bx-x-circle' }
      ]
    },
    // {
    //   label: 'Reports',
    //   id: 'Reports',
    //   icon: 'bx bx-file',
    //   children: [
    //     { label: 'RD History', route: '/dashboard/reports/rd-history', icon: 'bx bx-building' },
    //     { label: 'Pending Report', route: '/dashboard/reports/pending-report', icon: 'bx bx-building' },
    //     { label: 'Customer Summary', route: '/dashboard/reports/customer-summary', icon: 'bx bx-building' },
    //     { label: 'Account Summary', route: '/dashboard/reports/account-summary', icon: 'bx bx-building' },
    //   ]
    // },
    //  {
    //   label: 'Settings',
    //   id: 'Settings',
    //   icon: 'bx bx-cog',
    //   children: [
    //   { label: 'Companies', route: '/dashboard/settings/companies', icon: 'bx bx-building' },
    //    { label: 'Voucher Series', route: '/dashboard/settings/voucher-serieses', icon: 'bx bx-building' },
    //    { label: 'App Setup', route: '/dashboard/settings/appsetup', icon: 'bx bx-cog' }
    //   ]
    // },
  ];

  constructor(private router: Router) { }

  ngOnInit() {
    // Subscribe to router events to close sidebar on mobile navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        if (this.sidebarToggle) {
          this.sidebarToggle.nativeElement.checked = false;
        }
      }
    });
  }

  toggleSubmenu(menuId: string | undefined) {
    this.expandSidebar();
    if (!menuId) return;
    this.expandedMenu = this.expandedMenu === menuId ? null : menuId;
  }

  expandSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      if (this.sidebarToggle && this.sidebarToggle.nativeElement.checked) {
        this.sidebarToggle.nativeElement.checked = false;
      }
    }
  }

  closeSidebar() {
    if (this.sidebarToggle) {
      this.sidebarToggle.nativeElement.checked = false;
    }
  }

  get isCompanySelected(): boolean {
    if (typeof sessionStorage !== 'undefined') {
      return !!sessionStorage.getItem('CompSno');
    }
    return false;
  }
}