import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.services';

interface CountryCode {
    code: string;
    name: string;
    phoneLength: number;
}

@Component({
    selector: 'app-auth-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: 'auth-modal.component.html',
    styleUrls: ['auth-modal.component.css']
})
export class AuthModalComponent {
    
    @Input() isVisible = false;
    @Output() closeModal = new EventEmitter<void>();
    @Output() authSuccess = new EventEmitter<void>();

    authForm: FormGroup;
    otpForm: FormGroup;

    currentStep: 'login' | 'signup' | 'otp' = 'login';
    isLoading = false;
    errorMessage = '';
    successMessage = '';

    // Store phone number for OTP verification
    pendingPhone = '';
    pendingUserData: any = null;

    // Country codes data
    countryCodes: CountryCode[] = [
        { code: '+91', name: 'India', phoneLength: 10 },
        { code: '+1', name: 'United States', phoneLength: 10 },
        { code: '+44', name: 'United Kingdom', phoneLength: 10 },
        { code: '+61', name: 'Australia', phoneLength: 9 },
        { code: '+33', name: 'France', phoneLength: 10 },
        { code: '+49', name: 'Germany', phoneLength: 11 },
        { code: '+86', name: 'China', phoneLength: 11 },
        { code: '+81', name: 'Japan', phoneLength: 10 },
        { code: '+82', name: 'South Korea', phoneLength: 10 },
        { code: '+65', name: 'Singapore', phoneLength: 8 },
        { code: '+971', name: 'UAE', phoneLength: 9 },
        { code: '+966', name: 'Saudi Arabia', phoneLength: 9 },
        { code: '+52', name: 'Mexico', phoneLength: 10 },
        { code: '+55', name: 'Brazil', phoneLength: 11 },
        { code: '+7', name: 'Russia', phoneLength: 10 }
    ];

    selectedCountryCode: CountryCode = this.countryCodes[0];
    isCountryDropdownOpen = false;

    otpDigits: string[] = ['', '', '', '', '', ''];
    otpError = false;
    otpErrorMessage = '';
    canResend = false;
    resendTimer = 60;
    private resendInterval: any;
    
