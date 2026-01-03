package com.mycargonaut.backend.user.api;

import java.time.LocalDate;

public record LoginResponse(
    String token,
    Long id,
    String email,
    String vorname,
    String nachname,
    String handynummer,
    String stadt,
    String plz,
    LocalDate registriert
) {}
