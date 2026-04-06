import { Component, effect, EventEmitter, Input, input, Output, signal } from '@angular/core';
import { _isNumberValue } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { GlobalService } from '../../services/global.service';
import { TypeFieldInfo } from '../../Types/TypeFieldInfo';

import { SearchPipe } from './search.pipe';
import { IntToDatePipe } from '../../pipes/int-to-date.pipe'; // Imported Pipe
import { ExcelExportService } from '../../services/excel-export.service';
import { PdfExportService } from '../../services/pdf-export.service';


interface PagedData {
  PageNumber: number;
  PageData: any[];
}

interface TypeSelectedItems {
  Item: any;
  Selected: boolean;
}

interface TypeTotal {
  name: string;
  value: any;
}
@Component({
  selector: 'app-tableview',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatOptionModule, SearchPipe, IntToDatePipe], // Added Pipe
  templateUrl: './tableview.component.html',
  styleUrl: './tableview.component.scss'
})

export class TableviewComponent {
  DataSource = input.required<any[]>();

  // Dropdown state
  showDownloadMenu: boolean = false;

  FieldNames = input.required<TypeFieldInfo[]>();
  PrimaryKey = input<string>('Sno');

  ArrayColsSort: any[] = [];
  @Input() EnableDateSelection: boolean = false;
  @Input() EnablePendingDues: boolean = false;
  @Input() PendingDues: number = 0;
  @Input() FromDate: string = "";
  @Input() ToDate: string = "";
  @Input() RowsPerPage: number = 5;
  @Input() EnableCheckbox: boolean = false;
  @Input() ObjSelectedItems: any[] = [];
  @Input() EnablePrint: boolean = false;
  @Input() EnableMail: boolean = false;
  @Input() OutputFileName: string = "";
  @Input() EnableDelete: boolean = true;

  TotalFields = input<string[]>();
  Totals: number[] = [];
  TotalsArray: TypeTotal[] = [];

  initialFromDate: string = "";
  initialToDate: string = "";

  RemoveSignal = input(0);

  DataList: any[] = [];
  FilteredDataList: any[] = [];
  PagedDataList: PagedData[] = [];
  SelectedItems: TypeSelectedItems[] = [];
  // For pagination and Selection

  TotalPages: number = 0;
  CurrentPage: number = 0;

  @Output() actionEvent = new EventEmitter<any>();

  constructor(public globals: GlobalService,
    private excelService: ExcelExportService,
    private pdfService: PdfExportService
  ) {
    effect(() => {
      this.DataList = this.DataSource();
      this.ApplyAllFilters();
    })
  }

  ApplyAllFilters() {
    this.FilteredDataList = this.DataList.filter(item => {
      // Date Filter
      if (this.EnableDateSelection && this.FromDate && this.ToDate) {
        const dateField = this.FieldNames().find(f => f.Data_Type === 'date');
        if (dateField) {
          const rowVal = item[dateField.Field_Name];
          if (!rowVal) return false;

          let rowDateNum: number;
          if (typeof rowVal === 'number') {
            rowDateNum = rowVal;
          } else {
            // Assume string like YYYY-MM-DD or Date object
            const d = new Date(rowVal);
            if (isNaN(d.getTime())) return true; // Can't parse, include it
            rowDateNum = this.globals.DateToInt(d);
          }

          const fromInt = this.globals.DateToInt(new Date(this.FromDate));
          const toInt = this.globals.DateToInt(new Date(this.ToDate));
          if (rowDateNum < fromInt || rowDateNum > toInt) return false;
        }
      }

      // Search Filter
      if (this.searchText) {
        return JSON.stringify(item).toLowerCase().includes(this.searchText.toLowerCase());
      }

      return true;
    });

    this.DoPagination();

    this.SelectedItems = [];
    this.FilteredDataList.forEach(item => {
      this.SelectedItems.push({ Item: item, Selected: false });
    });

    this.SelectedItems.map(item => {
      this.ObjSelectedItems.find(selItem => {
        const pk = this.PrimaryKey();
        if (selItem[pk] == item.Item[pk]) {
          item.Selected = true;
        }
      })
    })

    if (this.RemoveSignal() !== 0) {
      this.FilteredDataList.splice(this.RemoveSignal(), 1);
    }
  }


  searchText: string = "";

  HandleFilter(event: any) {
    this.searchText = event.target.value;
    this.ApplyAllFilters();
  }

  ngOnInit() {
    const today = new Date();
    if (!this.FromDate) {
      // Set to first day of current month
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.FromDate = this.formatDateToISO(firstDay);
    }
    if (!this.ToDate) {
      this.ToDate = this.formatDateToISO(today);
    }
    
    // Store initial values for reset
    this.initialFromDate = this.FromDate;
    this.initialToDate = this.ToDate;
  }

