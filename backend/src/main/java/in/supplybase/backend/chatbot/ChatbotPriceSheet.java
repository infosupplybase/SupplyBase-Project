package in.supplybase.backend.chatbot;

import in.supplybase.backend.catalogue.PaintingProductPrice;
import in.supplybase.backend.catalogue.PaintingProductPriceRepository;
import in.supplybase.backend.catalogue.PopCeilingPricingService;
import in.supplybase.backend.catalogue.ServiceCategory;
import in.supplybase.backend.catalogue.ServiceCategoryRepository;
import in.supplybase.backend.catalogue.ServiceOption;
import in.supplybase.backend.catalogue.ServiceOptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * The live rate card, written out as plain text for the chatbot.
 *
 * Read from the same catalogue tables the booking pages use, so a price
 * changed in admin or by a migration reaches the bot without anyone editing
 * the knowledge file. Rebuilt at most every few minutes.
 */
@Component
public class ChatbotPriceSheet {

    private static final Logger log = LoggerFactory.getLogger(ChatbotPriceSheet.class);

    private static final Duration REFRESH = Duration.ofMinutes(10);
    private static final String SITE = "https://supplybase.co.in";

    private final ServiceCategoryRepository categories;
    private final ServiceOptionRepository options;
    private final PaintingProductPriceRepository paintingPrices;
    private final PopCeilingPricingService popPrices;

    private volatile String cached;
    private volatile Instant builtAt = Instant.EPOCH;

    public ChatbotPriceSheet(ServiceCategoryRepository categories,
                             ServiceOptionRepository options,
                             PaintingProductPriceRepository paintingPrices,
                             PopCeilingPricingService popPrices) {
        this.categories = categories;
        this.options = options;
        this.paintingPrices = paintingPrices;
        this.popPrices = popPrices;
    }

    /** The current price sheet, or the last good one if the database is unreachable. */
    public String text() {
        if (cached == null || Instant.now().isAfter(builtAt.plus(REFRESH))) {
            try {
                cached = build();
                builtAt = Instant.now();
            } catch (Exception e) {
                log.warn("Could not build the chatbot price sheet: {}", e.getMessage());
                if (cached == null) {
                    return "";
                }
            }
        }
        return cached;
    }

    String build() {
        StringBuilder out = new StringBuilder("LIVE PRICES FROM THE BOOKING SYSTEM\n");

        for (ServiceCategory category : categories.findByActiveTrueOrderBySortOrderAsc()) {
            List<ServiceOption> rows =
                    options.findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(category.getId());
            Map<String, String> labels = labels(rows);

            out.append("\n").append(category.getName().toUpperCase(Locale.ROOT))
                    .append(" (").append(pageFor(category)).append(")\n");
            out.append("Home visit fee (where the booking asks for one): ").append(rupees(category.getVisitFeePaise())).append("\n");
            if (category.getEstimateMinPaise() != null && category.getEstimateMaxPaise() != null) {
                out.append("Typical job estimate: ").append(rupees(category.getEstimateMinPaise()))
                        .append(" to ").append(rupees(category.getEstimateMaxPaise())).append("\n");
            }

            appendPricedOptions(out, rows);

            if ("painting".equals(category.getSlug())) {
                appendPaintingPrices(out, labels);
            }
            if ("pop-ceiling-design".equals(category.getSlug())) {
                appendPopPrices(out, labels);
            }
        }
        return out.toString();
    }

    /** Every option that carries a price, or a rate written in its hint, grouped by question. */
    private void appendPricedOptions(StringBuilder out, List<ServiceOption> rows) {
        Map<String, Set<String>> byQuestion = new LinkedHashMap<>();
        for (ServiceOption row : rows) {
            String hint = row.getOptionHint() == null ? "" : row.getOptionHint().trim();
            boolean hintHasRate = hint.contains("₹");
            if (row.getOptionLabel() == null || (row.getPricePaise() == null && !hintHasRate)) {
                continue;
            }
            StringBuilder line = new StringBuilder("- ");
            if (row.getOptionGroup() != null && !row.getOptionGroup().isBlank()) {
                line.append(row.getOptionGroup()).append(": ");
            }
            line.append(row.getOptionLabel());
            if (hintHasRate) {
                // The hint already says how the price is charged, e.g. "₹450 / point".
                line.append(": ").append(hint);
            } else {
                line.append(": ").append(rupees(row.getPricePaise()));
                if (!hint.isEmpty()) {
                    line.append(" (").append(hint).append(")");
                }
            }
            // Questions repeated across a service's flows list the same add-on once.
            byQuestion.computeIfAbsent(row.getQuestionText(), k -> new LinkedHashSet<>()).add(line.toString());
        }
        byQuestion.forEach((question, lines) -> {
            out.append(question).append(":\n");
            lines.forEach(l -> out.append(l).append("\n"));
        });
    }

