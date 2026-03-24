
import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoUnsubscribe } from '../auto-unsubscribe.decorator';
import { GlobalService } from '../../services/global.service';

export interface DialogData {
  DialogType: number; // 0-Progress 1-Information 2-Question 3- Error
  Message: string;
}

@Component({
  selector: 'app-msgbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './msgbox.component.html',
  styleUrls: ['./msgbox.component.scss']
})

@AutoUnsubscribe
export class MsgboxComponent implements OnInit {

  @Input() data: DialogData = { DialogType: 1, Message: '' };

  onClose: (result: number) => void = () => { };

  appName: string = "";
  logoPath: string = "";

  constructor(private globals: GlobalService) { }

  ngOnInit(): void {
    this.appName = this.globals.AppName;
    this.logoPath = this.globals.AppLogoPath;
  }

  CloseDialog(action: number) {
    this.onClose(action);
  }

  @HostListener("keydown.esc")
  public onEsc() {
    this.onClose(0);
  }
}
