package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Bewertung {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Cargonaut bewertetVon; // Wer gibt die Bewertung ab?

    @ManyToOne
    private Cargonaut bewerteterNutzer; // Wer wird bewertet?

    private Long fahrtId; // Verknüpfung zur Fahrt

    private int sterne; // 1-5 Sterne

    // Kriterien für beide
    private boolean puenktlich; // +/- 5 Minuten
    private boolean abmachungenEingehalten; // Treffpunkt etc.

    // Spezifisch für Mitfahrer (bewertet Fahrer)
    private boolean wohlgefuehlt;
    private boolean frachtUnbeschadet;

    // Spezifisch für Fahrer (bewertet Mitfahrer)
    private boolean gerneMitgenommen;

    private String kommentar; // Optionaler Text

    private boolean istSichtbar = false; // Erst sichtbar, wenn beide bewertet haben
    private LocalDateTime erstelltAm = LocalDateTime.now();
}
