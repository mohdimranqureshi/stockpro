package com.dealerpro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hsn_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HsnMaster {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "hsn_code", nullable = false, unique = true, length = 20)
	private String hsnCode;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String description;
}
