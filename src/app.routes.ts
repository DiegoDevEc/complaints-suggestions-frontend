import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { FormComplaintsComponent } from '@/pages/form-complaints/form-complaints.component';
import { authGuard } from '@/guards/auth.guard';
import { ViewComplaint } from '@/pages/view-complaint/view-complaint';

export const appRoutes: Routes = [
    { path: '', component: FormComplaintsComponent },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'complaints', loadChildren: () => import('./app/pages/admin/admin.routes') },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    {path: 'view-complaint', component: ViewComplaint},
    { path: '**', redirectTo: '/notfound' }
];
