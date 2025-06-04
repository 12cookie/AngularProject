import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: 'list-property.html',
  styleUrls: ['list-property.css']
})
export class ListPropertyComponent {
  propertyForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.propertyForm = this.formBuilder.group({
      // Owner details
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email: ['', [Validators.email]],
      
      // Property details
      propertyType: ['', Validators.required],
      bedrooms: ['', Validators.required],
      bathrooms: ['', Validators.required],
      area: ['', [Validators.required, Validators.min(1)]],
      rent: ['', [Validators.required, Validators.min(1)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      description: [''],
      
      // Amenities
      parking: [false],
      furnished: [false],
      gym: [false],
      swimming: [false],
      security: [false],
      elevator: [false]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.propertyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.propertyForm.valid) {
      const formData = this.propertyForm.value;
      console.log('Property listing data:', formData);
      
      // Here you would typically send the data to your backend service
      alert('Property listed successfully! We will contact you soon.');
      
      // Navigate back to home or to a success page
      this.router.navigate(['/']);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.propertyForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}