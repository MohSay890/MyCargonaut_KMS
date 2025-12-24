package com.mycargonaut.backend.model; // Muss zur Ordnerstruktur passen

import jakarta.persistence.*; // Für @Entity, @Id, @GeneratedValue, @ManyToOne
import lombok.Data;          // Für @Data (erzeugt Getter/Setter)
import java.time.LocalDate;   // Für Geburtsdatum/Datum
import java.util.List;        // Für Listen
import java.math.BigDecimal;  // Für den Preis in "Fahrt"

@Entity
@Data
public class Fahrzeug {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String marke;
    private String modell;
    private String kennzeichen;
    private int baujahr;
    private double kapazitaet;
    private double maxGewicht;
    private boolean hatKuehlung;

    @ManyToOne
    @JoinColumn(name = "besitzer_id")
    private Cargonaut besitzer;
}
