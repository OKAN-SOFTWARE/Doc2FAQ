package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.FaqItem;
import com.okansoftware.doc2faq.model.PreviewResponse;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * Creates source-grounded FAQ suggestions from ordinary document sections.
 * Does not contact a language model or invent missing facts.
 */
@Service
public class FaqGenerateService {
    private static final int MAX_CHARACTERS = 50_000;
    private static final int MAX_ITEMS = 30;
    private static final int MAX_ANSWER_CHARS = 1_200;
    private static final Pattern MARKDOWN_HEADING = Pattern.compile("^#{1,6}\\s+(.+?)\\s*$");
    private static final Pattern NUMBERED_HEADING = Pattern.compile("^\\d+(?:\\.\\d+)*[.)]?\\s+([\\p{L}].{2,79})$");
    private static final Pattern ALL_CAPS_HEADING = Pattern.compile("^[\\p{Lu}][\\p{Lu}\\p{N} /&(),.'–-]{2,79}:?$");
    private static final Pattern TITLE_CASE_HEADING = Pattern.compile("^[\\p{Lu}][\\p{L}\\p{N} /&(),.'–-]{2,59}:?$");
    private static final String NOTICE = "Generated locally from source passages using deterministic rules. "
            + "No AI service is used. Verify and edit every question and answer before sharing.";

    private final FaqDraftService extractor;

    public FaqGenerateService(FaqDraftService extractor) {
        this.extractor = extractor;
    }

    public PreviewResponse generate(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Document text is required");
        }
        if (content.length() > MAX_CHARACTERS) {
            throw new IllegalArgumentException("Document text must not exceed 50,000 characters");
        }

        List<FaqItem> items = new ArrayList<>(extractor.preview(content).items());
        Set<String> seen = new HashSet<>();
        items.forEach(item -> seen.add(item.question().toLowerCase(Locale.ROOT)));

        for (Section section : splitSections(content)) {
            if (items.size() >= MAX_ITEMS) {
                break;
            }
            String passage = section.body.toString().strip().replaceAll("\\s+", " ");
            if (passage.isEmpty() || section.heading.endsWith("?")) {
                continue;
            }
            String question = questionFor(section.heading);
            if (seen.add(question.toLowerCase(Locale.ROOT))) {
                items.add(new FaqItem(question, excerpt(passage)));
            }
        }

        // Conservative fallback for documents without recognizable sections.
        if (items.isEmpty()) {
            String passage = content.strip().replaceAll("\\s+", " ");
            items.add(new FaqItem("What information does this document provide?", excerpt(passage)));
        }
        return new PreviewResponse(List.copyOf(items), items.size(), NOTICE);
    }

    private static List<Section> splitSections(String content) {
        List<Section> sections = new ArrayList<>();
        Section current = new Section("Overview");
        for (String raw : content.split("\\R", -1)) {
            String line = raw.strip();
            if (line.isBlank()) {
                if (!current.body.isEmpty()) current.body.append(' ');
                continue;
            }
            String heading = headingOf(line);
            if (heading != null) {
                if (!current.body.toString().isBlank()) sections.add(current);
                current = new Section(heading);
            } else {
                if (!current.body.isEmpty()) current.body.append(' ');
                current.body.append(line);
            }
        }
        if (!current.body.toString().isBlank()) sections.add(current);
        return sections;
    }

    private static String headingOf(String line) {
        Matcher markdown = MARKDOWN_HEADING.matcher(line);
        if (markdown.matches()) return markdown.group(1).strip();

        Matcher numbered = NUMBERED_HEADING.matcher(line);
        if (numbered.matches() && !line.endsWith(".") && !line.endsWith("?")) {
            return numbered.group(1).strip();
        }
        if (ALL_CAPS_HEADING.matcher(line).matches()) {
            return withoutColon(line);
        }
        if (TITLE_CASE_HEADING.matcher(line).matches()
                && !line.endsWith(".") && !line.endsWith("?")
                && line.split("\\s+").length <= 7 && isTitleCase(line)) {
            return withoutColon(line);
        }
        return null;
    }

    private static boolean isTitleCase(String line) {
        String[] words = line.split("\\s+");
        int uppercaseWords = 0;
        for (String word : words) {
            if (!word.isEmpty() && Character.isUpperCase(word.codePointAt(0))) uppercaseWords++;
        }
        return uppercaseWords >= Math.max(1, words.length - 1);
    }

    private static String withoutColon(String heading) {
        return heading.endsWith(":") ? heading.substring(0, heading.length() - 1) : heading;
    }

    private static String questionFor(String heading) {
        String normalized = heading.toLowerCase(Locale.ROOT);
        if (normalized.contains("termination") || normalized.contains("cancellation"))
            return "How can the agreement be terminated?";
        if (normalized.contains("fee") || normalized.contains("pricing"))
            return "What fees does the document specify?";
        if (normalized.contains("payment"))
            return "When and how are payments due?";
        if (normalized.contains("service") || normalized.contains("scope of work"))
            return "What services are included?";
        if (normalized.contains("duration") || normalized.equals("term") || normalized.contains("agreement term"))
            return "How long does the agreement last?";
        if (normalized.contains("confidential"))
            return "What are the confidentiality requirements?";
        if (normalized.contains("professional summary") || normalized.equals("summary"))
            return "What professional background is described?";
        if (normalized.contains("skill") || normalized.contains("technolog"))
            return "Which skills and technologies are listed?";
        if (normalized.contains("experience"))
            return "What experience is described?";
        if (normalized.contains("education"))
            return "What education is listed?";
        return "What does the document say about " + heading + "?";
    }

    private static String excerpt(String passage) {
        if (passage.length() <= MAX_ANSWER_CHARS) return passage;
        int boundary = passage.lastIndexOf(' ', MAX_ANSWER_CHARS - 1);
        if (boundary < MAX_ANSWER_CHARS / 2) boundary = MAX_ANSWER_CHARS - 1;
        return passage.substring(0, boundary).stripTrailing() + "…";
    }

    private static final class Section {
        private final String heading;
        private final StringBuilder body = new StringBuilder();

        private Section(String heading) {
            this.heading = heading;
        }
    }
}
