package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Fahrt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FahrtRepository extends JpaRepository<Fahrt, Long> {
    // Die Suchlogik für den Kollegen
    List<Fahrt> findByStartOrtAndZielOrt(String start, String ziel);
}
