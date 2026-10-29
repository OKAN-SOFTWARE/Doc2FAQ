package com.okansoftware.doc2faq.api;

import com.okansoftware.doc2faq.Doc2FaqApplication;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.test.web.servlet.MockMvc;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = Doc2FaqApplication.class)
@AutoConfigureMockMvc
class ExportIntegrationTest {
    @Autowired private MockMvc mvc;
    private static final String BODY = """
        {"title":"Team FAQ İstanbul","includeSources":true,"items":[
          {"question":"How do we share notes?","answer":"Use the café guide.\\nKeep <script> as plain text.",
           "edited":true,"sources":[{"section":"Knowledge Sharing","startLine":2,"endLine":4}]}]}
        """;

    @Test void exportsUnicodePdfWithReferencesAndMetadata() throws Exception {
        byte[] bytes = mvc.perform(post("/api/faqs/export/pdf").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk()).andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("doc2faq-draft.pdf")))
                .andReturn().getResponse().getContentAsByteArray();
        try (var document = Loader.loadPDF(bytes)) {
            String text = new PDFTextStripper().getText(document);
            assertEquals("Team FAQ İstanbul", document.getDocumentInformation().getTitle());
            assertTrue(text.contains("café")); assertTrue(text.contains("<script>"));
            assertTrue(text.contains("Knowledge Sharing")); assertTrue(text.contains("Edited"));
            assertTrue(text.contains("1 / 1"));
        }
    }

    @Test void exportsEditableWordWithTitleStyleAndPageNumber() throws Exception {
        byte[] bytes = mvc.perform(post("/api/faqs/export/docx").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .andReturn().getResponse().getContentAsByteArray();
        try (var document = new XWPFDocument(new ByteArrayInputStream(bytes)); var extractor = new XWPFWordExtractor(document)) {
            assertTrue(extractor.getText().contains("café"));
            assertTrue(extractor.getText().contains("<script>"));
            assertTrue(extractor.getText().contains("Knowledge Sharing"));
            assertEquals("Title", document.getParagraphs().getFirst().getStyle());
            assertEquals(ParagraphAlignment.CENTER, document.getParagraphs().getFirst().getAlignment());
            assertFalse(extractor.getText().contains("frequently asked questions"));
            assertTrue(document.getFooterList().getFirst().getParagraphs().stream()
                    .anyMatch(paragraph -> paragraph.getCTP().xmlText().contains("PAGE")));
        }
    }

    @Test void sourceReferencesCanBeOmitted() throws Exception {
        byte[] bytes = mvc.perform(post("/api/faqs/export/pdf").contentType(MediaType.APPLICATION_JSON)
                        .content(BODY.replace("\"includeSources\":true", "\"includeSources\":false")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        try (var document = Loader.loadPDF(bytes)) {
            String text = new PDFTextStripper().getText(document);
            assertFalse(text.contains("Knowledge Sharing")); assertFalse(text.contains("Edited"));
        }
    }

    @Test void pdfPaginatesLongAnswersAndUnbrokenWordsWithoutLosingText() throws Exception {
        String answer = "A clear answer with several details. ".repeat(300) + "x".repeat(1000) + " END_MARKER";
        String body = "{\"title\":\"Long FAQ\",\"items\":[{\"question\":\"What is covered?\",\"answer\":\"" + answer + "\"}]}";
        byte[] bytes = mvc.perform(post("/api/faqs/export/pdf").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        try (var document = Loader.loadPDF(bytes)) {
            assertTrue(document.getNumberOfPages() >= 3);
            assertTrue(new PDFTextStripper().getText(document).contains("END_MARKER"));
        }
    }

    @Test void invalidExportsReturnActionableErrors() throws Exception {
        for (String body : new String[]{"{\"title\":\"FAQ\",\"items\":[]}",
                BODY.replace("How do we share notes?", " "),
                BODY.replace("\"endLine\":4", "\"endLine\":1"),
                BODY.replace("\"items\":[", "\"items\":[null,")}) {
            mvc.perform(post("/api/faqs/export/pdf").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_INPUT"));
        }
        mvc.perform(post("/api/faqs/export/exe").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isBadRequest());
    }

    @Test void unsupportedPdfGlyphReturnsErrorInsteadOfSilentlyDroppingText() throws Exception {
        mvc.perform(post("/api/faqs/export/pdf").contentType(MediaType.APPLICATION_JSON)
                        .content(BODY.replace("café", "\uD83E\uDDEC")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("DOCX")));
    }

    @Test void pdfCentersItsTitleUsesEmbeddedLatoAndOmitsTheFaqCountSubtitle() throws Exception {
        byte[] bytes = mvc.perform(post("/api/faqs/export/pdf").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        try (var document = Loader.loadPDF(bytes)) {
            float[] bounds = new float[2];
            PDFTextStripper stripper = new PDFTextStripper() {
                @Override protected void writeString(String text, List<TextPosition> positions) throws IOException {
                    if (text.equals("Team FAQ İstanbul")) {
                        bounds[0] = positions.getFirst().getXDirAdj();
                        var last = positions.getLast();
                        bounds[1] = last.getXDirAdj() + last.getWidthDirAdj();
                    }
                    super.writeString(text, positions);
                }
            };
            assertFalse(stripper.getText(document).contains("frequently asked questions"));
            assertTrue(bounds[1] > bounds[0]);
            assertEquals(document.getPage(0).getMediaBox().getWidth() / 2, (bounds[0] + bounds[1]) / 2, 1);
            var resources = document.getPage(0).getResources();
            for (var name : resources.getFontNames()) {
                var font = resources.getFont(name);
                assertTrue(font.getName().contains("Lato"));
                assertTrue(font.isEmbedded());
            }
        }
    }

    @Test void exportHeadersUseTheRequestedNameAndTheCorrectExtension() throws Exception {
        for (String format : new String[]{"pdf", "docx"}) {
            var response = mvc.perform(post("/api/faqs/export/" + format).contentType(MediaType.APPLICATION_JSON)
                            .content(BODY.replace("\"title\":", "\"filename\":\"testdata-Doc2FAQ.pdf\",\"title\":")))
                    .andExpect(status().isOk()).andReturn().getResponse();
            assertEquals("testdata-Doc2FAQ." + format,
                    ContentDisposition.parse(response.getHeader("Content-Disposition")).getFilename());
        }
    }

    @Test void exportFilenamesCannotContainPathsOrHeaderControlCharacters() throws Exception {
        var response = mvc.perform(post("/api/faqs/export/pdf").contentType(MediaType.APPLICATION_JSON)
                        .content(BODY.replace("\"title\":", "\"filename\":\"../private\\\\name\\r\\n.pdf\",\"title\":")))
                .andExpect(status().isOk()).andReturn().getResponse();
        String name = ContentDisposition.parse(response.getHeader("Content-Disposition")).getFilename();
        assertFalse(name.contains("/")); assertFalse(name.contains("\\"));
        assertFalse(name.contains("\r")); assertFalse(name.contains("\n"));
        assertTrue(name.endsWith(".pdf"));
    }
}
