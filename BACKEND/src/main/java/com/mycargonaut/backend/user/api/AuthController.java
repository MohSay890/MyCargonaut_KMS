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
            return ResponseEntity.ok("Cargonaut registriert mit ID: " + cargonaut.getId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // 1. Login prüfen über das neue Modell
            Cargonaut cargonaut = userService.loginUser(request.primaryEmail(), request.password());

            // 2. Token generieren mit 'getEmail()' statt 'getPrimaryEmail()' laut UML
            String token = jwtService.generateToken(cargonaut.getEmail());

            // 3. Token zurückgeben
            return ResponseEntity.ok(new LoginResponse(token));

        } catch (Exception e) {
            // 401 Unauthorized bei falschen Daten
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}
