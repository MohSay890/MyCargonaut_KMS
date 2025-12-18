package com.mycargonaut.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // Damit können wir prüfen, ob eine E-Mail schon existiert
    Optional<User> findByPrimaryEmail(String primaryEmail);
}
