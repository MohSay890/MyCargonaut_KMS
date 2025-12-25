package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.service.BuchungService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/buchungen")
public class BuchungController {

    private final BuchungService buchungService;

    public BuchungController(BuchungService buchungService) {
        this.buchungService = buchungService;
    }

    @PostMapping
    public ResponseEntity<?> buchen(@RequestParam Long fahrtId, @RequestParam Long userId) {
        return ResponseEntity.ok(buchungService.createBuchung(fahrtId, userId));
    }
}
