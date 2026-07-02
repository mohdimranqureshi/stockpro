package com.dealerpro.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ReplacementRequest {
    @NotBlank private String customerName;
    private String customerPhone;
    private Long givenStockId;

    @NotBlank private String givenItemName;
    private String givenSku;
    private BigDecimal givenValue = BigDecimal.ZERO;

    @NotBlank private String receivedItemName;
    private String receivedSku;
    private BigDecimal receivedValue    = BigDecimal.ZERO;
    private BigDecimal differenceAmount = BigDecimal.ZERO;

    @NotNull private LocalDate replacementDate;
    private String notes;
}
