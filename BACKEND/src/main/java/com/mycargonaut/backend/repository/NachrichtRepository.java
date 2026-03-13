package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Nachricht;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NachrichtRepository extends JpaRepository<Nachricht, Long> {

    /**
     * Find all messages between two users (both directions)
     */
    @Query("SELECT n FROM Nachricht n WHERE " +
           "(n.sender.email = :user1 AND n.empfaenger.email = :user2) OR " +
           "(n.sender.email = :user2 AND n.empfaenger.email = :user1) " +
           "ORDER BY n.erstelltAm ASC")
    List<Nachricht> findConversationBetweenUsers(@Param("user1") String user1Email, 
                                                   @Param("user2") String user2Email);

    /**
     * Get all conversations for a user (grouped by other user)
     */
    @Query("SELECT n FROM Nachricht n WHERE " +
           "n.sender.email = :userEmail OR n.empfaenger.email = :userEmail " +
           "ORDER BY n.erstelltAm DESC")
    List<Nachricht> findAllMessagesByUser(@Param("userEmail") String userEmail);

    /**
     * Count unread messages for a user
     */
    @Query("SELECT COUNT(n) FROM Nachricht n WHERE " +
           "n.empfaenger.email = :userEmail AND n.gelesen = false")
    Long countUnreadMessages(@Param("userEmail") String userEmail);

    /**
     * Get unread messages for a user
     */
    @Query("SELECT n FROM Nachricht n WHERE " +
           "n.empfaenger.email = :userEmail AND n.gelesen = false " +
           "ORDER BY n.erstelltAm DESC")
    List<Nachricht> findUnreadMessages(@Param("userEmail") String userEmail);

    /**
     * Find messages related to a specific booking
     */
    @Query("SELECT n FROM Nachricht n WHERE n.buchung.id = :buchungId " +
           "ORDER BY n.erstelltAm ASC")
    List<Nachricht> findByBuchungId(@Param("buchungId") Long buchungId);

    /**
     * Find messages related to a specific trip
     */
    @Query("SELECT n FROM Nachricht n WHERE n.fahrt.id = :fahrtId " +
           "ORDER BY n.erstelltAm ASC")
    List<Nachricht> findByFahrtId(@Param("fahrtId") Long fahrtId);
}
