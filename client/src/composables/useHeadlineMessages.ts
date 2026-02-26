import { ref, type Ref } from "vue";

const messages: Ref<string[]> = ref([]);

export function useHeadlineMessages() {
  function setMessages(next: string[]): void {
    if (next.length > 0) {
      messages.value = next;
    }
  }

  function clearMessages(): void {
    messages.value = [];
  }

  return { messages, setMessages, clearMessages };
}
