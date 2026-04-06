import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalService } from '../../../../services/global.service';
import { AppsetupService, TypeSavingsSetup } from './appsetup.service';

@Component({
  selector: 'app-appsetup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appsetup.component.html',
  styleUrl: './appsetup.component.scss',
})
export class AppsetupComponent implements OnInit {
  Setup!: TypeSavingsSetup;
  isSaving: boolean = false;
  submitCount = 0;
  errors: any = {};

  constructor(
    public globals: GlobalService,
    private appsetupService: AppsetupService,
  ) { }

  ngOnInit(): void {
    this.Setup = this.appsetupService.initializeSetup();
    this.loadSetup();
  }

  loadSetup() {
    this.appsetupService.getRdSetup().subscribe({
      next: (res: TypeSavingsSetup[]) => {
        if (res && res.length > 0) {
          this.Setup = res[0];
        }
      },
      error: (err) => {
        this.Setup = this.appsetupService.initializeSetup();
        this.globals.SnackBar('error', 'Failed to load App Setup data');
      },
    });
  }

  validateFields(): boolean {
    this.errors = {};
    let isValid = true;

    const setError = (field: string, msg: string) => {
      this.errors[field] = msg;
      isValid = false;
    };

    if (this.Setup.AccCode_Prefix == '') {
      setError('AccCode_Prefix', 'AccCode_Prefix is Required');
      console.log("AccCode_Prefix is Required");
    }
    if (!this.Setup.AccCode_CurrentNo) {
      setError('AccCode_CurrentNo', 'AccCode_CurrentNo is Required');
      console.log("AccCode_CurrentNo is Required");
    }
    if (!this.Setup.AccCode_Width) {
      setError('AccCode_Width', 'Width is Required');
      console.log("AccCode_Width is Required");
    }
    return isValid;
  }

  updateSetup() {
    this.submitCount++;
    if (!this.validateFields()) {
      this.globals.SnackBar('error', 'Please fill required fields');
      return;
    }
    this.isSaving = true;
    console.log(this.Setup);
    this.appsetupService.updateRdSetup(this.Setup).subscribe({

      next: (res: any) => {
        this.isSaving = false;
        this.globals.SnackBar('success', 'App Setup updated successfully');
      },
      error: (err) => {
        this.isSaving = false;
        this.globals.SnackBar('error', 'Network Error while updating');
        console.error(err);
      },
    });
  }
}




// if (res.Status === 'Success' || res.queryStatus === 1) {
//   //this.globals.SnackBar('success', 'App Setup updated successfully');

// } else {
//   this.globals.SnackBar(
//     'error',
//     res.userMessage || res.Message || 'Update failed',
//   );
// }
