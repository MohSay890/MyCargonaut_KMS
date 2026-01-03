package com.mycargonaut.backend.user.api;

public record UpdateProfileRequest(
    String vorname,
    String nachname,
    String handynummer,
    String stadt,
    String plz,
    String bio,
    String profilbild,
    String sprachen
) {}
