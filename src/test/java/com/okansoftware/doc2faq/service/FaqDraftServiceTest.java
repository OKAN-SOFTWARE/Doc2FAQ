package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.PreviewResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FaqDraftServiceTest {
    private final FaqDraftService service = new FaqDraftService();

    @Test
    void extractsMarkdownQuestionsWithoutInventingAnswers() {
        String text = """
                # Team handbook
                ## What is the vacation policy?
                Employees receive 15 days annually.
                Ask your manager before booking.

                ## What is the office address?
                The office is in Fairfax.
                """;
        PreviewResponse result = service.preview(text);

        assertEquals(2, result.count());
        assertEquals("What is the vacation policy?", result.items().get(0).question());
        assertEquals("Employees receive 15 days annually. Ask your manager before booking.",
                result.items().get(0).answer());
        assertEquals("The office is in Fairfax.", result.items().get(1).answer());
        assertTrue(result.notice().contains("does not generate"));
    }

    @Test
    void supportsLabeledPlainTextQuestions() {
        PreviewResponse result = service.preview("""
                Q: How can I reset my password?
                A: Use the reset link.
                Question: Where is support?
                Answer: Email the support team.
                """);
        assertEquals(2, result.count());
        assertEquals("Use the reset link.", result.items().get(0).answer());
        assertEquals("Where is support?", result.items().get(1).question());
    }

    @Test
    void skipsEmptyAnswersAndDeduplicatesQuestions() {
        PreviewResponse result = service.preview("""
                ## How does this work?
                First answer.
                ## How does this work?
                Duplicate answer.
                ## What is missing?
                # Unrelated section
                """);
        assertEquals(1, result.count());
        assertEquals("First answer.", result.items().get(0).answer());
    }

    @Test
    void returnsEmptyDraftForNonFaqText() {
        PreviewResponse result = service.preview("A paragraph without explicit question headings.");
        assertEquals(0, result.count());
        assertTrue(result.items().isEmpty());
    }

    @Test
    void rejectsBlankAndOversizedContent() {
        assertThrows(IllegalArgumentException.class, () -> service.preview("  "));
        assertThrows(IllegalArgumentException.class, () -> service.preview("a".repeat(50_001)));
    }

    @Test
    void supportsExpandedCharacterLimit() {
        String heading = "Q: What is the long answer?\nA: ";
        String exactlyMax = heading + "x".repeat(50_000 - heading.length());
        PreviewResponse result = service.preview(exactlyMax);
        assertEquals(1, result.count());
        assertEquals(50_000 - heading.length(), result.items().get(0).answer().length());
    }

    @Test
    void capsNumberOfExtractedPairs() {
        StringBuilder input = new StringBuilder();
        for (int i = 0; i < 40; i++) {
            input.append("## Question ").append(i).append("?\n")
                    .append("Answer ").append(i).append(".\n\n");
        }
        assertEquals(30, service.preview(input.toString()).count());
    }
}
