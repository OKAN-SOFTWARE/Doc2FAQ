package com.okansoftware.doc2faq.api;

import com.okansoftware.doc2faq.model.ExportRequest;
import com.okansoftware.doc2faq.service.FaqExportService;
import jakarta.validation.Valid;
import java.io.IOException;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faqs/export")
public class ExportController {
    private final FaqExportService exporter;

    public ExportController(FaqExportService exporter) {
        this.exporter = exporter;
    }

    @PostMapping("/{format}")
    public ResponseEntity<byte[]> export(@PathVariable String format,
                                        @Valid @RequestBody ExportRequest request) throws IOException {
        String mime = switch (format) {
            case "pdf" -> "application/pdf";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default -> throw new IllegalArgumentException("Choose PDF or DOCX export");
        };
        byte[] data = format.equals("pdf") ? exporter.pdf(request) : exporter.docx(request);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mime))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("doc2faq-draft." + format).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(data);
    }
}
