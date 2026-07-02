package com.dealerpro.entity;

import com.dealerpro.entity.enums.PaymentMode;
import com.dealerpro.entity.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id")
    private Stock stock;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(length = 100)
    private String sku;

    @Column(name = "party_name", nullable = false, length = 150)
    private String partyName;

    @Column(name = "party_phone", length = 15)
    private String partyPhone;

    @Column(name = "party_gstin", length = 20)
    private String partyGstin;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(precision = 12, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "invoice_no", unique = true, length = 50)
    private String invoiceNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 20)
    private PaymentMode paymentMode = PaymentMode.CASH;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
