package com.dealerpro.dto.request;

import com.dealerpro.entity.enums.FlowType;
import com.dealerpro.entity.enums.PaymentMode;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentRequest {
    @NotNull private FlowType flowType;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotNull private LocalDate paymentDate;
    @NotBlank private String partyName;
    @NotNull private PaymentMode paymentMode;
    private String referenceNo;
    private Long transactionId;
    private String category = "PRODUCT";
    private String notes;
}
