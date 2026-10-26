package com.okansoftware.doc2faq.api;

import com.okansoftware.doc2faq.Doc2FaqApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = Doc2FaqApplication.class)
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired
    private MockMvc mvc;

    @Test
    void healthReportsDeterministicMode() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.aiEnabled").value(false));
    }

    @Test
    void landingPageIsServed() throws Exception {
        mvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("index.html"));
        mvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Doc2FAQ")));
    }

    @Test
    void previewReturnsExtractedPairs() throws Exception {
        mvc.perform(post("/api/faqs/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"## What is Doc2FAQ?\\nIt extracts explicit FAQ pairs."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.items[0].question").value("What is Doc2FAQ?"))
                .andExpect(jsonPath("$.items[0].answer").value("It extracts explicit FAQ pairs."));
    }

    @Test
    void generateCreatesSourceGroundedDraft() throws Exception {
        mvc.perform(post("/api/faqs/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"## Services\\nWebsite monitoring and software maintenance."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.items[0].question").value("What services are included?"))
                .andExpect(jsonPath("$.items[0].answer").value("Website monitoring and software maintenance."))
                .andExpect(jsonPath("$.notice").value(
                        org.hamcrest.Matchers.containsString("No AI service")));
    }

    @Test
    void bothEndpointsRejectTextOverFiftyThousandCharacters() throws Exception {
        String body = new com.fasterxml.jackson.databind.ObjectMapper()
                .writeValueAsString(java.util.Map.of("content", "x".repeat(50_001)));
        for (String endpoint : new String[]{"/api/faqs/preview", "/api/faqs/generate"}) {
            mvc.perform(post(endpoint)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("INVALID_INPUT"));
        }
    }

    @Test
    void invalidInputReturnsClearError() throws Exception {
        mvc.perform(post("/api/faqs/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_INPUT"));
    }

    @Test
    void documentUploadRejectsUnsupportedFormat() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "sample.exe", "application/octet-stream", new byte[]{1, 2, 3});
        mvc.perform(multipart("/api/documents/extract").file(file))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_FORMAT"));
    }

    @Test
    void documentUploadRejectsFakePdf() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "sample.pdf", "application/pdf", "fake".getBytes());
        mvc.perform(multipart("/api/documents/extract").file(file))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("UNREADABLE_DOCUMENT"));
    }

    @Test
    void malformedJsonReturnsBadRequest() throws Exception {
        mvc.perform(post("/api/faqs/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_JSON"));
    }
}
