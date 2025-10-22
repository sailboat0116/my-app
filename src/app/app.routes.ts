import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { FindComponent } from './pages/find/find';
import { ReportComponent } from './pages/report/report';
import { BenignComponent } from './pages/benign/benign';
import { ResponseComponent } from './pages/response/response';

export const routes: Routes = [
    { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'find', component: FindComponent },
  { path: 'report', component: ReportComponent },
  { path: 'benign', component: BenignComponent },
  { path: 'response', component: ResponseComponent },
];
