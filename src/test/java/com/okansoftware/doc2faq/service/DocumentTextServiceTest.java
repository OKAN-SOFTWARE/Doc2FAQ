package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.ExtractedDocument;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class DocumentTextServiceTest {
    private final DocumentTextService service = new DocumentTextService();

    @Test
    void extractsReadablePdfWithoutStoringIt() throws Exception {
        byte[] bytes = samplePdf("Q: What is Doc2FAQ?", "A: A document FAQ workbench.");
        ExtractedDocument result = service.extract(upload("policy.pdf", bytes));

        assertEquals("pdf", result.format());
        assertEquals("policy.pdf", result.filename());
        assertTrue(result.text().contains("What is Doc2FAQ?"));
        assertTrue(result.text().contains("A document FAQ workbench."));
    }

    @Test
    void extractsDocxParagraphsAndRecognizesQuestionLines() throws Exception {
        byte[] bytes;
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.createParagraph().createRun().setText("What is the vacation policy?");
            document.createParagraph().createRun().setText("Employees receive 15 days annually.");
            document.write(output);
            bytes = output.toByteArray();
        }

        ExtractedDocument result = service.extract(upload("handbook.docx", bytes));
        assertEquals("docx", result.format());
        assertTrue(result.text().contains("Q: What is the vacation policy?"));
        assertTrue(result.text().contains("Employees receive 15 days annually."));
    }

    @Test
    void rejectsSpoofedAndBrokenFiles() {
        assertEquals("UNSUPPORTED_FORMAT", assertThrows(DocumentException.class,
                () -> service.extract(upload("payload.exe", new byte[]{1, 2, 3}))).code());
        assertEquals("UNREADABLE_DOCUMENT", assertThrows(DocumentException.class,
                () -> service.extract(upload("fake.pdf", "not a pdf".getBytes(StandardCharsets.UTF_8)))).code());
        assertEquals("UNREADABLE_DOCUMENT", assertThrows(DocumentException.class,
                () -> service.extract(upload("fake.docx", new byte[]{'P', 'K', 3, 4}))).code());
    }

    @Test
    void rejectsEmptyOversizedAndImageOnlyDocuments() throws Exception {
        assertEquals("EMPTY_FILE", assertThrows(DocumentException.class,
                () -> service.extract(upload("empty.pdf", new byte[0]))).code());
        assertEquals("FILE_TOO_LARGE", assertThrows(DocumentException.class,
                () -> service.extract(upload("large.pdf", new byte[DocumentTextService.MAX_FILE_BYTES + 1]))).code());
        assertEquals("UNREADABLE_DOCUMENT", assertThrows(DocumentException.class,
                () -> service.extract(upload("empty.pdf", samplePdf()))).code());
    }

    @Test
    void limitsPdfPageCount() throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (PDDocument document = new PDDocument()) {
            for (int i = 0; i < 51; i++) {
                document.addPage(new PDPage());
            }
            document.save(output);
        }
        assertEquals("DOCUMENT_TOO_LONG", assertThrows(DocumentException.class,
                () -> service.extract(upload("long.pdf", output.toByteArray()))).code());
    }

    private static MockMultipartFile upload(String name, byte[] bytes) {
        return new MockMultipartFile("file", name, "application/octet-stream", bytes);
    }

    private static byte[] samplePdf(String... lines) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            if (lines.length > 0) {
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    stream.beginText();
                    stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    stream.newLineAtOffset(50, 700);
                    for (String line : lines) {
                        stream.showText(line);
                        stream.newLineAtOffset(0, -20);
                    }
                    stream.endText();
                }
            }
            document.save(output);
        }
        return output.toByteArray();
    }
}
