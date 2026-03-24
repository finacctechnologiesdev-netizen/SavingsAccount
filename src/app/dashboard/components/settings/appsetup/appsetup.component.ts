import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalService } from '../../../../services/global.service';
import { AppsetupService, TypeAppSetup } from './appsetup.service';

@Component({
  selector: 'app-appsetup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appsetup.component.html',
  styleUrl: './appsetup.component.scss',
})
export class AppsetupComponent implements OnInit {
  Setup!: TypeAppSetup;
  isSaving: boolean = false;
  submitCount = 0;
  errors: any = {};

  constructor(
    public globals: GlobalService,
    private appsetupService: AppsetupService,
  ) {}

  ngOnInit(): void {
    this.loadSetup();
  }

  loadSetup() {
    this.appsetupService.getRdSetup().subscribe({
      next: (res: any) => {
        let data = res;

        // Handle { queryStatus, apiData } wrapper
        if (res && res.apiData) {
          data =
            typeof res.apiData === 'string'
              ? JSON.parse(res.apiData)
              : res.apiData;
        } else if (typeof res === 'string') {
          try {
            data = JSON.parse(res);
          } catch (e) {}
        }

        // If result is an array, take first record
        if (Array.isArray(data)) {
          data = data[0];
        }

        if (data && typeof data === 'object') {
          this.Setup = {
            CompSno: data.CompSno ?? Number(sessionStorage.getItem('CompSno')),
            UserSno: data.UserSno ?? 1,
            SchemeCode_AutoGen: data.SchemeCode_AutoGen ?? 0,
            SchemeCode_Prefix: data.SchemeCode_Prefix ?? '',
            SchemeCode_CurrentNo: data.SchemeCode_CurrentNo ?? 0,
            SchemeCode_Width: data.SchemeCode_Width ?? 0,
          };
        } else {
          this.Setup = this.appsetupService.initializeSetup();
        }

        console.log('App Setup loaded:', this.Setup);
      },
      error: (err) => {
        this.Setup = this.appsetupService.initializeSetup();
        console.error('Error loading app setup:', err);
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

    if (
      !this.Setup.SchemeCode_Prefix ||
      this.Setup.SchemeCode_Prefix.trim() === ''
    ) {
      setError('SchemeCode_Prefix', 'Scheme Prefix is Required');
    }
    if (
      this.Setup.SchemeCode_CurrentNo === null ||
      this.Setup.SchemeCode_CurrentNo === undefined
    ) {
      setError('SchemeCode_CurrentNo', 'Current No is Required');
    }
    if (
      this.Setup.SchemeCode_Width === null ||
      this.Setup.SchemeCode_Width === undefined
    ) {
      setError('SchemeCode_Width', 'Width is Required');
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
    this.appsetupService.updateRdSetup(this.Setup).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.globals.SnackBar('success', 'App Setup updated successfully');
        if (res.Status === 'Success' || res.queryStatus === 1) {
          //this.globals.SnackBar('success', 'App Setup updated successfully');

        } else {
          this.globals.SnackBar(
            'error',
            res.userMessage || res.Message || 'Update failed',
          );
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.globals.SnackBar('error', 'Network Error while updating');
        console.error(err);
      },
    });
  }
}
