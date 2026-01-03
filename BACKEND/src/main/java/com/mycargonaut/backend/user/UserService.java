package com.mycargonaut.backend.user;

import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.user.api.RegisterRequest;
// WICHTIG: Dieser Import hat gefehlt, da das Repository jetzt in einem anderen Ordner liegt
import com.mycargonaut.backend.repository.CargonautRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class UserService {

    private final CargonautRepository cargonautRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(CargonautRepository cargonautRepository, PasswordEncoder passwordEncoder) {
        this.cargonautRepository = cargonautRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Cargonaut registerUser(RegisterRequest request) {
        // Convert email to lowercase for case-insensitive storage and comparison
        String normalizedEmail = request.primaryEmail().toLowerCase().trim();

        if (cargonautRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new RuntimeException("Benutzer mit dieser Email existiert bereits.");
        }

        Cargonaut cargonaut = new Cargonaut();
        cargonaut.setVorname(request.firstName()); // laut UML
        cargonaut.setNachname(request.lastName()); // laut UML
        cargonaut.setEmail(normalizedEmail); // laut UML - stored as lowercase
        cargonaut.setGeburtsdatum(request.dateOfBirth()); // laut UML
        cargonaut.setPasswort(passwordEncoder.encode(request.password())); // laut UML
        cargonaut.setHandynummer(request.phone()); // Telefonnummer

        cargonaut.setStadt(request.stadt());
        cargonaut.setPlz(request.plz());

        // Set registration date
        cargonaut.setRegistriert(LocalDate.now());

        return cargonautRepository.save(cargonaut);
    }

    public Cargonaut loginUser(String email, String rawPassword) {
        Cargonaut cargonaut = cargonautRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden."));

        if (!passwordEncoder.matches(rawPassword, cargonaut.getPasswort())) {
            throw new RuntimeException("Falsches Passwort!");
        }

        return cargonaut;
    }

    /**
     * Request password reset - generates token and stores it
     * @param email The user's email
     * @return Reset token (in real app, this would be sent via email)
     */
    @Transactional
    public String requestPasswordReset(String email) {
        // Normalize email for case-insensitive lookup
        String normalizedEmail = email.toLowerCase().trim();
        System.out.println("[DEBUG] Password reset requested for email: " + normalizedEmail);

        Cargonaut cargonaut = cargonautRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    System.out.println("[DEBUG] User not found with email: " + email);
                    return new RuntimeException("Benutzer mit dieser Email existiert nicht.");
                });

        System.out.println("[DEBUG] User found: " + cargonaut.getEmail());

        // Generate unique token
        String resetToken = UUID.randomUUID().toString();

        // Set expiry to 24 hours from now
        cargonaut.setResetToken(resetToken);
        cargonaut.setResetTokenExpiry(LocalDate.now().plusDays(1));

        cargonautRepository.save(cargonaut);

        System.out.println("[DEBUG] Reset token generated: " + resetToken);

        // In production, send email with reset link containing this token
        // For now, we return it directly
        return resetToken;
    }

    /**
     * Verify reset token validity
     * @param token The reset token
     * @return The user if token is valid
     */
    public Cargonaut verifyResetToken(String token) {
        Cargonaut cargonaut = cargonautRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Ungültiger oder abgelaufener Reset-Token."));

        // Check if token is expired
        if (cargonaut.getResetTokenExpiry() == null ||
            cargonaut.getResetTokenExpiry().isBefore(LocalDate.now())) {
            throw new RuntimeException("Reset-Token ist abgelaufen.");
        }

        return cargonaut;
    }

    /**
     * Reset password using valid token
     * @param token The reset token
     * @param newPassword The new password
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        Cargonaut cargonaut = verifyResetToken(token);

        // Update password
        cargonaut.setPasswort(passwordEncoder.encode(newPassword));

        // Clear reset token
        cargonaut.setResetToken(null);
        cargonaut.setResetTokenExpiry(null);

        cargonautRepository.save(cargonaut);
    }

    // DEBUG method - remove in production
    public java.util.List<String> getAllEmails() {
        return cargonautRepository.findAll().stream()
                .map(c -> c.getEmail())
                .collect(java.util.stream.Collectors.toList());
    }
}
