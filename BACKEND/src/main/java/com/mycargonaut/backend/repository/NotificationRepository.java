package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Holt alle Nachrichten für einen User, die neuesten zuerst
    List<Notification> findByEmpfaengerIdOrderByZeitstempelDesc(Long empfaengerId);
}
