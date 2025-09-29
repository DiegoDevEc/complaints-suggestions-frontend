import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class NotificationsService {

    private socket = io('http://hckk8oogsckgggc08w4wgg4k.31.97.12.29.sslip.io', {
        transports: ['websocket'],
        reconnection: true,
    });


    constructor() {
        this.socket.on('connect_error', (err) => {
            console.error('❌ Error de conexión:', err.message);
        });
        console.log('Iniciando servicio de notificaciones');

        this.socket.on('connect', () => {
            console.log('✅ Conectado al servidor WebSocket');
        });

        // Escuchar cambios de estado
       /* this.socket.on('statusUpdated', (data) => {
            console.log('Estado actualizado:', data);
            alert(`Caso ${data.id} ahora está en ${data.status}`);
        });*/
    }

    onFeedbackStatusUpdated(): Observable<any> {
        return new Observable((subscriber) => {
            this.socket.on('statusUpdated', (data) => {
                subscriber.next(data);
            });
        });
    }

    // Ejemplo: enviar un "ping" al servidor
    sendPing() {
        this.socket.emit('ping', 'Hola servidor!');
    }
}
