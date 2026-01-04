package com.mycargonaut.backend.user.api;

import com.mycargonaut.backend.model.Cargonaut; // <--- WICHTIG: Nutzt jetzt Cargonaut
import com.mycargonaut.backend.security.JwtService;
import com.mycargonaut.backend.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Rückgabetyp auf Cargonaut geändert
            Cargonaut cargonaut = userService.registerUser(request);
            return ResponseEntity.ok(new RegisterResponse(
                cargonaut.getId(),
                "Cargonaut erfolgreich registriert",
                cargonaut.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // 1. Login prüfen über das neue Modell (email to lowercase for case-insensitive login)
            Cargonaut cargonaut = userService.loginUser(request.primaryEmail().toLowerCase().trim(), request.password());

            // 2. Token generieren mit 'getEmail()' statt 'getPrimaryEmail()' laut UML
            String token = jwtService.generateToken(cargonaut.getEmail());

            // 3. Token und User-Daten zurückgeben
            return ResponseEntity.ok(new LoginResponse(
                token,
                cargonaut.getId(),
                cargonaut.getEmail(),
                cargonaut.getVorname(),
                cargonaut.getNachname(),
                cargonaut.getHandynummer(),
                cargonaut.getStadt(),
                cargonaut.getPlz(),
                cargonaut.getRegistriert()
            ));

        } catch (Exception e) {
            // 401 Unauthorized bei falschen Daten
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/request-password-reset")
    public ResponseEntity<?> requestPasswordReset(@RequestBody PasswordResetRequest request) {
        try {
            System.out.println("[DEBUG] Received password reset request for email: " + request.email());
            String token = userService.requestPasswordReset(request.email());
            // In production, don't return the token - send it via email instead
            return ResponseEntity.ok(new PasswordResetTokenResponse(
                token,
                "Reset-Link wurde an Ihre Email gesendet. (Demo: Token wird direkt zurückgegeben)"
            ));
        } catch (Exception e) {
            System.err.println("[ERROR] Password reset failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(@RequestBody VerifyTokenRequest request) {
        try {
            userService.verifyResetToken(request.token());
            return ResponseEntity.ok("Token ist gültig");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            userService.resetPassword(request.token(), request.newPassword());
            return ResponseEntity.ok("Passwort wurde erfolgreich zurückgesetzt");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DEBUG endpoint - remove in production
    @GetMapping("/debug/list-emails")
    public ResponseEntity<?> listEmails() {
        return ResponseEntity.ok(userService.getAllEmails());
    }
}

// Request/Response records
record RegisterResponse(Long id, String message, String email) {}
record PasswordResetRequest(String email) {}
record PasswordResetTokenResponse(String token, String message) {}
record VerifyTokenRequest(String token) {}
record ResetPasswordRequest(String token, String newPassword) {}
