package com.mycargonaut.backend.model; // Muss zur Ordnerstruktur passen

import jakarta.persistence.*; // Für @Entity, @Id, @GeneratedValue, @ManyToOne
import lombok.Data;          // Für @Data (erzeugt Getter/Setter)
import java.time.LocalDateTime;


@Entity
@Data
public class Buchung {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Fahrt fahrt;

    @ManyToOne
    private Cargonaut mitfahrer; // The passenger who is requesting/booking
    
    // Booking status: PENDING, CONFIRMED, REJECTED, CANCELLED
    private String status = "PENDING";
    
    // Payment enforcement fields
    @Column(nullable = false)
    private Boolean paymentRequired = true; // Payment must be completed
    
    @Column(nullable = false)
    private Boolean isPaid = false; // Has payment been completed?
    
    @Column
    private LocalDateTime paymentDeadline; // Deadline for payment (30 minutes after booking)
    
    // Timestamps
    private LocalDateTime erstelltAm; // When booking was requested
    private LocalDateTime bestaetigtAm; // When booking was confirmed
    
    // Optional message from passenger when requesting
    @Column(length = 500)
    private String nachricht;
    
    // Number of seats/spaces requested
    private Integer anzahlPlaetze = 1;
    
    @PrePersist
    protected void onCreate() {
        this.erstelltAm = LocalDateTime.now();
        // Set payment deadline to 30 minutes after booking creation
        if (this.paymentRequired && this.paymentDeadline == null) {
            this.paymentDeadline = LocalDateTime.now().plusMinutes(30);
        }
    }
}
