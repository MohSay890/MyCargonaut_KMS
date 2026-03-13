package com.mycargonaut.backend.model; // Muss zur Ordnerstruktur passen

import jakarta.persistence.*; // Für @Entity, @Id, @GeneratedValue, @ManyToOne
import lombok.Data;          // Für @Data (erzeugt Getter/Setter)
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
public class Bewertung {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private int sterne; // Overall rating 1-5
    private String kommentar; // Optional comment
    
    // Common questions for both driver and passenger
    private Boolean warPuenktlich; // Was the person on time? (+/- 5 minutes)
    private Boolean hiltAbmachungen; // Did they keep to all agreements?
    
    // Passenger-specific questions (rating driver)
    private Boolean fuehlteSichWohl; // Did you feel comfortable during the trip?
    private Boolean frachtUnbeschaedigt; // Did the cargo arrive undamaged?
    
    // Driver-specific question (rating passenger)
    private Boolean gerneGenommen; // Did you enjoy having the passenger?
    
    // Meta information
    @ManyToOne
    @JoinColumn(name = "verfasser_id")
    @JsonIgnoreProperties({"fahrzeuge", "passwort", "resetToken", "resetTokenExpiry"})
    private Cargonaut verfasser; // Person who wrote the review
    
    @ManyToOne
    @JoinColumn(name = "bewertet_id")
    @JsonIgnoreProperties({"fahrzeuge", "passwort", "resetToken", "resetTokenExpiry"})
    private Cargonaut bewertet; // Person being reviewed
    
    @ManyToOne
    @JoinColumn(name = "fahrt_id")
    @JsonIgnoreProperties({"frachten", "bewertungen", "fahrer", "fahrzeug"})
    private Fahrt fahrt; // Trip this review belongs to
    
    private String reviewerRole; // "DRIVER" or "PASSENGER" - who is writing the review
    
    private LocalDateTime erstelltAm; // When the review was created
    
    private boolean istSichtbar; // Only visible when all participants have rated
    
    @PrePersist
    protected void onCreate() {
        erstelltAm = LocalDateTime.now();
    }
}
