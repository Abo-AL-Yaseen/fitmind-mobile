import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { User, Lock, Bell, Target, LogOut, ChevronRight, Edit2 } from 'lucide-react-native';

export default function SettingsScreen() {
  const [editMode, setEditMode] = useState(false);
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    mealReminders: true,
    progressUpdates: true,
    newsOffers: false,
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>John Doe</Text>
            <Text style={styles.headerEmail}>john@example.com</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>⭐ Premium Member</Text>
            </View>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                <User color="#0D7D6D" size={18} />
              </View>
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, editMode && styles.editButtonActive]}
              onPress={() => setEditMode(!editMode)}
              activeOpacity={0.7}
            >
              <Edit2 color={editMode ? "#6B7280" : "#0D7D6D"} size={12} />
              <Text style={[styles.editButtonText, editMode && styles.editButtonTextActive]}>
                {editMode ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputsGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                defaultValue="John Doe"
                editable={editMode}
                style={[styles.input, !editMode && styles.inputDisabled]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                defaultValue="john@example.com"
                editable={editMode}
                keyboardType="email-address"
                style={[styles.input, !editMode && styles.inputDisabled]}
              />
            </View>

            <View style={styles.halfInputGroup}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (in)</Text>
                <TextInput
                  defaultValue="72"
                  editable={editMode}
                  keyboardType="numeric"
                  style={[styles.input, !editMode && styles.inputDisabled]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (lbs)</Text>
                <TextInput
                  defaultValue="176"
                  editable={editMode}
                  keyboardType="numeric"
                  style={[styles.input, !editMode && styles.inputDisabled]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                defaultValue="28"
                editable={editMode}
                keyboardType="numeric"
                style={[styles.input, !editMode && styles.inputDisabled]}
              />
            </View>
          </View>

          {editMode && (
            <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fitness Goals */}
        <View style={styles.card}>
          <View style={styles.cardHeaderSimple}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Target color="#F59E0B" size={18} />
            </View>
            <Text style={styles.cardTitle}>Fitness Goals</Text>
          </View>

          <View style={styles.inputsGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Primary Goal</Text>
              <View style={styles.selectInput}>
                <Text style={styles.selectText}>Weight Loss</Text>
                <ChevronRight color="#9CA3AF" size={16} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Activity Level</Text>
              <View style={styles.selectInput}>
                <Text style={styles.selectText}>Moderate Activity</Text>
                <ChevronRight color="#9CA3AF" size={16} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Weight (lbs)</Text>
              <TextInput
                defaultValue="170"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <View style={styles.cardHeaderSimple}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Bell color="#A855F7" size={18} />
            </View>
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>

          <View style={styles.notificationsList}>
            {[
              { key: "workoutReminders" as const, title: "Workout Reminders", desc: "Get notified about scheduled workouts" },
              { key: "mealReminders" as const, title: "Meal Reminders", desc: "Reminders for meal times" },
              { key: "progressUpdates" as const, title: "Progress Updates", desc: "Weekly progress summaries" },
              { key: "newsOffers" as const, title: "News & Offers", desc: "Special deals and announcements" },
            ].map((item, i) => (
              <View key={i}>
                {i > 0 && <View style={styles.separator} />}
                <View style={styles.notificationItem}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={notifications[item.key]}
                    onValueChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    trackColor={{ false: '#E5E7EB', true: '#7FD4C9' }}
                    thumbColor={notifications[item.key] ? '#0D7D6D' : '#F3F4F6'}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Security */}
        <View style={styles.card}>
          <View style={styles.cardHeaderSimple}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Lock color="#EF4444" size={18} />
            </View>
            <Text style={styles.cardTitle}>Account Security</Text>
          </View>

          <View style={styles.securityList}>
            {["Change Password", "Two-Factor Authentication"].map((item) => (
              <TouchableOpacity key={item} style={styles.securityItem} activeOpacity={0.7}>
                <Text style={styles.securityItemText}>{item}</Text>
                <ChevronRight color="#D1D5DB" size={16} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
          <LogOut color="#EF4444" size={18} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  cardHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D7D6D',
  },
  editButtonTextActive: {
    color: '#6B7280',
  },
  inputsGrid: {
    gap: 12,
    marginTop: 16,
  },
  inputGroup: {
    gap: 4,
  },
  halfInputGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
  },
  selectText: {
    fontSize: 14,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#0D7D6D',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationsList: {
    marginTop: 16,
    gap: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  notificationDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  securityList: {
    marginTop: 16,
    gap: 8,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  securityItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    height: 48,
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
