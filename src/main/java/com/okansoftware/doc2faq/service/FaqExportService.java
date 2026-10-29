package com.okansoftware.doc2faq.service;

import com.okansoftware.doc2faq.model.ExportRequest;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Service;

/** Stateless exports; content is written to an in-memory response, never to a server file. */
@Service
public class FaqExportService {
    private static void validate(ExportRequest request) {
        validateText(request.title());
        int characters = request.title().length();
        for (var item : request.items()) {
            validateText(item.question()); validateText(item.answer());
            characters += item.question().length() + item.answer().length();
            if (item.sources() != null) for (var source : item.sources()) {
                validateText(source.section());
                if (source.endLine() < source.startLine() || source.endLine() > 50001) {
                    throw new IllegalArgumentException("Invalid source line range");
                }
                characters += source.section().length();
            }
        }
        if (characters > 300000) throw new IllegalArgumentException("Export text must not exceed 300,000 characters");
    }

    private static void validateText(String text) {
        if (text.codePoints().anyMatch(point -> (point < 32 && point != '\n' && point != '\r' && point != '\t')
                || (point >= 0xD800 && point <= 0xDFFF) || point == 0xFFFE || point == 0xFFFF)) {
            throw new IllegalArgumentException("Export text contains unsupported control characters. Remove them and retry.");
        }
    }

