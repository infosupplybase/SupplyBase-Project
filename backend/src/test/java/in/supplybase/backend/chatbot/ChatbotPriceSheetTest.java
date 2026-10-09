package in.supplybase.backend.chatbot;

import static org.assertj.core.api.Assertions.assertThat;

import in.supplybase.backend.catalogue.ServiceCategory;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** How the live price sheet writes prices, labels and page addresses. */
class ChatbotPriceSheetTest {

    @Test
    void paiseAreWrittenAsIndianRupees() {
        assertThat(ChatbotPriceSheet.rupees(9900)).isEqualTo("₹99");
        assertThat(ChatbotPriceSheet.rupees(2099900)).isEqualTo("₹20,999");
        assertThat(ChatbotPriceSheet.rupees(15000050)).isEqualTo("₹1,50,000.50");
        assertThat(ChatbotPriceSheet.rupees(1234567800)).isEqualTo("₹1,23,45,678");
        assertThat(ChatbotPriceSheet.rupees(50000)).isEqualTo("₹500");
    }

    @Test
    void optionValuesReadAsTheirLabels() {
        assertThat(ChatbotPriceSheet.label(Map.of("tractor-emulsion", "Tractor Emulsion"), "tractor-emulsion"))
                .isEqualTo("Tractor Emulsion");
        assertThat(ChatbotPriceSheet.label(Map.of(), "2bhk")).isEqualTo("2 BHK");
        assertThat(ChatbotPriceSheet.label(Map.of(), "bathroom-pvc")).isEqualTo("Bathroom PVC");
    }

    @Test
    void eachServiceLinksToItsOwnPage() {
        assertThat(ChatbotPriceSheet.pageFor(ServiceCategory.builder().slug("painting").build()))
                .isEqualTo("https://supplybase.co.in/services/painting");
        assertThat(ChatbotPriceSheet.pageFor(ServiceCategory.builder().slug("interior-by-choice").build()))
                .isEqualTo("https://supplybase.co.in/interior-by-choice");
        assertThat(ChatbotPriceSheet.pageFor(
                ServiceCategory.builder().slug("fan-installation").parentSlug("electrical").build()))
                .isEqualTo("https://supplybase.co.in/services/electrical/fan-installation");
    }
}
