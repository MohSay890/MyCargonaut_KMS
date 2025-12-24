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

    @OneToMany(mappedBy = "besitzer")
    private List<Fahrzeug> fahrzeuge;
}
