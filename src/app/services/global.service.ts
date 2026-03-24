import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SnackbarComponent } from '../widgets/snackbar/snackbar.component';
import { MsgboxComponent } from '../widgets/msgbox/msgbox.component';
import { GlobalPrintComponent } from '../widgets/global-print/global-print.component';
@Injectable({
  providedIn: 'root'

})
export class GlobalService {

  AppName: string = "PawnSoft";
  AppLogoPath: string = "assets/logo.png";


  constructor(
    private router: Router,
    public datePipe: DatePipe,
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) { }

  SnackBar(type: string, message: string): void {
    // Create component dynamically
    const componentRef: ComponentRef<SnackbarComponent> = createComponent(SnackbarComponent, {
      environmentInjector: this.injector
    });

    // Set input data
    componentRef.instance.data = { type, message };

    // Attach to application
    this.appRef.attachView(componentRef.hostView);

    // Get DOM element
    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;

    // Append to body
    document.body.appendChild(domElem);

    const destroySnack = () => {
      if (!componentRef.hostView.destroyed) {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        domElem.remove();
      }
    };

    componentRef.instance.closeSnackbar = destroySnack;

    // Auto-remove after 3 seconds
    setTimeout(destroySnack, 3000);
  }

  PrintPreview(data: any): void {
    // Create component dynamically
    const componentRef: ComponentRef<GlobalPrintComponent> = createComponent(GlobalPrintComponent, {
      environmentInjector: this.injector
    });

    // Set input data
    componentRef.instance.printData = data;

    // Attach to application
    this.appRef.attachView(componentRef.hostView);

    // Get DOM element
    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;

    // Append to body
    document.body.appendChild(domElem);

    // Define destroy function
    const destroyPrint = () => {
      if (!componentRef.hostView.destroyed) {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        domElem.remove();
      }
    };

    // Link close event
    componentRef.instance.onClose = destroyPrint;
  }

  MsgBox(dialogType: number, message: string): Promise<number> {
    return new Promise((resolve) => {
      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'msgbox-backdrop';
      document.body.appendChild(backdrop);

      // Create component
      const componentRef: ComponentRef<MsgboxComponent> = createComponent(MsgboxComponent, {
        environmentInjector: this.injector
      });

      // Set input data
      componentRef.instance.data = { DialogType: dialogType, Message: message };

      // Handle close callback
      componentRef.instance.onClose = (result: number) => {
        // Remove backdrop and component
        backdrop.remove();
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();

        // Resolve promise with result
        resolve(result);
      };

      // Attach to application
      this.appRef.attachView(componentRef.hostView);

      // Get DOM element and append
      const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
      document.body.appendChild(domElem);

      // Add click handler to backdrop
      backdrop.addEventListener('click', () => {
        componentRef.instance.onClose(0); // Close with 0 (No/Cancel)
      });
    });
  }

  goBack(): void {
    this.router.navigate(['dashboard/masters/areas']);
  }
  createNew(): void {
    this.router.navigate(['dashboard/masters/area']);
  }

  formatDate(dateVal: any, format: string = 'dd-MM-yyyy'): string {
    if (!dateVal) return '';
    const rawDate = typeof dateVal === 'object' && dateVal.date ? dateVal.date : dateVal;
    try {
      return this.datePipe.transform(rawDate, format) || '';
    } catch {
      return rawDate;
    }
  }


  DateToInt(inputDate: Date): number {
    let month: string = (inputDate.getMonth() + 1).toString();
    let day: string = inputDate.getDate().toString();
    if (month.length == 1) { month = "0" + month }
    if (day.length == 1) { day = "0" + day }
    return parseInt(inputDate.getFullYear().toString() + month + day);
  }

  IntToDate(inputDate: any): Date {
    let argDate = inputDate.toString();
    let year = argDate.substring(0, 4);
    let month = argDate.substring(4, 6);
    let day = argDate.substring(6, 8);
    let newDate = year + "/" + month + "/" + day;
    return new Date(newDate);
  }

  formatDateForApi(dateStr: any): string {
    if (!dateStr) return '';
    // Handle if dateStr is already a Date object
    let d;
    if (dateStr instanceof Date) {
      d = dateStr;
    } else {
      d = new Date(dateStr);
    }
    // Ensure we use 'yyyy-MM-dd' for API compatibility
    return this.formatDate(d, 'yyyy-MM-dd');
  }

  // Efficiently converts backend INT dates (e.g. 20041111) to HTML Date Input format (e.g. "2004-11-11")
  ConvertApiDateToInput(apiDate: number | string | any): string {
    if (!apiDate) return '';
    const strDate = apiDate.toString();
    if (strDate.length !== 8) return ''; // If formatting is already mangled or it's empty, abort string slice
    return `${strDate.substring(0, 4)}-${strDate.substring(4, 6)}-${strDate.substring(6, 8)}`;
  }

