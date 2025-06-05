import { Component, EventEmitter, Input, Output } from '@angular/core';
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

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService
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
                this.currentStep = 'otp';
                this.successMessage = 'OTP sent successfully! Please check your phone.';
            } else {
                this.errorMessage = 'Failed to send OTP. Please try again.';
            }
        } catch (error) {
            this.errorMessage = 'An error occurred. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    async onSubmitOTP() {
        if (this.otpForm.invalid) {
            this.markFormGroupTouched(this.otpForm);
            return;
        }

        this.isLoading = true;
        this.clearMessages();

        const otp = this.otpForm.value.otp;

        try {
            const isValidOTP = await this.authService.verifyOTP(this.pendingPhone, otp);

            if (isValidOTP) {
                // OTP verified, login the user
                this.authService.login(this.pendingUserData);
                this.successMessage = 'Authentication successful!';

                setTimeout(() => {
                    this.authSuccess.emit();
                    this.onClose();
                }, 1000);
            } else {
                this.errorMessage = 'Invalid OTP. Please try again.';
            }
        } catch (error) {
            this.errorMessage = 'An error occurred during verification. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    resendOTP() {
        this.isLoading = true;
        this.clearMessages();

        this.authService.sendOTP(this.pendingPhone).then(success => {
            if (success) {
                this.successMessage = 'OTP resent successfully!';
            } else {
                this.errorMessage = 'Failed to resend OTP. Please try again.';
            }
            this.isLoading = false;
        });
    }

    onClose() {
        this.isVisible = false;
        this.currentStep = 'login';
        this.authForm.reset();
        this.otpForm.reset();
        this.clearMessages();
        this.pendingPhone = '';
        this.pendingUserData = null;
        this.isCountryDropdownOpen = false;
        this.selectedCountryCode = this.countryCodes[0];
        this.authForm.patchValue({ countryCode: this.selectedCountryCode.code });
        this.closeModal.emit();
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
}