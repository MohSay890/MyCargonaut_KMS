package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Fahrzeug {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String marke;
    private String modell;
    private String kennzeichen;
    private int baujahr;
    private double kapazitaet;
    private double maxGewicht;
    private boolean hatKuehlung;
    
    // Additional fields for production
    private String typ;              // Vehicle type (e.g., "Transporter", "LKW")
    private String abmessungen;      // Dimensions (e.g., "5.2m x 2.1m x 2.4m")
    private String versicherung;     // Insurance information
    private boolean istAktiv;        // Whether the vehicle is active
    
    @Column(name = "besitzer_email")
    private String besitzerEmail;    // Owner's email
    
    @Column(name = "erstellt_am")
    private LocalDateTime erstelltAm;
    
    @Column(name = "aktualisiert_am")
    private LocalDateTime aktualisiertAm;
    
    @ManyToOne
    @JoinColumn(name = "besitzer_id")
    private Cargonaut besitzer;
    
    @PrePersist
    protected void onCreate() {
        erstelltAm = LocalDateTime.now();
        aktualisiertAm = LocalDateTime.now();
        if (istAktiv == false) {
            istAktiv = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        aktualisiertAm = LocalDateTime.now();
    }
}
