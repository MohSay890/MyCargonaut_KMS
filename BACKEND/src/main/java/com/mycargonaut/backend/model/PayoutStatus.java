package com.mycargonaut.backend.model;

/**
 * Payout Status - tracks the lifecycle of a payout transaction
 */
public enum PayoutStatus {
    PENDING("Ausstehend"),           // Payout created, waiting for processing
    SCHEDULED("Geplant"),            // Scheduled for next payout batch
    PROCESSING("Wird verarbeitet"),  // Being sent to bank
    COMPLETED("Abgeschlossen"),      // Successfully completed
    FAILED("Fehlgeschlagen"),        // Failed (e.g., invalid bank account)
    CANCELLED("Storniert");          // Cancelled (e.g., dispute)
    
    private final String label;
    
    PayoutStatus(String label) {
        this.label = label;
    }
    
    public String getLabel() {
        return label;
    }
}
