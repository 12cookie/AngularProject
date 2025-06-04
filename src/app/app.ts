import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
})
export class App {
  protected title = 'Find my home';
}