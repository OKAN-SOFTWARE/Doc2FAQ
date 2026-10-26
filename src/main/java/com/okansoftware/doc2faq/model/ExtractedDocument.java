package com.okansoftware.doc2faq.model;

/** Extracted text stays in memory and is returned for human review. */
public record ExtractedDocument(String filename, String format, String text) {}
