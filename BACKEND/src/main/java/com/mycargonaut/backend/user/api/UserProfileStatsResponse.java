package com.mycargonaut.backend.user.api;

import java.math.BigDecimal;

public record UserProfileStatsResponse(
    int activeOffers,
    int completedTrips,
    double averageRating,
    BigDecimal earnings,
    int totalReviews
) {}
