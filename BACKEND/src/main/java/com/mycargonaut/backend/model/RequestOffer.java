package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents an offer from a driver responding to a transport request
 */
@Entity
@Table(name = "request_offers")
public class RequestOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    // Driver information
    @Column(name = "driver_name", nullable = false)
    private String driverName;

    @Column(name = "driver_email", nullable = false)
    private String driverEmail;

    @Column(name = "driver_avatar")
    private String driverAvatar;

    @Column(name = "driver_rating")
    private Double driverRating;

    // Offer details
    @Column(name = "angebotspreis", nullable = false)
    private BigDecimal angebotspreis;

    @Column(name = "nachricht", columnDefinition = "TEXT")
    private String nachricht;

    // Vehicle details
    @Column(name = "fahrzeugtyp")
    private String fahrzeugtyp;

    @Column(name = "fahrzeugmarke")
    private String fahrzeugmarke;

    // Offer status
    @Column(name = "status", nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    @Column(name = "erstellt_am")
    private LocalDate erstelltAm;

    @Column(name = "beantwortet_am")
    private LocalDate beantwortetAm;

    // Constructors
    public RequestOffer() {
        this.erstelltAm = LocalDate.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverEmail() {
        return driverEmail;
    }

    public void setDriverEmail(String driverEmail) {
        this.driverEmail = driverEmail;
    }

    public String getDriverAvatar() {
        return driverAvatar;
    }

    public void setDriverAvatar(String driverAvatar) {
        this.driverAvatar = driverAvatar;
    }

    public Double getDriverRating() {
        return driverRating;
    }

    public void setDriverRating(Double driverRating) {
        this.driverRating = driverRating;
    }

    public BigDecimal getAngebotspreis() {
        return angebotspreis;
    }

    public void setAngebotspreis(BigDecimal angebotspreis) {
        this.angebotspreis = angebotspreis;
    }

    public String getNachricht() {
        return nachricht;
    }

    public void setNachricht(String nachricht) {
        this.nachricht = nachricht;
    }

    public String getFahrzeugtyp() {
        return fahrzeugtyp;
    }

    public void setFahrzeugtyp(String fahrzeugtyp) {
        this.fahrzeugtyp = fahrzeugtyp;
    }

    public String getFahrzeugmarke() {
        return fahrzeugmarke;
    }

    public void setFahrzeugmarke(String fahrzeugmarke) {
        this.fahrzeugmarke = fahrzeugmarke;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getErstelltAm() {
        return erstelltAm;
    }

    public void setErstelltAm(LocalDate erstelltAm) {
        this.erstelltAm = erstelltAm;
    }

    public LocalDate getBeantwortetAm() {
        return beantwortetAm;
    }

    public void setBeantwortetAm(LocalDate beantwortetAm) {
        this.beantwortetAm = beantwortetAm;
    }
}
