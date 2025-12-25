package com.mycargonaut.backend.user;

import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.user.api.RegisterRequest;
// WICHTIG: Dieser Import hat gefehlt, da das Repository jetzt in einem anderen Ordner liegt
import com.mycargonaut.backend.repository.CargonautRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (cargonautRepository.findByEmail(request.primaryEmail()).isPresent()) {
            throw new RuntimeException("Benutzer mit dieser Email existiert bereits.");
        }

        Cargonaut cargonaut = new Cargonaut();
        cargonaut.setVorname(request.firstName()); // laut UML
        cargonaut.setNachname(request.lastName()); // laut UML
        cargonaut.setEmail(request.primaryEmail()); // laut UML
        cargonaut.setGeburtsdatum(request.dateOfBirth()); // laut UML
        cargonaut.setPasswort(passwordEncoder.encode(request.password())); // laut UML

        cargonaut.setStadt(request.stadt());
        cargonaut.setPlz(request.plz());

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
}
