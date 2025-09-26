import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Message {
  sender: 'bot' | 'user';
  text: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="chatbot-wrapper" [class.minimized]="isMinimized">
      <div class="chat-header" (click)="toggleChat()">
        💬 Asistente Virtual
        <span class="toggle-btn">{{ isMinimized ? '▲' : '▼' }}</span>
      </div>

      <div class="chat-container" *ngIf="!isMinimized">
        <div class="messages">
          <div *ngFor="let msg of messages" [ngClass]="msg.sender">
            <span>{{ msg.text }}</span>
          </div>
        </div>
        <div class="input-container">
          <input [(ngModel)]="userInput" (keyup.enter)="sendMessage()" placeholder="Escribe un mensaje..." />
          <button (click)="sendMessage()">➤</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chatbot-wrapper {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 360px;
      max-height: 500px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-family: Arial, sans-serif;
      z-index: 9999;
    }
    .chat-header {
      background: #075E54;
      color: white;
      padding: 12px;
      font-weight: bold;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .toggle-btn {
      font-size: 16px;
      cursor: pointer;
    }
    .chat-container {
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }
    .messages {
      flex: 1;
      max-height: 400px;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
    }
    .bot, .user {
      max-width: 75%;
      padding: 10px;
      margin: 5px 0;
      border-radius: 15px;
      word-wrap: break-word;
      font-size: 14px;
      display: inline-block;
    }
    .bot {
      align-self: flex-start;
      background: #e5e5ea;
      color: black;
      border-bottom-left-radius: 0;
    }
    .user {
      align-self: flex-end;
      background: #25D366;
      color: white;
      border-bottom-right-radius: 0;
    }
    .input-container {
      display: flex;
      border-top: 1px solid #ccc;
      padding: 8px;
      background: white;
    }
    input {
      flex: 1;
      border: none;
      padding: 8px;
      font-size: 14px;
      outline: none;
    }
    button {
      background: #075E54;
      color: white;
      border: none;
      padding: 0 12px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
    }
    .minimized {
      height: auto;
      width: 250px;
    }
  `]
})

export class ChatbotComponent {
  isMinimized = true;
  messages: Message[] = [
    { sender: 'bot', text: '¡Hola! Soy tu asistente 🤖. ¿Cuál es tu nombre?' }
  ];
  userInput = '';
  step = 0;

  feedbackData: any = {
    name: '',
    email: '',
    type: '',
    description: '',
    latitude: null,
    longitude: null,
    date: new Date().toISOString().split('T')[0]
  };

  constructor(private http: HttpClient) {}

  toggleChat() {
    this.isMinimized = !this.isMinimized;
  }

  sendMessage() {
    if (!this.userInput.trim() && this.step !== 4) return;

    if (this.step !== 4) {
      this.messages.push({ sender: 'user', text: this.userInput });
    }

    switch (this.step) {
      case 0:
        this.feedbackData.name = this.userInput;
        this.messages.push({ sender: 'bot', text: 'Gracias 🙌, ahora dime tu correo electrónico 📧:' });
        break;
      case 1:
        this.feedbackData.email = this.userInput;
        this.messages.push({ sender: 'bot', text: '¿Qué tipo de feedback es? (complaint, suggestion, congratulations)' });
        break;
      case 2:
        this.feedbackData.type = this.userInput;
        this.messages.push({ sender: 'bot', text: 'Perfecto 👍, ahora describe tu feedback 📝:' });
        break;
      case 3:
        this.feedbackData.description = this.userInput;
        this.messages.push({ sender: 'bot', text: '¿Me permites acceder a tu ubicación para adjuntarla al feedback? 📍' });
        this.askForLocation();
        break;
      case 4:
        // Después de capturar ubicación
        this.messages.push({ sender: 'bot', text: '¡Gracias! Estoy registrando tu feedback... ⏳' });
        this.sendToWebhook();
        break;
    }

    this.userInput = '';
    this.step++;
  }

  askForLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.feedbackData.latitude = position.coords.latitude;
          this.feedbackData.longitude = position.coords.longitude;
          this.messages.push({
            sender: 'bot',
            text: `Ubicación recibida ✅ (Lat: ${this.feedbackData.latitude}, Lng: ${this.feedbackData.longitude})`
          });
          // Pasamos automáticamente al siguiente paso (guardar feedback)
          this.step = 4;
          this.sendMessage();
        },
        (error) => {
          this.messages.push({ sender: 'bot', text: '⚠️ No pude obtener tu ubicación.' });
          this.step = 4;
          this.sendMessage();
        }
      );
    } else {
      this.messages.push({ sender: 'bot', text: '❌ Tu navegador no soporta geolocalización.' });
      this.step = 4;
      this.sendMessage();
    }
  }

  sendToWebhook() {
    const url = 'https://n8n.srv863641.hstgr.cloud/webhook/feedback';
    this.http.post(url, this.feedbackData).subscribe({
      next: () => this.messages.push({ sender: 'bot', text: '✅ Tu feedback fue registrado con éxito, ¡gracias!' }),
      error: () => this.messages.push({ sender: 'bot', text: '⚠️ Ocurrió un error al registrar tu feedback.' })
    });
  }
}
