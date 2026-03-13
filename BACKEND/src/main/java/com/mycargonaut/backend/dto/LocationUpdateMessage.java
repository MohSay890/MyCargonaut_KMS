package com.mycargonaut.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationUpdateMessage {
    private Long fahrtId;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double heading;
    private Long timestamp; // Epoch millisecond
}
