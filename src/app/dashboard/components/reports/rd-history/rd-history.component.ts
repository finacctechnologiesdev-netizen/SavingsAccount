import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypeFieldInfo } from '../../../../Types/TypeFieldInfo';
import { GlobalService } from '../../../../services/global.service';
import { TableviewComponent } from '../../../../widgets/tableview/tableview.component';
import { RdHistoryService, TypeRdHistory } from './rd-history.service';

@Component({
  selector: 'app-rd-history',
  standalone: true,
  imports: [CommonModule, TableviewComponent],
  templateUrl: './rd-history.component.html',
  styleUrl: './rd-history.component.scss'
})
export class RdHistoryComponent implements OnInit {

  constructor(
    public historyService: RdHistoryService,
    public globals: GlobalService
  ) {}

  // Date filters
  fromDate: string = "";
  toDate: string = "";

  // Data persistence and filtering
  fullHistoryList: any[] = [];
  activeFilter: number | null = null;
  
  summaryData = {
    open: { count: 0, amount: 0 },
    closed: { count: 0, amount: 0 },
    matured: { count: 0, amount: 0 },
    auctioned: { count: 0, amount: 0 }
  };

  DataSource = signal<TypeRdHistory[]>([]);
  FieldNames = signal<TypeFieldInfo[]>([
    { Field_Name: 'Account_No', Data_Type: 'string' },
    { Field_Name: 'Party_Name', Data_Type: 'string' },
    { Field_Name: 'Mobile', Data_Type: 'string' },
    { Field_Name: 'RdScheme_Name', Data_Type: 'string' },
    { Field_Name: 'Account_Date', Data_Type: 'string' },
    { Field_Name: 'Mature_Date', Data_Type: 'string' },
    { Field_Name: 'DueAmount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Maturity_Amount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Paid_Amount', Data_Type: 'number', Decimals: 2 },
    { Field_Name: 'Balance_Amount', Data_Type: 'number', Decimals: 2 },
  ]);

  ngOnInit(): void {
    this.fromDate = this.globals.getCurrentMonthStartDate();
    this.toDate = this.globals.getCurrentMonthEndDate();
    
    this.loadHistoryData(this.fromDate, this.toDate);
  }

  loadHistoryData(from: string, to: string) {
    this.historyService.getRdHistory(from, to).subscribe({
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
            
            if (item.Account_Date?.date) {
                const d = new Date(item.Account_Date.date);
                acctDateStr = this.globals.formatDate(d, 'dd-MM-yyyy');
            }
            if (item.Mature_Date?.date) {
               const md = new Date(item.Mature_Date.date);
               matDateStr = this.globals.formatDate(md, 'dd-MM-yyyy');
            }

            return {
                ...item,
                Account_Date: acctDateStr,
                Mature_Date: matDateStr,
            }
        });

        this.historyService.historyList = formattedList;
        this.fullHistoryList = formattedList;
        this.calculateSummary();
        this.applyFilter();
      },
      error: (err) => {
        console.error('Network Error', err);
        this.globals.SnackBar('error', 'Failed to load RD History');
      },
    });
  }

  calculateSummary() {
    this.summaryData = {
      open: { count: 0, amount: 0 },
      closed: { count: 0, amount: 0 },
      matured: { count: 0, amount: 0 },
      auctioned: { count: 0, amount: 0 }
    };

    if (this.fullHistoryList && this.fullHistoryList.length > 0) {
      this.fullHistoryList.forEach(item => {
        const status = Number(item.Account_Status);
        const amt = Number(item.Balance_Amount) || 0; // Summarize based on the active balances
        
        if (status === 1) {
          this.summaryData.open.count++;
          this.summaryData.open.amount += amt;
        } else if (status === 2) {
          this.summaryData.closed.count++;
          this.summaryData.closed.amount += amt;
        } else if (status === 3) {
          this.summaryData.matured.count++;
          this.summaryData.matured.amount += amt;
        } else if (status === 4) {
          this.summaryData.auctioned.count++;
          this.summaryData.auctioned.amount += amt;
        }
      });
    }
  }

  toggleFilter(status: number) {
    if (this.activeFilter === status) {
      this.activeFilter = null; // Toggle off if clicked again
    } else {
      this.activeFilter = status; // Set active filter
    }
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeFilter === null) {
      this.DataSource.set(this.fullHistoryList);
    } else {
      const filtered = this.fullHistoryList.filter(item => Number(item.Account_Status) === this.activeFilter);
      this.DataSource.set(filtered);
    }
  }

  handleAction(event: any) {
    if (event.Action === 'FilterDates') {
       // Refresh list securely via endpoint utilizing parameters emitted straight from Tableview 
       this.fromDate = event.FromDate;
       this.toDate = event.ToDate;
       this.loadHistoryData(this.fromDate, this.toDate);
    }
  }

}
