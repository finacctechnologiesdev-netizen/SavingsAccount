import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor() { }

  /**
   * Renders htmlContent in a hidden iframe and triggers the browser print dialog.
   *
   * @param htmlContent  Full HTML document string to print.
   * @param onAfterPrint Optional callback fired AFTER the print dialog is fully
   *                     dismissed (user clicked Print, Save as PDF, or Cancel).
   *
   * WHY matchMedia instead of iframe.onafterprint:
   *   Chrome fires `onafterprint` on zero-size hidden iframes IMMEDIATELY when
   *   the dialog opens — before the user interacts with it at all.
   *   `window.matchMedia('print')` on the PARENT window is immune to this bug:
   *   it transitions to `matches=false` only after the dialog is fully closed.
   */
  printContent(htmlContent: string, onAfterPrint?: () => void) {
    const printFrame = document.createElement('iframe');
    printFrame.name = 'print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';

    document.body.appendChild(printFrame);

    // ── Track print dialog lifecycle via parent-window matchMedia ────────────
    // This runs on the Angular app's window, not the iframe, so it is NOT
    // affected by Chrome's premature onafterprint behaviour for hidden iframes.
    if (onAfterPrint) {
      const mq = window.matchMedia('print');
      let enteredPrintMode = false;

      const mqHandler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          // Print dialog just opened — record entry (do NOT save state yet)
          enteredPrintMode = true;
        } else if (enteredPrintMode) {
          // Print dialog just closed (Print clicked, Save as PDF, or Cancel)
          enteredPrintMode = false;
          mq.removeEventListener('change', mqHandler);
          onAfterPrint();
        }
      };

      mq.addEventListener('change', mqHandler);
    }

    printFrame.onload = () => {
      const w = printFrame.contentWindow;
      if (!w) return;

      // Use iframe's own onafterprint only for cleanup — NOT for the callback.
      w.onafterprint = () => {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 300);
      };

      w.focus();
      w.print();
    };

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  }
}
