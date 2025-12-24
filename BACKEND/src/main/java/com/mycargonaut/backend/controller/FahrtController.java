package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.repository.FahrtRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/fahrten")
public class FahrtController {

    private final FahrtRepository fahrtRepository;

    // Konstruktor-Injektion des Repositories
    public FahrtController(FahrtRepository fahrtRepository) {
        this.fahrtRepository = fahrtRepository;
    }

    // Endpunkt: Alle Fahrten anzeigen
    @GetMapping
    public List<Fahrt> getAllFahrten() {
        return fahrtRepository.findAll();
    }

    // Endpunkt: Suche nach Start und Ziel (für die Suchlogik des Kollegen)
    @GetMapping("/suche")
    public List<Fahrt> sucheFahrten(@RequestParam String start, @RequestParam String ziel) {
        return fahrtRepository.findByStartOrtAndZielOrt(start, ziel);
    }
}
