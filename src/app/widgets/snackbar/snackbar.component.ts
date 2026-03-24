import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoUnsubscribe } from '../auto-unsubscribe.decorator';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss']
})

@AutoUnsubscribe
export class SnackbarComponent implements OnInit {

  @Input() data: any = { type: 'info', message: '' };
  @Input() closeSnackbar: () => void = () => {};

  constructor() { }

  ngOnInit(): void {

  }

  CloseDialog() {
    this.closeSnackbar();
  }

}
