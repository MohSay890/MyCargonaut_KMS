package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Buchung;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BuchungRepository extends JpaRepository<Buchung, Long> { }
