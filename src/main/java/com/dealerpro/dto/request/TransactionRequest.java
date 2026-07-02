package com.dealerpro.dto.request;

import com.dealerpro.entity.enums.PaymentMode;
import com.dealerpro.entity.enums.TransactionType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionRequest {

    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    private Long stockId;

    @NotBlank(message = "Item name is required")
    private String itemName;

    private String sku;

    @NotBlank(message = "Party name is required")
    private String partyName;

    private String partyPhone;
    private String partyGstin;

    @NotNull(message = "Amount is required")
    @DecimalMin("0.0")
    private BigDecimal amount;

    private BigDecimal discount   = BigDecimal.ZERO;
    private BigDecimal taxAmount  = BigDecimal.ZERO;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    private String invoiceNo;
    private PaymentMode paymentMode = PaymentMode.CASH;
    private String notes;
}
