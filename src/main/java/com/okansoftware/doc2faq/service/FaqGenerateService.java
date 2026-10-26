package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.FaqItem;
import com.okansoftware.doc2faq.model.PreviewResponse;
import java.util.ArrayList;
import java.util.EnumSet;
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
            + "Common duplicate topics and FAQ appendices are filtered. No AI service is used. "
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
        Set<String> seen = new HashSet<>();
        Set<Topic> seenTopics = EnumSet.noneOf(Topic.class);
        for (FaqItem item : items) {
            seen.add(item.question().toLowerCase(Locale.ROOT));
            Topic topic = topicForQuestion(item.question());
            if (topic != Topic.OTHER) seenTopics.add(topic);
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
            Topic topic = topicForHeading(section.heading);
            // Preserve all explicit pairs, but do not propose the same subject again.
            if (topic != Topic.OTHER && seenTopics.contains(topic)) {
                continue;
            }
            String question = questionFor(section.heading);
            if (seen.add(question.toLowerCase(Locale.ROOT))) {
                items.add(new FaqItem(question, excerpt(passage)));
                if (topic != Topic.OTHER) seenTopics.add(topic);
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

    private static Topic topicForHeading(String heading) {
        String h = heading.toLowerCase(Locale.ROOT);
        if (h.contains("terminat") || h.contains("cancellat")) return Topic.TERMINATION;
        if (h.contains("payment") || h.contains("invoic")) return Topic.PAYMENT;
        if (h.contains("fee") || h.contains("pricing") || h.contains("cost")) return Topic.FEES;
        if (h.contains("responsibilit") || h.contains("obligation")) return Topic.RESPONSIBILITIES;
        if (h.contains("ownership") || h.contains("intellectual property")) return Topic.OWNERSHIP;
        if (h.contains("confidential")) return Topic.CONFIDENTIALITY;
        if (h.contains("scope") || h.contains("service")) return Topic.SERVICES;
        if (h.equals("term") || h.contains("duration") || h.contains("agreement term")
                || h.contains("effective date")) return Topic.TERM;
        if (h.contains("summary")) return Topic.SUMMARY;
        if (h.contains("skill") || h.contains("technolog")) return Topic.SKILLS;
        if (h.contains("experience")) return Topic.EXPERIENCE;
        if (h.contains("education")) return Topic.EDUCATION;
        return Topic.OTHER;
    }

    /** Uses recognizable question intent, not exact string equality. */
    private static Topic topicForQuestion(String question) {
        String q = question.toLowerCase(Locale.ROOT);
        if (q.contains("terminat") || q.contains("cancel")
                || q.contains("end the agreement")) return Topic.TERMINATION;
        if (q.contains("when is payment") || q.contains("payment due")
                || q.contains("invoice") || q.contains("how are payments")) return Topic.PAYMENT;
        if (q.contains("fee") || q.contains("pricing") || q.contains("price")
                || q.contains("cost")) return Topic.FEES;
        if (q.contains("responsibilit") || q.contains("obligation")) return Topic.RESPONSIBILITIES;
        if (q.contains("ownership") || q.contains("owns the work") || q.contains("deliverables"))
            return Topic.OWNERSHIP;
        if (q.contains("confidential")) return Topic.CONFIDENTIALITY;
        if (q.contains("agreement begin") || q.contains("engagement begin")
                || q.contains("agreement last") || q.contains("effective date")
                || q.contains("agreement term") || q.contains("duration")) return Topic.TERM;
        if (q.contains("service") || q.contains("maintenance hours")
                || q.contains("scope of work")) return Topic.SERVICES;
        if (q.contains("professional background")) return Topic.SUMMARY;
        if (q.contains("skill") || q.contains("technolog")) return Topic.SKILLS;
        if (q.contains("experience")) return Topic.EXPERIENCE;
        if (q.contains("education")) return Topic.EDUCATION;
        return Topic.OTHER;
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

    private enum Topic {
        SERVICES, TERM, FEES, PAYMENT, TERMINATION, RESPONSIBILITIES,
        OWNERSHIP, CONFIDENTIALITY, SUMMARY, SKILLS, EXPERIENCE, EDUCATION, OTHER
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
