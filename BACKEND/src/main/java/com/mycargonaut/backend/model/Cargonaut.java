package com.mycargonaut.backend.model; // Muss zur Ordnerstruktur passen

import jakarta.persistence.*; // Für @Entity, @Id, @GeneratedValue, @ManyToOne
import lombok.Data;          // Für @Data (erzeugt Getter/Setter)
import java.time.LocalDate;   // Für Geburtsdatum/Datum
import java.util.List;        // Für Listen
import java.math.BigDecimal;  // Für den Preis in "Fahrt"
//Die User-Entity
@Entity
@Data
public class Cargonaut {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String vorname;
    private String nachname;
    private String email;
    private String passwort;
    private LocalDate geburtsdatum;
    private String handynummer;
    private String stadt;
    private String plz;

    // Password reset fields
    private String resetToken;
    private LocalDate resetTokenExpiry;
    
    // Profile fields
    @Column(columnDefinition = "TEXT")
    private String bio;              // About me section
    private LocalDate registriert;   // Registration date (member since)
    private boolean ausweisVerifiziert = false;
    private boolean fuehrerscheinVerifiziert = false;
    private boolean telefonVerifiziert = false;
    
    @Column(columnDefinition = "TEXT")
    private String profilbild;       // Avatar/profile picture URL or base64
    private String sprachen;         // Languages (e.g., "Deutsch, Englisch")

    @OneToMany(mappedBy = "besitzer")
    private List<Fahrzeug> fahrzeuge;
}
