import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  showProfileMenu = false;
  clientCode: string = "";
  selectedCompanyName: string = "";

  @Output() openBranchSelection = new EventEmitter<void>();

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.clientCode = localStorage.getItem('Client_Code') || "";
    this.selectedCompanyName = sessionStorage.getItem('Comp_Name') || "";
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  @HostListener('document:click')
  closeMenu() {
    this.showProfileMenu = false;
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  toggleSidebar() {
    const sidebarCheckbox = document.getElementById('sidebar-toggle') as HTMLInputElement;
    if (sidebarCheckbox) {
      sidebarCheckbox.click();
    }
  }

  viewProfile() {
    this.router.navigate(['/dashboard/client-info']);
  }

  openCompanySelection() {
    this.openBranchSelection.emit();
  }
}
