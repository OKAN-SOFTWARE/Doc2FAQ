package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.FaqItem;
import com.okansoftware.doc2faq.model.PreviewResponse;
import com.okansoftware.doc2faq.model.SourceReference;
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
            + "Exact duplicate passages and FAQ appendices are filtered; similar questions remain for review. No AI service is used. "
            + "Verify and edit every question and answer before sharing.";

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
        Set<String> seenPassages = new HashSet<>();
        for (FaqItem item : items) {
            seenPassages.add(item.question().toLowerCase(Locale.ROOT) + "\n" + item.answer().strip().toLowerCase(Locale.ROOT));
        }

        for (Section section : splitSections(content)) {
            if (items.size() >= MAX_ITEMS) {
                break;
            }
            String passage = section.body.toString().strip().replaceAll("\\s+", " ");
            if (passage.isEmpty() || section.heading.endsWith("?")
                    || isBoilerplateHeading(section.heading)) {
                continue;
            }
            String answer = excerpt(passage);
            if (seenPassages.add(questionFor(section.heading).toLowerCase(Locale.ROOT) + "\n" + passage.toLowerCase(Locale.ROOT))) {
                items.add(new FaqItem(questionFor(section.heading), answer,
                        new SourceReference(section.heading, section.startLine, section.endLine,
                                section.original.substring(0, section.original.length() - 1))));
            }
        }

        // Conservative fallback for documents without recognizable sections.
        if (items.isEmpty()) {
            String passage = content.strip().replaceAll("\\s+", " ");
            items.add(new FaqItem("What information does this document provide?", excerpt(passage),
                    new SourceReference("Document", 1, content.split("\\R", -1).length,
                            String.join("\n", content.split("\\R", -1)))));
        }
        return new PreviewResponse(List.copyOf(items), items.size(), NOTICE);
    }

    private static List<Section> splitSections(String content) {
        List<Section> sections = new ArrayList<>();
        Section current = new Section("Overview", 1);
        String[] lines = content.split("\\R", -1);
        for (int i = 0; i < lines.length; i++) {
            String raw = lines[i];
            String line = raw.strip();
            if (line.isBlank()) {
                if (!current.body.isEmpty()) current.body.append(' ');
                current.original.append(raw).append('\n');
                current.endLine = i + 1;
                continue;
            }
            String heading = headingOf(line);
            if (heading != null) {
                if (!current.body.toString().isBlank()) sections.add(current);
                current = new Section(heading, i + 1);
            } else {
                if (!current.body.isEmpty()) current.body.append(' ');
                current.body.append(line);
            }
            current.original.append(raw).append('\n');
            current.endLine = i + 1;
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

    /**
     * Detects section titles and appendices that should not become FAQs.
     * A FAQ appendix is already handled by the explicit Q/A extractor.
     */
    private static boolean isBoilerplateHeading(String heading) {
        String h = heading.toLowerCase(Locale.ROOT).strip();
        if (h.contains("frequently asked questions") || h.equals("faq") || h.equals("faqs")
                || h.contains("table of contents") || h.contains("signature")) {
            return true;
        }
        // Standalone document titles are not useful customer-facing questions.
        return h.equals("agreement") || h.equals("contract")
                || (h.endsWith(" agreement") && !h.contains("term") && !h.contains("duration"))
                || (h.endsWith(" contract") && !h.contains("term"));
    }

    private static String questionFor(String heading) {
        String h = heading.toLowerCase(Locale.ROOT);
        if (h.contains("termination") || h.contains("cancellation"))
            return "How can the agreement be terminated?";
        if (h.contains("client") && (h.contains("responsibilit") || h.contains("obligation")))
            return "What responsibilities does the client have under the agreement?";
        if (h.contains("provider") && (h.contains("responsibilit") || h.contains("obligation")))
            return "What responsibilities does the provider have under the agreement?";
        if (h.contains("responsibilit") || h.contains("obligation"))
            return "What responsibilities are outlined in the document?";
        if (h.contains("ownership") || h.contains("intellectual property"))
            return "Who owns the work and deliverables?";
        if (h.contains("confidential"))
            return "What confidentiality obligations apply?";
        if (h.contains("payment") || h.contains("invoic"))
            return "When and how are payments due?";
        if (h.contains("fee") || h.contains("pricing") || h.contains("cost"))
            return "What fees does the document specify?";
        if (h.contains("service") || h.contains("scope of work"))
            return "What services are included?";
        if (h.contains("duration") || h.equals("term") || h.contains("agreement term"))
            return "How long does the agreement last?";
        if (h.contains("professional summary") || h.equals("summary"))
            return "What professional background is described?";
        if (h.contains("skill") || h.contains("technolog"))
            return "Which skills and technologies are listed?";
        if (h.contains("experience"))
            return "What experience is described?";
        if (h.contains("education"))
            return "What education is listed?";
        if (h.contains("return") || h.contains("refund"))
            return "What is the return and refund policy?";
        return "What information is provided about " + heading + "?";
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
        private final StringBuilder original = new StringBuilder();
        private final int startLine;
        private int endLine;

        private Section(String heading, int startLine) {
            this.heading = heading;
            this.startLine = startLine;
            this.endLine = startLine;
        }
    }
}
