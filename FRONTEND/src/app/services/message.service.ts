import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Message {
  id: number;
  sender: {
    email: string;
    vorname: string;
    nachname: string;
    profilbild?: string;
  };
  empfaenger: {
    email: string;
    vorname: string;
    nachname: string;
    profilbild?: string;
  };
  text: string;
  erstelltAm: string;
  gelesen: boolean;
  gelesenAm?: string;
  buchung?: any;
  fahrt?: any;
}

export interface Conversation {
  otherUser: {
    email: string;
    name: string;
    avatar: string;
  };
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
  isOnline: boolean;
}

export interface SendMessageRequest {
  senderEmail: string;
  empfaengerEmail: string;
  text: string;
  buchungId?: number;
  fahrtId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private readonly API_URL = 'http://localhost:8080/api/nachrichten';

  constructor(private http: HttpClient) {}

  /**
   * Send a message
   */
  sendMessage(request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.API_URL}/send`, request).pipe(
      catchError(error => {
        console.error('Error sending message:', error);
        throw error;
      })
    );
  }

  /**
   * Get conversation between two users
   */
  getConversation(user1Email: string, user2Email: string): Observable<Message[]> {
    const params = new HttpParams()
      .set('user1', user1Email)
      .set('user2', user2Email);

    return this.http.get<Message[]>(`${this.API_URL}/conversation`, { params }).pipe(
      catchError(error => {
        console.error('Error loading conversation:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all conversations for a user
   * Returns map of conversations grouped by other user email
   */
  getAllConversations(userEmail: string): Observable<Conversation[]> {
    const params = new HttpParams().set('userEmail', userEmail);

    return this.http.get<{[key: string]: Message[]}>(`${this.API_URL}/conversations`, { params }).pipe(
      map(conversationsMap => {
        // Convert map to array of Conversation objects
        const conversations: Conversation[] = [];

        for (const [otherUserEmail, messages] of Object.entries(conversationsMap)) {
          if (messages.length === 0) continue;

          const lastMessage = messages[messages.length - 1];

          // Determine other user info
          const otherUser = lastMessage.sender.email === userEmail
            ? lastMessage.empfaenger
            : lastMessage.sender;

          // Count unread messages (where current user is recipient and message is unread)
          const unreadCount = messages.filter(m =>
            m.empfaenger.email === userEmail && !m.gelesen
          ).length;

          // Use actual profile picture if available, otherwise generate avatar with initials
          const avatarUrl = otherUser.profilbild && otherUser.profilbild.trim() !== ''
            ? otherUser.profilbild
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.vorname)}+${encodeURIComponent(otherUser.nachname)}&background=10b981&color=fff`;

          conversations.push({
            otherUser: {
              email: otherUser.email,
              name: `${otherUser.vorname} ${otherUser.nachname}`,
              avatar: avatarUrl
            },
            messages: messages,
            lastMessage: lastMessage,
            unreadCount: unreadCount,
            isOnline: false // TODO: Implement online status
          });
        }

        // Sort by last message timestamp (newest first)
        conversations.sort((a, b) =>
          new Date(b.lastMessage.erstelltAm).getTime() - new Date(a.lastMessage.erstelltAm).getTime()
        );

        return conversations;
      }),
      catchError(error => {
        console.error('Error loading conversations:', error);
        return of([]);
      })
    );
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: number): Observable<Message> {
    return this.http.post<Message>(`${this.API_URL}/${messageId}/read`, null).pipe(
      catchError(error => {
        console.error('Error marking message as read:', error);
        throw error;
      })
    );
  }

  /**
   * Mark all messages in conversation as read
   */
  markConversationAsRead(userEmail: string, otherUserEmail: string): Observable<any> {
    const params = new HttpParams()
      .set('userEmail', userEmail)
      .set('otherUserEmail', otherUserEmail);

    return this.http.post(`${this.API_URL}/conversation/read`, null, { params }).pipe(
      catchError(error => {
        console.error('Error marking conversation as read:', error);
        return of({ success: false });
      })
    );
  }

  /**
   * Get unread message count
   */
  getUnreadCount(userEmail: string): Observable<number> {
    const params = new HttpParams().set('userEmail', userEmail);

    return this.http.get<{count: number}>(`${this.API_URL}/unread/count`, { params }).pipe(
      map(response => response.count),
      catchError(error => {
        console.error('Error getting unread count:', error);
        return of(0);
      })
    );
  }

  /**
   * Get unread messages
   */
  getUnreadMessages(userEmail: string): Observable<Message[]> {
    const params = new HttpParams().set('userEmail', userEmail);

    return this.http.get<Message[]>(`${this.API_URL}/unread`, { params }).pipe(
      catchError(error => {
        console.error('Error getting unread messages:', error);
        return of([]);
      })
    );
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Gerade eben';
    } else if (diffMinutes < 60) {
      return `vor ${diffMinutes} Min.`;
    } else if (diffHours < 24) {
      return `vor ${diffHours} Std.`;
    } else if (diffDays === 1) {
      return 'Gestern';
    } else if (diffDays < 7) {
      return `vor ${diffDays} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  }

  /**
   * Format message time (for message bubbles)
   */
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }
}
