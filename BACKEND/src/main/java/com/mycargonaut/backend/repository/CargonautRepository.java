package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Cargonaut;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CargonautRepository extends JpaRepository<Cargonaut, Long> {
    Optional<Cargonaut> findByEmail(String email);
}
