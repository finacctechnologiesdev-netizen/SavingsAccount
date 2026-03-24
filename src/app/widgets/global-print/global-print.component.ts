import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-global-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-print.component.html',
  styleUrl: './global-print.component.scss'
})
export class GlobalPrintComponent implements AfterViewInit {
  @Input() printData: any = {};
  @Output() close = new EventEmitter<void>();

  // Use this to destroy the dynamically created component instance
  onClose?: () => void;

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  ngAfterViewInit() {
    // Adding a slight delay to ensure UI is completely rendered
    setTimeout(() => {
      this.printDocument();
      // automatically close the dynamically rendered component when print ends
      this.closePreview();
    }, 100);
  }

  printDocument() {
    // This will open the browser print dialog
    window.print();
  }

  closePreview() {
    if (this.onClose) {
      this.onClose();
    }
    this.close.emit();
  }
}
