package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * TransportRequest - User posts what they need transported (reverse of Fahrt/Offer)
 */
@Entity
@Data
@Table(name = "transport_request")
public class TransportRequest {
    
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Route information
    @Column(nullable = false)
    private String startOrt;
    
    @Column(nullable = false)
    private String zielOrt;
    
    private LocalDate datum;
    private String uhrzeit;
    
    // Cargo details
    private String beschreibung;
    private String abmessungen;
    private Double gewicht;  // in kg
    private String kategorie;  // möbel, pakete, umzug, etc.
    
    // Pricing
    @Column(nullable = false)
    private BigDecimal maxPreis;  // Maximum price user is willing to pay
    
    // Additional info
    private String abholadresse;
    private String lieferadresse;
    private String extras;  // Comma-separated tags
    
    // Creator information
    private String erstellerName;
    private String erstellerEmail;
    private String erstellerAvatar;
    
    // Metadata
    private String entfernung;
    private String dauer;
    
    @Column(name = "erstellt_am", updatable = false)
    private LocalDate erstelltAm = LocalDate.now();
    
    @Column(name = "status")
    private String status = "ACTIVE";  // ACTIVE, MATCHED, CANCELLED, EXPIRED
}
