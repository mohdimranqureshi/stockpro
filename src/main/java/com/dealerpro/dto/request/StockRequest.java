package com.dealerpro.dto.request;

import com.dealerpro.entity.enums.StockStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class StockRequest {

    @NotBlank(message = "Item name is required")
    @Size(max = 200)
    private String itemName;

    @NotBlank(message = "SKU is required")
    @Size(max = 100)
    private String sku;

    @NotNull(message = "Rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rate must be positive")
    private BigDecimal rate;

    @Size(max = 100)
    private String category;

    @Size(max = 100)
    private String brand;

    private StockStatus status = StockStatus.AVAILABLE;

    private String barcode;
    private String unit = "PCS";
    private Integer quantity = 1;
    private String hsnCode;
    private LocalDate purchaseDate;
    private String supplier;
    private String location;
    private String notes;
}
