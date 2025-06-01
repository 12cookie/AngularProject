import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ListPropertyComponent } from './list-property/list-property.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'list-property', component: ListPropertyComponent },
  { path: '**', redirectTo: '' } // Wildcard route for 404 page
];