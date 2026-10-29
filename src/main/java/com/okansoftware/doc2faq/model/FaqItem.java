package com.okansoftware.doc2faq.model;

public record FaqItem(String question, String answer, SourceReference source) {
    public FaqItem(String question, String answer) {
        this(question, answer, null);
    }
}
