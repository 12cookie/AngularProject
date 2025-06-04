import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../services/auth.services';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, AuthModalComponent],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

    currentUser: User | null = null;
    showAuthModal = false;
    private userSubscription: Subscription = new Subscription();

    constructor(private authService: AuthService) { }

    ngOnInit() {
        // Subscribe to user authentication state
        this.userSubscription = this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
    }

    ngOnDestroy() {
        this.userSubscription.unsubscribe();
    }

    openAuthModal() {
        this.showAuthModal = true;
    }

    closeAuthModal() {
        this.showAuthModal = false;
    }

    onAuthSuccess() {
        this.showAuthModal = false;
        console.log('User authenticated successfully');
    }

    logout() {
        this.authService.logout();
    }

    get isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }
}