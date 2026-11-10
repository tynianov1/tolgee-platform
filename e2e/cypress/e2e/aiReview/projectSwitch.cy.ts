import {
  aiReviewTestData,
  getProjectByNameFromTestData,
} from '../../common/apiCalls/testData/testData';
import { login } from '../../common/apiCalls/common';
import { gcy, gcyAdvanced } from '../../common/shared';
import { waitForGlobalLoading } from '../../common/loading';
import { openBatchOperationMenu } from '../../common/batchOperations';
import { openPlayground } from '../../common/prompt';
import { E2AiReviewRulesView } from '../../compounds/aiReview/E2AiReviewRulesView';
import { E2TranslationsView } from '../../compounds/E2TranslationsView';
import { E2AiReviewBadge } from '../../compounds/aiReview/E2AiReviewBadge';

describe('AI review project switch', () => {
  let projectId: number;
  let switchProjectId: number;
  const rulesView = new E2AiReviewRulesView();

  beforeEach(() => {
    aiReviewTestData.clean();
    aiReviewTestData.generateStandard().then((res) => {
      projectId = getProjectByNameFromTestData(
        res.body,
        'ai_review_project'
      )!.id;
      switchProjectId = getProjectByNameFromTestData(
        res.body,
        'ai_review_switch_project'
      )!.id;
    });
  });

  afterEach(() => {
    aiReviewTestData.clean();
  });

  it('turning it on creates the default dry-run rule', () => {
    login('test_username');
    rulesView.visit(switchProjectId);
    gcy('ai-review-empty-state').should('be.visible');
    gcy('ai-review-enabled-toggle').find('input').should('not.be.checked');

    gcy('ai-review-enabled-toggle').click();
    waitForGlobalLoading();

    gcy('ai-review-enabled-toggle').find('input').should('be.checked');
    gcy('ai-review-rule-item').should('have.length', 1);
    gcyAdvanced({ value: 'ai-review-rule-item', name: 'Default rule' }).should(
      'exist'
    );
    gcyAdvanced({ value: 'ai-review-rule-mode', mode: 'DRY_RUN' }).should(
      'exist'
    );
  });

  it('turning it off hides AI review from the translations view', () => {
    login('test_username');
    rulesView.visit(projectId);
    gcy('ai-review-enabled-toggle').find('input').should('be.checked');

    gcy('ai-review-enabled-toggle').click();
    waitForGlobalLoading();
    gcy('ai-review-enabled-toggle').find('input').should('not.be.checked');
    gcy('ai-review-rule-item').should('have.length', 2);

    const view = new E2TranslationsView();
    view.visit(projectId, {
      languages: ['en', 'de'],
      search: 'key_approved',
    });
    waitForGlobalLoading();
    new E2AiReviewBadge('key_approved').assertAbsent();

    // The select-all helper toggles the selection off again when the search
    // matches a single key, so select the one row directly.
    cy.gcy('translations-row-checkbox').first().click();
    gcy('batch-operations-select').should('be.visible');
    openBatchOperationMenu();
    gcyAdvanced({ value: 'batch-select-item', id: 'ai_review' }).should(
      'not.exist'
    );
    gcyAdvanced({ value: 'batch-select-item', id: 'machine_translate' }).should(
      'exist'
    );
    cy.get('body').type('{esc}');

    view.openFilterSelect();
    gcyAdvanced({ value: 'submenu-item', id: 'tags' }).should('be.visible');
    gcyAdvanced({ value: 'submenu-item', id: 'ai-review' }).should('not.exist');
  });

  it('hides the playground review tab while off', () => {
    login('test_username');
    openPlayground(switchProjectId, 'switch_key');
    gcy('ai-prompt-type-switch').should('not.exist');
  });

  it('a user without the edit permission cannot toggle', () => {
    login('prompts_viewer_username');
    rulesView.visit(projectId);
    gcy('ai-review-enabled-toggle').find('input').should('be.disabled');
  });
});
