package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Buchung;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.model.Nachricht;
import com.mycargonaut.backend.repository.BuchungRepository;
import com.mycargonaut.backend.repository.CargonautRepository;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.repository.NachrichtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class NachrichtService {

    private final NachrichtRepository nachrichtRepository;
    private final CargonautRepository cargonautRepository;
    private final BuchungRepository buchungRepository;
    private final FahrtRepository fahrtRepository;

    public NachrichtService(NachrichtRepository nachrichtRepository,
                           CargonautRepository cargonautRepository,
                           BuchungRepository buchungRepository,
                           FahrtRepository fahrtRepository) {
        this.nachrichtRepository = nachrichtRepository;
        this.cargonautRepository = cargonautRepository;
        this.buchungRepository = buchungRepository;
        this.fahrtRepository = fahrtRepository;
    }

    /**
     * Send a message from one user to another
     */
    public Nachricht sendMessage(String senderEmail, String empfaengerEmail, String text,
                                  Long buchungId, Long fahrtId) {
        Cargonaut sender = cargonautRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender nicht gefunden: " + senderEmail));

        Cargonaut empfaenger = cargonautRepository.findByEmail(empfaengerEmail)
                .orElseThrow(() -> new RuntimeException("Empfänger nicht gefunden: " + empfaengerEmail));

        Nachricht nachricht = new Nachricht();
        nachricht.setSender(sender);
        nachricht.setEmpfaenger(empfaenger);
        nachricht.setText(text);
        nachricht.setGelesen(false);

        // Optional: Link to booking
        if (buchungId != null) {
            Buchung buchung = buchungRepository.findById(buchungId)
                    .orElseThrow(() -> new RuntimeException("Buchung nicht gefunden: " + buchungId));
            nachricht.setBuchung(buchung);
        }

        // Optional: Link to trip
        if (fahrtId != null) {
            Fahrt fahrt = fahrtRepository.findById(fahrtId)
                    .orElseThrow(() -> new RuntimeException("Fahrt nicht gefunden: " + fahrtId));
            nachricht.setFahrt(fahrt);
        }

        return nachrichtRepository.save(nachricht);
    }

    /**
     * Create automatic message when booking request is created
     */
    public Nachricht createBookingRequestMessage(Buchung buchung) {
        String messageText = String.format(
            "Neue Buchungsanfrage von %s %s für %d %s. " +
            "Fahrt: %s → %s am %s um %s Uhr. " +
            "%s",
            buchung.getMitfahrer().getVorname(),
            buchung.getMitfahrer().getNachname(),
            buchung.getAnzahlPlaetze(),
            buchung.getAnzahlPlaetze() == 1 ? "Platz" : "Plätze",
            buchung.getFahrt().getStartOrt(),
            buchung.getFahrt().getZielOrt(),
            buchung.getFahrt().getDatum(),
            buchung.getFahrt().getUhrzeit(),
            buchung.getNachricht() != null ? "Nachricht: \"" + buchung.getNachricht() + "\"" : ""
        );

        return sendMessage(
            buchung.getMitfahrer().getEmail(),
            buchung.getFahrt().getErstellerEmail(),
            messageText,
            buchung.getId(),
            buchung.getFahrt().getId()
        );
    }

    /**
     * Create automatic message when booking is confirmed
     */
    public Nachricht createBookingConfirmedMessage(Buchung buchung) {
        String fahrerName = buchung.getFahrt().getFahrer() != null
            ? buchung.getFahrt().getFahrer().getVorname() + " " + buchung.getFahrt().getFahrer().getNachname()
            : buchung.getFahrt().getErstellerName();

        String messageText = String.format(
            "Deine Buchungsanfrage wurde bestätigt! 🎉 " +
            "Fahrt: %s → %s am %s um %s Uhr. " +
            "Der Fahrer %s erwartet dich zur vereinbarten Zeit.",
            buchung.getFahrt().getStartOrt(),
            buchung.getFahrt().getZielOrt(),
            buchung.getFahrt().getDatum(),
            buchung.getFahrt().getUhrzeit(),
            fahrerName
        );

        return sendMessage(
            buchung.getFahrt().getErstellerEmail(),
            buchung.getMitfahrer().getEmail(),
            messageText,
            buchung.getId(),
            buchung.getFahrt().getId()
        );
    }

    /**
     * Create automatic message when booking is rejected
     */
    public Nachricht createBookingRejectedMessage(Buchung buchung) {
        String messageText = String.format(
            "Deine Buchungsanfrage wurde leider abgelehnt. " +
            "Fahrt: %s → %s am %s um %s Uhr. " +
            "Bitte suche nach einer alternativen Fahrt.",
            buchung.getFahrt().getStartOrt(),
            buchung.getFahrt().getZielOrt(),
            buchung.getFahrt().getDatum(),
            buchung.getFahrt().getUhrzeit()
        );

        return sendMessage(
            buchung.getFahrt().getErstellerEmail(),
            buchung.getMitfahrer().getEmail(),
            messageText,
            buchung.getId(),
            buchung.getFahrt().getId()
        );
    }

    /**
     * Get conversation between two users
     */
    public List<Nachricht> getConversation(String user1Email, String user2Email) {
        return nachrichtRepository.findConversationBetweenUsers(user1Email, user2Email);
    }

    /**
     * Get all conversations for a user (grouped by other user)
     */
    public Map<String, List<Nachricht>> getAllConversations(String userEmail) {
        List<Nachricht> allMessages = nachrichtRepository.findAllMessagesByUser(userEmail);

        // Group messages by conversation partner
        Map<String, List<Nachricht>> conversations = new HashMap<>();

        for (Nachricht nachricht : allMessages) {
            String otherUserEmail = nachricht.getSender().getEmail().equals(userEmail)
                    ? nachricht.getEmpfaenger().getEmail()
                    : nachricht.getSender().getEmail();

            conversations.computeIfAbsent(otherUserEmail, k -> new ArrayList<>()).add(nachricht);
        }

        // Sort messages within each conversation by timestamp
        conversations.values().forEach(msgs -> 
            msgs.sort(Comparator.comparing(Nachricht::getErstelltAm))
        );

        return conversations;
    }

    /**
     * Mark message as read
     */
    public Nachricht markAsRead(Long messageId) {
        Nachricht nachricht = nachrichtRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Nachricht nicht gefunden: " + messageId));

        nachricht.setGelesen(true);
        nachricht.setGelesenAm(LocalDateTime.now());

        return nachrichtRepository.save(nachricht);
    }

    /**
     * Mark all messages in conversation as read
     */
    public void markConversationAsRead(String userEmail, String otherUserEmail) {
        List<Nachricht> conversation = nachrichtRepository.findConversationBetweenUsers(userEmail, otherUserEmail);

        for (Nachricht nachricht : conversation) {
            if (nachricht.getEmpfaenger().getEmail().equals(userEmail) && !nachricht.getGelesen()) {
                nachricht.setGelesen(true);
                nachricht.setGelesenAm(LocalDateTime.now());
                nachrichtRepository.save(nachricht);
            }
        }
    }

    /**
     * Get unread message count for user
     */
    public Long getUnreadCount(String userEmail) {
        return nachrichtRepository.countUnreadMessages(userEmail);
    }

    /**
     * Get unread messages for user
     */
    public List<Nachricht> getUnreadMessages(String userEmail) {
        return nachrichtRepository.findUnreadMessages(userEmail);
    }
}