    private void appendPaintingPrices(StringBuilder out, Map<String, String> labels) {
        Map<String, List<String>> byGroup = new LinkedHashMap<>();
        for (PaintingProductPrice p : paintingPrices.findAllByOrderByIdAsc()) {
            String flow = p.getFlowKey().startsWith("full_home") ? "Full home painting" : "Few walls / ceiling painting";
            String group = flow + ", " + label(labels, p.getPaintingType()) + ", " + label(labels, p.getBrand());
            byGroup.computeIfAbsent(group, k -> new ArrayList<>()).add(
                    "- " + label(labels, p.getHomeType()) + ", " + label(labels, p.getProductValue())
                            + ": " + rupees(p.getPricePaise()));
        }
        if (byGroup.isEmpty()) {
            return;
        }
        out.append("Painting package prices (labour and paint):\n");
        byGroup.forEach((group, lines) -> {
            out.append(group).append(":\n");
            lines.forEach(l -> out.append(l).append("\n"));
        });
    }

    private void appendPopPrices(StringBuilder out, Map<String, String> labels) {
        List<PopCeilingPricingService.StartingPrice> prices = popPrices.listPrices();
        if (prices.isEmpty()) {
            return;
        }
        out.append("POP ceiling starting prices:\n");
        for (PopCeilingPricingService.StartingPrice p : prices) {
            String where = p.homeType().startsWith("room:")
                    ? label(labels, p.homeType().substring(5))
                    : "Full home " + label(labels, p.homeType());
            String type = "*".equals(p.ceilingType()) ? "" : ", " + label(labels, p.ceilingType());
            out.append("- ").append(where).append(type).append(": from ")
                    .append(rupees(p.pricePaise())).append("\n");
        }
    }

    /** Option value to its label, so "tractor-emulsion" reads "Tractor Emulsion". */
    private static Map<String, String> labels(List<ServiceOption> rows) {
        Map<String, String> labels = new HashMap<>();
        for (ServiceOption row : rows) {
            if (row.getOptionValue() != null && row.getOptionLabel() != null) {
                labels.putIfAbsent(row.getOptionValue(), row.getOptionLabel());
            }
        }
        return labels;
    }

    static String label(Map<String, String> labels, String value) {
        String known = labels.get(value);
        if (known != null) {
            return known;
        }
        StringBuilder words = new StringBuilder();
        for (String word : value.split("[-_]")) {
            if (word.isEmpty()) {
                continue;
            }
            if (words.length() > 0) {
                words.append(' ');
            }
            words.append(word.matches("\\d+bhk") ? word.replace("bhk", " BHK")
                    : word.equals("pvc") || word.equals("pop") ? word.toUpperCase(Locale.ROOT)
                    : Character.toUpperCase(word.charAt(0)) + word.substring(1));
        }
        return words.toString();
    }

    static String pageFor(ServiceCategory category) {
        if ("interior-by-choice".equals(category.getSlug())) {
            return SITE + "/interior-by-choice";
        }
        if (category.getParentSlug() != null) {
            return SITE + "/services/" + category.getParentSlug() + "/" + category.getSlug();
        }
        return SITE + "/services/" + category.getSlug();
    }

    /** Indian digit grouping, as the website shows it: 150000.50 is ₹1,50,000.50. */
    static String rupees(long paise) {
        String digits = Long.toString(paise / 100);
        String grouped = digits;
        if (digits.length() > 3) {
            // The last three digits, then pairs: 1,23,45,678.
            String head = digits.substring(0, digits.length() - 3);
            StringBuilder out = new StringBuilder();
            for (int i = 0; i < head.length(); i++) {
                if (i > 0 && (head.length() - i) % 2 == 0) {
                    out.append(',');
                }
                out.append(head.charAt(i));
            }
            grouped = out + "," + digits.substring(digits.length() - 3);
        }
        long rest = paise % 100;
        return "₹" + grouped + (rest == 0 ? "" : String.format(".%02d", rest));
    }
}
