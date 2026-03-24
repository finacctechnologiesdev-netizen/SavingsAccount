import { Component, ElementRef, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog'; 
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AutoUnsubscribe } from '../../auto-unsubscribe.decorator';
import { DataService } from '../../../services/data.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selectionlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selectionlist.component.html',
  styleUrls: ['./selectionlist.component.scss']
})

@AutoUnsubscribe 
export class SelectionlistComponent implements OnInit {

  private searchSubject = new Subject<string>();
  
focus() {
//throw new Error('Method not implemented.');
} 
constructor(private dialog: MatDialog, private dataService: DataService){
  
this.searchSubject
        .pipe(
          debounceTime(300), // Wait 300ms after user stops typing
          distinctUntilChanged() // Only emit if the value is different from the last
        )
        .subscribe((searchText) => {                   
          if (!searchText || searchText.length < 3) { return;}
          this.debounceString.emit(searchText);            
        });
      }
  showList: boolean     = false;
  SelectionList: any [] = [];
  FilteredData: any []  = [];  
  activeIndex: number   = 0; 
  
  focused: boolean = false;
  @ViewChild('InputBox') InputBox!: ElementRef;
    
  @Input() Caption!: string; // decorate the property with @Input()
  @Input() DataSource: any[] = []; // decorate the property with @Input()
  @Input() SelectedItem!: any; 
  @Input() SkipDebounce: boolean = true;
  @Output() newItemEvent = new EventEmitter<any>();
  @Output() newMasterEmit = new EventEmitter<any>();   
  //@Input() MasterComponentId!: MasterIds;

  @Output() debounceString = new EventEmitter<string>();

  ngAfterViewInit(){
    
  }
  ngOnInit(): void { 
  }

  ngOnChanges(changes: SimpleChanges) {        
    this.SelectionList = this.DataSource;
    
    // Automatically preserve active search filtering across array reference updates
    if (this.InputBox && this.InputBox.nativeElement) {
         let filterValue = (this.InputBox.nativeElement.value || '').trim().toLowerCase();
         let selectedName = (this.SelectedItem?.Name || '').toLowerCase();

         // Re-apply local filter if user has custom search text in box
         if (filterValue !== '' && filterValue !== selectedName) {
            this.FilteredData = this.SelectionList.filter((cat) => {
                const nMatch = cat.Name ? cat.Name.toLowerCase().includes(filterValue) : false;
                const dMatch = cat.Details ? String(cat.Details).toLowerCase().includes(filterValue) : false;
                return nMatch || dMatch;
            });
            return;
         }
    }
    // Default fallback if no active manual search string
    this.FilteredData = this.DataSource;         
  }


sendTypedString(event: Event): void {
  if (this.SkipDebounce) return;
  const input = event.target as HTMLInputElement;
  this.searchSubject.next(input.value);    
}

OpenMaster() {
  console.log("OpenMaster called in selectionlist");
  // Implement actual logic here when ready
}

// OpenMaster()
// {
//   switch (this.MasterComponentId) {
//     case MasterIds.MasterIdParty:
//       let pty = new ClsParties(this.dataService);                
//       const dialogRef = this.dialog.open(PartyComponent, 
//         {
//           width:"45vw", 
//           height:"100vh",
//           position:{"right":"0","top":"0" },
//           data: pty.Initialize(),          
//         });      
//         //dialogRef.disableClose = true; 
//         dialogRef.afterClosed().subscribe(result => {                  
//           if (result) 
//           {           
//             this.newMasterEmit.emit(result);            
//           }        
//         });
//       break;    
//     case MasterIds.MasterIdItem:
//         let it = new ClsItems(this.dataService);                
//         const dialogRef1 = this.dialog.open(ItemComponent, 
//           {            
//             data: it.Initialize(),
//           });      
//           //dialogRef.disableClose = true; 
//           dialogRef1.afterClosed().subscribe(result => {                    
//             if (result) 
//             {             
//                 this.newMasterEmit.emit(result);            
//             }        
//           });
//         break;      
         
//     case MasterIds.MasterIdPurity:
//     let um = new ClsPurities(this.dataService);                
//     const dialogRef3 = this.dialog.open(PurityComponent, 
//       {            
//         data: um.Initialize(),
//       });      
//       //dialogRef.disableClose = true; 
//       dialogRef3.afterClosed().subscribe(result => {                     
//         if (result) 
//         {    
//             this.newMasterEmit.emit(result);            
//         }        
//       });
//     break; 
 
//     case MasterIds.MasterIdScheme:
//     let bnk = new ClsSchemes(this.dataService);                
//     const dialogRef4 = this.dialog.open(SchemeComponent, 
//       {            
//         data: bnk.Initialize(),
//       });      
      
//       //dialogRef.disableClose = true; 
//       dialogRef4.afterClosed().subscribe(result => {                    
//         if (result) 
//         {             
//             this.newMasterEmit.emit(result);            
//         }        
//       });
//     break; 

//     case MasterIds.MasterIdLocation:
//     let loc = new ClsLocations(this.dataService);                
//     const dialogRef5 = this.dialog.open(LocationComponent, 
//       {              
//         data: loc.Initialize(),
//       });      
//       //dialogRef.disableClose = true; 
//       dialogRef5.afterClosed().subscribe(result => {                    
//         if (result) 
//         {             
//             this.newMasterEmit.emit(result);            
//         }        
//       });
//     break; 
    
//     case MasterIds.MasterIdItemGroup:
//     let grp = new ClsItemGroups(this.dataService);                
//     const dialogRef6 = this.dialog.open(ItemgroupComponent, 
//       {            
//         data: grp.Initialize(),
//       });      
//       //dialogRef.disableClose = true; 
//       dialogRef6.afterClosed().subscribe(result => {                    
//         if (result) 
//         {             
//             this.newMasterEmit.emit(result);            
//         }        
//       });
//     break; 

//     case MasterIds.MasterIdArea:
//       let ar = new ClsAreas(this.dataService);                
//       const dialogRef7 = this.dialog.open(AreaComponent, 
//         {            
//           data: ar.Initialize(),
//         });      
//         //dialogRef.disableClose = true; 
//         dialogRef7.afterClosed().subscribe(result => {                    
//           if (result) 
//           {             
//               this.newMasterEmit.emit(result);            
//           }        
//         });
//       break; 

//     case MasterIds.MasterIdVoucherSeries:
//       let ser = new ClsVoucherSeries(this.dataService);                
//       const dialogRef8 = this.dialog.open(VoucherseriesComponent, 
//         {            
//           data: ser.Initialize(),
//         });      
//         //dialogRef.disableClose = true; 
//         dialogRef8.afterClosed().subscribe(result => {                    
//           if (result) 
//           {             
//               this.newMasterEmit.emit(result);            
//           }        
//         });
//       break; 

//     case MasterIds.MasterIdAgent:
//       let Ag = new ClsAgents(this.dataService);                
//       const dialogRef9 = this.dialog.open(AgentComponent, 
//         {            
//           data: Ag.Initialize(),
//         });      
//         //dialogRef.disableClose = true; 
//         dialogRef9.afterClosed().subscribe(result => {                    
//           if (result) 
//           {             
//               this.newMasterEmit.emit(result);            
//           }        
//         });
//       break; 

//     case MasterIds.MasterIdLedger:
//       let led = new ClsLedgers(this.dataService);                
//       const dialogRef10 = this.dialog.open(LedgerComponent, 
//         {            
//           data: led.Initialize(),
//         });      
//         //dialogRef.disableClose = true; 
//         dialogRef10.afterClosed().subscribe(result => {                    
//           if (result) 
//           {             
//               this.newMasterEmit.emit(result);            
//           }        
//         });
//       break; 
//   }
    
// }
 
