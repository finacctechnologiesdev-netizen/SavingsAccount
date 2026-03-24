import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalService } from '../../../../../services/global.service';
import { VoucherSeriesesService, TypeVoucherSeries } from '../voucher-serieses.service';
import { InputBehaviorDirective } from '../../../../../directives/input-behavior.directive';

@Component({
  selector: 'app-voucher-series',
  standalone: true,
  imports: [CommonModule, FormsModule, InputBehaviorDirective],
  templateUrl: './voucher-series.component.html',
  styleUrl: './voucher-series.component.scss'
})
export class VoucherSeriesComponent implements OnInit {

  @Input() inputSeries: TypeVoucherSeries | null = null;
  @Input() editMode: boolean = false;
  
  @Output() closeEvent = new EventEmitter<void>();
  @Output() saveEvent = new EventEmitter<TypeVoucherSeries>();

  Series!: TypeVoucherSeries;
  isEditMode = false;
  submitCount = 0;
  errors: any = {};

  constructor(
    private router: Router,
    public globals: GlobalService,
    private voucherService: VoucherSeriesesService,
  ) { }

  ngOnInit(): void {
    if (this.inputSeries) {
      this.isEditMode = this.editMode;
      this.Series = { ...this.inputSeries };
    } else {
      // Fallback for routed instances if needed
      const stateData = history.state.data;
      if (stateData) {
        this.isEditMode = true;
        this.Series = { ...stateData };
      } else {
        this.isEditMode = false;
        this.Series = this.voucherService.initializeVoucherSeries();
      }
    }

    // Safely reconstruct nested objects natively if the backend API responds with older flat formats
    if (!this.Series.VouType) {
        this.Series.VouType = { VouTypeSno: (this.Series as any).VouTypeSno || 0 };
    }
    if (!this.Series.MapGroup) {
        this.Series.MapGroup = { GrpSno: (this.Series as any).MapGrpSno || 0 };
    }
  }

  validateFields(): boolean {
    this.errors = {};
    let isValid = true;
    const data = this.Series;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (!data.Series_Name) setError('Series_Name', 'Series Name is Required');
    if (data.Start_No === null || data.Start_No === undefined) setError('Start_No', 'Start No is Required');
    if (data.Current_No === null || data.Current_No === undefined) setError('Current_No', 'Current No is Required');

    return isValid;
  }

  saveSeries() {
    this.submitCount++;
    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please fill required fields');
      return;
    }

    const action = this.isEditMode ? 1 : 0;
    const payload: any = { ...this.Series };
    
    // Ensure numeric types correctly applied if needed, but form binding handles most of them.
    // payload.Width = Number(payload.Width) || 0;
    // payload.Start_No = Number(payload.Start_No) || 0;
    // payload.Current_No = Number(payload.Current_No) || 0;
    
    // Safely extract VouTypeSno avoiding undefined runtime crashes
    payload.VouTypeSno = payload.VouType?.VouTypeSno ?? payload.VouTypeSno ?? 0;

    this.voucherService.crudVoucherSeries(payload).subscribe({
      next: (res: any) => {
        if (res.Status === 'Success' || res.queryStatus === 1) {
          this.globals.SnackBar('success', this.isEditMode ? 'Voucher Series updated successfully' : 'Voucher Series created successfully');
          
          if (this.isEditMode) {
            this.voucherService.updateVoucherSeries(payload);
          } else {
            if (res.RetSno) {
              payload.SeriesSno = res.RetSno;
            }
            this.voucherService.addVoucherSeries(payload);
          }
          this.saveEvent.emit(payload); 
          this.closeSeries();
        } else {
          this.globals.SnackBar('error', res.userMessage || res.Message || 'Operation failed');
        }
      },
      error: (err) => {
        this.globals.SnackBar('error', 'Network Error');
        console.error(err);
      }
    });
  }

  cancelSeries() {
    this.closeSeries();
  }

  closeSeries() {
    this.closeEvent.emit();
    // Fallback if accessed via direct URL
    if (!this.inputSeries && history.state.data === undefined) {
      this.router.navigate(['dashboard/settings/voucher-serieses']);
    }
  }
}
