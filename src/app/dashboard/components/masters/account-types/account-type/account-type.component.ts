import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { AccountTypesService, TypeAcType } from '../account-types.service';
import { InputBehaviorDirective } from '../../../../../directives/input-behavior.directive';
import { AppsetupService } from '../../../settings/appsetup/appsetup.service';

@Component({
  selector: 'app-account-type',
  standalone: true,
  imports: [CommonModule, FormsModule, InputBehaviorDirective],
  providers: [DatePipe],
  templateUrl: './account-type.component.html',
  styleUrl: './account-type.component.scss'
})
export class AccountTypeComponent implements OnInit {

  AcType!: TypeAcType;
  isEditMode = false;
  isAcTypeCodeDisabled = false;
  submitCount = 0;
  errors: any = {};

  constructor(
    private router: Router,
    public globals: GlobalService,
    private acTypesService: AccountTypesService,
    private datePipe: DatePipe,
    private appsetupService: AppsetupService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const stateData = history.state.data;
    if (stateData) {
      this.isEditMode = true;
      this.AcType = { ...stateData };
      if (this.AcType.CreateDate && this.AcType.CreateDate.date) {
        this.AcType.CreateDate = this.datePipe.transform(new Date(this.AcType.CreateDate.date), 'yyyy-MM-dd') || '';
      } else if (this.AcType.CreateDate) {
        if (typeof this.AcType.CreateDate === 'number' || (typeof this.AcType.CreateDate === 'string' && this.AcType.CreateDate.length === 8 && !this.AcType.CreateDate.includes('-'))) {
          this.AcType.CreateDate = this.globals.ConvertApiDateToInput(this.AcType.CreateDate);
        } else {
          this.AcType.CreateDate = this.datePipe.transform(new Date(this.AcType.CreateDate), 'yyyy-MM-dd') || '';
        }
      }
    } else {
      this.isEditMode = false;
      this.AcType = this.acTypesService.initializeAcType();
    }

    this.loadAppSetup();
  }

  loadAppSetup(): void {
    this.appsetupService.getRdSetup().subscribe({
      next: (res: any) => {
        let data = res;
        if (res && res.apiData) {
          data = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
        } else if (typeof res === 'string') {
          try { data = JSON.parse(res); } catch (e) {}
        }
        const setup = Array.isArray(data) ? data[0] : data;
        if (setup) {
          this.applyAcTypeCodeAutoGen(Number(setup.SchemeCode_AutoGen));
        }
      },
      error: (err) => console.error('Failed to load AppSetup', err)
    });
  }

  applyAcTypeCodeAutoGen(autoGenMode: number): void {
    if (autoGenMode === 1) {
      this.isAcTypeCodeDisabled = true;
      if (!this.isEditMode) {
        this.AcType.AcType_Code = 'Auto';
      }
    } else {
      this.isAcTypeCodeDisabled = false;
    }
    this.cdr.detectChanges();
  }


  validateFields(): boolean {
    this.errors = {};
    let isValid = true;
    const data = this.AcType;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (!this.isAcTypeCodeDisabled && !data.AcType_Code) {
      setError('AcType_Code', 'Account Type Code is Required');
    }
    if (!data.AcType_Name) {
      setError('AcType_Name', 'Account Type Name is Required');
    }
    if (data.Min_Balance === null || data.Min_Balance === undefined || Number(data.Min_Balance) < 0) {
      setError('Min_Balance', 'Valid Min Balance is Required');
    }
    if (data.Roi === null || data.Roi === undefined || Number(data.Roi) <= 0) {
      setError('Roi', 'Rate of Interest is Required');
    }

    return isValid;
  }

  saveAcType() {
    this.submitCount++;
    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please fill required fields');
      return;
    }

    const action = this.isEditMode ? 1 : 0;
    const payload: any = { ...this.AcType };
    payload.IsActive = (payload.IsActive === true || payload.IsActive === 1) ? 1 : 0;

    payload.AcTypeSno = Number(payload.AcTypeSno || 0);
    payload.Min_Balance = Number(payload.Min_Balance || 0);
    payload.Roi = Number(payload.Roi || 0);
    payload.Ac_Category = Number(payload.Ac_Category || 1);

    if (this.isEditMode) {
      payload.AcTypeSno = this.AcType.AcTypeSno;
      payload.CurrentRowVer = this.AcType.CurrentRowVer;
      if (typeof payload.CreateDate === 'string' && payload.CreateDate.length === 10 && payload.CreateDate.includes('-')) {
        payload.CreateDate = this.globals.ConvertInputDateToApi(payload.CreateDate);
      }
    } else {
      payload.UserSno = 1;
      payload.CompSno = 1;
      delete payload.CurrentRowVer;
      delete payload.CreateDate;
    }

    this.acTypesService.crudAcType(action, payload).subscribe({
      next: (res: any) => {
        if (res.Status === 'Success' || res.queryStatus === 1) {
          this.globals.SnackBar('success', this.isEditMode ? 'Account type updated successfully' : 'Account type created successfully');

          if (res.CurrentRowVer) {
            this.AcType.CurrentRowVer = res.CurrentRowVer;
          }

          if (this.isEditMode) {
            this.acTypesService.updateAcType(this.AcType);
          } else {
            if (res.RetSno) {
              this.AcType.AcTypeSno = res.RetSno; 
            }
            this.acTypesService.addAcType(this.AcType);
          }
          this.router.navigate(['/dashboard/masters/account-types']);
        } else {
          this.globals.SnackBar('error', res.Message || res.apiData || 'Operation failed');
        }
      },
      error: (err) => {
        this.globals.SnackBar('error', 'Network error');
        console.error(err);
      }
    });
  }

  cancelAcType() {
    this.router.navigate(['/dashboard/masters/account-types']);
  }
}
