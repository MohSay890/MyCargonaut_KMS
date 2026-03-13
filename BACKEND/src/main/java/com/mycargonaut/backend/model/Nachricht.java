package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nachrichten")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Nachricht {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private Cargonaut sender;

    @ManyToOne
    @JoinColumn(name = "empfaenger_id", nullable = false)
    private Cargonaut empfaenger;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "erstellt_am", nullable = false)
    private LocalDateTime erstelltAm;

    @Column(name = "gelesen", nullable = false)
    private Boolean gelesen = false;

    @Column(name = "gelesen_am")
    private LocalDateTime gelesenAm;

    // Optional: Link to booking if message is related to a booking
    @ManyToOne
    @JoinColumn(name = "buchung_id")
    private Buchung buchung;

    // Optional: Link to trip if message is related to a trip
    @ManyToOne
    @JoinColumn(name = "fahrt_id")
    private Fahrt fahrt;

    @PrePersist
    protected void onCreate() {
        this.erstelltAm = LocalDateTime.now();
        if (this.gelesen == null) {
            this.gelesen = false;
        }
    }
}
