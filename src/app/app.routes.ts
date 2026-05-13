import { Routes } from '@angular/router';
import { BoardComponent } from './pages/board/board.component';
import { LoginComponent } from './pages/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // default
  { path: 'login', component: LoginComponent },
  { path: 'board', component: BoardComponent },
  { path: '**', redirectTo: 'login' } // fallback
];