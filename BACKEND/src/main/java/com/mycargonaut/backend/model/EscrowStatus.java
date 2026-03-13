package com.mycargonaut.backend.model;

/**
 * Escrow Status for Payment
 * 
 * HELD: Money is held by platform (escrow), waiting for trip completion
 * RELEASED: Money has been released to driver after trip completion  
 * FAILED: Escrow hold failed (payment processing issue)
 * REFUNDED: Money has been refunded to passenger (trip cancelled/failed)
 */
public enum EscrowStatus {
    HELD("Gehalten"),
    RELEASED("Freigegeben"),
    FAILED("Fehlgeschlagen"),
    REFUNDED("Rückerstattet");
    
    private final String label;
    
    EscrowStatus(String label) {
        this.label = label;
    }
    
    public String getLabel() {
        return label;
    }
}