    public byte[] pdf(ExportRequest request) throws IOException {
        validate(request);
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream();
             InputStream normal = font("Lato-Regular.ttf"); InputStream strong = font("Lato-Bold.ttf")) {
            PDType0Font regular = PDType0Font.load(document, normal);
            PDType0Font bold = PDType0Font.load(document, strong);
            document.getDocumentInformation().setTitle(request.title().strip());
            document.getDocumentInformation().setCreator("Doc2FAQ");
            PdfLayout layout = new PdfLayout(document, regular, bold);
            try {
                layout.title(request.title().strip());
                for (int i = 0; i < request.items().size(); i++) {
                    var item = request.items().get(i);
                    layout.heading((i + 1) + ". " + item.question().strip());
                    layout.paragraph(item.answer().strip(), 11, false, 10);
                    if (request.includeSources()) {
                        for (String reference : references(item)) layout.paragraph(reference, 9, false, 5);
                    }
                    layout.gap(12);
                }
                layout.finish();
            } finally {
                layout.close();
            }
            document.save(output);
            return output.toByteArray();
        } catch (IllegalArgumentException exception) {
            if (exception.getMessage() != null && (exception.getMessage().contains("glyph")
                    || exception.getMessage().contains("is not available"))) {
                throw new IllegalArgumentException("PDF export encountered an unsupported character. Use DOCX export for this text.");
            }
            throw exception;
        }
    }

    private static InputStream font(String name) throws IOException {
        InputStream input = FaqExportService.class.getResourceAsStream("/fonts/" + name);
        if (input == null) throw new IOException("Bundled PDF font is missing");
        return input;
    }

    public byte[] docx(ExportRequest request) throws IOException {
        validate(request);
        try (XWPFDocument document = new XWPFDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.getProperties().getCoreProperties().setTitle(request.title().strip());
            document.getProperties().getCoreProperties().setCreator("Doc2FAQ");
            var styles = document.createStyles();
            addStyle(styles, "Title", "Title", 48, false);
            addStyle(styles, "Heading1", "Heading 1", 28, true);
            var section = document.getDocument().getBody().addNewSectPr();
            var page = section.addNewPgSz();
            page.setW(BigInteger.valueOf(12240));
            page.setH(BigInteger.valueOf(15840));
            var margins = section.addNewPgMar();
            margins.setTop(BigInteger.valueOf(1080)); margins.setBottom(BigInteger.valueOf(1080));
            margins.setLeft(BigInteger.valueOf(1080)); margins.setRight(BigInteger.valueOf(1080));

            var title = paragraph(document, request.title().strip(), 24, false);
            title.setStyle("Title");
            title.setAlignment(ParagraphAlignment.CENTER);
            title.setSpacingAfter(360);
            for (int i = 0; i < request.items().size(); i++) {
                var item = request.items().get(i);
                var heading = paragraph(document, (i + 1) + ". " + item.question().strip(), 14, true);
                heading.setStyle("Heading1");
                heading.setKeepNext(true);
                heading.setSpacingBefore(240);
                paragraph(document, item.answer().strip(), 11, false);
                if (request.includeSources()) {
                    for (String reference : references(item)) paragraph(document, reference, 9, false);
                }
            }
            XWPFFooter footer = document.createFooter(org.apache.poi.wp.usermodel.HeaderFooterType.DEFAULT);
            XWPFParagraph foot = footer.createParagraph();
            foot.setAlignment(ParagraphAlignment.RIGHT);
            var run = foot.createRun(); run.setText("Doc2FAQ | Page "); run.setFontSize(9);
            foot.getCTP().addNewFldSimple().setInstr("PAGE");
            document.write(output);
            return output.toByteArray();
        }
    }

    private static void addStyle(XWPFStyles styles, String id, String name, int halfPoints, boolean bold) {
        CTStyle style = CTStyle.Factory.newInstance();
        style.setStyleId(id); style.setType(STStyleType.PARAGRAPH);
        style.addNewName().setVal(name);
        var properties = style.addNewRPr();
        properties.addNewSz().setVal(BigInteger.valueOf(halfPoints));
        properties.addNewColor().setVal("000000");
        if (bold) properties.addNewB();
        styles.addStyle(new XWPFStyle(style));
    }

    private static XWPFParagraph paragraph(XWPFDocument document, String text, int size, boolean bold) {
        XWPFParagraph paragraph = document.createParagraph();
        paragraph.setSpacingAfter(160);
        paragraph.setSpacingBetween(1.2);
        XWPFRun run = paragraph.createRun();
        run.setFontFamily("Calibri"); run.setFontSize(size); run.setBold(bold); run.setColor("000000");
        String[] lines = text.split("\\R", -1);
        for (int i = 0; i < lines.length; i++) {
            if (i > 0) run.addBreak();
            run.setText(lines[i]);
        }
        return paragraph;
    }

    private static List<String> references(ExportRequest.Entry item) {
        List<String> result = new ArrayList<>();
        if (item.sources() != null) for (var source : item.sources()) {
            result.add("Source: " + source.section() + " (text lines " + source.startLine() + "-" + source.endLine() + ").");
        }
        if (result.isEmpty()) result.add("Manually added: no source reference.");
        if (item.edited()) result.add("Edited answer or question: recheck against the source.");
        return result;
    }

    private static final class PdfLayout implements AutoCloseable {
        private static final float MARGIN = 54;
        private static final float WIDTH = PDRectangle.LETTER.getWidth() - 2 * MARGIN;
        private final PDDocument document;
        private final PDType0Font regular;
        private final PDType0Font bold;
        private PDPageContentStream stream;
        private float y;

        PdfLayout(PDDocument document, PDType0Font regular, PDType0Font bold) throws IOException {
            this.document = document; this.regular = regular; this.bold = bold;
            newPage();
        }

        void newPage() throws IOException {
            close();
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = PDRectangle.LETTER.getHeight() - MARGIN;
        }

        void heading(String text) throws IOException {
            var lines = wrap(text, bold, 13);
            if (y - (lines.size() * 19 + 32) < MARGIN && y < 738) newPage();
            paragraph(text, 13, true, 8);
        }

        void title(String text) throws IOException {
            int size = 26;
            for (String line : wrap(text, bold, size)) {
                if (y - size * 1.5f < MARGIN) newPage();
                float width = bold.getStringWidth(line) / 1000 * size;
                draw(stream, line, bold, size, MARGIN + (WIDTH - width) / 2, y - size);
                y -= size * 1.5f;
            }
            gap(24);
        }

        void paragraph(String text, int size, boolean strong, int after) throws IOException {
            PDType0Font font = strong ? bold : regular;
            for (String line : wrap(text, font, size)) {
                if (y - size * 1.5f < MARGIN) newPage();
                draw(stream, line, font, size, MARGIN, y - size);
                y -= size * 1.5f;
            }
            gap(after);
        }

        private static List<String> wrap(String text, PDType0Font font, int size) throws IOException {
            List<String> lines = new ArrayList<>();
            for (String paragraph : text.replace('\t', ' ').split("\\R", -1)) {
                StringBuilder line = new StringBuilder();
                float width = 0;
                int lastSpace = -1;
                for (int offset = 0; offset < paragraph.length();) {
                    int point = paragraph.codePointAt(offset);
                    String character = new String(Character.toChars(point));
                    float advance = font.getStringWidth(character) / 1000 * size;
                    while (width + advance > WIDTH && !line.isEmpty()) {
                        if (lastSpace > 0) {
                            lines.add(line.substring(0, lastSpace));
                            String rest = line.substring(lastSpace + 1);
                            line.setLength(0); line.append(rest);
                            width = font.getStringWidth(rest) / 1000 * size;
                        } else {
                            lines.add(line.toString()); line.setLength(0); width = 0;
                        }
                        lastSpace = line.lastIndexOf(" ");
                    }
                    if (point == ' ') lastSpace = line.length();
                    line.append(character); width += advance;
                    offset += Character.charCount(point);
                }
                lines.add(line.toString());
            }
            return lines;
        }

        void gap(int points) { y -= points; }

        void finish() throws IOException {
            close();
            for (int i = 0; i < document.getNumberOfPages(); i++) {
                try (var footer = new PDPageContentStream(document, document.getPage(i),
                        PDPageContentStream.AppendMode.APPEND, true, true)) {
                    draw(footer, "Doc2FAQ | " + (i + 1) + " / " + document.getNumberOfPages(), regular, 9, MARGIN, 30);
                }
            }
        }

        private static void draw(PDPageContentStream target, String text, PDType0Font font,
                                 int size, float x, float y) throws IOException {
            target.beginText(); target.setFont(font, size); target.setNonStrokingColor(Color.BLACK);
            target.newLineAtOffset(x, y); target.showText(text); target.endText();
        }

        @Override public void close() throws IOException {
            if (stream != null) { stream.close(); stream = null; }
        }
    }
}
