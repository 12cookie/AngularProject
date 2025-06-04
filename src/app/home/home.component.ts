import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'home.html',
  styleUrls: ['home.css']
})
export class HomeComponent {

  constructor(private router: Router) { }

  navigateToSearch() {
    // Navigate to property search page (to be implemented)
    console.log('Navigate to search properties');
    // this.router.navigate(['/search']);
  }

  navigateToList() {
    this.router.navigate(['/list-property']);
  }
}