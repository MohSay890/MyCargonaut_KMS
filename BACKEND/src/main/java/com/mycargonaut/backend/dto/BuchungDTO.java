package com.mycargonaut.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuchungDTO {
    private Long fahrtId;
    private Long userId;
}
