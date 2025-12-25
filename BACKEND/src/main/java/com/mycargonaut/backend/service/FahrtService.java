package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.repository.FahrtRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FahrtService {
    private final FahrtRepository fahrtRepo;

    public FahrtService(FahrtRepository fahrtRepo) {
        this.fahrtRepo = fahrtRepo;
    }

    public List<Fahrt> sucheFahrten(String start, String ziel) {
        return fahrtRepo.findByStartOrtAndZielOrt(start, ziel); // Exakt nach UML
    }

    public Fahrt createFahrt(Fahrt fahrt) {
        return fahrtRepo.save(fahrt);
    }
}
