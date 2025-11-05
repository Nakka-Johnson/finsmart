package com.finsmart.config;

import org.mapstruct.InjectionStrategy;
import org.mapstruct.MapperConfig;
import org.mapstruct.NullValueCheckStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Global MapStruct configuration for all mappers.
 *
 * <p>This configuration is applied to all mappers in the application by referencing it with
 * {@code @Mapper(config = MapStructConfig.class)}.
 */
@MapperConfig(
    componentModel = "spring",
    injectionStrategy = InjectionStrategy.CONSTRUCTOR,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS,
    unmappedTargetPolicy = ReportingPolicy.WARN)
public interface MapStructConfig {}
