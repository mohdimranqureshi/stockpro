package com.dealerpro.entity;

import com.dealerpro.entity.enums.StockStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "stock")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Stock extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal rate;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String brand;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StockStatus status = StockStatus.AVAILABLE;

    @Column(length = 100)
    private String barcode;

    @Column(length = 30)
    private String unit = "PCS";

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "hsn_code", length = 20)
    private String hsnCode;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(length = 150)
    private String supplier;

    @Column(length = 100)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
