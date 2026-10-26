package com.okansoftware.doc2faq.model;

import java.util.List;

public record PreviewResponse(List<FaqItem> items, int count, String notice) {}
