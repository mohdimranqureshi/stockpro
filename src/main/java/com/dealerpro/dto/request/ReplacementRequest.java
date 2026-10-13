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
    private String givenSku;            // serial number of item given to customer
    private String givenChallanNumber;  // challan number of item given to customer
    private BigDecimal givenValue = BigDecimal.ZERO;

    @NotBlank private String receivedItemName;
    private String receivedSku;         // serial number of item received from customer
    private BigDecimal receivedValue    = BigDecimal.ZERO;
    private BigDecimal differenceAmount = BigDecimal.ZERO;

    // Item received from company (warranty replacement / company credit)
    private String companyItemName;
    private String companySerialNumber;
    private String companyChallanNumber;

    @NotNull private LocalDate replacementDate;
    private String notes;
}
