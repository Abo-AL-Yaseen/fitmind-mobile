import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
} from 'lucide-react-native';
import { useAssistantChatMutation } from '../hooks/assistant/mutations/useAssistantChatMutation';
import { useStoredAuthQuery } from '../hooks/auth/queries/useStoredAuthQuery';
import type { AssistantSource } from '../services/assistant';
import { Colors } from '../constants/theme';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  warnings?: string[];
  sources?: AssistantSource[];
  createdAt: Date;
};

const ASSISTANT_ERROR_MESSAGE =
  'FitMind Assistant is temporarily unavailable. Please try again.';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial-assistant-message',
  role: 'assistant',
  text: "Hi, I'm FitMind Assistant. Ask me about your workout, nutrition, injuries, or plan.",
  createdAt: new Date(),
};

function createMessageId(role: ChatRole) {
  return `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSourceNames(sources?: AssistantSource[]) {
  return Array.from(
    new Set(
      (sources ?? [])
        .map((source) => String(source.source_name ?? '').trim())
        .filter(Boolean)
    )
  );
}

function normalizeWarnings(warnings?: string[]) {
  return (warnings ?? [])
    .map((warning) => String(warning ?? '').trim())
    .filter(Boolean);
}

export default function AssistantScreen({ navigation }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const chatMutation = useAssistantChatMutation();
  const authQuery = useStoredAuthQuery();
  const isLoading = chatMutation.isPending;
  const role = authQuery.data?.role?.toLowerCase() ?? null;
  const isMember = role === 'user';

  const trimmedInput = inputText.trim();
  const canSend = trimmedInput.length > 0 && !isLoading;

  const inputPlaceholder = useMemo(
    () => (isLoading ? 'Assistant is thinking...' : 'Ask FitMind Assistant...'),
    [isLoading]
  );

  const scrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated });
      }, 80);
    });
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardSubscription = Keyboard.addListener(showEvent, () => {
      scrollToEnd(true);
    });

    return () => {
      keyboardSubscription.remove();
    };
  }, [scrollToEnd]);

  const appendMessages = (nextMessages: ChatMessage[]) => {
    setMessages((current) => [...current, ...nextMessages]);
    scrollToEnd();
  };

  const handleSend = async () => {
    if (!canSend) return;

    const messageText = trimmedInput;
    setInputText('');

    appendMessages([
      {
        id: createMessageId('user'),
        role: 'user',
        text: messageText,
        createdAt: new Date(),
      },
    ]);

    try {
      const response = await chatMutation.mutateAsync(messageText);

      appendMessages([
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          text: String(response.answer || '').trim() || ASSISTANT_ERROR_MESSAGE,
          warnings: normalizeWarnings(response.warnings),
          sources: response.sources ?? [],
          createdAt: new Date(),
        },
      ]);
    } catch {
      appendMessages([
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          text: ASSISTANT_ERROR_MESSAGE,
          createdAt: new Date(),
        },
      ]);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const warnings = normalizeWarnings(item.warnings);
    const sourceNames = getSourceNames(item.sources);

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Bot color={Colors.primary} size={17} />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {item.text}
          </Text>

          {!isUser && warnings.length > 0 && (
            <View style={styles.warningsBox}>
              <View style={styles.warningHeader}>
                <AlertTriangle color="#B45309" size={13} />
                <Text style={styles.warningTitle}>Warnings</Text>
              </View>
              {warnings.map((warning, index) => (
                <Text key={`${item.id}-warning-${index}`} style={styles.warningText}>
                  {warning}
                </Text>
              ))}
            </View>
          )}

          {!isUser && sourceNames.length > 0 && (
            <Text style={styles.sourcesText}>
              Sources: {sourceNames.join(', ')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (authQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color="#FFFFFF" size="small" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isMember) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.restrictedHeader}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#FFFFFF" size={23} />
          </TouchableOpacity>
        </View>

        <View style={styles.restrictedBody}>
          <View style={styles.restrictedIcon}>
            <Sparkles color={Colors.primary} size={24} />
          </View>
          <Text style={styles.restrictedTitle}>FitMind Assistant</Text>
          <Text style={styles.restrictedText}>
            FitMind Assistant is available for members only.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#FFFFFF" size={23} />
          </TouchableOpacity>

          <View style={styles.headerIcon}>
            <Sparkles color="#FFFFFF" size={18} />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>FitMind Assistant</Text>
            <Text style={styles.headerSubtitle}>Workout, nutrition, and injury help</Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollToEnd(true)}
          onLayout={() => scrollToEnd(false)}
        />

        {isLoading && (
          <View style={styles.typingRow}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.typingText}>FitMind Assistant is typing...</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={inputPlaceholder}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
            maxLength={700}
            editable={!isLoading}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            onContentSizeChange={() => scrollToEnd(false)}
          />

          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            activeOpacity={0.82}
            onPress={handleSend}
            disabled={!canSend}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Send color="#FFFFFF" size={19} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  restrictedBody: {
    flex: 1,
    backgroundColor: '#F7F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  restrictedIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  restrictedTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  restrictedText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 18,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 5,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  assistantMessageText: {
    color: '#111827',
  },
  warningsBox: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    padding: 10,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  warningTitle: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  sourcesText: {
    marginTop: 9,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 8,
    backgroundColor: '#F7F9FB',
  },
  typingText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 12 : 10,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 112,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A7CFC9',
  },
});
