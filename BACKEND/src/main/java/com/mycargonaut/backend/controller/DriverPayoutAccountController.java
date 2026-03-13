package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.DriverPayoutAccount;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.repository.DriverPayoutAccountRepository;
import com.mycargonaut.backend.repository.CargonautRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/driver-payout-accounts")
@CrossOrigin(origins = "*")
public class DriverPayoutAccountController {

    @Autowired
    private DriverPayoutAccountRepository driverPayoutAccountRepository;
    
    @Autowired
    private CargonautRepository cargonautRepository;

    /**
     * Get driver payout account
     */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getByDriverId(@PathVariable Long driverId) {
        Optional<DriverPayoutAccount> account = driverPayoutAccountRepository.findByDriverId(driverId);
        if (account.isPresent()) {
            return ResponseEntity.ok(account.get());
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Create or update driver payout account
     */
    @PostMapping("/driver/{driverId}")
    public ResponseEntity<?> createOrUpdate(@PathVariable Long driverId, @RequestBody DriverPayoutAccount accountData) {
        Cargonaut driver = cargonautRepository.findById(driverId)
            .orElseThrow(() -> new RuntimeException("Driver not found"));
        
        Optional<DriverPayoutAccount> existingOpt = driverPayoutAccountRepository.findByDriverId(driverId);
        
        DriverPayoutAccount account;
        if (existingOpt.isPresent()) {
            // Update existing
            account = existingOpt.get();
        } else {
            // Create new
            account = new DriverPayoutAccount();
            account.setDriver(driver);
        }
        
        account.setAccountHolderName(accountData.getAccountHolderName());
        account.setIban(accountData.getIban());
        account.setBic(accountData.getBic());
        account.setBankName(accountData.getBankName());
        account.setIsActive(true);
        account.setIsVerified(false); // Admin must verify
        
        DriverPayoutAccount saved = driverPayoutAccountRepository.save(account);
        return ResponseEntity.ok(saved);
    }

    /**
     * Delete driver payout account
     */
    @DeleteMapping("/{accountId}")
    public ResponseEntity<?> delete(@PathVariable Long accountId) {
        driverPayoutAccountRepository.deleteById(accountId);
        return ResponseEntity.ok().build();
    }
}
