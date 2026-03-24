import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
    selector: '[appInputBehavior]',
    standalone: true
})
export class InputBehaviorDirective implements OnInit, OnDestroy {
    @Input() minVal: number | null = null;
    @Input() maxVal: number | null = null;
    @Input() decimalPlaces: number | null = null;
    private sub!: Subscription;

    constructor(private el: ElementRef, private control: NgControl) { }

    ngOnInit() {
        this.sub = this.control.valueChanges?.subscribe(val => {
            if (val === '.0000' || val === '0.0000' || val === '.00' || val === '0.00') {
                this.control.control?.setValue(0, { emitEvent: false });
            } else if (this.decimalPlaces !== null && val !== null && val !== '') {
                // If field is NOT focused (so we don't interrupt active typing)
                if (document.activeElement !== this.el.nativeElement) {
                    const num = Number(val);
                    if (!isNaN(num)) {
                        const formatted = num.toFixed(this.decimalPlaces);
                        if (val.toString() !== formatted) {
                            this.control.control?.setValue(formatted, { emitEvent: false });
                        }
                    }
                }
            }
        }) || new Subscription();
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }

    @HostListener('focus')
    @HostListener('click')
    onFocus() {
        const value = this.control.value;
        // Check if value is 0 or "0" (or trailing zero decimals) and reset to null
        if (value === 0 || value === '0' || value === '.0000' || value === '0.0000' || value === '.00' || value === '0.00') {
            this.control.control?.setValue(null);
        }
    }

    @HostListener('blur')
    onBlur() {
        let value = this.control.value;

        // If input is left completely empty when focus is lost, restore it to 0
        if (value === null || value === '' || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            this.control.control?.setValue(0);
            value = 0;
        }

        // Apply min/max constraints if provided
        if (value !== null && value !== '' && value !== undefined) {
            
            // Format decimals on blur explicitly
            if (this.decimalPlaces !== null) {
                const num = Number(value);
                if (!isNaN(num)) {
                    const formatted = num.toFixed(this.decimalPlaces);
                    this.control.control?.setValue(formatted, { emitEvent: false });
                    value = formatted;
                }
            }

            if (this.minVal !== null && value < this.minVal) {
                this.control.control?.setValue(this.minVal);
            }
            if (this.maxVal !== null && value > this.maxVal) {
                this.control.control?.setValue(this.maxVal);
            }
        }
    }
}
