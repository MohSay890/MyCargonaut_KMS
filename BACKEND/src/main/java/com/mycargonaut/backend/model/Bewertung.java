package com.mycargonaut.backend.model; // Muss zur Ordnerstruktur passen

import jakarta.persistence.*; // Für @Entity, @Id, @GeneratedValue, @ManyToOne
import lombok.Data;          // Für @Data (erzeugt Getter/Setter)

@Entity
@Data
public class Bewertung {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int sterne;
    private String kommentar;
    private boolean istPuenktlich;
    private boolean istFreundlich;
    private boolean istSorgfaeltig; // Alle Flags laut Analyse-Ebene

    @ManyToOne
    private Cargonaut verfasser;
}
