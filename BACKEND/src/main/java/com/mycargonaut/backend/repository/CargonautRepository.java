package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Cargonaut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface CargonautRepository extends JpaRepository<Cargonaut, Long> {
    Optional<Cargonaut> findByEmail(String email);
    
    @Query("SELECT c FROM Cargonaut c WHERE LOWER(c.email) = LOWER(:email)")
    Optional<Cargonaut> findByEmailIgnoreCase(@Param("email") String email);
    
    Optional<Cargonaut> findByResetToken(String resetToken);
}
