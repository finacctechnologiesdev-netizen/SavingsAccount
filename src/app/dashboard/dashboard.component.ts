import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { RouterOutlet } from '@angular/router';
import { CompanySelectionComponent } from './components/company-selection/company-selection.component';

@Component({
  selector: 'app-dashboard',
  imports: [SidebarComponent,HeaderComponent,RouterOutlet, CompanySelectionComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  showCompanySelectionModal: boolean = false;
  hasSelectedCompany: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkCompanySelection();

    this.router.events.subscribe(() => {
      this.checkCompanySelection();
    });
  }

  checkCompanySelection() {
    this.hasSelectedCompany = !!sessionStorage.getItem('CompSno');

    // If no company selected and no company list available
    if (!this.hasSelectedCompany) {
      if (!sessionStorage.getItem('CompInfoList')) {
        this.router.navigate(['login']);
      } else {
        // We have a list but no selection, auto-open the modal
        this.showCompanySelectionModal = true;
      }
    }
  }

  onCompanySelected(comp: any) {
    this.hasSelectedCompany = true;
    this.showCompanySelectionModal = false;
  }
}
