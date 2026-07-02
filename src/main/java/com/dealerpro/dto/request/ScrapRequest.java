package com.dealerpro.dto.request;

import com.dealerpro.entity.enums.ScrapStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ScrapRequest {
    @NotBlank private String itemName;
    private String sku;
    private String barcode;
    private BigDecimal estimatedValue = BigDecimal.ZERO;
    private BigDecimal soldValue;
    private ScrapStatus status = ScrapStatus.TAGGED_FOR_SALE;
    @NotNull private LocalDate scrapDate;
    private String source;
    private String buyerName;
    private String notes;
}
