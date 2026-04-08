import { Component, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { Router } from '@angular/router';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { VoucherSeriesesService, TypeVoucherSeries } from './voucher-serieses.service';
import { VoucherSeriesComponent } from './voucher-series/voucher-series.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-voucher-serieses',
  standalone: true,
  imports: [TableviewComponent, VoucherSeriesComponent, CommonModule],
  templateUrl: './voucher-serieses.component.html',
  styleUrl: './voucher-serieses.component.scss'
})
export class VoucherSeriesesComponent implements OnInit {

  constructor(
    public voucherService: VoucherSeriesesService,
    public globals: GlobalService,
    private router: Router
  ) {}

  DataSource = signal<TypeVoucherSeries[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Series_Name', Data_Type: 'string', Display_Name: 'Series Name' },
    { Field_Name: 'Prefix', Data_Type: 'string', Display_Name: 'Prefix' },
    { Field_Name: 'Suffix', Data_Type: 'string', Display_Name: 'Suffix' },
    { Field_Name: 'Width', Data_Type: 'string', Display_Name: 'Width' },
    { Field_Name: 'Start_No', Data_Type: 'string', Display_Name: 'Start No.' },
    { Field_Name: 'Current_No', Data_Type: 'string', Display_Name: 'Current No.' },
    { Field_Name: 'Active_Status', Data_Type: 'boolean', Display_Name: 'Status' },
    { Field_Name: 'Actions', Data_Type: 'string', Display_Name: 'Actions' },
  ]);

  // Modal State Variables
  showForm: boolean = false;
  isEditMode: boolean = false;
  selectedSeries: TypeVoucherSeries | null = null;

  ngOnInit(): void {
      this.loadVoucherSeries();
  }

  loadVoucherSeries() {
    this.voucherService.getVoucherSeries().subscribe({
      next: (res: any) => {
        let list = res;
        
        // Handle payload structured as { queryStatus: number, apiData: string }
        if (res && res.apiData) {
            list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
        } else if (typeof res === 'string') {
            try { list = JSON.parse(res); } catch(e) {}
        }
        
        if (!Array.isArray(list)) {
            list = [];
        }

        this.voucherService.seriesList = list;
        this.DataSource.set(list);
        console.log("Parsed API Response: ", list);
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load Voucher Series data');
      },
    });
  }

  handleAction(event: any) {
    if (event.Action === 'Select' || event.Action === 'Filter') {
      return;
    }
    if (event.Action === 1) { // Edit
      this.editVoucherSeries(event.Data);
    } else if (event.Action === 2) { // Delete
      this.deleteVoucherSeries(event.Data);
    }
  }

  editVoucherSeries(series: TypeVoucherSeries) {
    const originalSeries = this.voucherService.seriesList.find(s => s.SeriesSno === series.SeriesSno);
    this.selectedSeries = originalSeries || series;
    this.isEditMode = true;
    this.showForm = true;
  }

  createNew() {
    this.selectedSeries = this.voucherService.initializeVoucherSeries();
    this.isEditMode = false;
    this.showForm = true;
  }

  onFormClosed() {
    this.showForm = false;
    this.selectedSeries = null;
  }

  onFormSaved(updatedSeries: TypeVoucherSeries) {
    this.showForm = false;
    this.selectedSeries = null;
    this.DataSource.set([...this.voucherService.seriesList]);
  }

  deleteVoucherSeries(series: TypeVoucherSeries) {
    this.globals.MsgBox(2, 'Are you sure you want to delete this Voucher Series?').then((result) => {
      if (result === 1) {
        this.voucherService.crudVoucherSeries(series).subscribe({
          next: (res: any) => {
            if (res.Status === 'Success' || res.queryStatus === 1) {
              this.globals.SnackBar('success', 'Voucher Series deleted successfully');
              this.voucherService.removeVoucherSeries(series.SeriesSno!);
              this.DataSource.set([...this.voucherService.seriesList]);
            } else {
              this.globals.SnackBar('error', res.userMessage || res.Message || 'Failed to delete series');
            }
          },
          error: (err) => {
            this.globals.SnackBar('error', 'Error while deleting series');
            console.error(err);
          }
        });
      }
    });
  }
}
