import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-company-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-selection.component.html',
  styleUrl: './company-selection.component.scss'
})
export class CompanySelectionComponent implements OnInit {
  companies: any[] = [];
  activeCompSno: number = 0;

  @Input() canClose: boolean = true;
  @Output() companySelected = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.activeCompSno = Number(sessionStorage.getItem('CompSno')) || 0;

    const storedInfo = sessionStorage.getItem('CompInfoList');
    if (storedInfo) {
      try {
        this.companies = JSON.parse(storedInfo);
      } catch (e) {
        if (!this.canClose) this.router.navigate(['login']);
      }
    } else {
      if (!this.canClose) this.router.navigate(['login']);
    }
  }

  isActive(comp: any): boolean {
    return Number(comp.CompSno) === this.activeCompSno;
  }

  selectCompany(company: any): void {
    sessionStorage.setItem('CompSno', company.CompSno.toString());
    sessionStorage.setItem('Comp_Code', company.Comp_Code);
    sessionStorage.setItem('Comp_Name', company.Comp_Name);
    this.companySelected.emit(company);
    
    // Always navigate to dashboard and trigger a full refesh.
    // This is required because services cache and rely on CompSno directly via sessionStorage. 
    this.router.navigate(['dashboard/user-dashboard']).then(() => {
       window.location.reload();
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(): void {
    if (this.canClose) {
      this.closeModal();
    }
  }
}
