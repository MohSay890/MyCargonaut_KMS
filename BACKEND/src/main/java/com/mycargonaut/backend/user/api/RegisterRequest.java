package com.mycargonaut.backend.user.api;

import java.time.LocalDate;

public record RegisterRequest(
    String firstName,
    String lastName,
    String primaryEmail,
    String secondaryEmail,
    String password,
    LocalDate dateOfBirth
) {}
