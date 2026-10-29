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
 * Extracts explicit question/answer pairs without inventing content.
 * This preview is deliberately not an AI summarizer or a document parser.
 */
@Service
public class FaqDraftService {
    private static final int MAX_CHARACTERS = 50_000;
    private static final int MAX_ITEMS = 30;
    private static final Pattern QUESTION_PREFIX = Pattern.compile(
            "^(?:#{1,6}\\s+|(?:Q|Question):\\s*)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern ANSWER_PREFIX = Pattern.compile(
            "^(?:A|Answer):\\s*", Pattern.CASE_INSENSITIVE);
    private static final String NOTICE = "This preview extracts explicit question headings "
            + "and their answers. It does not generate questions or use AI.";

    public PreviewResponse preview(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Document text is required");
        }
        if (content.length() > MAX_CHARACTERS) {
            throw new IllegalArgumentException("Document text must not exceed 50,000 characters");
        }

        List<FaqItem> items = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String question = null;
        StringBuilder answer = new StringBuilder();
        String[] lines = content.split("\\R", -1);
        int start = 0;
        int end = 0;

        for (int i = 0; i < lines.length; i++) {
            String rawLine = lines[i];
            String line = rawLine.strip();
            String nextQuestion = questionFrom(line);
            if (nextQuestion != null) {
                addIfValid(items, seen, question, answer, lines, start, end);
                question = nextQuestion;
                start = i;
                end = i;
                answer.setLength(0);
                continue;
            }

            // A new unrelated section ends the previous answer.
            if (line.startsWith("#")) {
                addIfValid(items, seen, question, answer, lines, start, end);
                question = null;
                answer.setLength(0);
                continue;
            }

            if (question == null || line.isBlank()) {
                continue;
            }
            String answerLine = ANSWER_PREFIX.matcher(line).replaceFirst("").strip();
            if (!answerLine.isBlank()) {
                if (!answer.isEmpty()) {
                    answer.append(' ');
                }
                answer.append(answerLine);
                end = i;
            }
        }

        addIfValid(items, seen, question, answer, lines, start, end);
        return new PreviewResponse(List.copyOf(items), items.size(), NOTICE);
    }

    private static String questionFrom(String line) {
        if (!line.endsWith("?")) return null;
        // Match only the prefix: overlapping whitespace and question captures can
        // otherwise backtrack quadratically on a long line without a question mark.
        Matcher prefix = QUESTION_PREFIX.matcher(line);
        if (!prefix.find()) return null;
        String question = line.substring(prefix.end()).strip();
        return question.length() > 1 ? question : null;
    }

    private static void addIfValid(List<FaqItem> items, Set<String> seen,
                                   String question, StringBuilder answer, String[] lines, int start, int end) {
        if (question == null || answer.isEmpty() || items.size() >= MAX_ITEMS) {
            return;
        }
        String key = question.toLowerCase(Locale.ROOT) + "\n" + answer.toString().toLowerCase(Locale.ROOT);
        if (seen.add(key)) {
            String excerpt = String.join("\n", java.util.Arrays.copyOfRange(lines, start, end + 1));
            items.add(new FaqItem(question, answer.toString(),
                    new SourceReference(question, start + 1, end + 1, excerpt)));
        }
    }
}
