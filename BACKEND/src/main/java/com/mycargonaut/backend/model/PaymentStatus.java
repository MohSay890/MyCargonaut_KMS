package com.mycargonaut.backend.model;

public enum PaymentStatus {
    PENDING("Ausstehend"),
    PROCESSING("Wird verarbeitet"),
    COMPLETED("Abgeschlossen"),
    FAILED("Fehlgeschlagen"),
    REFUNDED("Rückerstattet");
    
    private final String label;
    
    PaymentStatus(String label) {
        this.label = label;
    }
    
    public String getLabel() {
        return label;
    }
}
