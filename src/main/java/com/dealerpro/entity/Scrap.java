package com.dealerpro.entity;

import com.dealerpro.entity.enums.ScrapStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "scrap")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Scrap extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(length = 100)
    private String sku;

    @Column(length = 100)
    private String barcode;

    @Column(name = "estimated_value", precision = 12, scale = 2)
    private BigDecimal estimatedValue = BigDecimal.ZERO;

    @Column(name = "sold_value", precision = 12, scale = 2)
    private BigDecimal soldValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private ScrapStatus status = ScrapStatus.TAGGED_FOR_SALE;

    @Column(name = "scrap_date", nullable = false)
    private LocalDate scrapDate;

    @Column(length = 100)
    private String source;

    @Column(name = "buyer_name", length = 150)
    private String buyerName;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
