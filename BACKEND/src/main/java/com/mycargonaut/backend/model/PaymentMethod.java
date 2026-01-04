package com.mycargonaut.backend.model;

public enum PaymentMethod {
    CREDIT_CARD("Kreditkarte"),
    PAYPAL("PayPal"),
    BANK_TRANSFER("Banküberweisung"),
    CASH("Barzahlung");
    
    private final String label;
    
    PaymentMethod(String label) {
        this.label = label;
    }
    
    public String getLabel() {
        return label;
    }
}
