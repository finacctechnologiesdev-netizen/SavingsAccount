import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Client } from '../../../auth/auth.service';

@Component({
  selector: 'app-client-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-info.component.html',
  styleUrls: ['./client-info.component.scss']
})
export class ClientInfoComponent implements OnInit {

  client: Client | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (this.authService.ClientInfo && this.authService.ClientInfo.length > 0) {
      this.client = this.authService.ClientInfo[0];
    }
  }

  formatNumberToDate(numDate: number | undefined): string {
    if (!numDate) return '-';
    const dateStr = numDate.toString();
    if (dateStr.length !== 8) return dateStr;
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${day}/${month}/${year}`;
  }

}
