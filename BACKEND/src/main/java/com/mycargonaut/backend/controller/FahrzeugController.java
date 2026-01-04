package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Fahrzeug;
import com.mycargonaut.backend.repository.FahrzeugRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/fahrzeuge")
@CrossOrigin(origins = "*")
public class FahrzeugController {

    @Autowired
    private FahrzeugRepository fahrzeugRepository;

    /**
     * Get all vehicles for a specific user (by email)
     */
    @GetMapping
    public ResponseEntity<List<Fahrzeug>> getVehiclesByEmail(@RequestParam String email) {
        try {
            List<Fahrzeug> vehicles = fahrzeugRepository.findByBesitzerEmail(email);
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific vehicle by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Fahrzeug> getVehicleById(@PathVariable Long id, @RequestParam String email) {
        try {
            Optional<Fahrzeug> vehicle = fahrzeugRepository.findByIdAndBesitzerEmail(id, email);
            return vehicle.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new vehicle
     */
    @PostMapping
    public ResponseEntity<Fahrzeug> createVehicle(@RequestBody Fahrzeug fahrzeug) {
        try {
            // Validate required fields
            if (fahrzeug.getBesitzerEmail() == null || fahrzeug.getBesitzerEmail().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            Fahrzeug savedVehicle = fahrzeugRepository.save(fahrzeug);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedVehicle);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update an existing vehicle
     */
    @PutMapping("/{id}")
    public ResponseEntity<Fahrzeug> updateVehicle(
            @PathVariable Long id,
            @RequestParam String email,
            @RequestBody Fahrzeug fahrzeugDetails) {
        try {
            Optional<Fahrzeug> optionalVehicle = fahrzeugRepository.findByIdAndBesitzerEmail(id, email);
            
            if (optionalVehicle.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Fahrzeug existingVehicle = optionalVehicle.get();
            
            // Update fields
            existingVehicle.setMarke(fahrzeugDetails.getMarke());
            existingVehicle.setModell(fahrzeugDetails.getModell());
            existingVehicle.setKennzeichen(fahrzeugDetails.getKennzeichen());
            existingVehicle.setBaujahr(fahrzeugDetails.getBaujahr());
            existingVehicle.setKapazitaet(fahrzeugDetails.getKapazitaet());
            existingVehicle.setMaxGewicht(fahrzeugDetails.getMaxGewicht());
            existingVehicle.setHatKuehlung(fahrzeugDetails.isHatKuehlung());
            existingVehicle.setTyp(fahrzeugDetails.getTyp());
            existingVehicle.setAbmessungen(fahrzeugDetails.getAbmessungen());
            existingVehicle.setVersicherung(fahrzeugDetails.getVersicherung());
            existingVehicle.setIstAktiv(fahrzeugDetails.isIstAktiv());
            
            Fahrzeug updatedVehicle = fahrzeugRepository.save(existingVehicle);
            return ResponseEntity.ok(updatedVehicle);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a vehicle (soft delete by setting istAktiv to false)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id, @RequestParam String email) {
        try {
            Optional<Fahrzeug> optionalVehicle = fahrzeugRepository.findByIdAndBesitzerEmail(id, email);
            
            if (optionalVehicle.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Fahrzeug vehicle = optionalVehicle.get();
            vehicle.setIstAktiv(false);
            fahrzeugRepository.save(vehicle);
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Permanently delete a vehicle (hard delete)
     */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentlyDeleteVehicle(@PathVariable Long id, @RequestParam String email) {
        try {
            Optional<Fahrzeug> optionalVehicle = fahrzeugRepository.findByIdAndBesitzerEmail(id, email);
            
            if (optionalVehicle.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            fahrzeugRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
