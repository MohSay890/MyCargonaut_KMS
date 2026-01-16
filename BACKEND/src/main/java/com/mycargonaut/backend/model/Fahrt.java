package com.mycargonaut.backend.model; // Muss zur Ordnerstruktur passen

import jakarta.persistence.*; // Für @Entity, @Id, @GeneratedValue, @ManyToOne
import lombok.Data;          // Für @Data (erzeugt Getter/Setter)
import java.time.LocalDate;   // Für Geburtsdatum/Datum
import java.util.List;        // Für Listen
import java.math.BigDecimal;  // Für den Preis in "Fahrt"
import lombok.Data;
@Entity
@Data
public class Fahrt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String startOrt;
    private String zielOrt;
    private String abholadresse;      // Detailed pickup address (e.g., "Frankfurt am Main Hauptbahnhof")
    private String lieferadresse;     // Detailed delivery address (e.g., "Giessen Bahnhof")
    private LocalDate datum;
    private String uhrzeit;           // Time of departure (e.g., "08:00")
    private int freiePlaetze;
    private BigDecimal preis;
    private String status;
    // Additional transport details
    @Column(columnDefinition = "TEXT")
    private String beschreibung;      // Description - can be long text
    private String abmessungen;       // Max dimensions (e.g., "200x150x120 cm")
    private String ladekapazitaet;    // Load capacity (e.g., "12 m³")
    private String fahrzeugTyp;       // Vehicle type (e.g., "PKW", "Transporter")
    private String fahrzeugModell;    // Vehicle model (e.g., "Mercedes Sprinter")
    private String entfernung;        // Distance (e.g., "290 km")
    private String dauer;             // Duration (e.g., "ca. 3 Std.")
    private String extras;            // Comma-separated extras/tags (e.g., "Versicherung inkl.,Be-/Entladehilfe")
    private String kategorie;         // Category (e.g., "möbel", "pakete", "umzug")

    // Creator info (stored directly for simplicity)
    private String erstellerName;     // Name of the user who created this
    private String erstellerEmail;    // Email of creator
    @Column(columnDefinition = "TEXT")
    private String erstellerAvatar;   // Avatar URL/Base64 of creator - can be very long

    @ManyToOne
    private Cargonaut fahrer;

    @ManyToOne
    private Fahrzeug fahrzeug;

    @OneToMany(mappedBy = "fahrt")
    private List<Fracht> frachten;
}
