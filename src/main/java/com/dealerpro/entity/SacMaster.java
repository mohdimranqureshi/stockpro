package com.dealerpro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sac_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SacMaster {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "sac_code", nullable = false, unique = true, length = 20)
	private String sacCode;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String description;
}
