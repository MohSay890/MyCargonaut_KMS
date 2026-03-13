package com.mycargonaut.backend.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * PricingService - Calculates transport prices based on weight, distance, and category
 */
@Service
public class PricingService {

    // Base pricing constants
    private static final BigDecimal BASE_PRICE = new BigDecimal("25.00"); // Base fee
    private static final BigDecimal PRICE_PER_KG = new BigDecimal("0.50"); // €0.50 per kg
    private static final BigDecimal PRICE_PER_KM = new BigDecimal("0.80"); // €0.80 per km

    // Category multipliers
    private static final BigDecimal MOEBEL_MULTIPLIER = new BigDecimal("1.2");     // +20% for furniture
    private static final BigDecimal UMZUG_MULTIPLIER = new BigDecimal("1.5");      // +50% for moving
    private static final BigDecimal PAKETE_MULTIPLIER = new BigDecimal("1.0");     // Standard for packages
    private static final BigDecimal SONSTIGES_MULTIPLIER = new BigDecimal("1.1");  // +10% for other

    /**
     * Calculate transport price based on weight, distance, and category
     * 
     * Formula: (BASE_PRICE + (weight * PRICE_PER_KG) + (distance * PRICE_PER_KM)) * categoryMultiplier
     * 
     * @param gewicht Weight in kg
     * @param entfernungKm Distance in km
     * @param kategorie Category (Möbel, Umzug, Pakete, Sonstiges)
     * @return Calculated price
     */
    public BigDecimal calculatePrice(Double gewicht, Double entfernungKm, String kategorie) {
        if (gewicht == null || gewicht <= 0) {
            gewicht = 0.0;
        }
        if (entfernungKm == null || entfernungKm <= 0) {
            entfernungKm = 0.0;
        }

        // Calculate base components
        BigDecimal weightCost = PRICE_PER_KG.multiply(BigDecimal.valueOf(gewicht));
        BigDecimal distanceCost = PRICE_PER_KM.multiply(BigDecimal.valueOf(entfernungKm));
        
        // Calculate subtotal
        BigDecimal subtotal = BASE_PRICE.add(weightCost).add(distanceCost);
        
        // Apply category multiplier
        BigDecimal categoryMultiplier = getCategoryMultiplier(kategorie);
        BigDecimal totalPrice = subtotal.multiply(categoryMultiplier);
        
        // Round to 2 decimal places
        return totalPrice.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Get price breakdown for display
     */
    public PriceBreakdown calculatePriceBreakdown(Double gewicht, Double entfernungKm, String kategorie) {
        if (gewicht == null || gewicht <= 0) gewicht = 0.0;
        if (entfernungKm == null || entfernungKm <= 0) entfernungKm = 0.0;

        BigDecimal weightCost = PRICE_PER_KG.multiply(BigDecimal.valueOf(gewicht))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal distanceCost = PRICE_PER_KM.multiply(BigDecimal.valueOf(entfernungKm))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotal = BASE_PRICE.add(weightCost).add(distanceCost)
                .setScale(2, RoundingMode.HALF_UP);
        
        BigDecimal categoryMultiplier = getCategoryMultiplier(kategorie);
        BigDecimal totalPrice = subtotal.multiply(categoryMultiplier)
                .setScale(2, RoundingMode.HALF_UP);

        return new PriceBreakdown(
            BASE_PRICE,
            weightCost,
            distanceCost,
            subtotal,
            categoryMultiplier,
            totalPrice,
            kategorie
        );
    }

    /**
     * Get category multiplier
     */
    private BigDecimal getCategoryMultiplier(String kategorie) {
        if (kategorie == null) {
            return PAKETE_MULTIPLIER;
        }
        
        String lowerKat = kategorie.toLowerCase();
        
        if (lowerKat.contains("möbel") || lowerKat.contains("mobel")) {
            return MOEBEL_MULTIPLIER;
        } else if (lowerKat.contains("umzug")) {
            return UMZUG_MULTIPLIER;
        } else if (lowerKat.contains("paket")) {
            return PAKETE_MULTIPLIER;
        } else if (lowerKat.contains("sonstiges") || lowerKat.contains("andere")) {
            return SONSTIGES_MULTIPLIER;
        }
        
        return PAKETE_MULTIPLIER; // Default
    }

    /**
     * Extract distance in km from string like "150 km" or "150km"
     */
    public Double extractDistanceKm(String entfernungStr) {
        if (entfernungStr == null || entfernungStr.trim().isEmpty()) {
            return 0.0;
        }
        
        try {
            // Remove " km", "km", spaces, and parse
            String cleaned = entfernungStr.toLowerCase()
                    .replace("km", "")
                    .replace(",", ".")
                    .trim();
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    /**
     * Price breakdown data class
     */
    public static class PriceBreakdown {
        private final BigDecimal basePrice;
        private final BigDecimal weightCost;
        private final BigDecimal distanceCost;
        private final BigDecimal subtotal;
        private final BigDecimal categoryMultiplier;
        private final BigDecimal totalPrice;
        private final String category;

        public PriceBreakdown(BigDecimal basePrice, BigDecimal weightCost, BigDecimal distanceCost,
                            BigDecimal subtotal, BigDecimal categoryMultiplier, 
                            BigDecimal totalPrice, String category) {
            this.basePrice = basePrice;
            this.weightCost = weightCost;
            this.distanceCost = distanceCost;
            this.subtotal = subtotal;
            this.categoryMultiplier = categoryMultiplier;
            this.totalPrice = totalPrice;
            this.category = category;
        }

        // Getters
        public BigDecimal getBasePrice() { return basePrice; }
        public BigDecimal getWeightCost() { return weightCost; }
        public BigDecimal getDistanceCost() { return distanceCost; }
        public BigDecimal getSubtotal() { return subtotal; }
        public BigDecimal getCategoryMultiplier() { return categoryMultiplier; }
        public BigDecimal getTotalPrice() { return totalPrice; }
        public String getCategory() { return category; }
    }
}
