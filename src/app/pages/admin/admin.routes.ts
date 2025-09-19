import { Routes } from '@angular/router';
import { Complaints } from './complaints/complaints';
import { MenuDemo } from '../uikit/menudemo';
import { Users } from './users/users';
import { Companies } from './companies/companies';
import { SuggestionsComponent } from './suggestions/suggestions.component';
import { CongratulationsComponent } from './congratulations/congratulations.component';

export default [
    { path: 'complaints', data: { breadcrumb: 'Quejas' }, component: Complaints },
    { path: 'suggestions', data: { breadcrumb: 'Sugerencias' }, component: SuggestionsComponent },
    { path: 'congratulations', data: { breadcrumb: 'Felicitaciones' }, component: CongratulationsComponent },
    { path: 'users', data: { breadcrumb: 'Usuarios' }, component: Users },
    { path: 'companies', data: { breadcrumb: 'Empresas' }, component: Companies },
    { path: 'menu', data: { breadcrumb: 'Menu' }, component: MenuDemo },
    /*{ path: 'button', data: { breadcrumb: 'Button' }, component: ButtonDemo },
    { path: 'charts', data: { breadcrumb: 'Charts' }, component: ChartDemo },
    { path: 'file', data: { breadcrumb: 'File' }, component: FileDemo },
    { path: 'formlayout', data: { breadcrumb: 'Form Layout' }, component: FormLayoutDemo },
    { path: 'input', data: { breadcrumb: 'Input' }, component: InputDemo },
    { path: 'list', data: { breadcrumb: 'List' }, component: ListDemo },
    { path: 'media', data: { breadcrumb: 'Media' }, component: MediaDemo },
    { path: 'message', data: { breadcrumb: 'Message' }, component: MessagesDemo },
    { path: 'misc', data: { breadcrumb: 'Misc' }, component: MiscDemo },
    { path: 'panel', data: { breadcrumb: 'Panel' }, component: PanelsDemo },
    { path: 'timeline', data: { breadcrumb: 'Timeline' }, component: TimelineDemo },
    { path: 'table', data: { breadcrumb: 'Table' }, component: TableDemo },
    { path: 'overlay', data: { breadcrumb: 'Overlay' }, component: OverlayDemo },
    { path: 'tree', data: { breadcrumb: 'Tree' }, component: TreeDemo },
    { path: 'menu', data: { breadcrumb: 'Menu' }, component: MenuDemo },*/
    /*{ path: '**', redirectTo: '/notfound' }*/
] as Routes;