    @ViewChild('otpInput0', { static: false }) otpInput0!: ElementRef;
    @ViewChild('otpInput1', { static: false }) otpInput1!: ElementRef;
    @ViewChild('otpInput2', { static: false }) otpInput2!: ElementRef;
    @ViewChild('otpInput3', { static: false }) otpInput3!: ElementRef;
    @ViewChild('otpInput4', { static: false }) otpInput4!: ElementRef;
    @ViewChild('otpInput5', { static: false }) otpInput5!: ElementRef;

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private renderer: Renderer2
    ) {
        this.authForm = this.formBuilder.group({
            name: [''],
            countryCode: [this.selectedCountryCode.code],
            phone: ['', [Validators.required]],
            email: ['']
        });

        this.otpForm = this.formBuilder.group({
            otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
        });

        this.updatePhoneValidation();
    }

    switchToLogin() {
        this.currentStep = 'login';
        this.authForm.patchValue({ name: '', email: '' });
        this.authForm.get('name')?.clearValidators();
        this.authForm.get('email')?.clearValidators();
        this.authForm.get('name')?.updateValueAndValidity();
        this.authForm.get('email')?.updateValueAndValidity();
        this.clearMessages();
    }

    switchToSignup() {
        this.currentStep = 'signup';
        this.authForm.get('name')?.setValidators([Validators.required, Validators.minLength(2)]);
        this.authForm.get('email')?.setValidators([Validators.email]);
        this.authForm.get('name')?.updateValueAndValidity();
        this.authForm.get('email')?.updateValueAndValidity();
        this.clearMessages();
    }

    selectCountryCode(country: CountryCode) {
        this.selectedCountryCode = country;
        this.authForm.patchValue({ countryCode: country.code });
        this.isCountryDropdownOpen = false;
        this.updatePhoneValidation();
        this.authForm.get('phone')?.updateValueAndValidity();
    }

    toggleCountryDropdown() {
        this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    }

    closeCountryDropdown() {
        this.isCountryDropdownOpen = false;
    }

    private updatePhoneValidation() {
        const phoneControl = this.authForm.get('phone');
        if (phoneControl) {
            
            let pattern: RegExp;
            
            if (this.selectedCountryCode.code === '+91') {
                pattern = /^[6-9]\d{9}$/;
            } else {
                const expectedLength = this.selectedCountryCode.phoneLength;
                pattern = new RegExp(`^\\d{${expectedLength}}$`);
            }
            
            phoneControl.setValidators([Validators.required, Validators.pattern(pattern)]);
            phoneControl.updateValueAndValidity();
        }
    }

    getPhoneNumberPlaceholder(): string {
        if (this.selectedCountryCode.code === '+91') {
            return 'Enter your 10-digit phone number';
        }
        return `Enter your ${this.selectedCountryCode.phoneLength}-digit phone number`;
    }

    isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
        const field = formGroup.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    private clearMessages() {
        this.errorMessage = '';
        this.successMessage = '';
    }

    onOtpDigitInput(event: any, index: number): void {
        const value = event.target.value;
        
        // Only allow digits
        if (!/^\d$/.test(value) && value !== '') {
            event.target.value = this.otpDigits[index];
            return;
        }

        this.otpDigits[index] = value;
        this.otpError = false;
        this.otpErrorMessage = '';

        // Auto-focus next input
        if (value && index < 5) {
            this.focusOtpInput(index + 1);
        }

        // Update form control
        this.updateOtpFormControl();

        // Auto-submit if all digits are filled
        if (this.isOtpComplete() && this.otpForm.valid) {
            setTimeout(() => this.onSubmitOTP(), 500);
        }
    }

    // OTP Keydown Handler
    onOtpKeyDown(event: KeyboardEvent, index: number): void {
        // Handle backspace
        if (event.key === 'Backspace') {
            if (!this.otpDigits[index] && index > 0) {
                // If current input is empty, focus previous input
                this.focusOtpInput(index - 1);
                this.otpDigits[index - 1] = '';
                this.updateOtpFormControl();
            } else {
                // Clear current input
                this.otpDigits[index] = '';
                this.updateOtpFormControl();
            }
            this.otpError = false;
        }
        
        // Handle arrow keys
        if (event.key === 'ArrowLeft' && index > 0) {
            this.focusOtpInput(index - 1);
        }
        if (event.key === 'ArrowRight' && index < 5) {
            this.focusOtpInput(index + 1);
        }

        // Prevent non-numeric input
        if (!/\d/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
        }
    }

    // Handle paste events
    onOtpPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text') || '';
        const digits = pastedData.replace(/\D/g, '').slice(0, 6);
        
        if (digits.length > 0) {
            for (let i = 0; i < 6; i++) {
                this.otpDigits[i] = digits[i] || '';
                this.setOtpInputValue(i, this.otpDigits[i]);
            }
            
            this.updateOtpFormControl();
            
            // Focus the next empty input or the last one
            const nextEmptyIndex = this.otpDigits.findIndex(digit => !digit);
            const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
            this.focusOtpInput(focusIndex);

            // Auto-submit if complete
            if (this.isOtpComplete()) {
                setTimeout(() => this.onSubmitOTP(), 500);
            }
        }
    }

    // Focus specific OTP input
    private focusOtpInput(index: number): void {
        const inputs = [
            this.otpInput0, this.otpInput1, this.otpInput2,
            this.otpInput3, this.otpInput4, this.otpInput5
        ];
        
        if (inputs[index]) {
            setTimeout(() => {
                inputs[index].nativeElement.focus();
                inputs[index].nativeElement.select();
            }, 10);
        }
    }

    // Set value for specific OTP input
    private setOtpInputValue(index: number, value: string): void {
        const inputs = [
            this.otpInput0, this.otpInput1, this.otpInput2,
            this.otpInput3, this.otpInput4, this.otpInput5
        ];
        
        if (inputs[index]) {
            inputs[index].nativeElement.value = value;
        }
    }

    // Update form control with combined OTP
    private updateOtpFormControl(): void {
        const otp = this.otpDigits.join('');
        this.otpForm.patchValue({ otp });
    }

    // Check if OTP is complete
    isOtpComplete(): boolean {
        return this.otpDigits.every(digit => digit !== '') && this.otpDigits.length === 6;
    }

    // Enhanced OTP submission
    async onSubmitOTP() {
        if (!this.isOtpComplete()) {
            this.otpError = true;
            this.otpErrorMessage = 'Please enter all 6 digits';
            this.animateError();
            return;
        }

        this.isLoading = true;
        this.clearMessages();

        const otp = this.otpDigits.join('');

        try {
            const isValidOTP = await this.authService.verifyOTP(this.pendingPhone, otp);

            if (isValidOTP) {
                // Add success animation
                this.animateSuccess();
                
                // OTP verified, login the user
                this.authService.login(this.pendingUserData);
                this.successMessage = 'Authentication successful!';
                this.stopResendTimer();

                setTimeout(() => {
                    this.authSuccess.emit();
                    this.onClose();
                }, 1500);
            } else {
                this.otpError = true;
                this.otpErrorMessage = 'Invalid OTP. Please try again.';
                this.animateError();
                this.clearOtpInputs();
            }
        } catch (error) {
            this.otpError = true;
            this.otpErrorMessage = 'Verification failed. Please try again.';
            this.animateError();
        } finally {
            this.isLoading = false;
        }
    }

    // Enhanced resend OTP with timer
    async resendOTP() {
        this.isLoading = true;
        this.clearMessages();

        try {
            const success = await this.authService.sendOTP(this.pendingPhone);
            
            if (success) {
                this.successMessage = 'OTP sent successfully!';
                this.clearOtpInputs();
                this.startResendTimer();
                this.focusOtpInput(0);
            } else {
                this.errorMessage = 'Failed to resend OTP. Please try again.';
            }
        } catch (error) {
            this.errorMessage = 'Failed to resend OTP. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    // Start resend timer
    private startResendTimer(): void {
        this.canResend = true;
        this.resendTimer = 60;
        
        this.resendInterval = setInterval(() => {
            this.resendTimer--;
            if (this.resendTimer <= 0) {
                this.stopResendTimer();
            }
        }, 1000);
    }

    // Stop resend timer
    private stopResendTimer(): void {
        if (this.resendInterval) {
            clearInterval(this.resendInterval);
            this.resendInterval = null;
        }
        this.canResend = false;
        this.resendTimer = 0;
    }

    // Clear OTP inputs
    private clearOtpInputs(): void {
        this.otpDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < 6; i++) {
            this.setOtpInputValue(i, '');
        }
        this.updateOtpFormControl();
        this.otpError = false;
        this.otpErrorMessage = '';
    }

    // Animate error
    private animateError(): void {
        const inputs = [
            this.otpInput0, this.otpInput1, this.otpInput2,
            this.otpInput3, this.otpInput4, this.otpInput5
        ];
        
        inputs.forEach(input => {
            if (input) {
                this.renderer.addClass(input.nativeElement, 'error');
                setTimeout(() => {
                    this.renderer.removeClass(input.nativeElement, 'error');
                }, 500);
            }
        });
    }

    // Animate success
    private animateSuccess(): void {
        const inputs = [
            this.otpInput0, this.otpInput1, this.otpInput2,
            this.otpInput3, this.otpInput4, this.otpInput5
        ];
        
        inputs.forEach((input, index) => {
            if (input) {
                setTimeout(() => {
                    this.renderer.addClass(input.nativeElement, 'success');
                }, index * 100);
            }
        });
    }

    // Allow changing phone number
    changePhoneNumber(): void {
        this.currentStep = this.pendingUserData?.name ? 'signup' : 'login';
        this.clearOtpInputs();
        this.clearMessages();
        this.stopResendTimer();
        this.pendingPhone = '';
    }

    // Override the existing switchToOtp method to include timer
    private switchToOtpStep(): void {
        this.currentStep = 'otp';
        this.clearOtpInputs();
        this.startResendTimer();
        
        // Auto-focus first input after modal animation
        setTimeout(() => {
            this.focusOtpInput(0);
        }, 300);
    }

    // Update the existing onSubmitAuth method to use new switchToOtpStep
    async onSubmitAuth() {
        if (this.authForm.invalid) {
            this.markFormGroupTouched(this.authForm);
            return;
        }

        this.isLoading = true;
        this.clearMessages();

        const formData = this.authForm.value;
        const fullPhoneNumber = formData.countryCode + formData.phone;
        this.pendingPhone = fullPhoneNumber;
        this.pendingUserData = { ...formData, phone: fullPhoneNumber };

        try {
            const otpSent = await this.authService.sendOTP(fullPhoneNumber);

            if (otpSent) {
                this.switchToOtpStep();
                this.successMessage = 'OTP sent successfully!';
            } else {
                this.errorMessage = 'Failed to send OTP. Please try again.';
            }
        } catch (error) {
            this.errorMessage = 'An error occurred. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    // Enhanced onClose method
    onClose() {
        this.isVisible = false;
        this.currentStep = 'login';
        this.authForm.reset();
        this.otpForm.reset();
        this.clearMessages();
        this.clearOtpInputs();
        this.stopResendTimer();
        this.pendingPhone = '';
        this.pendingUserData = null;
        this.isCountryDropdownOpen = false;
        this.selectedCountryCode = this.countryCodes[0];
        this.authForm.patchValue({ countryCode: this.selectedCountryCode.code });
        this.closeModal.emit();
    }

    // Add cleanup on destroy
    ngOnDestroy() {
        this.stopResendTimer();
    }
}