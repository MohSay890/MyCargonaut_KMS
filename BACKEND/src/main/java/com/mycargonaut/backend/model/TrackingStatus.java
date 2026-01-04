package com.mycargonaut.backend.model;

/**
 * Enum for tracking status states
 */
public enum TrackingStatus {
    WAITING("Warten auf Abholung", "🕐"),
    PICKED_UP("Abgeholt", "📦"),
    IN_TRANSIT("Unterwegs", "🚚"),
    NEAR_DESTINATION("Fast am Ziel", "📍"),
    DELIVERED("Zugestellt", "✅"),
    CANCELLED("Storniert", "❌");
    
    private final String label;
    private final String icon;
    
    TrackingStatus(String label, String icon) {
        this.label = label;
        this.icon = icon;
    }
    
    public String getLabel() {
        return label;
    }
    
    public String getIcon() {
        return icon;
    }
}