  // Helper to get yyyy-MM-dd
  private formatDateToISO(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  EditRecord(row: any) {
    this.actionEvent.emit({ "Action": 1, "Data": row });
  }

  DeleteRecord(row: any, i: number) {
    this.actionEvent.emit({ "Action": 2, "Data": row, "Index": i });
  }

  PrintRecord(row: any, i: number) {
    this.actionEvent.emit({ "Action": 3, "Data": row, });
  }

  MailRecord(row: any, i: number) {
    this.actionEvent.emit({ "Action": "Email", "Data": row, });
  }

  ResetFilter() {
    this.FromDate = this.initialFromDate;
    this.ToDate = this.initialToDate;
    this.searchText = "";
    this.ApplyAllFilters();
  }

  LoadPendingDues() {
    this.actionEvent.emit({ "Action": "LoadPendingDues", "PendingDues": this.PendingDues });
  }

  FilterRecords() {
    this.actionEvent.emit({ "Action": "FilterDates", "FromDate": this.FromDate, "ToDate": this.ToDate });
    this.ApplyAllFilters();
  }

  SelectRecord(row: any) {
    if (this.EnableCheckbox) { return };
    this.actionEvent.emit({ "Action": "Select", "Data": row, });
  }

  MultiSelectRecord(pkValue: any, $event: any) {
    const checkbox = $event.target as HTMLInputElement;
    const pk = this.PrimaryKey();
    this.SelectedItems.find(item => {
      return item.Item[pk] == pkValue;
    })!.Selected = checkbox.checked;
  }

  GetFindStatus(pkValue: any): boolean {
    const pk = this.PrimaryKey();
    return (this.SelectedItems.find(item => {
      return item.Item[pk] == pkValue;
    })?.Selected)!;
  }

  AddMultiItems() {
    let PushSelectedItems: any[] = [];
    this.SelectedItems.forEach(item => {
      if (item.Selected) {
        PushSelectedItems.push(item);
      }
    })
    this.actionEvent.emit({ "Action": "MultiSelect", "Data": PushSelectedItems, });
  }

  testfilter(event: any) {
    this.searchText = event.target.value.toLowerCase();
    this.ApplyAllFilters();
  }

  DoPagination() {
    this.TotalPages = Math.ceil(this.FilteredDataList.length / this.RowsPerPage);
    this.PagedDataList = [];
    let newPage: any[] = [];
    let i = 0;
    let pageNumber = 1;

    this.FilteredDataList.forEach(row => {
      if (i == this.RowsPerPage) {
        this.PagedDataList.push({ PageNumber: pageNumber, PageData: newPage });
        pageNumber++;
        newPage = [];
        i = 0;
      }
      newPage.push(row);
      i++;
    })

    if (newPage.length > 0) {
      this.PagedDataList.push({ PageNumber: pageNumber, PageData: newPage });
    }

    this.SetTotals();
  }

  SetTotals() {

    if (!this.PagedDataList || this.PagedDataList.length < 1 || !this.TotalFields() || this.TotalFields()!.length < 1) {
      return;
    }

    let a = 0;
    this.TotalFields()!.forEach(fld => {
      this.Totals[a] = 0;
      for (let i = 0; i < this.PagedDataList[this.CurrentPage].PageData.length; i++) {
        let row = this.PagedDataList[this.CurrentPage].PageData[i];
        let colVal: any = Object.entries(row).find(([key, val]) => key === fld)?.[1];
        this.Totals[a] += +colVal;
      }
      a++;
    })

    //Iterating through Fieldnames and checking Total field is included in that and forming a new totals array with the totals
    a = 0;
    this.TotalsArray = [];
    this.FieldNames().forEach(element => {
      if (this.TotalFields()!.includes(element.Field_Name)) {
        this.TotalsArray.push({ name: element.Field_Name, value: this.Totals[a].toFixed(2) })
        a++;
      }
      else {
        this.TotalsArray.push({ name: element.Field_Name, value: "{#Total#}" })
      }
    });

    //Forming a Row with the totals array as string and converting that into Json object and pushing it to DataList array
    let strarr = "{";
    this.TotalsArray.forEach(tot => {
      strarr += '"' + tot.name + '":"' + tot.value + '", ';
    })
    strarr = strarr.substring(0, strarr.length - 2);
    strarr += "}";

    this.PagedDataList[this.CurrentPage].PageData.push(JSON.parse(strarr));
  }

  SetCurrentPage(type: number) {
    switch (type) {
      case 1:
        if (this.CurrentPage == 0) return;
        this.CurrentPage = 0;
        this.DoPagination();
        break;
      case 2:
        if (this.CurrentPage !== 0) {
          this.CurrentPage--;
          this.DoPagination();
        }
        break;
      case 3:
        if (this.CurrentPage !== this.TotalPages - 1) {
          this.CurrentPage++;
          this.DoPagination();
        }
        break;
      case 4:
        if (this.CurrentPage = this.TotalPages - 1) return;
        this.CurrentPage = this.TotalPages - 1;
        this.DoPagination();
        break;
    }
  }

  DateToInt($event: any): number {
    return this.globals.DateToInt(new Date($event.target.value));
  }

  isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  DoSorting(column: keyof any, index: number) {
    if (!this.ArrayColsSort || !this.ArrayColsSort[index]) {
      this.ArrayColsSort[index] = true;
    }
    else {
      if (this.ArrayColsSort[index] == true) {
        this.ArrayColsSort[index] = false;
      }
      else {
        this.ArrayColsSort[index] = true;
      }
    }

    let ascending: boolean = this.ArrayColsSort[index];

    let sortableData = this.PagedDataList[0].PageData;
    let totalRow = sortableData[sortableData.length - 1];
    sortableData.splice(sortableData.length - 1, 1);

    const sortedData = [...sortableData].sort((a, b) => {
      if (typeof a[column] === 'string') {
        return ascending
          ? a[column].localeCompare(b[column] as string)
          : b[column].localeCompare(a[column] as string);
      }
      return ascending ? a[column] - b[column] : b[column] - a[column];
    });
    // renderTable(sortedData);
    sortedData.push(totalRow);
    this.PagedDataList[0].PageData = sortedData;
  }

  SortTable(ColName: string, index: number) {
    this.DoSorting(ColName, index);
  }


  ExportToExcel() {
    let SelectedColumns: string[] = [];
    this.FieldNames().forEach(fld => {
      SelectedColumns.push(fld.Field_Name);
    })

    let TotalColumns = [""];
    // Remove # and Actions from export
    if (SelectedColumns.indexOf("#") >= 0) SelectedColumns.splice(SelectedColumns.indexOf("#"), 1);
    if (SelectedColumns.indexOf("Actions") >= 0) SelectedColumns.splice(SelectedColumns.indexOf("Actions"), 1);

    const ExportList = this.FilteredDataList.map((item: any) => {
      let exportItem: any = {};
      const colClone = { ...item }; // Clone row

      // Format data before export
      SelectedColumns.forEach(fldName => {
        const fieldInfo = this.FieldNames().find(item => item['Field_Name'] === fldName);
        if (fieldInfo) {
          if (fieldInfo.Data_Type === "date") {
            if (colClone[fldName] !== 0) {
              const dateObj = this.globals.IntToDate(colClone[fldName]);
              colClone[fldName] = this.globals.formatDate(dateObj); // fixed
            } else {
              colClone[fldName] = "";
            }
          } else if (fieldInfo.Data_Type === "number") {
            if (colClone[fldName] == 0) {
              colClone[fldName] = "";
            }
          } else if (fieldInfo.Data_Type === "boolean") {
            colClone[fldName] = colClone[fldName] ? "Active" : "Inactive";
          }
        }
        exportItem[fldName] = colClone[fldName];
      });

      return exportItem;
    });

    this.excelService.exportAsExcelFile(ExportList, this.OutputFileName || "Export", SelectedColumns, TotalColumns);
    this.globals.SnackBar("info", "Report downloaded successfully")
  }


  DownloadasPDF() {
    let ColumnData: any = [];
    // Deep copy to avoid mutating data
    const dataList = JSON.parse(JSON.stringify(this.FilteredDataList));

    // Format data for PDF
    dataList.map((col: any) => {
      const colvalue = Object.keys(col);

      colvalue.forEach(fldName => {
        const fieldInfo = this.FieldNames().find(item => item['Field_Name'] === fldName);
        if (fieldInfo) {
          if (fieldInfo.Data_Type === "date") {
            if (col[fldName] !== 0) {
              // Fixed IntToDateString -> IntToDate + formatDate
              const dateObj = this.globals.IntToDate(col[fldName]);
              col[fldName] = this.globals.formatDate(dateObj);
            } else {
              col[fldName] = "";
            }
          } else if (fieldInfo.Data_Type === "number") {
            if (col[fldName] == 0) {
              col[fldName] = "";
            }
          }
        }
      })
    })

    this.FieldNames().forEach(col => {
      if (col.Field_Name !== '#' && col.Field_Name !== 'Actions') {
        ColumnData.push({ "header": col.Display_Name ? col.Display_Name : col.Field_Name.replace(/_/g, ' '), "dataKey": col.Field_Name })
      }
    });

    this.pdfService.exportJsonToPdf({
      data: dataList,
      columns: ColumnData,
      title: this.OutputFileName || "Report",
      fileName: (this.OutputFileName || "Report") + '.pdf',
      totalColumns: this.TotalFields()
    });
    this.globals.SnackBar("info", "Report downloaded successfully")
  }

}


