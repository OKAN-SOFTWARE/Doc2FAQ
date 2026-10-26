package com.okansoftware.doc2faq.api;

import com.okansoftware.doc2faq.model.ExtractedDocument;
import com.okansoftware.doc2faq.service.DocumentTextService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private final DocumentTextService documents;

    public DocumentController(DocumentTextService documents) {
        this.documents = documents;
    }

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ExtractedDocument extract(@RequestPart("file") MultipartFile file) {
        return documents.extract(file);
    }
}
