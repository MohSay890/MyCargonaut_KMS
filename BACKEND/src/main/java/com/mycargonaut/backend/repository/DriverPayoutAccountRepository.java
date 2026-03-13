package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.DriverPayoutAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverPayoutAccountRepository extends JpaRepository<DriverPayoutAccount, Long> {
    
    Optional<DriverPayoutAccount> findByDriverId(Long driverId);
    
    Optional<DriverPayoutAccount> findByDriverIdAndIsActive(Long driverId, Boolean isActive);
}
