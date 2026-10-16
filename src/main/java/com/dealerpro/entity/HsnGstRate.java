package com.dealerpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "hsn_gst_rate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HsnGstRate {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "hsn_code", nullable = false, length = 20)
	private String hsnCode;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String description;

	@Column(name = "gst_rate", nullable = false, precision = 5, scale = 2)
	private BigDecimal gstRate;
}
