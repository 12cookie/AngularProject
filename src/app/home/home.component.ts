import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../services/auth.services';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AuthModalComponent],
  templateUrl: 'home.html',
  styleUrls: ['home.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  currentUser: User | null = null;
  showAuthModal = false;
  private userSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Subscribe to user authentication state
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  navigateToSearch() {
    // Navigate to property search page (to be implemented)
    console.log('Navigate to search properties');
    // this.router.navigate(['/search']);
  }

  navigateToList() {
    this.router.navigate(['/list-property']);
  }

  openAuthModal() {
    this.showAuthModal = true;
  }

  closeAuthModal() {
    this.showAuthModal = false;
  }

  onAuthSuccess() {
    this.showAuthModal = false;
    // You can add any additional logic here after successful authentication
    console.log('User authenticated successfully');
  }

  logout() {
    this.authService.logout();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}