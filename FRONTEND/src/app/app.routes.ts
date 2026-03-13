import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { ProfileComponent } from './components/profile/profile.component';
import { VehicleEditorComponent } from './components/vehicle-editor/vehicle-editor.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MyTripsComponent } from './components/my-trips/my-trips.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { OfferDetailComponent } from './components/offer-detail/offer-detail.component';
import { MessagesComponent } from './components/messages/messages.component';
import { ReviewsComponent } from './components/reviews/reviews.component';
import { TrackingComponent } from './components/tracking/tracking.component';
import { DriverTrackingComponent } from './components/driver-tracking/driver-tracking.component';
import { ReviewCreateComponent } from './components/review-create/review-create.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { OfferCreateComponent } from './components/offer-create/offer-create.component';
import { CreateRequestComponent } from './components/create-request/create-request.component';
import { RequestDetailComponent } from './components/request-detail/request-detail.component';
import { PaymentHistoryComponent } from './components/payment-history/payment-history.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { MyRequestsComponent } from './components/my-requests/my-requests.component';
import { DriverBankAccountComponent } from './components/driver-bank-account/driver-bank-account.component';
import { DriverPayoutDashboardComponent } from './components/driver-payout-dashboard/driver-payout-dashboard.component';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'how-it-works', component: HowItWorksComponent },
  { path: 'search', component: SearchResultsComponent },

  // WICHTIG: Spezifische Routes MÜSSEN VOR parametrisierten Routes stehen!
  {
    path: 'offer/create',
    component: OfferCreateComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'offer/edit/:id',
    component: OfferCreateComponent,
    canActivate: [AuthGuard]
  },
  { path: 'offer/:id', component: OfferDetailComponent },

  // Request detail route
  { path: 'request/:id', component: RequestDetailComponent },

  {
    path: 'review/create/:id',
    component: ReviewCreateComponent,
    canActivate: [AuthGuard]
  },
  { path: 'reviews/:id', component: ReviewsComponent },

  // Protected routes (require login)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-profile',
    component: EditProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile-editor',  // Alias für edit-profile
    redirectTo: 'edit-profile',
    pathMatch: 'full'
  },
  {
    path: 'vehicle-editor',
    component: VehicleEditorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'my-trips',
    component: MyTripsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'my-requests',
    component: MyRequestsComponent,
    canActivate: [AuthGuard]
  },
  // Tracking routes - order matters! More specific routes first
  {
    path: 'tracking/code/:code',
    component: TrackingComponent
  },
  {
    path: 'tracking/driver',
    component: DriverTrackingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'tracking/:id',
    component: TrackingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'create-request',
    component: CreateRequestComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'tracking',
    component: TrackingComponent
  },
  {
    path: 'messages',
    component: MessagesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'favorites',
    component: FavoritesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payments',
    component: PaymentHistoryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payment-history',
    redirectTo: 'payments',
    pathMatch: 'full'
  },
  // Driver-specific routes
  {
    path: 'driver/bank-account',
    component: DriverBankAccountComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'driver/payouts',
    component: DriverPayoutDashboardComponent,
    canActivate: [AuthGuard]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
