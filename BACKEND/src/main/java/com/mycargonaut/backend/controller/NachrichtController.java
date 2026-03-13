package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Nachricht;
import com.mycargonaut.backend.service.NachrichtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nachrichten")
@CrossOrigin(origins = "http://localhost:4200")
public class NachrichtController {

    private final NachrichtService nachrichtService;

    public NachrichtController(NachrichtService nachrichtService) {
        this.nachrichtService = nachrichtService;
    }

    /**
     * Send a message
     * POST /api/nachrichten/send
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageDto dto) {
        try {
            Nachricht nachricht = nachrichtService.sendMessage(
                    dto.senderEmail(),
                    dto.empfaengerEmail(),
                    dto.text(),
                    dto.buchungId(),
                    dto.fahrtId()
            );
            return ResponseEntity.ok(nachricht);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get conversation between two users
     * GET /api/nachrichten/conversation?user1=xxx&user2=yyy
     */
    @GetMapping("/conversation")
    public ResponseEntity<List<Nachricht>> getConversation(
            @RequestParam String user1,
            @RequestParam String user2) {
        List<Nachricht> conversation = nachrichtService.getConversation(user1, user2);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Get all conversations for a user
     * GET /api/nachrichten/conversations?userEmail=xxx
     */
    @GetMapping("/conversations")
    public ResponseEntity<Map<String, List<Nachricht>>> getAllConversations(
            @RequestParam String userEmail) {
        Map<String, List<Nachricht>> conversations = nachrichtService.getAllConversations(userEmail);
        return ResponseEntity.ok(conversations);
    }

    /**
     * Mark message as read
     * POST /api/nachrichten/{id}/read
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Nachricht nachricht = nachrichtService.markAsRead(id);
            return ResponseEntity.ok(nachricht);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark all messages in conversation as read
     * POST /api/nachrichten/conversation/read?userEmail=xxx&otherUserEmail=yyy
     */
    @PostMapping("/conversation/read")
    public ResponseEntity<?> markConversationAsRead(
            @RequestParam String userEmail,
            @RequestParam String otherUserEmail) {
        nachrichtService.markConversationAsRead(userEmail, otherUserEmail);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Get unread message count
     * GET /api/nachrichten/unread/count?userEmail=xxx
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@RequestParam String userEmail) {
        Long count = nachrichtService.getUnreadCount(userEmail);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Get unread messages
     * GET /api/nachrichten/unread?userEmail=xxx
     */
    @GetMapping("/unread")
    public ResponseEntity<List<Nachricht>> getUnreadMessages(@RequestParam String userEmail) {
        List<Nachricht> messages = nachrichtService.getUnreadMessages(userEmail);
        return ResponseEntity.ok(messages);
    }

    /**
     * DTO for sending message
     */
    record SendMessageDto(
            String senderEmail,
            String empfaengerEmail,
            String text,
            Long buchungId,
            Long fahrtId
    ) {}
}
