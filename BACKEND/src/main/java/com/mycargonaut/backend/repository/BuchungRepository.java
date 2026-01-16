package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Buchung;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface BuchungRepository extends JpaRepository<Buchung, Long> {
    List<Buchung> findByMitfahrerEmail(String email);

    // NEU: Diese Methode wird benötigt, um den Mitfahrer einer Fahrt zu finden
    List<Buchung> findByFahrtId(Long fahrtId);

    long countByMitfahrerEmailAndFahrt_DatumAfter(String email, LocalDate date);
}
