package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER) // Eager sorgt dafür, dass der Empfänger sofort geladen wird
    @JoinColumn(name = "empfaenger_id", nullable = false) // nullable = false verhindert NULL-Einträge in der DB
    private Cargonaut empfaenger;

    private String titel;
    private String nachricht;
    private String typ;
    private LocalDateTime zeitstempel = LocalDateTime.now();
    private boolean gelesen = false;
}
