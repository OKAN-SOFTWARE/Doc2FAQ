package com.okansoftware.doc2faq.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ExportRequest(
        @NotBlank @Size(max = 200) String title,
        @NotEmpty @Size(max = 30) List<@NotNull @Valid Entry> items,
        Boolean includeSources) {
    public ExportRequest {
        includeSources = Boolean.TRUE.equals(includeSources);
    }
    public record Entry(
            @NotBlank @Size(max = 500) String question,
            @NotBlank @Size(max = 50000) String answer,
            @Size(max = 30) List<@NotNull @Valid Reference> sources,
            Boolean edited) {
        public Entry {
            edited = Boolean.TRUE.equals(edited);
        }
    }

    public record Reference(
            @NotBlank @Size(max = 50000) String section,
            @Min(1) int startLine, @Min(1) int endLine) {}
}
