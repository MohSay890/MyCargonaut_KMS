import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MessageService, Message as ApiMessage, Conversation } from '../../services/message.service';

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
  currentUserEmail: string | null = null;
  chats: Chat[] = [];
  isLoading: boolean = true;

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user email
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserEmail = user.email || null;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    if (this.currentUserEmail) {
      this.loadConversations();
    } else {
      console.error('No current user found');
      this.isLoading = false;
    }
  }

  loadConversations(): void {
    if (!this.currentUserEmail) return;

    this.isLoading = true;
    this.messageService.getAllConversations(this.currentUserEmail).subscribe({
      next: (conversations) => {
        // Convert API conversations to local Chat format
        this.chats = conversations.map(conv => this.convertToChat(conv));

        // Check if navigation state has recipient info (from offer-detail page)
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || (history.state && history.state.recipientEmail ? history.state : null);

        if (state && state.recipientEmail) {
          // Try to find existing conversation with this recipient
          const existingChat = this.chats.find(chat => chat.userId === state.recipientEmail);

          if (existingChat) {
            // Open existing conversation
            this.selectChat(existingChat);
          } else {
            // Create a new conversation placeholder
            // Use provided avatar or generate one with initials
            const avatarUrl = state.recipientAvatar && state.recipientAvatar.trim() !== ''
              ? state.recipientAvatar
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(state.recipientName || state.recipientEmail)}&background=10b981&color=fff`;

            const newChat: Chat = {
              id: state.recipientEmail,
              userId: state.recipientEmail,
              userName: state.recipientName || state.recipientEmail,
              userAvatar: avatarUrl,
              lastMessage: 'Neue Konversation',
              timestamp: new Date(),
              unreadCount: 0,
              isOnline: false,
              messages: []
            };
            this.chats.unshift(newChat);
            this.selectChat(newChat);
          }
        } else if (this.chats.length > 0 && !this.selectedChat) {
          // Select first chat if available and no specific recipient
          this.selectChat(this.chats[0]);
        }

        this.isLoading = false;
        console.log('Loaded conversations:', this.chats);
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.isLoading = false;
      }
    });
  }

  convertToChat(conversation: Conversation): Chat {
    // Truncate long messages for preview (max 50 characters)
    const lastMessageText = conversation.lastMessage.text;
    const truncatedMessage = lastMessageText.length > 50
      ? lastMessageText.substring(0, 50) + '...'
      : lastMessageText;

    return {
      id: conversation.otherUser.email,
      userId: conversation.otherUser.email,
      userName: conversation.otherUser.name,
      userAvatar: conversation.otherUser.avatar,
      lastMessage: truncatedMessage,
      timestamp: new Date(conversation.lastMessage.erstelltAm),
      unreadCount: conversation.unreadCount,
      isOnline: conversation.isOnline,
      messages: conversation.messages.map(msg => this.convertToMessage(msg))
    };
  }

  convertToMessage(apiMessage: ApiMessage): Message {
    const isOwn = apiMessage.sender.email === this.currentUserEmail;
    return {
      id: apiMessage.id.toString(),
      senderId: apiMessage.sender.email,
      senderName: `${apiMessage.sender.vorname} ${apiMessage.sender.nachname}`,
      text: apiMessage.text,
      timestamp: new Date(apiMessage.erstelltAm),
      isOwn: isOwn
    };
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

    // Mark conversation as read
    if (chat.unreadCount > 0 && this.currentUserEmail) {
      this.messageService.markConversationAsRead(this.currentUserEmail, chat.userId).subscribe({
        next: () => {
          chat.unreadCount = 0;
        },
        error: (error) => {
          console.error('Error marking conversation as read:', error);
        }
      });
    }

    // Scroll to bottom after view update
    this.shouldScrollToBottom = true;
  }

  sendMessage(): void {
    if (!this.newMessageText.trim() || !this.selectedChat || !this.currentUserEmail) {
      return;
    }

    const messageText = this.newMessageText.trim();
    const recipientEmail = this.selectedChat.userId;

    // Clear input immediately for better UX
    this.newMessageText = '';

    // Send message to API
    this.messageService.sendMessage({
      senderEmail: this.currentUserEmail,
      empfaengerEmail: recipientEmail,
      text: messageText
    }).subscribe({
      next: (apiMessage) => {
        // Add message to chat
        const newMessage = this.convertToMessage(apiMessage);
        this.selectedChat!.messages.push(newMessage);

        // Truncate message for preview (max 50 characters)
        const truncatedMessage = messageText.length > 50
          ? messageText.substring(0, 50) + '...'
          : messageText;
        this.selectedChat!.lastMessage = truncatedMessage;
        this.selectedChat!.timestamp = new Date();

        // Scroll to bottom
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        // Optionally show error to user
        alert('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.');
      }
    });
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
