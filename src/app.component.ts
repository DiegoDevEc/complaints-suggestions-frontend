import { LayoutService } from '@/layout/service/layout.service';
import { NotificationsService } from '@/pages/service/notification.service';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {

    constructor(private notifications: NotificationsService) { }

    ngOnInit() {
        console.log('🌐 App inicializada, conectando al WebSocket...');
    }

    enviarPing() {
        this.notifications.sendPing();
    }
}
