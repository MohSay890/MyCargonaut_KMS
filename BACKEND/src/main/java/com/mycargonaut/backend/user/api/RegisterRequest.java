package com.mycargonaut.backend.user.api;

import java.time.LocalDate;

/**
 * Diese Klasse transportiert die Daten von der Registrierungs-Seite zum Backend.
 * Wir nutzen ein 'record', weil es automatisch Getter wie 'stadt()' erzeugt.
 */
public record RegisterRequest(
    String firstName,
    String lastName,
    String primaryEmail,
    String secondaryEmail,
    String password,
    LocalDate dateOfBirth,
    String stadt, // Laut UML-Analyse-Ebene
    String plz     // Laut UML-Analyse-Ebene
) {}
