package com.okansoftware.doc2faq.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PreviewRequest(
        @NotBlank(message = "Document text is required")
        @Size(max = 50000, message = "Document text must not exceed 50,000 characters")
        String content
) {}
