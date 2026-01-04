package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Fahrzeug;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FahrzeugRepository extends JpaRepository<Fahrzeug, Long> {
    
    /**
     * Find all vehicles by owner email
     */
    List<Fahrzeug> findByBesitzerEmail(String besitzerEmail);
    
    /**
     * Find a specific vehicle by ID and owner email (for security)
     */
    Optional<Fahrzeug> findByIdAndBesitzerEmail(Long id, String besitzerEmail);
    
    /**
     * Find all active vehicles by owner email
     */
    List<Fahrzeug> findByBesitzerEmailAndIstAktiv(String besitzerEmail, boolean istAktiv);
}
