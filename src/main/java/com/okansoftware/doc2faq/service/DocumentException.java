package com.okansoftware.doc2faq.service;

public final class DocumentException extends RuntimeException {
    private final String code;

    public DocumentException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
