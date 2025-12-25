package com.mycargonaut.backend.model; // Muss zur Ordnerstruktur passen

import jakarta.persistence.*; // Für @Entity, @Id, @GeneratedValue, @ManyToOne
import lombok.Data;          // Für @Data (erzeugt Getter/Setter)
import java.time.LocalDate;   // Für Geburtsdatum/Datum
import java.util.List;        // Für Listen
import java.math.BigDecimal;  // Für den Preis in "Fahrt"

@Entity
@Data
public class Fracht {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String beschreibung;
    private double gewicht;
    private double laenge;
    private double breite;
    private double hoehe;

    @ManyToOne
    private Fahrt fahrt; // Verknüpfung zur Fahrt laut UML
}
