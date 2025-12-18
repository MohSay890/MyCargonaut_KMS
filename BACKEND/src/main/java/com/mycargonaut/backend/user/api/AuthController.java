package com.mycargonaut.backend.user.api;

import com.mycargonaut.backend.security.JwtService; // <--- WICHTIG: Import
import com.mycargonaut.backend.user.User;
import com.mycargonaut.backend.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService; // <--- NEU: Der Token-Generator

    // <--- NEU: Wir fügen jwtService hier im Konstruktor hinzu
    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.registerUser(request);
            return ResponseEntity.ok("User registriert mit ID: " + user.getId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // 1. Login prüfen (Passwort checken)
            User user = userService.loginUser(request.primaryEmail(), request.password());

            // 2. Token generieren (Der digitale Ausweis)
            String token = jwtService.generateToken(user.getPrimaryEmail());

            // 3. Token als JSON zurückgeben
            return ResponseEntity.ok(new LoginResponse(token));

        } catch (Exception e) {
            // Bei Fehler (401 Unauthorized)
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}
