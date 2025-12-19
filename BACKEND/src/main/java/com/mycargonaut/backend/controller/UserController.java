package com.mycargonaut.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(Authentication authentication) {
        // authentication.getName() liefert die E-Mail aus deinem JWT-Token
        String email = authentication.getName();

        // Wir geben ein einfaches JSON-Objekt zurück
        return ResponseEntity.ok(Map.of(
            "email", email,
            "status", "Authentifiziert über JWT",
            "info", "Hier könnten weitere Daten aus PostgreSQL stehen"
        ));
    }
}
