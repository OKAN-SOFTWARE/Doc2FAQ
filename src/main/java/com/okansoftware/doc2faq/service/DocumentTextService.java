package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.ExtractedDocument;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Converts small PDF/DOCX uploads to reviewable text without persisting the file.
 * Text is returned to the browser; FAQ extraction remains a separate user action.
 */
@Service
public class DocumentTextService {
    public static final int MAX_FILE_BYTES = 5 * 1024 * 1024;
    public static final int MAX_TEXT_CHARACTERS = 50_000;
    private static final int MAX_PDF_PAGES = 50;
    private static final Pattern STANDALONE_QUESTION =
            Pattern.compile("^[^#\\r\\n]{5,150}\\?$");

    public ExtractedDocument extract(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new DocumentException("EMPTY_FILE", "Choose a non-empty PDF or DOCX document");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            filename = "document";
        }
        // Browsers send names, but do not allow an untrusted path to reach the UI.
        filename = filename.replace('\\', '/');
        filename = filename.substring(filename.lastIndexOf('/') + 1);
        String lower = filename.toLowerCase(Locale.ROOT);
        boolean pdf = lower.endsWith(".pdf");
        boolean docx = lower.endsWith(".docx");
        if (!pdf && !docx) {
            throw new DocumentException("UNSUPPORTED_FORMAT", "Only .pdf and .docx uploads are supported");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new DocumentException("FILE_TOO_LARGE", "Maximum document size is 5 MB");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new DocumentException("UNREADABLE_DOCUMENT", "Could not read the uploaded file");
        }
        if (bytes.length > MAX_FILE_BYTES) {
            throw new DocumentException("FILE_TOO_LARGE", "Maximum document size is 5 MB");
        }
        if (pdf && !startsWith(bytes, "%PDF-")) {
            throw new DocumentException("UNREADABLE_DOCUMENT", "This file does not appear to be a valid PDF");
        }
        if (docx && !(bytes.length >= 4 && bytes[0] == 'P' && bytes[1] == 'K'
                && (bytes[2] == 3 || bytes[2] == 5 || bytes[2] == 7)
                && (bytes[3] == 4 || bytes[3] == 6 || bytes[3] == 8))) {
            throw new DocumentException("UNREADABLE_DOCUMENT", "This file does not appear to be a valid DOCX");
        }

        String text = pdf ? readPdf(bytes) : readDocx(bytes);
        text = normalizeQuestions(text.replace("\r\n", "\n").replace('\r', '\n').replace('\0', ' ')).strip();
        if (text.isBlank()) {
            throw new DocumentException("UNREADABLE_DOCUMENT",
                    "No selectable text found. Scanned PDFs require OCR, which is not supported");
        }
        if (text.length() > MAX_TEXT_CHARACTERS) {
            throw new DocumentException("DOCUMENT_TOO_LONG",
                    "Extracted text exceeds 50,000 characters. Use a shorter document");
        }
        return new ExtractedDocument(filename, pdf ? "pdf" : "docx", text);
    }

    private static boolean startsWith(byte[] bytes, String signature) {
        if (bytes.length < signature.length()) {
            return false;
        }
        for (int i = 0; i < signature.length(); i++) {
            if (bytes[i] != (byte) signature.charAt(i)) {
                return false;
            }
        }
        return true;
    }

    private static String readPdf(byte[] bytes) {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.isEncrypted()) {
                throw new DocumentException("UNREADABLE_DOCUMENT",
                        "Password-protected PDFs are not supported");
            }
            if (document.getNumberOfPages() > MAX_PDF_PAGES) {
                throw new DocumentException("DOCUMENT_TOO_LONG", "PDFs must not exceed 50 pages");
            }
            return new PDFTextStripper().getText(document);
        } catch (DocumentException exception) {
            throw exception;
        } catch (IOException | RuntimeException exception) {
            throw new DocumentException("UNREADABLE_DOCUMENT", "Could not extract text from the PDF");
        }
    }

    private static String readDocx(byte[] bytes) {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes));
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        } catch (IOException | RuntimeException exception) {
            throw new DocumentException("UNREADABLE_DOCUMENT", "Could not extract text from the DOCX");
        }
    }

    /**
     * PDF/Word paragraphs lose Markdown heading metadata. Recognize only
     * short lines already written as questions; do not generate new questions.
     */
    private static String normalizeQuestions(String text) {
        StringBuilder normalized = new StringBuilder(text.length());
        for (String line : text.split("\n", -1)) {
            String trimmed = line.strip();
            if (STANDALONE_QUESTION.matcher(trimmed).matches()
                    && trimmed.contains(" ")
                    && !trimmed.matches("(?i)^(?:Q|Question):.*")) {
                normalized.append("Q: ").append(trimmed);
            } else {
                normalized.append(line);
            }
            normalized.append('\n');
        }
        return normalized.toString();
    }
}
