import { QuestionGroup } from '../shared/interfaces/analysis.interface';

/**
 * Builds a prompt for analyzing architecture diagrams
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for architecture diagram analysis
 */
export function buildImagePrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  let prompt = `
  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>

  <kb>
  ${kbContexts.join('\n\n')}
  </kb>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  The attached file named "${supportingDocName}" has been provided as a supporting document that you need to use for additional context and guidelines to consider when completing the analysis and deciding on whether a best practice if applied, not applied or not applicable.

  In the case your decision to consider a best practice to be applied or not applied was mainly driven from the content of the supporting document, say so in the reasonApplied or reasonNotApplied field of your response.

  Below is a brief description of the supporting document attached: 
  ${supportingDocDescription}
  </supporting_document>
  `;
  }

  return prompt;
}

/**
 * Builds a prompt for analyzing IaC templates
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for IaC template analysis
 */
export function buildPrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  let prompt = `
  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>

  <kb>
  ${kbContexts.join('\n\n')}
  </kb>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  The attached file named "${supportingDocName}" has been provided as a supporting document that you need to use for additional context and guidelines to consider when completing the analysis and deciding on whether a best practice if applied, not applied or not applicable.

  In the case your decision to consider a best practice to be applied or not applied was mainly driven from the content of the supporting document, say so in the reasonApplied or reasonNotApplied field of your response.

  Below is a brief description of the supporting document attached: 
  ${supportingDocDescription}
  </supporting_document>
  `;
  }

  return prompt;
}

/**
 * Builds a prompt for analyzing projects (multiple files or zip)
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for project analysis
 */
export function buildProjectPrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  let prompt = `
  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>

  <kb>
  ${kbContexts.join('\n\n')}
  </kb>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  The attached file named "${supportingDocName}" has been provided as a supporting document that you need to use for additional context and guidelines to consider when completing the analysis and deciding on whether a best practice if applied, not applied or not applicable.

  In the case your decision to consider a best practice to be applied or not applied was mainly driven from the content of the supporting document, say so in the reasonApplied or reasonNotApplied field of your response.

  Below is a brief description of the supporting document attached: 
  ${supportingDocDescription}
  </supporting_document>
  `;
  }

  return prompt;
}