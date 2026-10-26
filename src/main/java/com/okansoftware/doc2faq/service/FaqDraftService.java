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
 * Extracts explicit question/answer pairs without inventing content.
 * This preview is deliberately not an AI summarizer or a document parser.
 */
@Service
public class FaqDraftService {
    private static final int MAX_CHARACTERS = 20_000;
    private static final int MAX_ITEMS = 30;
    private static final Pattern QUESTION = Pattern.compile(
            "^(?:#{1,6}\\s+|(?:Q|Question):\\s*)(.+\\?)\\s*$",
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
            throw new IllegalArgumentException("Document text must not exceed 20,000 characters");
        }

        List<FaqItem> items = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String question = null;
        StringBuilder answer = new StringBuilder();

        for (String rawLine : content.split("\\R", -1)) {
            String line = rawLine.strip();
            Matcher match = QUESTION.matcher(line);
            if (match.matches()) {
                addIfValid(items, seen, question, answer);
                question = match.group(1).strip();
                answer.setLength(0);
                continue;
            }

            // A new unrelated section ends the previous answer.
            if (line.startsWith("#")) {
                addIfValid(items, seen, question, answer);
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
            }
        }

        addIfValid(items, seen, question, answer);
        return new PreviewResponse(List.copyOf(items), items.size(), NOTICE);
    }

    private static void addIfValid(List<FaqItem> items, Set<String> seen,
                                   String question, StringBuilder answer) {
        if (question == null || answer.isEmpty() || items.size() >= MAX_ITEMS) {
            return;
        }
        if (seen.add(question.toLowerCase(Locale.ROOT))) {
            items.add(new FaqItem(question, answer.toString()));
        }
    }
}
