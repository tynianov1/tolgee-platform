package io.tolgee.service.aiReview

import io.tolgee.model.enums.TranslationState
import io.tolgee.model.translation.Translation
import io.tolgee.model.translation.Translation_
import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.Path
import jakarta.persistence.criteria.Predicate

object AiReviewEligibleText {
  /** REVIEWED rows: see AiReviewManaged. */
  fun of(translation: Translation): Boolean =
    !translation.text.isNullOrBlank() &&
      translation.state != TranslationState.DISABLED &&
      !translation.outdated

  const val SQL_NOT_REVIEWED = """t.text ~ '\S'
        and t.state <> :disabled
        and t.state <> :reviewed
        and t.outdated = false"""

  fun criteriaNotReviewed(
    cb: CriteriaBuilder,
    t: Path<Translation>,
  ): List<Predicate> =
    listOf(
      cb.not(t.get(Translation_.state).`in`(TranslationState.DISABLED, TranslationState.REVIEWED)),
      cb.isFalse(t.get(Translation_.outdated)),
      cb.isTrue(cb.function("textregexeq", Boolean::class.java, t.get(Translation_.text), cb.literal("\\S"))),
    )
}
