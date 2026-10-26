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
}
