import { Component, Input, forwardRef, ElementRef, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
    selector: 'app-searchable-dropdown',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './searchable-dropdown.component.html',
    styleUrls: ['./searchable-dropdown.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SearchableDropdownComponent),
            multi: true
        }
    ]
})
export class SearchableDropdownComponent implements ControlValueAccessor, OnChanges {
    @Input() options: any[] = [];
    @Input() label: string = '';
    @Input() displayKey: string = 'label'; // Key to show in the list
    @Input() valueKey: string = 'id';     // Key to return as value
    @Input() subDisplayKey: string = '';  // Optional secondary key to show and search against (e.g. mobile no)
    @Input() placeholder: string = ' ';
    @Input() required: boolean = false;
    @Input() multiSelect: boolean = false;
    @Input() subDisplayIcon: string = ''; // Icon for the left side of sub-text (e.g. 'bx bx-phone')
    @Input() inputClass: string = ''; // Allows parent to assign a CSS class to the input
    @Input() containerClass: string = ''; // Allows parent to assign a CSS class to the container

    searchText: string = '';
    selectedOption: any = null; // Used for single select
    selectedOptions: any[] = []; // Used for multi select
    filteredOptions: any[] = [];
    isOpen: boolean = false;
    isDisabled: boolean = false;
    focusedIndex: number = -1;

    // --- ControlValueAccessor Implementation ---
    //To check when the value changes, run at automatically 
    private onChange: (value: any) => void = () => { };
    //To check when the value is touched like clicked or focused, run at automatically 
    private onTouched: () => void = () => { };
    //Used to store the current value selected
    private _value: any = null;

    //used to control the dom like when clicked outside we ill get th action throw this  
    constructor(private eRef: ElementRef) { }
    //runs when the options value changes
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['options']) {
            this.filteredOptions = this.options || [];
            this.updateSelection();
        }
    }

    //used to write the selected value to the component
    writeValue(value: any): void {
        this._value = value;
        this.updateSelection();
    }

    private updateSelection() {
        if (this._value !== null && this._value !== undefined && this.options && this.options.length > 0) {
            if (this.multiSelect) {
                 // Expecting array of IDs
                 const valArray = Array.isArray(this._value) ? this._value : [this._value];
                 this.selectedOptions = this.options.filter(opt => valArray.includes(this.getValue(opt)));
                 this.searchText = this.getSelectedDisplay();
            } else {
                 const found = this.options.find(opt => this.getValue(opt) == this._value);
                 if (found) {
                     this.selectedOption = found;
                     this.searchText = this.getDisplay(found);
                     return;
                 }
            }
        } else {
             // Reset
             this.selectedOption = null;
             this.selectedOptions = [];
             this.searchText = '';
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    // --- UI Logic ---

    getValue(option: any): any {
        return typeof option === 'object' && option !== null ? option[this.valueKey] : option;
    }

    getDisplay(option: any): string {
        return typeof option === 'object' && option !== null ? option[this.displayKey] : String(option);
    }

    getSubDisplay(option: any): string {
        return typeof option === 'object' && option !== null && this.subDisplayKey && option[this.subDisplayKey] ? String(option[this.subDisplayKey]) : '';
    }
    
    getSelectedDisplay(): string {
        if (this.multiSelect) {
            return this.selectedOptions.map(o => this.getDisplay(o)).join(', ');
        }
        return this.selectedOption ? this.getDisplay(this.selectedOption) : '';
    }
    
    isSelected(option: any): boolean {
        if (this.multiSelect) {
            return this.selectedOptions.some(o => this.getValue(o) === this.getValue(option));
        }
        return this.selectedOption && this.getValue(this.selectedOption) === this.getValue(option);
    }

    onFocus(): void {
        if (this.isDisabled) return;
        this.openDropdown();
    }

    onInput(event: any): void {
        this.isOpen = true;
        const value = event.target.value.toLowerCase();
        this.filteredOptions = this.options.filter(opt => {
            const matchesMain = this.getDisplay(opt).toLowerCase().includes(value);
            let matchesSub = false;
            if (this.subDisplayKey) {
                matchesSub = this.getSubDisplay(opt).toLowerCase().includes(value);
            }
            return matchesMain || matchesSub;
        });
        this.focusedIndex = -1;
    }

    selectOption(option: any): void {
        if (this.multiSelect) {
            const index = this.selectedOptions.findIndex(o => this.getValue(o) === this.getValue(option));
            if (index > -1) {
                this.selectedOptions.splice(index, 1);
            } else {
                this.selectedOptions.push(option);
            }
            
            const values = this.selectedOptions.map(o => this.getValue(o));
            this.onChange(values);
            
            this.searchText = this.getSelectedDisplay();
            this.filteredOptions = this.options; 
            // Keep open
             this.eRef.nativeElement.querySelector('input').focus();
        } else {
            this.selectedOption = option;
            this.searchText = this.getDisplay(option);
            this.isOpen = false;
            this.onChange(this.getValue(option));
            this.focusedIndex = -1;
        }
    }

    // Input click should ensure it's open, not toggle
    onInputClick(): void {
        if (this.isDisabled) return;
        this.openDropdown();
    }

    // Dictionary arrow click toggles
    toggleDropdown(): void {
        if (this.isDisabled) return;
        if (this.isOpen) {
            this.isOpen = false;
        } else {
            this.openDropdown();
        }
    }

    private openDropdown() {
        this.isOpen = true;
        this.filteredOptions = this.options;
        this.focusedIndex = -1;
        
        // Populate searchText with summary on open? It's already there.
        // If user wants to search, they delete it.
        
        if (!this.multiSelect && this.selectedOption) {
            this.focusedIndex = this.filteredOptions.findIndex(o => this.getValue(o) === this.getValue(this.selectedOption));
        }
        this.onTouched();
    }

    @HostListener('keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.isOpen) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                this.openDropdown();
                return;
            }
        }

        if (this.isOpen) {
            if (event.key === 'ArrowDown') {
                this.focusedIndex = (this.focusedIndex + 1) % this.filteredOptions.length;
                this.scrollToFocused();
                event.preventDefault(); 
            } else if (event.key === 'ArrowUp') {
                this.focusedIndex = (this.focusedIndex - 1 + this.filteredOptions.length) % this.filteredOptions.length;
                this.scrollToFocused();
                event.preventDefault();
            } else if (event.key === 'Enter') {
                if (this.focusedIndex >= 0 && this.focusedIndex < this.filteredOptions.length) {
                    this.selectOption(this.filteredOptions[this.focusedIndex]);
                    event.preventDefault(); 
                }
            } else if (event.key === 'Escape') {
                this.isOpen = false;
            } else if (event.key === 'Tab') {
                this.isOpen = false;
            }
        }
    }

    private scrollToFocused() {
        const list = this.eRef.nativeElement.querySelector('.dropdown-list');
        if (list) {
            const focusedElement = list.children[this.focusedIndex] as HTMLElement;
            if (focusedElement) {
                const listRect = list.getBoundingClientRect();
                const itemRect = focusedElement.getBoundingClientRect();

                if (itemRect.bottom > listRect.bottom) {
                    list.scrollTop += (itemRect.bottom - listRect.bottom);
                } else if (itemRect.top < listRect.top) {
                    list.scrollTop -= (listRect.top - itemRect.top);
                }
            }
        }
    }

    // Close when clicking outside
    @HostListener('document:click', ['$event'])
    clickout(event: any) {
        if (!this.eRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
            this.searchText = this.getSelectedDisplay();
        }
    }
}
