import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Chat {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  messages: Message[];
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesArea') private messagesArea!: ElementRef;
  private shouldScrollToBottom = false;

  searchQuery: string = '';
  newMessageText: string = '';
  selectedChat: Chat | null = null;

  chats: Chat[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Sarah K.',
      userAvatar: 'https://i.pravatar.cc/50?img=5',
      lastMessage: 'Perfekt, danke! Bis dann.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      unreadCount: 2,
      isOnline: true,
      messages: [
        {
          id: 'm1',
          senderId: 'user1',
          senderName: 'Sarah K.',
          text: 'Hallo! Ist der Transport noch verfügbar?',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          isOwn: false
        },
        {
          id: 'm2',
          senderId: 'me',
          senderName: 'Ich',
          text: 'Ja, der Transport ist noch verfügbar!',
          timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
          isOwn: true
        },
        {
          id: 'm3',
          senderId: 'user1',
          senderName: 'Sarah K.',
          text: 'Super! Wann können wir starten?',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          isOwn: false
        },
        {
          id: 'm4',
          senderId: 'me',
          senderName: 'Ich',
          text: 'Morgen um 10 Uhr wäre möglich.',
          timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
          isOwn: true
        },
        {
          id: 'm5',
          senderId: 'user1',
          senderName: 'Sarah K.',
          text: 'Passt perfekt! Von Berlin nach Hamburg, richtig?',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          isOwn: false
        },
        {
          id: 'm6',
          senderId: 'me',
          senderName: 'Ich',
          text: 'Genau! Abholung in Berlin Mitte.',
          timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          isOwn: true
        },
        {
          id: 'm7',
          senderId: 'user1',
          senderName: 'Sarah K.',
          text: 'Toll! Ich bestätige dann gleich.',
          timestamp: new Date(Date.now() - 2.25 * 60 * 60 * 1000),
          isOwn: false
        },
        {
          id: 'm8',
          senderId: 'user1',
          senderName: 'Sarah K.',
          text: 'Perfekt, danke! Bis dann.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isOwn: false
        }
      ]
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Michael B.',
      userAvatar: 'https://i.pravatar.cc/50?img=12',
      lastMessage: 'Alles klar, bis morgen!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1d ago
      unreadCount: 0,
      isOnline: false,
      messages: [
        {
          id: 'm1',
          senderId: 'user2',
          senderName: 'Michael B.',
          text: 'Hi! Können wir den Termin verschieben?',
          timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
          isOwn: false
        },
        {
          id: 'm2',
          senderId: 'me',
          senderName: 'Ich',
          text: 'Klar, wann passt es dir besser?',
          timestamp: new Date(Date.now() - 24.5 * 60 * 60 * 1000),
          isOwn: true
        },
        {
          id: 'm3',
          senderId: 'user2',
          senderName: 'Michael B.',
          text: 'Wäre Mittwoch möglich?',
          timestamp: new Date(Date.now() - 24.25 * 60 * 60 * 1000),
          isOwn: false
        },
        {
          id: 'm4',
          senderId: 'me',
          senderName: 'Ich',
          text: 'Ja, Mittwoch geht! Um 14 Uhr?',
          timestamp: new Date(Date.now() - 24.1 * 60 * 60 * 1000),
          isOwn: true
        },
        {
          id: 'm5',
          senderId: 'user2',
          senderName: 'Michael B.',
          text: 'Alles klar, bis morgen!',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          isOwn: false
        }
      ]
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Anna M.',
      userAvatar: 'https://i.pravatar.cc/50?img=9',
      lastMessage: 'Vielen Dank für die Info!',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3d ago
      unreadCount: 0,
      isOnline: false,
      messages: [
        {
          id: 'm1',
          senderId: 'user3',
          senderName: 'Anna M.',
          text: 'Hallo! Ist Versicherung inklusive?',
          timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
          isOwn: false
        },
        {
          id: 'm2',
          senderId: 'me',
          senderName: 'Ich',
          text: 'Ja, Vollkasko bis 5000€ ist dabei.',
          timestamp: new Date(Date.now() - 3.25 * 24 * 60 * 60 * 1000),
          isOwn: true
        },
        {
          id: 'm3',
          senderId: 'user3',
          senderName: 'Anna M.',
          text: 'Vielen Dank für die Info!',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isOwn: false
        }
      ]
    },
    {
      id: '4',
      userId: 'user4',
      userName: 'Peter L.',
      userAvatar: 'https://i.pravatar.cc/50?img=11',
      lastMessage: 'Verstanden, danke!',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3d ago
      unreadCount: 0,
      isOnline: false,
      messages: [
        {
          id: 'm1',
          senderId: 'user4',
          senderName: 'Peter L.',
          text: 'Können wir die Uhrzeit ändern?',
          timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
          isOwn: false
        },
        {
          id: 'm2',
          senderId: 'me',
          senderName: 'Ich',
          text: 'Ja klar! Wann wäre besser?',
          timestamp: new Date(Date.now() - 3.25 * 24 * 60 * 60 * 1000),
          isOwn: true
        },
        {
          id: 'm3',
          senderId: 'user4',
          senderName: 'Peter L.',
          text: 'Verstanden, danke!',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isOwn: false
        }
      ]
    }
  ];

  ngOnInit(): void {
    // Select first chat by default
    if (this.chats.length > 0) {
      this.selectChat(this.chats[0]);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  get filteredChats(): Chat[] {
    if (!this.searchQuery.trim()) {
      return this.chats;
    }

    const query = this.searchQuery.toLowerCase();
    return this.chats.filter(chat =>
      chat.userName.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    );
  }

  selectChat(chat: Chat): void {
    this.selectedChat = chat;
    // Mark as read
    chat.unreadCount = 0;
    // Scroll to bottom after view update
    this.shouldScrollToBottom = true;
  }

  sendMessage(): void {
    if (!this.newMessageText.trim() || !this.selectedChat) {
      return;
    }

    const newMessage: Message = {
      id: 'm' + Date.now(),
      senderId: 'me',
      senderName: 'Ich',
      text: this.newMessageText,
      timestamp: new Date(),
      isOwn: true
    };

    this.selectedChat.messages.push(newMessage);
    this.selectedChat.lastMessage = this.newMessageText;
    this.selectedChat.timestamp = new Date();

    // Clear input
    this.newMessageText = '';

    // Scroll to bottom
    this.shouldScrollToBottom = true;
  }

  scrollToBottom(): void {
    try {
      if (this.messagesArea) {
        this.messagesArea.nativeElement.scrollTop = this.messagesArea.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Scroll error:', err);
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Jetzt';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }

  getMessageTime(date: Date): string {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  getUserInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
