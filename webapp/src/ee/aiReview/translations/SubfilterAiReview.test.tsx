import { describe, expect, it } from 'vitest';
import {
  getAiReviewFiltersLength,
  getAiReviewFiltersName,
} from './SubfilterAiReview';
import { AiReviewFilterOutcome } from 'tg.views/projects/translations/TranslationFilters/tools';

const nameKey = (outcome: AiReviewFilterOutcome) =>
  getAiReviewFiltersName({ filterAiReviewOutcomes: [outcome] })?.props.keyName;

describe('AI review filter name', () => {
  it('names every outcome', () => {
    expect(nameKey('CONFIRMED')).toBe('ai_review_filter_confirmed');
    expect(nameKey('REJECTED')).toBe('ai_review_filter_rejected');
    expect(nameKey('REVIEWED_BY_AI')).toBe('ai_review_filter_reviewed_by_ai');
    expect(nameKey('NOT_REVIEWED_YET')).toBe(
      'ai_review_filter_not_reviewed_yet'
    );
  });

  it('has no name without a selected outcome', () => {
    expect(getAiReviewFiltersName({})).toBeUndefined();
  });

  it('names both dry-run outcomes with the single dry-run label', () => {
    expect(nameKey('DRY_RUN_PASS')).toBe('ai_review_filter_dry_run');
    expect(nameKey('DRY_RUN_FAIL')).toBe('ai_review_filter_dry_run');
  });

  it('counts the merged dry-run selection as one filter', () => {
    expect(
      getAiReviewFiltersLength({
        filterAiReviewOutcomes: ['DRY_RUN_PASS', 'DRY_RUN_FAIL'],
      })
    ).toBe(1);
    expect(
      getAiReviewFiltersLength({
        filterAiReviewOutcomes: ['DRY_RUN_PASS', 'DRY_RUN_FAIL', 'FAILED'],
      })
    ).toBe(2);
  });
});
