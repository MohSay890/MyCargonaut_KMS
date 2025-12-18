package com.mycargonaut.backend.user;

import com.mycargonaut.backend.user.api.RegisterRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerUser(RegisterRequest request) {
        if (userRepository.findByPrimaryEmail(request.primaryEmail()).isPresent()) {
            throw new RuntimeException("Benutzer mit dieser Email existiert bereits.");
        }

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPrimaryEmail(request.primaryEmail());
        user.setSecondaryEmail(request.secondaryEmail());
        user.setDateOfBirth(request.dateOfBirth());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        return userRepository.save(user);
    }

    // --- NEU: Diese Methode hat gefehlt ---
    public User loginUser(String email, String rawPassword) {
        // 1. Suche User in DB
        User user = userRepository.findByPrimaryEmail(email)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden."));

        // 2. Vergleiche Passwörter (Eingegeben vs. Datenbank-Hash)
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new RuntimeException("Falsches Passwort!");
        }

        return user;
    }
}
