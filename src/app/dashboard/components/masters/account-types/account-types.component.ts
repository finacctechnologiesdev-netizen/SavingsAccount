import { Component, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { AccountTypesService, TypeAcType } from './account-types.service';

@Component({
  selector: 'app-account-types',
  standalone: true,
  imports: [TableviewComponent, RouterOutlet],
  templateUrl: './account-types.component.html',
  styleUrl: './account-types.component.scss'
})
export class AccountTypesComponent implements OnInit {

  constructor(
    public acTypesService: AccountTypesService,
    public globals: GlobalService,
    private router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.router.url === '/dashboard/masters/account-types') {
          this.updateDataSource(this.acTypesService.acTypesList);
        }
      }
    });
  }

  DataSource = signal<TypeAcType[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'AcType_Code', Data_Type: 'string', Display_Name: 'Account Type Code' },
    { Field_Name: 'AcType_Name', Data_Type: 'string', Display_Name: 'Account Type Name' },
    { Field_Name: 'Min_Balance', Data_Type: 'string', Display_Name: 'Min Balance' },
    { Field_Name: 'Roi', Data_Type: 'string', Display_Name: 'ROI' },
    { Field_Name: 'Ac_Category', Data_Type: 'string', Display_Name: 'Category' },
    { Field_Name: 'CreateDate', Data_Type: 'date', Display_Name: 'Create Date' },
    { Field_Name: 'IsActive', Data_Type: 'boolean', Display_Name: 'Status' },
    { Field_Name: 'Actions', Data_Type: 'string', Display_Name: 'Actions' },
  ]);

  ngOnInit(): void {
    if (this.acTypesService.acTypesList.length === 0) {
      this.loadAcTypes();
    } else {
      this.updateDataSource(this.acTypesService.acTypesList);
    }
  }

  loadAcTypes(){
    this.acTypesService.getAcTypes().subscribe({
      next: (res) =>{
        this.acTypesService.acTypesList = res;
        res.forEach((acType: TypeAcType) =>{
          acType.CreateDate = acType.CreateDate.date;
        })
        this.updateDataSource(res);
      },
      error: (err) => {
        console.error('Network Error', err);
      },
    })
  }

  updateDataSource(list: TypeAcType[]) {
    const mappedList = list.map(acType => {
      return {
        ...acType,
        Ac_Category: acType.Ac_Category == 1 ? "Savings" : acType.Ac_Category == 2 ? "Current" : "Other"
      };
    });
    
    this.DataSource.set(mappedList);
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }

    if (event.Action === 1) { // Edit
      this.editAcType(event.Data);
    } else if (event.Action === 2) { // Delete
      this.deleteAcType(event.Data);
    }
  }

  editAcType(acType: TypeAcType) {
    const originalAcType = this.acTypesService.acTypesList.find(s => s.AcTypeSno === acType.AcTypeSno);
    this.router.navigate(['/dashboard/masters/account-types/account-type'], {
      state: { data: originalAcType || acType },
    });
  }

  createNew() {
    this.router.navigate(['/dashboard/masters/account-types/account-type']);
  }

  deleteAcType(acType: TypeAcType) {
    this.globals.MsgBox(2, 'Are you sure you want to delete this account type?').then((result) => {
      if (result === 1) {
        const deletePayload = this.acTypesService.acTypesList.find(s => s.AcTypeSno === acType.AcTypeSno) as TypeAcType;
        // const deletePayload = { ...(originalAcType || acType) };
        delete deletePayload.CreateDate;
        this.acTypesService.crudAcType(2, deletePayload).subscribe({
          next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
              this.globals.SnackBar('success', 'Account type deleted successfully');
              this.acTypesService.removeAcType(acType.AcTypeSno!);
              this.updateDataSource(this.acTypesService.acTypesList);
            } else {
              this.globals.SnackBar('error', res.Message || 'Failed to delete account type');
            }
          },
          error: (err) => {
            this.globals.SnackBar('error', 'Error while deleting account type');
            console.error(err);
          }
        });
      }
    });
  }
}