  DisplayList() 
  {    
    if (!this.showList) {
      this.showList = true;         
      if (this.SelectedItem && this.FilteredData) {
        const idx = this.FilteredData.findIndex((item: any) => item === this.SelectedItem || item.Name === this.SelectedItem.Name);
        if (idx !== -1) {
           this.activeIndex = idx;
        } else {
           this.activeIndex = 0;
        }
      }
    }
  }

  HideList()
  {   
    setTimeout(() => {
      this.showList = false;  
      this.activeIndex = 0;
    }, 200);    
  }

  FilterList($event: any)
  {    
    if ($event.key == "Escape") {
      this.HideList();
      return;
    }
    
    if ($event.key == "Enter")
    {
      if (this.FilteredData && this.FilteredData.length > 0) {
          this.SelectItem(this.activeIndex);
      }
      this.HideList();
      return;
    }

    if ($event.key == "ArrowDown")
    { 
      this.DisplayList();
       if (this.activeIndex !=0) {
           const elems = document.getElementsByClassName('listItems');
           if (elems && elems[this.activeIndex]) {
               elems[this.activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
           }
       }
      if (this.activeIndex < this.FilteredData.length-1) {this.activeIndex++;} 
    }
    else if ($event.key == "ArrowUp")
    {      
      this.DisplayList();      
      if (this.activeIndex !=0) {this.activeIndex--;}
      const elems = document.getElementsByClassName('listItems');
      if (elems && elems[this.activeIndex]) {
          elems[this.activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    }
    else
    {
      this.DisplayList();      
        let filterValue = ($event.target.value || '').toLowerCase();
        if (filterValue.trim() == "")
        {
          this.FilteredData = this.SelectionList;  
        }
        else
        {
          if (this.SelectionList){
            this.FilteredData = this.SelectionList.filter((cat) => {
                const nMatch = cat.Name ? cat.Name.toLowerCase().includes(filterValue) : false;
                const dMatch = cat.Details ? String(cat.Details).toLowerCase().includes(filterValue) : false;
                return nMatch || dMatch;
            });
            this.activeIndex = 0;
          }
        }
    }
  } 

  SelectItem(ind: number){    
    if (this.FilteredData && this.FilteredData[ind]) {
        this.SelectedItem = this.FilteredData[ind];    
        this.newItemEvent.emit(this.SelectedItem);
    }
  }

  ClearItem(){            
    this.SelectedItem = undefined;
    this.activeIndex = 0;    
    this.FilteredData = this.SelectionList;  
    this.newItemEvent.emit(this.SelectedItem);
    this.HideList(); 
  }
  
  clickedOutside(){
    if (!this.InputBox) return;
    let boxvalue = (this.InputBox.nativeElement.value || '').trim().toLowerCase();
    if (boxvalue == '')
    {
      this.ClearItem();
      this.showList = false;  
      this.activeIndex = 0;   
      return;
    }

    if (boxvalue !== '')
    {
      
      this.FilteredData = this.SelectionList.filter((cat) => cat.Name && cat.Name.toLowerCase() === boxvalue );      
      if ( this.FilteredData.length == 0 )
      {
        this.ClearItem();
        this.InputBox.nativeElement.value = "";
      }
    }
  }
}