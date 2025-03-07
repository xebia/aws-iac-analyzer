/**
 * Builds a prompt for generating IaC templates from architecture diagrams
 * @param previousSections Number of sections already generated
 * @param allPreviousSections Content of all previously generated sections
 * @param recommendations Recommendations to consider when generating IaC
 * @returns A prompt for IaC template generation
 */
export function buildIacGenerationPrompt(
    previousSections: number,
    allPreviousSections: string,
    recommendations: any[]
): string {
    return `Based on the architecture diagram and the recommendations within the <recommendations> below, generate an IaC template.
    Consider the ${previousSections} previously generated sections within the <previous_responses> section below (if any).
  
    <previous_responses>
    ${allPreviousSections}
    </previous_responses>
    
    <recommendations>
    ${JSON.stringify(recommendations, null, 2)}
    </recommendations>`;
}