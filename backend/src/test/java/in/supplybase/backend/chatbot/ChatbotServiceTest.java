package in.supplybase.backend.chatbot;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** The plain-text rules that decide when a chat goes to the team. */
class ChatbotServiceTest {

    @Test
    void customerAskingForAPersonIsHandedToTheTeam() {
        assertThat(ChatbotService.asksForHuman("Talk to our team")).isTrue();
        assertThat(ChatbotService.asksForHuman("can I speak to a person?")).isTrue();
        assertThat(ChatbotService.asksForHuman("I want to talk with someone")).isTrue();
        assertThat(ChatbotService.asksForHuman("please call me back")).isTrue();
        assertThat(ChatbotService.asksForHuman("Need a callback")).isTrue();
    }

    @Test
    void ordinaryQuestionsStayWithTheAssistant() {
        assertThat(ChatbotService.asksForHuman("What services do you offer?")).isFalse();
        assertThat(ChatbotService.asksForHuman("How much is bathroom waterproofing?")).isFalse();
        assertThat(ChatbotService.asksForHuman("Is your team experienced?")).isFalse();
    }

    @Test
    void unknownAnswerIsDetectedEvenWithExtraWords() {
        assertThat(ChatbotService.isUnknownAnswer("I don't have that information.")).isTrue();
        assertThat(ChatbotService.isUnknownAnswer("Sorry, I don’t have that information.")).isTrue();
        assertThat(ChatbotService.isUnknownAnswer("User Safety: safe")).isTrue();
        assertThat(ChatbotService.isUnknownAnswer("  ")).isTrue();
        assertThat(ChatbotService.isUnknownAnswer("We offer painting and waterproofing.")).isFalse();
    }

    @Test
    void markdownIsTurnedIntoPlainText() {
        assertThat(ChatbotService.cleanResponse(
                "## Painting\n**Book** on [our painting page](https://supplybase.co.in/services/painting)."))
                .isEqualTo("Painting\nBook on our painting page (https://supplybase.co.in/services/painting).");
    }
}
