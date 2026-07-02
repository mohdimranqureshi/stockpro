package com.dealerpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "replacements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Replacement extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_phone", length = 15)
    private String customerPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "given_stock_id")
    private Stock givenStock;

    @Column(name = "given_item_name", nullable = false, length = 200)
    private String givenItemName;

    @Column(name = "given_sku", length = 100)
    private String givenSku;

    @Column(name = "given_value", precision = 12, scale = 2)
    private BigDecimal givenValue = BigDecimal.ZERO;

    @Column(name = "received_item_name", nullable = false, length = 200)
    private String receivedItemName;

    @Column(name = "received_sku", length = 100)
    private String receivedSku;

    @Column(name = "received_value", precision = 12, scale = 2)
    private BigDecimal receivedValue = BigDecimal.ZERO;

    @Column(name = "difference_amount", precision = 12, scale = 2)
    private BigDecimal differenceAmount = BigDecimal.ZERO;

    @Column(name = "replacement_date", nullable = false)
    private LocalDate replacementDate;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
