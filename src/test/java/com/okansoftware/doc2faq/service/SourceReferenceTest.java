package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.PreviewResponse;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SourceReferenceTest {
    private final FaqDraftService extractor = new FaqDraftService();
    private final FaqGenerateService generator = new FaqGenerateService(extractor);

    private static void assertReferencesMatch(String content, PreviewResponse response) {
        String[] lines = content.split("\\R", -1);
        for (var item : response.items()) {
            var source = item.source();
            assertNotNull(source);
            assertTrue(source.startLine() > 0);
            assertTrue(source.endLine() <= lines.length);
            assertEquals(String.join("\n", Arrays.copyOfRange(lines, source.startLine() - 1, source.endLine())),
                    source.excerpt());
        }
    }

    @Test void explicitPairsKeepRawPrefixesWhitespaceAndCorrectLineRanges() {
        String content = "# Team\r\n\r\n Q: Where is support?\r\n  A: Ask the team.  \r\n\r\n## Other\r\nA separate section.";
        var result = extractor.preview(content);
        assertEquals(1, result.count());
        assertReferencesMatch(content, result);
        assertEquals(3, result.items().getFirst().source().startLine());
        assertEquals(4, result.items().getFirst().source().endLine());
        assertTrue(result.items().getFirst().source().excerpt().contains("  A:"));
    }

    @Test void generatedReferencesCoverExactSectionsWithTrailingBlankLines() {
        String content = "\n# Team Guide\n\n## Services\n Onboarding guides. \n\n\n## Support\nAsk the team.\n";
        var result = generator.generate(content);
        assertEquals(2, result.count());
        assertReferencesMatch(content, result);
        assertEquals("Services", result.items().getFirst().source().section());
    }

    @Test void fallbackAndLongAnswerReferencesPreserveAllOriginalText() {
        String paragraph = "This is an ordinary passage. ".repeat(100);
        var fallback = generator.generate(paragraph);
        assertReferencesMatch(paragraph, fallback);
        assertEquals(paragraph, fallback.items().getFirst().source().excerpt());
        String section = "## Policy\n" + paragraph + "\n\n";
        var result = generator.generate(section);
        assertReferencesMatch(section, result);
        assertTrue(result.items().getFirst().answer().endsWith("…"));
        assertTrue(result.items().getFirst().source().excerpt().length() > result.items().getFirst().answer().length());
    }
}
