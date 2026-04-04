import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { User, Activity, Heart, ArrowLeft, Check } from 'lucide-react-native';

export default function ProfileScreen({ navigation }: any) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    age: '28',
    height: '175',
    weight: '72',
    gender: 'male',
    activityLevel: 'moderate',
    preferences: 'Strength training, Running, Yoga',
    foodAllergies: 'None',
    medicalConditions: 'None',
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigation.goBack();
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your personal information</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <User color="#0D7D6D" size={16} />
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              keyboardType="numeric"
              placeholder="Enter your age"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.selectInput}>
              <Text style={styles.selectText}>Male</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: text })}
                keyboardType="numeric"
                placeholder="175"
                style={styles.input}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
                keyboardType="numeric"
                placeholder="70"
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* Lifestyle Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Activity color="#0D7D6D" size={16} />
            </View>
            <Text style={styles.sectionTitle}>Lifestyle</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.selectInput}>
              <Text style={styles.selectText}>Moderate Activity</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Preferences</Text>
            <TextInput
              value={formData.preferences}
              onChangeText={(text) => setFormData({ ...formData, preferences: text })}
              placeholder="e.g., Strength training, Running, Yoga"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textarea]}
            />
            <Text style={styles.hint}>Share your fitness interests and goals</Text>
          </View>
        </View>

        {/* Health Information Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Heart color="#0D7D6D" size={16} />
            </View>
            <Text style={styles.sectionTitle}>Health Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Food Allergies</Text>
            <TextInput
              value={formData.foodAllergies}
              onChangeText={(text) => setFormData({ ...formData, foodAllergies: text })}
              placeholder="e.g., Peanuts, Shellfish, or None"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textarea]}
            />
            <Text style={styles.hint}>List any food allergies or sensitivities</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Medical Conditions</Text>
            <TextInput
              value={formData.medicalConditions}
              onChangeText={(text) => setFormData({ ...formData, medicalConditions: text })}
              placeholder="e.g., Diabetes, Hypertension, or None"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textarea]}
            />
            <Text style={styles.hint}>Share relevant medical conditions for personalized guidance</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Check color="#FFFFFF" size={20} />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0D7D6D',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
  },
  textarea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  selectInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 14,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D7D6D',
    height: 56,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
