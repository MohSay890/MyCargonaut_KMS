package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.service.BuchungService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.mycargonaut.backend.dto.BuchungDTO;

@RestController
@RequestMapping("/api/fahrten/buchungen")
public class BuchungController {

    private final BuchungService buchungService;

    public BuchungController(BuchungService buchungService) {
        this.buchungService = buchungService;
    }

    @PostMapping
    public ResponseEntity<?> buchen(@RequestBody BuchungDTO request) {
        // Diese Zeile erscheint in deinem WebStorm/Terminal-Fenster
        System.out.println("--- EINGEHENDE BUCHUNG ---");
        System.out.println("Fahrt-ID: " + request.getFahrtId());
        System.out.println("User-ID: " + request.getUserId());
        System.out.println("---------------------------");

        return ResponseEntity.ok(buchungService.createBuchung(
            request.getFahrtId(),
            request.getUserId()
        ));
    }
}
