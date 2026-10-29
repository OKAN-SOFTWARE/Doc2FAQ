package com.okansoftware.doc2faq.model;

/** Lines refer to the extracted/pasted text, not the original PDF's page layout. */
public record SourceReference(String section, int startLine, int endLine, String excerpt) {}
