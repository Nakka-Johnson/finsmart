package com.finsmart.service;

import com.finsmart.domain.entity.Envelope;
import com.finsmart.domain.entity.EnvelopeMove;
import com.finsmart.domain.repo.EnvelopeMoveRepository;
import com.finsmart.domain.repo.EnvelopeRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for managing envelope budgeting. */
@Slf4j
@Service
@RequiredArgsConstructor
public class EnvelopeService {

  private final EnvelopeRepository envelopeRepository;
  private final EnvelopeMoveRepository envelopeMoveRepository;

  /**
   * Get all envelopes for a user.
   *
   * @param userId user ID
   * @return list of envelopes
   */
  @Transactional(readOnly = true)
  public List<Envelope> getUserEnvelopes(UUID userId) {
    return envelopeRepository.findByUserIdOrderByName(userId);
  }

  /**
   * Get envelope by ID.
   *
   * @param userId user ID
   * @param envelopeId envelope ID
   * @return envelope
   * @throws EntityNotFoundException if envelope not found or not owned by user
   */
  @Transactional(readOnly = true)
  public Envelope getEnvelope(UUID userId, UUID envelopeId) {
    Envelope envelope =
        envelopeRepository
            .findById(envelopeId)
            .orElseThrow(() -> new EntityNotFoundException("Envelope not found: " + envelopeId));

    if (!envelope.getUserId().equals(userId)) {
      throw new EntityNotFoundException("Envelope not found: " + envelopeId);
    }

    return envelope;
  }

  /**
   * Create a new envelope.
   *
   * @param userId user ID
   * @param name envelope name
   * @param limitAmount limit amount (optional)
   * @return created envelope
   */
  @Transactional
  public Envelope createEnvelope(UUID userId, String name, BigDecimal limitAmount) {

    // Check for duplicate name
    envelopeRepository
        .findByUserIdAndName(userId, name)
        .ifPresent(
            e -> {
              throw new IllegalArgumentException("Envelope already exists with name: " + name);
            });

    Envelope envelope =
        Envelope.builder()
            .userId(userId)
            .name(name.trim())
            .limitAmount(limitAmount != null ? limitAmount : BigDecimal.ZERO)
            .build();

    return envelopeRepository.save(envelope);
  }

  /**
   * Update an existing envelope.
   *
   * @param userId user ID
   * @param envelopeId envelope ID
   * @param name new name (optional)
   * @param limitAmount new limit amount (optional)
   * @return updated envelope
   */
  @Transactional
  public Envelope updateEnvelope(
      UUID userId, UUID envelopeId, String name, BigDecimal limitAmount) {

    Envelope envelope = getEnvelope(userId, envelopeId);

    if (name != null) {
      // Check for duplicate name (excluding current envelope)
      envelopeRepository
          .findByUserIdAndName(userId, name)
          .ifPresent(
              e -> {
                if (!e.getId().equals(envelopeId)) {
                  throw new IllegalArgumentException("Envelope already exists with name: " + name);
                }
              });

      envelope.setName(name.trim());
    }

    if (limitAmount != null) {
      envelope.setLimitAmount(limitAmount);
    }

    return envelopeRepository.save(envelope);
  }

  /**
   * Delete an envelope (only if it has no movements).
   *
   * @param userId user ID
   * @param envelopeId envelope ID
   */
  @Transactional
  public void deleteEnvelope(UUID userId, UUID envelopeId) {
    Envelope envelope = getEnvelope(userId, envelopeId);

    // Check if envelope has any movements
    List<EnvelopeMove> moves =
        envelopeMoveRepository.findByFromEnvelopeIdOrToEnvelopeIdOrderByCreatedAtDesc(
            envelopeId, envelopeId);

    if (!moves.isEmpty()) {
      throw new IllegalStateException(
          "Cannot delete envelope with existing movements. Found " + moves.size() + " movements.");
    }

    envelopeRepository.delete(envelope);
    log.info("Deleted envelope {} for user {}", envelopeId, userId);
  }

  /**
   * Move money between envelopes.
   *
   * @param userId user ID
   * @param year year of the movement
   * @param month month of the movement
   * @param fromEnvelopeId source envelope ID (null for income)
   * @param toEnvelopeId destination envelope ID (null for expense)
   * @param amount amount to move
   * @param notes optional notes
   * @return created envelope move record
   */
  @Transactional
  public EnvelopeMove moveAmount(
      UUID userId,
      int year,
      int month,
      UUID fromEnvelopeId,
      UUID toEnvelopeId,
      BigDecimal amount,
      String notes) {

    if (amount.compareTo(BigDecimal.ZERO) <= 0) {
      throw new IllegalArgumentException("Amount must be positive");
    }

    if (fromEnvelopeId != null && fromEnvelopeId.equals(toEnvelopeId)) {
      throw new IllegalArgumentException("Cannot move to the same envelope");
    }

    Envelope fromEnvelope = null;
    Envelope toEnvelope = null;

    if (fromEnvelopeId != null) {
      fromEnvelope = getEnvelope(userId, fromEnvelopeId);
    }

    if (toEnvelopeId != null) {
      toEnvelope = getEnvelope(userId, toEnvelopeId);
    }

    // Create move record
    EnvelopeMove move =
        EnvelopeMove.builder()
            .userId(userId)
            .year(year)
            .month(month)
            .fromEnvelope(fromEnvelope)
            .toEnvelope(toEnvelope)
            .amount(amount)
            .notes(notes)
            .build();

    EnvelopeMove savedMove = envelopeMoveRepository.save(move);

    log.info(
        "Moved {} from envelope {} to envelope {} for user {} ({}/{})",
        amount,
        fromEnvelopeId,
        toEnvelopeId,
        userId,
        year,
        month);

    return savedMove;
  }

  /**
   * Get envelope movement history.
   *
   * @param userId user ID
   * @param envelopeId envelope ID
   * @return list of moves involving this envelope
   */
  @Transactional(readOnly = true)
  public List<EnvelopeMove> getEnvelopeMoves(UUID userId, UUID envelopeId) {
    // Verify envelope ownership
    getEnvelope(userId, envelopeId);

    return envelopeMoveRepository.findByFromEnvelopeIdOrToEnvelopeIdOrderByCreatedAtDesc(
        envelopeId, envelopeId);
  }
}
