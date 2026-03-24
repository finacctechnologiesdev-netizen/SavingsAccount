
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
    providedIn: 'root'
})
export class PdfExportService {

    constructor() { }

    public exportJsonToPdf(exportData: { data: any[], columns: any[], title: string, fileName: string, totalColumns?: string[] }): void {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(exportData.title, 14, 22);

        autoTable(doc, {
            head: [exportData.columns.map(col => col.header)],
            body: exportData.data.map(row => exportData.columns.map(col => row[col.dataKey])),
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [22, 160, 133] }, // Example color
        });

        doc.save(exportData.fileName);
    }
}
