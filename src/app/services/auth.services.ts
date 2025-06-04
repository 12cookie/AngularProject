import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    isAuthenticated: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private currentUserSubject = new BehaviorSubject <User | null> (null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() {
        // Check if user is already logged in (in real app, check token/session)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUserSubject.next(JSON.parse(savedUser));
        }
    }

    // Simulate sending OTP (in real app, call your backend API)
    sendOTP(phone: string): Promise <boolean> {
        return new Promise((resolve) => {
            console.log(`Sending OTP to phone: ${phone}`);
            // Simulate API delay
            setTimeout(() => {
                // In real implementation, call your backend to send OTP
                resolve(true);
            }, 1000);
        });
    }

    // Simulate OTP verification (in real app, verify with backend)
    verifyOTP(phone: string, otp: string): Promise <boolean> {
        return new Promise((resolve) => {
            console.log(`Verifying OTP: ${otp} for phone: ${phone}`);
            // Simulate API delay
            setTimeout(() => {
                // For demo purposes, accept "123456" as valid OTP
                resolve(otp === '123456');
            }, 1000);
        });
    }

    // Login user after OTP verification
    login(userData: { name: string; phone: string; email?: string }): void {
        const user: User = {
            id: Date.now().toString(),
            name: userData.name,
            phone: userData.phone,
            email: userData.email,
            isAuthenticated: true
        };

        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Logout user
    logout(): void {
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.currentUserSubject.value?.isAuthenticated || false;
    }

    // Get current user
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }
}