import { Component, effect, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { CustomersService, TypeCustomer } from './customers.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [TableviewComponent, RouterOutlet],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {

  constructor(
    public customersService: CustomersService,
    public globals: GlobalService,
    private router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.router.url === '/dashboard/masters/customers') {
          this.DataSource.set([...this.customersService.customersList]);
        }
      }
    });
  }

  DataSource = signal<TypeCustomer[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Party_Code', Data_Type: 'string' },
    { Field_Name: 'Party_Name', Data_Type: 'string' },
    // { Field_Name: 'Phone', Data_Type: 'string' },
    { Field_Name: 'Mobile', Data_Type: 'string' },
    { Field_Name: 'Reference', Data_Type: 'string' },
    { Field_Name: 'Create_Date', Data_Type: 'date' },
    { Field_Name: 'Active_Status', Data_Type: 'boolean' },
    { Field_Name: 'Actions', Data_Type: 'string' },
  ]);

  ngOnInit(): void {
    if (this.customersService.customersList.length === 0) {
      this.loadCustomers();
    } else {
      this.DataSource.set([...this.customersService.customersList]);
    }
  }

  loadCustomers(){
    this.customersService.getCustomers().subscribe({
      next: (res) =>{
        this.customersService.customersList = res;
        res.forEach((customer: TypeCustomer) => {
          customer.Create_Date = customer.Create_Date;
        });
        this.DataSource.set(res);
      },
      error: (err) => {
        console.error('Network Error', err);
      },
    })
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }

    if (event.Action === 1) { // Edit
      this.editCustomer(event.Data);
    } else if (event.Action === 2) { // Delete
      this.deleteCustomer(event.Data);
    } else if (event.Action === 3) { // Print
      this.globals.SnackBar('info', 'Print feature not implemented yet');
    } else if (event.Action === 'Email') { // Mail
      this.globals.SnackBar('info', 'Email sent successfully via ' + event.Data.Email || 'system');
    }
  }

  editCustomer(customer: TypeCustomer) {
    this.router.navigate(['dashboard/masters/customers/customer'], {
      state: { data: customer },
    });
  }

  createNew() {
    this.router.navigate(['dashboard/masters/customers/customer']);
  }

  deleteCustomer(customer: TypeCustomer) {
    this.globals.MsgBox(2, 'Are you sure you want to delete this customer?').then((result) => {
      if (result === 1) {
        const payload = { ...customer };
        payload.PartySno = Number(payload.PartySno || 0);
        payload.CompSno = 1;
        payload.UserSno = 1;

        this.customersService.crudCustomer(2, payload).subscribe({
          next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
              this.globals.SnackBar('success', 'Customer deleted successfully');
              this.customersService.removeCustomer(payload.PartySno!);
              this.DataSource.set([...this.customersService.customersList]);
            } else {
              this.globals.SnackBar('error',res.Message || 'Failed to delete customer');
            }
          },
          error: (err) => {
            this.globals.SnackBar('error', 'Error while deleting customer');
            console.error(err);
          }
        });
      }
    });
  }
}
