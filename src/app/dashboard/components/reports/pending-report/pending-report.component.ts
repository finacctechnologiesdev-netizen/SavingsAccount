import { Component, OnInit, signal } from '@angular/core';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { FormsModule } from '@angular/forms';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { PendingReportService, TypePendingReport } from './pending-report.service';

@Component({
  selector: 'app-pending-report',
  standalone: true,
  imports: [TableviewComponent, FormsModule],
  templateUrl: './pending-report.component.html',
  styleUrl: './pending-report.component.scss'
})
export class PendingReportComponent implements OnInit {

  constructor(
    public reportService: PendingReportService,
    public globals: GlobalService
  ) {}

  // API Filtering
  pendingDues: number = 0;

  DataSource = signal<TypePendingReport[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Account_No', Data_Type: 'string' },
    { Field_Name: 'Party_Name', Data_Type: 'string' },
    //{ Field_Name: 'Mobile', Data_Type: 'string' },
    { Field_Name: 'RdScheme_Name', Data_Type: 'string' },
    { Field_Name: 'Account_Date', Data_Type: 'string' },
    { Field_Name: 'Mature_Date', Data_Type: 'string' },
    { Field_Name: 'DueAmount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Paid_Amount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Balance_Amount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Pending_Dues', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Pending_Amount', Data_Type: 'number', Decimals: 2 }
  ]);

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData() {
    this.reportService.getPendingReport(this.pendingDues).subscribe({
      next: (res: any) => {
        let list = res;
        if (res && res.apiData) {
            list = typeof res.apiData === 'string' ? JSON.parse(res.apiData) : res.apiData;
        } else if (typeof res === 'string') {
            try { list = JSON.parse(res); } catch(e) {}
        }
        
        if (!Array.isArray(list)) list = [];
        
        // Flatten nested object dates so standard table components can parse/display them properly
        const formattedList = list.map((item: any) => {
            let acctDateStr = item.Account_Date;
            let matDateStr = item.Mature_Date;
            let _AccountDateNum = 0;
            
            if (item.Account_Date?.date) {
                const d = new Date(item.Account_Date.date);
                acctDateStr = this.globals.formatDate(d, 'dd-MM-yyyy');
                _AccountDateNum = d.getTime();
            }
            if (item.Mature_Date?.date) {
               const md = new Date(item.Mature_Date.date);
               matDateStr = this.globals.formatDate(md, 'dd-MM-yyyy');
            }

            return {
                ...item,
                Account_Date: acctDateStr,
                Mature_Date: matDateStr,
                _AccountDateNum: _AccountDateNum
            }
        });

        this.reportService.reportList = formattedList;
        this.DataSource.set(formattedList);
      },
      error: (err: any) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load Pending Report');
      },
    });
  }

  handleAction(event: any) {
    if (event.Action === 'LoadPendingDues') {
      this.pendingDues = event.PendingDues || 0;
      this.loadReportData();
    }
  }

}