  // Efficiently converts HTML Date Input format ("2004-11-11") safely into INT (20041111) for the backend
  ConvertInputDateToApi(inputDate: string | Date | any): number {
    if (!inputDate) return 0;

    // If it's already a JS string coming from an native Angular type="date" input (e.g., "2004-11-11")
    if (typeof inputDate === 'string' && inputDate.includes('-')) {
      return parseInt(inputDate.replace(/-/g, ''), 10) || 0;
    }

    // Fallback logic incase a raw JS Date object sneaks in
    const d = new Date(inputDate);
    if (!isNaN(d.getTime())) {
      return this.DateToInt(d);
    }

    return 0; // Return safe numeric fallback for SQL nvarchar errors
  }

  formatDateToDDMMYYYY(dateInput: any): string {
    if (!dateInput) return '';

    // Handle raw string or number directly if it's formatted as YYYYMMDD (e.g., 20260307)
    const strInput = dateInput.toString().trim();
    if (strInput.length === 8 && !strInput.includes('-') && !strInput.includes('/')) {
      const year = strInput.substring(0, 4);
      const month = strInput.substring(4, 6);
      const day = strInput.substring(6, 8);
      return `${day}-${month}-${year}`;
    }

    // Try initializing a physical date
    let d: Date;
    if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      d = new Date(dateInput);
    }

    if (isNaN(d.getTime())) {
      // In worst-case scenario where date parses as invalid, return data gracefully
      return strInput;
    }

    // Map safely independent of helpers
    let month = (d.getMonth() + 1).toString();
    let day = d.getDate().toString();
    const year = d.getFullYear().toString();

    if (month.length === 1) { month = '0' + month; }
    if (day.length === 1) { day = '0' + day; }

    return `${day}-${month}-${year}`;
  }

  // Common utility to restrict input fields to numeric only
  //use case-- (input)="Customer.Pincode = globals.filterNumbers($event)"
  filterNumbers(event: any): string {
    const input = event.target as HTMLInputElement;
    return input.value.replace(/[^0-9]/g, '');
  }


  isNumberKey(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      this.SnackBar("error", "Please enter only numbers");
      event.preventDefault();
      return false;
    }
    return true;
  }


  formateDateForTable = (d: any) => {
    if (!d) return 0;
    let dateObj: Date;
    if (d.date) {
      dateObj = new Date(d.date);
    } else if (typeof d === 'string') {
      dateObj = new Date(d);
    } else {
      return 0;
    }

    return isNaN(dateObj.getTime()) ? 0 : this.DateToInt(dateObj);
  }

  getCurrentMonthStartDate(): string {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return this.formatDate(firstDay, 'yyyy-MM-dd');
  }

  getCurrentMonthEndDate(): string {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return this.formatDate(lastDay, 'yyyy-MM-dd');
  }




  formatDateForInput(dateVal: any): string {
    if (!dateVal) return '';
    if (typeof dateVal === 'object' && dateVal.date) {
      return dateVal.date.split(' ')[0];
    }
    if (typeof dateVal === 'string') {
      // If already YYYY-MM-DD
      if (dateVal.match(/^\d{4}-\d{2}-\d{2}$/)) return dateVal;
      // If timestamp string
      return dateVal.split(' ')[0];
    }
    if (typeof dateVal === 'number' && dateVal.toString().length === 8) {
      const d = this.IntToDate(dateVal);
      return this.formatDate(d, 'yyyy-MM-dd');
    }
    return '';
  }

  checklength10(event: KeyboardEvent, msg: string) {
    const input = event.target as HTMLInputElement;
    if (input.value && input.value.length >= 10) {
      this.SnackBar('error', msg);
    }
  }
  // Predicts exact calendar leaps for schemes jumping by Daily/Monthly/Yearly frequencies
  addDuePeriodToDate(dateInput: Date | string | number, frequency: number | string, period: number): Date {
    let calcDate: Date;
    
    // Auto-parse SQL integer dates (like 20260310) into accurate Date objects
    if (typeof dateInput === 'number' || (typeof dateInput === 'string' && dateInput.toString().length === 8 && !dateInput.toString().includes('-') && !dateInput.toString().includes('/'))) {
        calcDate = this.IntToDate(dateInput);
    } else {
        calcDate = new Date(dateInput);
    }

    if (isNaN(calcDate.getTime())) return new Date(); // Safety fallback

    const freq = Number(frequency);

    switch (freq) {
        case 1: // Daily
            calcDate.setDate(calcDate.getDate() + period  );
            break;
        case 2: // Weekly
            calcDate.setDate(calcDate.getDate() + (period * 7));
            break;
        case 3: // Bi-Monthly (approx 15 days)
            calcDate.setDate(calcDate.getDate() + (period * 15)); 
            break;
        case 4: // Monthly
            calcDate.setMonth(calcDate.getMonth() + period);
            break;
        case 5: // Quarterly
            calcDate.setMonth(calcDate.getMonth() + (period * 3));
            break;
        case 6: // Half-Yearly
            calcDate.setMonth(calcDate.getMonth() + (period * 6));
            break;
        case 7: // Yearly
            calcDate.setFullYear(calcDate.getFullYear() + period);
            break;
        default:
            break;
    }
    
    return calcDate;
  }
}