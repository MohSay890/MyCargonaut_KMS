package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "bewertung")
@Data
public class Bewertung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int sterne; // 1-5 Sterne Skala

    @Column(columnDefinition = "TEXT")
    private String kommentar;

    // Kriterium: Sichtbarkeit erst, wenn beide bewertet haben
    @Column(name = "ist_sichtbar")
    private boolean istSichtbar = false;

    @ManyToOne
    @JoinColumn(name = "fahrt_id")
    private Fahrt fahrt;

    @ManyToOne
    @JoinColumn(name = "autor_id")
    private Cargonaut autor;

    @ManyToOne
    @JoinColumn(name = "bewerteter_nutzer_id")
    private Cargonaut bewerteterNutzer;

    // --- Spezifische Fragen laut Kriterien (Explizites Mapping auf DB-Spalten) ---

    @Column(name = "ist_puenktlich")
    private boolean puenktlich; // +/- 5 Minuten

    @Column(name = "abmachungen_eingehalten")
    private boolean abmachungenEingehalten; // Treffpunkt usw.

    @Column(name = "ist_freundlich")
    private Boolean istFreundlich;

    // Fragen nur für: Mitfahrer bewertet Fahrer
    @Column(name = "wohlgefuehlt")
    private Boolean wohlgefuehlt;

    @Column(name = "fracht_unbeschadet")
    private Boolean frachtUnbeschadet;

    // Frage nur für: Fahrer bewertet Mitfahrer
    @Column(name = "gerne_mitgenommen")
    private Boolean gerneMitgenommen;

    // Hilfsmethode für das Frontend/Mapping
    public Long getFahrtId() {
        return fahrt != null ? fahrt.getId() : null;
    }
}
