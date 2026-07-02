package com.dealerpro.dto.response;

import com.dealerpro.entity.enums.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// ── Auth ──────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserResponse user;
}

// ── User ──────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class UserResponse {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private boolean active;
}

// ── Stock ─────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class StockResponse {
    private Long id;
    private String itemName;
    private String serialNo;
    private BigDecimal rate;
    private String warranty;
    private StockStatus status;
    private String color;
    private String variant;
    private String engineNo;
    private String chassisNo;
    private String hsnCode;
    private LocalDate purchaseDate;
    private String supplier;
    private String notes;
    private LocalDateTime createdAt;
}

// ── Transaction ───────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class TransactionResponse {
    private Long id;
    private TransactionType type;
    private Long stockId;
    private String itemName;
    private String serialNo;
    private String partyName;
    private String partyPhone;
    private String partyGstin;
    private BigDecimal amount;
    private BigDecimal discount;
    private BigDecimal taxAmount;
    private BigDecimal finalAmount;
    private LocalDate transactionDate;
    private String invoiceNo;
    private PaymentMode paymentMode;
    private String notes;
    private LocalDateTime createdAt;
}

// ── Payment ───────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class PaymentResponse {
    private Long id;
    private FlowType flowType;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String partyName;
    private PaymentMode paymentMode;
    private String referenceNo;
    private Long transactionId;
    private String category;
    private String notes;
    private LocalDateTime createdAt;
}

// ── Replacement ───────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ReplacementResponse {
    private Long id;
    private String customerName;
    private String customerPhone;
    private Long givenStockId;
    private String givenModel;
    private String givenSerialNo;
    private BigDecimal givenValue;
    private String receivedModel;
    private String receivedSerialNo;
    private BigDecimal receivedValue;
    private BigDecimal differenceAmount;
    private LocalDate replacementDate;
    private String notes;
    private LocalDateTime createdAt;
}

// ── Scrap ─────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ScrapResponse {
    private Long id;
    private String itemName;
    private String serialNo;
    private String registrationNo;
    private BigDecimal estimatedValue;
    private BigDecimal soldValue;
    private ScrapStatus status;
    private LocalDate scrapDate;
    private String source;
    private String buyerName;
    private String notes;
    private LocalDateTime createdAt;
}

// ── Dashboard ─────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class DashboardResponse {
    private long totalStock;
    private long availableStock;
    private long soldStock;
    private BigDecimal totalSalesRevenue;
    private BigDecimal totalPurchaseCost;
    private BigDecimal netProfitLoss;
    private BigDecimal totalInflow;
    private BigDecimal totalOutflow;
    private long totalReplacements;
    private long scrapTagged;
}

// ── P&L Row ───────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ProfitLossRow {
    private String month;
    private BigDecimal sales;
    private BigDecimal purchases;
    private BigDecimal profitLoss;
}
