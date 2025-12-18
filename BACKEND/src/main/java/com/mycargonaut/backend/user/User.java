package com.mycargonaut.backend.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "users") // "user" ist in Postgres oft ein reserviertes Wort, daher "users"
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String primaryEmail;

    private String secondaryEmail;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private LocalDate dateOfBirth;
}
