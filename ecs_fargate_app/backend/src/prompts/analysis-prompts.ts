import { QuestionGroup } from '../shared/interfaces/analysis.interface';

/**
 * Builds a prompt for analyzing architecture diagrams
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @returns A prompt for architecture diagram analysis
 */
export function buildImagePrompt(question: QuestionGroup, kbContexts: string[]): string {
    const bestPracticesJson = JSON.stringify({
        pillar: question.pillar,
        question: question.title,
        bestPractices: question.bestPractices
    }, null, 2);

    return `
    Analyze the provided architecture diagram against the following Well-Architected best practices.
    
    <kb>
    ${kbContexts.join('\n\n')}
    </kb>

    <best_practices_json>
    ${bestPracticesJson}
    </best_practices_json>
  `;
}

/**
 * Builds a prompt for analyzing IaC templates
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @returns A prompt for IaC template analysis
 */
export function buildPrompt(question: QuestionGroup, kbContexts: string[]): string {
    const bestPracticesJson = JSON.stringify({
        pillar: question.pillar,
        question: question.title,
        bestPractices: question.bestPractices
    }, null, 2);

    return `
    <kb>
    ${kbContexts.join('\n\n')}
    </kb>

    <best_practices_json>
    ${bestPracticesJson}
    </best_practices_json>
  `;
}