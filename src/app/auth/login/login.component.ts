import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, } from '@angular/router';
import { AuthService, Client } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) { }

  clientCode: string = "";
  username: string = "";
  password: string = "";
  errorMessage: string = "";

  ngOnInit(): void {
    localStorage.clear();
  }

  Login(): void {
    this.errorMessage = "";
    if (!this.clientCode || !this.username || !this.password) {
      this.errorMessage = "Please enter all details including Client Code";
      return;
    }

    const clientCode = this.clientCode.trim();
    const username = this.username.trim();
    const password = this.password.trim();

    this.authService.login(username, password, clientCode).subscribe({
      next: (res) => {
        if (res?.queryStatus == 1) {
          localStorage.setItem('AuthToken', res.apiData.AuthToken);
          localStorage.setItem('App_Login', username);
          localStorage.setItem('App_Pwd', password);
          localStorage.setItem('Client_Code', res.apiData.ClientInfo[0].Client_Code);
          this.authService.ClientInfo = res.apiData.ClientInfo;
          //console.log("ClientInfo", this.authService.ClientInfo);

          const compInfo = res.apiData.CompInfo || [];
          if (compInfo.length === 1) {
            sessionStorage.setItem('CompSno', compInfo[0].CompSno);
            sessionStorage.setItem('Comp_Code', compInfo[0].Comp_Code);
            sessionStorage.setItem('Comp_Name', compInfo[0].Comp_Name);
            sessionStorage.setItem('CompInfoList', JSON.stringify(compInfo));
            this.router.navigate(['dashboard/user-dashboard']);
          } else if (compInfo.length > 1) {
            sessionStorage.setItem('CompInfoList', JSON.stringify(compInfo));
            this.router.navigate(['dashboard/user-dashboard']); // Header will open the company selection modal
          } else {
            this.errorMessage = "No company found for this user.";
          }
        } else {
          this.errorMessage = res?.message || 'Invalid login credentials';
        }
      },
      error: (err) => {
        this.errorMessage = "An error occurred during login. Please try again.";
      }
    });
  }

}
