package com.mycargonaut.backend.user.api;

import java.time.LocalDate;

public record UserProfileResponse(
    Long id,
    String vorname,
    String nachname,
    String email,
    String handynummer,
    String stadt,
    String plz,
    String bio,
    LocalDate registriert,
    boolean ausweisVerifiziert,
    boolean fuehrerscheinVerifiziert,
    boolean telefonVerifiziert,
    String profilbild,
    String sprachen
) {}
