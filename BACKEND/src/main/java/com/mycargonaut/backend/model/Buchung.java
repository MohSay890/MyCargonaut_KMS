package com.mycargonaut.backend.model; // Muss zur Ordnerstruktur passen

import jakarta.persistence.*; // Für @Entity, @Id, @GeneratedValue, @ManyToOne
import lombok.Data;          // Für @Data (erzeugt Getter/Setter)
import java.time.LocalDate;   // Für Geburtsdatum/Datum
import java.util.List;        // Für Listen
import java.math.BigDecimal;  // Für den Preis in "Fahrt"

@Entity
@Data
public class Buchung {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Fahrt fahrt;

    @ManyToOne
    private Cargonaut mitfahrer;
}
