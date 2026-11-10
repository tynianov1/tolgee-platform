import { gcy, gcyAdvanced } from '../../common/shared';

export class E2AiReviewRuleDialog {
  /** The number input next to the slider; shown only for Active rules. */
  setThreshold(value: number) {
    gcy('ai-review-rule-form-threshold-input')
      .clear()
      .type(String(value))
      .blur();
    return this;
  }

  getScopeOption(option: string) {
    return gcyAdvanced({ value: 'ai-review-rule-form-scope-option', option });
  }

  save() {
    gcy('ai-review-rule-form-save').click();
  }
}
