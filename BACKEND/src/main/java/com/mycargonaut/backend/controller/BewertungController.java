package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Bewertung;
import com.mycargonaut.backend.service.BewertungService;
import com.mycargonaut.backend.repository.BewertungRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bewertungen")
public class BewertungController {

    @Autowired
    private BewertungService bewertungService;

    @Autowired
    private BewertungRepository bewertungRepository;

    @PostMapping
    public ResponseEntity<Bewertung> erstelleBewertung(@RequestBody Bewertung bewertung) {
        return ResponseEntity.ok(bewertungService.speichereBewertung(bewertung));
    }

    @GetMapping("/nutzer/{id}")
    public ResponseEntity<List<Bewertung>> holeNutzerBewertungen(@PathVariable Long id) {
        return ResponseEntity.ok(bewertungRepository.findByBewerteterNutzerIdAndIstSichtbarTrue(id));
    }
}
