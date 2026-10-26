package com.okansoftware.doc2faq.api;

import com.okansoftware.doc2faq.model.PreviewRequest;
import com.okansoftware.doc2faq.model.PreviewResponse;
import com.okansoftware.doc2faq.service.FaqDraftService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faqs")
public class FaqController {
    private final FaqDraftService drafts;

    public FaqController(FaqDraftService drafts) {
        this.drafts = drafts;
    }

    @PostMapping("/preview")
    public PreviewResponse preview(@Valid @RequestBody PreviewRequest request) {
        return drafts.preview(request.content());
    }
}
