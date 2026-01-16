package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data // Generiert automatisch setGebuchtAm, setStatus, etc.
@NoArgsConstructor
@AllArgsConstructor
public class Buchung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "fahrt_id")
    private Fahrt fahrt;

    @ManyToOne
    @JoinColumn(name = "mitfahrer_id")
    private Cargonaut mitfahrer;

    // Diese beiden Felder haben gefehlt:
    private LocalDateTime gebuchtAm;
    private String status;
    private String mitfahrerEmail;
}
