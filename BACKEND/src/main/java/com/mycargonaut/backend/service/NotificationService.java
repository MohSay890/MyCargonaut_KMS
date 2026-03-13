package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.model.Notification;
import com.mycargonaut.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Transactional
    public void sende(Cargonaut empfaenger, String titel, String nachricht, String typ) {
        // Sicherheits-Check
        if (empfaenger == null || empfaenger.getId() == null) {
            System.err.println("FEHLER: Benachrichtigung '" + titel + "' hat keinen Empfänger!");
            return; // Oder wirf eine Exception
        }

        Notification n = new Notification();
        n.setEmpfaenger(empfaenger);
        n.setTitel(titel);
        n.setNachricht(nachricht);
        n.setTyp(typ);
        notificationRepository.save(n);
    }
}
