package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.PreviewResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FaqGenerateServiceTest {
    private final FaqGenerateService service = new FaqGenerateService(new FaqDraftService());

    @Test
    void generatesContractQuestionsFromNumberedSections() {
        PreviewResponse result = service.generate("""
                1. Services
                The provider performs website monitoring and maintenance.

                2. Payment Terms
                The client pays USD 1,200 within fifteen days.

                3. Term
                The agreement lasts three months.
                """);

        assertEquals(3, result.count());
        assertEquals("What services are included?", result.items().get(0).question());
        assertEquals("The provider performs website monitoring and maintenance.",
                result.items().get(0).answer());
        assertEquals("When and how are payments due?", result.items().get(1).question());
        assertEquals("How long does the agreement last?", result.items().get(2).question());
        assertTrue(result.notice().contains("No AI service"));
    }

    @Test
    void generatesQuestionsFromResumeHeadings() {
        PreviewResponse result = service.generate("""
                PROFESSIONAL SUMMARY
                Software developer with experience in healthcare applications.
                TECHNICAL SKILLS
                Java, Python, Spring Boot, and SQL.
                EDUCATION
                Bachelor of Science in Computer Science.
                """);
        assertEquals(3, result.count());
        assertEquals("What professional background is described?", result.items().get(0).question());
        assertEquals("Which skills and technologies are listed?", result.items().get(1).question());
        assertEquals("Java, Python, Spring Boot, and SQL.", result.items().get(1).answer());
        assertEquals("What education is listed?", result.items().get(2).question());
    }

    @Test
    void keepsExplicitQuestionsAndGeneratesOnlyForOtherSections() {
        PreviewResponse result = service.generate("""
                ## What is included?
                Initial onboarding.
                ## Confidentiality
                Confidential information must not be shared.
                """);
        assertEquals(2, result.count());
        assertEquals("What is included?", result.items().get(0).question());
        assertEquals("What are the confidentiality requirements?",
                result.items().get(1).question());
        assertEquals("Confidential information must not be shared.",
                result.items().get(1).answer());
    }

    @Test
    void fallsBackToExactSourcePassageWithoutHeadings() {
        String source = "This plain paragraph contains a policy without question headings.";
        PreviewResponse result = service.generate(source);
        assertEquals(1, result.count());
        assertEquals(source, result.items().get(0).answer());
    }

    @Test
    void truncatesLongAnswerWithoutInventingMissingDetails() {
        String passage = "Policy words ".repeat(130);
        PreviewResponse result = service.generate("## Policy\n" + passage);
        assertEquals(1, result.count());
        String answer = result.items().get(0).answer();
        assertTrue(answer.length() <= 1_201);
        assertTrue(answer.endsWith("…"));
        assertTrue(passage.startsWith(answer.substring(0, answer.length() - 1)));
    }

    @Test
    void rejectsBlankAndOversizedInput() {
        assertThrows(IllegalArgumentException.class, () -> service.generate(" "));
        assertThrows(IllegalArgumentException.class, () -> service.generate("x".repeat(50_001)));
    }

    @Test
    void capsGeneratedItemsAtThirty() {
        StringBuilder source = new StringBuilder();
        for (int i = 0; i < 40; i++) {
            source.append("## Unique Section ").append(i).append("\n")
                    .append("A different statement ").append(i).append(".\n");
        }
        assertEquals(30, service.generate(source.toString()).count());
    }

    @Test
    void demoAgreementKeepsExplicitFaqAndOnlyAddsNewTopics() {
        PreviewResponse result = service.generate("""
                SOFTWARE MAINTENANCE AGREEMENT
                DEMONSTRATION DOCUMENT | FICTIONAL PARTIES | NOT FOR SIGNATURE
                This sample document is illustrative only.

                1. Services
                The provider monitors the website and performs maintenance.

                2. Term
                The engagement begins November 1, 2026 and lasts three months.

                3. Fees and Invoicing
                The service fee is USD 1,200 per month, due in fifteen days.

                4. Client Responsibilities
                The client will provide administration access and retain backups.

                5. Confidentiality
                Both parties will restrict access to confidential materials.

                6. Ownership
                Each party retains its pre-existing intellectual property.

                7. Termination
                Either party may terminate with fifteen days' written notice.

                APPENDIX A - FREQUENTLY ASKED QUESTIONS
                These explicit Q: / A: pairs test extraction.
                Q: What services are included?
                A: Website monitoring and maintenance.
                Q: When does the agreement begin?
                A: The engagement begins on November 1, 2026.
                Q: What is the monthly service fee?
                A: The monthly fee is USD 1,200.
                Q: When is payment due?
                A: Within fifteen days of invoicing.
                Q: How can either party terminate the agreement?
                A: Fifteen days' written notice.
                """);

        assertEquals(8, result.count()); // Five explicit + three distinct suggestions.
        assertEquals("What services are included?", result.items().get(0).question());
        assertEquals("What responsibilities does the client have under the agreement?",
                result.items().get(5).question());
        assertEquals("Who owns the work and deliverables?", result.items().get(7).question());
        assertTrue(result.items().stream().noneMatch(item ->
                item.question().contains("SOFTWARE MAINTENANCE AGREEMENT")
                        || item.question().contains("APPENDIX A")));
        assertEquals(1, result.items().stream()
                .filter(item -> item.question().toLowerCase().contains("terminat")).count());
        assertTrue(result.notice().contains("duplicate"));
    }

    @Test
    void preservesDistinctFeeAndPaymentTopicsWhenSourceHasNoFaq() {
        PreviewResponse result = service.generate("""
                ## Fees
                Service is USD 1,200 each month.
                ## Payment Terms
                Invoices are due within fifteen calendar days.
                """);

        assertEquals(2, result.count());
        assertEquals("What fees does the document specify?", result.items().get(0).question());
        assertEquals("When and how are payments due?", result.items().get(1).question());
    }

    @Test
    void avoidsUnhelpfulTitleAndFaqAppendixInGeneratedQuestions() {
        PreviewResponse result = service.generate("""
                SOFTWARE MAINTENANCE AGREEMENT
                A fictional service agreement for testing.
                ## APPENDIX A - FREQUENTLY ASKED QUESTIONS
                Q: What does support include?
                A: Routine updates and monitoring.
                """);
        assertEquals(1, result.count());
        assertEquals("What does support include?", result.items().get(0).question());
    }

    @Test
    void usesNaturalQuestionsForResponsibilitiesAndOwnership() {
        PreviewResponse result = service.generate("""
                ## Client Responsibilities
                The client provides backups.
                ## Ownership
                The client owns specified custom deliverables.
                ## Confidentiality
                Confidential information is shared only with authorized people.
                """);

        assertEquals(3, result.count());
        assertEquals("What responsibilities does the client have under the agreement?",
                result.items().get(0).question());
        assertEquals("Who owns the work and deliverables?", result.items().get(1).question());
        assertEquals("What confidentiality obligations apply?", result.items().get(2).question());
        assertEquals("The client owns specified custom deliverables.",
                result.items().get(1).answer());
    }

}
