import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor() { }

  printContent(htmlContent: string) {
    const printFrame = document.createElement('iframe');
    printFrame.name = "print-frame";
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    
    document.body.appendChild(printFrame);
    
    // Attach an onload listener to the iframe to strictly wait for all heavy images to render
    printFrame.onload = () => {
      const w = printFrame.contentWindow;
      if (w) {
        w.focus();
        w.print();
      }
      
      // Clean up the iframe after a short delay so the print dialog isn't abruptly killed
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 3000); // Increased safe delay to 3 seconds before tearing down the invisible print DOM
    };

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      // Writing the HTML stream natively triggers the iframe's onload event once all external resources finish downloading
      doc.write(htmlContent);
      doc.close();
    }
  }
}
