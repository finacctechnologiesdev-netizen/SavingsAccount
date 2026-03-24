import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalPrintComponent } from './global-print.component';

describe('GlobalPrintComponent', () => {
  let component: GlobalPrintComponent;
  let fixture: ComponentFixture<GlobalPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalPrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
