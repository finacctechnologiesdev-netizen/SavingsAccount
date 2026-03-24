import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { AccountsService, TypeAccount } from '../transactions/accounts/accounts.service';
import { ReceiptsService, TypeReceipt } from '../transactions/receipts/receipts.service';
import { ClosuresService, TypeClosure } from '../transactions/closures/closures.service';
import { CustomersService, TypeCustomer } from '../masters/customers/customers.service';
import { GlobalService } from '../../../services/global.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsDirective, DecimalPipe],
  providers: [
    provideEchartsCore({ echarts: () => import('echarts') })
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent implements OnInit {

  public activeChartType: 'line' | 'bar' = 'bar';
  public mainChartOption: EChartsOption = {};

  public metrics = {
    totalCustomers: 0,
    activeAccounts: 0,
    totalCollections: 0,
    totalMaturity: 0,
    liquidity: 0
  };

  public recentTransactions: any[] = [];
  public nextMaturity: any = null;

  public activeDateFilter: string = 'all';
  private rawData: any = null;

  constructor(
    public accountsService: AccountsService,
    public receiptsService: ReceiptsService,
    public closuresService: ClosuresService,
    public customersService: CustomersService,
    public globals: GlobalService,
    private router: Router
  ) { }

  ngOnInit() {
    this.updateMainChart(); // init empty chart
    this.loadData();
  }

  loadData() {
    const accounts$ = this.accountsService.accountsList.length ? of(this.accountsService.accountsList) : this.accountsService.getAccounts();
    const receipts$ = this.receiptsService.receiptsList.length ? of(this.receiptsService.receiptsList) : this.receiptsService.getReceipts();
    const closures$ = this.closuresService.closuresList.length ? of(this.closuresService.closuresList) : this.closuresService.getClosures();
    const customers$ = this.customersService.customersList.length ? of(this.customersService.customersList) : this.customersService.getCustomers();

    forkJoin({
      accounts: accounts$,
      receipts: receipts$,
      closures: closures$,
      customers: customers$
    }).subscribe({
      next: (res) => {
        this.accountsService.accountsList = res.accounts || [];
        this.receiptsService.receiptsList = res.receipts || [];
        this.closuresService.closuresList = res.closures || [];
        this.customersService.customersList = res.customers || [];

        this.rawData = res;
        this.applyDateFilter();
      },
      error: (err) => {
        console.error("Error loading dashboard data", err);
      }
    });
  }

  public setDateFilter(filter: string) {
    this.activeDateFilter = filter;
    this.applyDateFilter();
  }

  private applyDateFilter() {
    if (!this.rawData) return;

    if (this.activeDateFilter === 'all') {
      this.calculateMetrics(this.rawData);
      this.prepareChart(this.rawData);
      this.prepareRecentTransactions(this.rawData);
      this.prepareAlerts(this.rawData);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filterStart = new Date(today);

    if (this.activeDateFilter === 'last7days') {
      filterStart.setDate(today.getDate() - 7);
    }

    const isDateInRange = (dateInput: any) => {
      if (!dateInput) return false;
      const dStr = typeof dateInput === 'object' ? dateInput.date : dateInput;
      const d = new Date(dStr);
      d.setHours(0, 0, 0, 0);

      if (this.activeDateFilter === 'today') {
        return d.getTime() === today.getTime();
      } else if (this.activeDateFilter === 'last7days') {
        return d.getTime() >= filterStart.getTime() && d.getTime() <= today.getTime();
      }
      return true;
    };

    const filteredData = {
      accounts: (this.rawData.accounts || []).filter((a: any) => isDateInRange(a.Account_Date)),
      receipts: (this.rawData.receipts || []).filter((r: any) => isDateInRange(r.Receipt_Date)),
      closures: (this.rawData.closures || []).filter((c: any) => isDateInRange(c.Closure_Date)),
      customers: this.rawData.customers // Keep base customers to map names correctly, metrics handle the rest filtering
    };

    this.calculateMetrics(filteredData);
    this.prepareChart(filteredData);
    this.prepareRecentTransactions(filteredData);
    this.prepareAlerts(filteredData);
  }

  calculateMetrics(filteredData: any) {
    // For overall stats, always use rawData to ignore date filters
    const allAccounts = this.rawData?.accounts || filteredData.accounts || [];
    const allCustomers = this.rawData?.customers || filteredData.customers || [];

    // Extract unique PartySno from all available accounts
    const uniqueCustomerIdsWithAccounts = new Set(allAccounts.map((a: any) => a.PartySno));

    // Only count active customers who actually have an account (Overall)
    this.metrics.totalCustomers = allCustomers.filter(
      (c: any) => c.Active_Status === 1 && uniqueCustomerIdsWithAccounts.has(c.PartySno)
    ).length;

    // Active accounts is overall without filter
    this.metrics.activeAccounts = allAccounts.filter((a: any) => a.IsActive === 1).length;
    
    // Financials apply the requested date filter
    this.metrics.totalCollections = (filteredData.receipts || []).reduce((sum: number, r: any) => sum + (Number(r.Amount) || 0), 0);
    this.metrics.totalMaturity = (filteredData.closures || []).reduce((sum: number, c: any) => {
         return sum + (Number(c.Total_Amount) || 0);
    }, 0);
    
    this.metrics.liquidity = this.metrics.totalCollections - this.metrics.totalMaturity;
  }

  public switchChartType(type: 'line' | 'bar') {
    this.activeChartType = type;
    this.updateMainChart();
  }

  private chartData = { collections: [] as number[], payouts: [] as number[] };

  prepareChart(data: any) {
    const collections = new Array(12).fill(0);
    const payouts = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    const processDate = (item: any, dateField: string, arr: number[], amountField: string) => {
      const dStr = typeof item[dateField] === 'object' ? item[dateField].date : item[dateField];
      if (dStr) {
        const d = new Date(dStr);
        if (d.getFullYear() === currentYear && !isNaN(d.getMonth())) {
          arr[d.getMonth()] += Number(item[amountField]) || 0;
        }
      }
    };

    (data.receipts || []).forEach((r: any) => processDate(r, 'Receipt_Date', collections, 'Amount'));
    (data.closures || []).forEach((c: any) => processDate(c, 'Closure_Date', payouts, 'Total_Amount'));

    this.chartData.collections = collections;
    this.chartData.payouts = payouts;
    this.updateMainChart();
  }

  private updateMainChart() {
    this.mainChartOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1f2937',
        textStyle: { color: '#f3f4f6' },
        borderWidth: 0
      },
      legend: {
        data: ['Collections', 'Maturity Payouts'],
        top: 0,
        right: 0,
        textStyle: { color: '#6b7280', fontSize: 12 }
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '5%',
        top: '15%',
        containLabel: true,
        borderColor: '#e5e7eb',
        show: false
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: (value: number) => `₹${value}`
        }
      },
      series: [
        {
          name: 'Collections',
          type: this.activeChartType,
          smooth: true,
          data: this.chartData.collections,
          itemStyle: { color: '#f59e0b' },
          barMaxWidth: 20,
          lineStyle: { width: 3 },
          showSymbol: false
        },
        {
          name: 'Maturity Payouts',
          type: this.activeChartType,
          smooth: true,
          data: this.chartData.payouts ,
          itemStyle: { color: '#6366f1' },
          barMaxWidth: 20,
          lineStyle: { width: 3 },
          showSymbol: false
        }
      ]
    };
  }

  prepareRecentTransactions(data: any) {
    const getDate = (d: any) => new Date(typeof d === 'object' ? d.date : d).getTime() || 0;
    
    const receipts = [...(data.receipts || [])]
      .sort((a, b) => getDate(b.Receipt_Date) - getDate(a.Receipt_Date))
      .slice(0, 5);

    this.recentTransactions = receipts.map((r: any) => {
      const account = (data.accounts || []).find((a: any) => a.RdAccountSno === r.RdAccountSno);
      const customer = account ? (data.customers || []).find((c: any) => c.PartySno === account.PartySno) : null;
      
      return {
        date: this.globals.formatDateForInput(r.Receipt_Date),
        type: 'RECEIPT',
        ref: r.Receipt_No,
        customer: customer?.Party_Name || 'Unknown',
        amount: r.Amount,
        dueCount: r.DueCount
      };
    });
  }

  prepareAlerts(data: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = (data.accounts || [])
      .filter((a: any) => a.IsActive === 1 && a.Mature_Date)
      .map((a: any) => {
        const dStr = typeof a.Mature_Date === 'object' ? a.Mature_Date.date : a.Mature_Date;
        const mDate = new Date(dStr);
        mDate.setHours(0, 0, 0, 0);
        return {
          ...a,
          daysToMaturity: Math.ceil((mDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        };
      })
      .filter((a: any) => a.daysToMaturity >= 0)
      .sort((a: any, b: any) => a.daysToMaturity - b.daysToMaturity);

    if (upcoming.length > 0) {
      const acc = upcoming[0];
      const customer = (data.customers || []).find((c: any) => c.PartySno === acc.PartySno);

      this.nextMaturity = {
        ref: acc.Account_No,
        customer: customer?.Party_Name || 'Unknown',
        days: acc.daysToMaturity,
        amount: acc.Mature_Amount
      };
    }
  }

  navigate(path: string) {
     this.router.navigate([path]);
  }
}
