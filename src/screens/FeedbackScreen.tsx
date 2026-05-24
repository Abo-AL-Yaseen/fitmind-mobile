import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MessageSquare, Wrench, Star, ThumbsUp, ChevronRight } from 'lucide-react-native';
import { trainers, equipmentOptions } from '../data/feedbackData';

type TabType = "equipment" | "trainer" | "suggestion";

export default function FeedbackScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("equipment");
  const [selectedIssue, setSelectedIssue] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const tabs = [
    { id: "equipment" as TabType, label: "Equipment", icon: Wrench },
    { id: "trainer" as TabType, label: "Rate Trainer", icon: Star },
    { id: "suggestion" as TabType, label: "Suggestions", icon: MessageSquare },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Feedback & Reports</Text>
          <Text style={styles.headerSubtitle}>Help us improve your experience</Text>
        </View>

        {/* Success Toast */}
        {submitted && (
          <View style={styles.successToast}>
            <View style={styles.toastIcon}>
              <ThumbsUp color="#FFFFFF" size={18} />
            </View>
            <Text style={styles.toastText}>Thank you! We'll review your feedback shortly.</Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <TabIcon color={activeTab === tab.id ? "#FFFFFF" : "#9CA3AF"} size={13} />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Equipment Issues */}
        {activeTab === "equipment" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Wrench color="#F97316" size={20} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Report Equipment Issue</Text>
                <Text style={styles.cardSubtitle}>Let us know if something needs fixing</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.formLabel}>Which equipment?</Text>
              <View style={styles.optionsList}>
                {equipmentOptions.map((eq) => (
                  <TouchableOpacity
                    key={eq}
                    style={[
                      styles.optionItem,
                      selectedIssue === eq.toLowerCase().replace(/ /g, '-') && styles.optionItemSelected
                    ]}
                    onPress={() => setSelectedIssue(eq.toLowerCase().replace(/ /g, '-'))}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.radio,
                      selectedIssue === eq.toLowerCase().replace(/ /g, '-') && styles.radioSelected
                    ]} />
                    <Text style={styles.optionText}>{eq}</Text>
                    <ChevronRight color="#D1D5DB" size={14} style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Describe the issue</Text>
              <TextInput
                placeholder="Please describe what's wrong with the equipment..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                style={styles.textarea}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rate Trainer */}
        {activeTab === "trainer" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Star color="#F59E0B" size={20} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Rate Your Trainer</Text>
                <Text style={styles.cardSubtitle}>Your feedback helps us improve</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.formLabel}>Select Trainer</Text>
              <View style={styles.trainersList}>
                {trainers.map((trainer) => (
                  <TouchableOpacity
                    key={trainer.id}
                    style={[
                      styles.trainerItem,
                      selectedTrainer === trainer.id.toString() && styles.trainerItemSelected
                    ]}
                    onPress={() => setSelectedTrainer(trainer.id.toString())}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.trainerAvatar,
                      selectedTrainer === trainer.id.toString() && styles.trainerAvatarSelected
                    ]}>
                      <Text style={[
                        styles.trainerInitials,
                        selectedTrainer === trainer.id.toString() && styles.trainerInitialsSelected
                      ]}>
                        {trainer.initials}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.trainerName}>{trainer.name}</Text>
                      <Text style={styles.trainerRole}>{trainer.role}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Your Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                  >
                    <Star
                      color={star <= rating ? "#FBBF24" : "#E5E7EB"}
                      size={38}
                      fill={star <= rating ? "#FBBF24" : "#E5E7EB"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Your Feedback</Text>
              <TextInput
                placeholder="Share your experience with this trainer..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                style={styles.textarea}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.submitButtonText}>Submit Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Suggestions */}
        {activeTab === "suggestion" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#E6F4F1' }]}>
                <MessageSquare color="#0D7D6D" size={20} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Service Improvement</Text>
                <Text style={styles.cardSubtitle}>We value your suggestions</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.formLabel}>Your Suggestion</Text>
              <TextInput
                placeholder="What would you like us to improve or add to our gym?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                style={styles.textarea}
              />

              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Tip:</Text> Be as specific as possible. Whether it's new equipment, class times, or facility improvements — we want to hear it!
                </Text>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.submitButtonText}>Submit Suggestion</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E6F4F1',
    borderWidth: 2,
    borderColor: 'rgba(13, 125, 109, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  toastIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7D6D',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#0D7D6D',
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  form: {
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: -8,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  optionItemSelected: {
    borderColor: '#0D7D6D',
    backgroundColor: '#E6F4F1',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  radioSelected: {
    borderColor: '#0D7D6D',
    backgroundColor: '#0D7D6D',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  textarea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0D7D6D',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trainersList: {
    gap: 8,
  },
  trainerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  trainerItemSelected: {
    borderColor: '#0D7D6D',
    backgroundColor: '#E6F4F1',
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerAvatarSelected: {
    backgroundColor: '#0D7D6D',
  },
  trainerInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  trainerInitialsSelected: {
    color: '#FFFFFF',
  },
  trainerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  trainerRole: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  tipBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  tipBold: {
    fontWeight: '700',
  },
});
