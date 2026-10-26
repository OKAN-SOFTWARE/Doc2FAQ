package com.okansoftware.doc2faq.api;

import com.okansoftware.doc2faq.model.PreviewRequest;
import com.okansoftware.doc2faq.model.PreviewResponse;
import com.okansoftware.doc2faq.service.FaqDraftService;
import com.okansoftware.doc2faq.service.FaqGenerateService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faqs")
public class FaqController {
    private final FaqDraftService drafts;
    private final FaqGenerateService generator;

    public FaqController(FaqDraftService drafts, FaqGenerateService generator) {
        this.drafts = drafts;
        this.generator = generator;
    }

    @PostMapping("/preview")
    public PreviewResponse preview(@Valid @RequestBody PreviewRequest request) {
        return drafts.preview(request.content());
    }

    @PostMapping("/generate")
    public PreviewResponse generate(@Valid @RequestBody PreviewRequest request) {
        return generator.generate(request.content());
    }
}
