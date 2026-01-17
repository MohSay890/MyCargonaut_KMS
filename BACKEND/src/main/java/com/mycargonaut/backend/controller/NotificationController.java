package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Notification;
import com.mycargonaut.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/user/{userId}")
    public List<Notification> getMyNotifications(@PathVariable Long userId) {
        return notificationRepository.findByEmpfaengerIdOrderByZeitstempelDesc(userId);
    }
}
