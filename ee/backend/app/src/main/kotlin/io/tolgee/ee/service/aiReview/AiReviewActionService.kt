package io.tolgee.ee.service.aiReview

import io.tolgee.component.CurrentDateProvider
import io.tolgee.constants.Message
import io.tolgee.exceptions.BadRequestException
import io.tolgee.exceptions.NotFoundException
import io.tolgee.model.UserAccount
import io.tolgee.model.aiReview.TranslationAiReview
import io.tolgee.model.enums.aiReview.AiReviewStatus
import io.tolgee.repository.aiReview.TranslationAiReviewRepository
import io.tolgee.service.aiReview.AiReviewTextHash
import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AiReviewActionService(
  private val reviewRepository: TranslationAiReviewRepository,
  private val currentDateProvider: CurrentDateProvider,
  private val entityManager: EntityManager,
  private val websocketPublisher: AiReviewWebsocketPublisher,
) {
  fun get(translationId: Long): TranslationAiReview =
    reviewRepository.findByTranslationId(translationId) ?: throw NotFoundException()

  fun checkRetryAllowed(translationId: Long) {
    val row = reviewRepository.findByTranslationId(translationId) ?: return
    if (row.status == AiReviewStatus.SUPERSEDED) {
      throw BadRequestException(Message.AI_REVIEW_NOTHING_TO_REVIEW)
    }
  }

  @Transactional
  fun settleHumanUnReview(
    projectId: Long,
    translationIds: Collection<Long>,
    textChangedIds: Set<Long>,
    resolvedById: Long?,
    aiReviewOn: Boolean,
  ) {
    val updates = mutableListOf<AiReviewUpdate>()
    translationIds.chunked(IN_CLAUSE_CHUNK).forEach { chunk ->
      val rows = reviewRepository.findAllWithTranslationByTranslationIdIn(chunk)
      val (deletedApprovals, supersededApprovals) =
        rows
          .filter { it.status == AiReviewStatus.APPROVED }
          .partition { !aiReviewOn || isMachineOverwrite(it, textChangedIds) }
      supersededApprovals.forEach { row ->
        resolve(row, AiReviewStatus.SUPERSEDED, resolvedById)
        updates += AiReviewUpdate.of(row, scoreOnlyRun = false)
      }
      deleteAndCollectRemovals(rows.filter { AiReviewEligibility.isMarker(it) } + deletedApprovals, updates)
    }
    websocketPublisher.publishAfterCommit(projectId, updates)
  }

  companion object {
    private val SUPERSEDABLE_RESULTS =
      setOf(AiReviewStatus.BELOW_THRESHOLD, AiReviewStatus.SCORE_ONLY_PASS, AiReviewStatus.SCORE_ONLY_FAIL)
  }

  private fun isMachineOverwrite(
    row: TranslationAiReview,
    textChangedIds: Set<Long>,
  ): Boolean = row.translation.id in textChangedIds && row.translation.auto

  @Transactional
  fun releaseToHumanReview(
    projectId: Long,
    translationIds: Collection<Long>,
    resolvedById: Long?,
    aiReviewOn: Boolean,
  ) {
    val updates = mutableListOf<AiReviewUpdate>()
    translationIds.chunked(IN_CLAUSE_CHUNK).forEach { chunk ->
      val rows = reviewRepository.findAllWithTranslationByTranslationIdIn(chunk)
      val (toSupersede, rest) = rows.partition { aiReviewOn && supersedesOnHumanReview(it) }
      toSupersede.forEach { row ->
        resolve(row, AiReviewStatus.SUPERSEDED, resolvedById)
        updates += AiReviewUpdate.of(row, scoreOnlyRun = false)
      }
      deleteAndCollectRemovals(rest.filter { AiReviewEligibility.keepsAiManaged(it) }, updates)
    }
    websocketPublisher.publishAfterCommit(projectId, updates)
  }

  private fun supersedesOnHumanReview(row: TranslationAiReview): Boolean =
    row.status in SUPERSEDABLE_RESULTS && row.textHash == AiReviewTextHash.of(row.translation)

  private fun deleteAndCollectRemovals(
    rows: List<TranslationAiReview>,
    updates: MutableList<AiReviewUpdate>,
  ) {
    if (rows.isEmpty()) return
    rows.forEach { updates += AiReviewUpdate.removed(it.translation) }
    reviewRepository.deleteAllByIdInBatch(rows.map { it.id })
  }

  private fun resolve(
    row: TranslationAiReview,
    status: AiReviewStatus,
    resolvedById: Long?,
  ) {
    row.status = status
    row.resolvedBy = resolvedById?.let { entityManager.getReference(UserAccount::class.java, it) }
    row.resolvedAt = currentDateProvider.date
    row.reReviewRequested = false
    // A superseded row must never show Retry, so the stale failure data goes with the decision.
    row.lastFailureReason = null
    row.lastFailedAt = null
  }
}
