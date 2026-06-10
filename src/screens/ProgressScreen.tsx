import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { TrendingUp, TrendingDown, Target, Zap, Plus, X } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { weightData, bodyFatData, measurementsData } from '../data/progressData';
import { AITipCard } from '../components/AITipCard';
import { useTranslation } from '../i18n';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const { t, isRtl } = useTranslation();
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isRtl && styles.textRight]}>
            {t('progress.title')}
          </Text>
          <Text style={[styles.headerSubtitle, isRtl && styles.textRight]}>
            {t('progress.subtitle')}
          </Text>
        </View>

        {/* Key Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statLabel, isRtl && styles.textRight]}>
              {t('progress.currentWeight')}
            </Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>176 </Text>
              <Text style={styles.statUnit}>lbs</Text>
            </View>
            <View style={styles.statChange}>
              <TrendingDown color="#10B981" size={14} />
              <Text style={styles.statChangeText}>
                {t('progress.totalLossLbs', { value: '-9' })}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressBarFill, { width: '60%', backgroundColor: '#34D399' }]} />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statLabel, isRtl && styles.textRight]}>
              {t('progress.bodyFat')}
            </Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>18 </Text>
              <Text style={styles.statUnit}>%</Text>
            </View>
            <View style={styles.statChange}>
              <TrendingDown color="#10B981" size={14} />
              <Text style={styles.statChangeText}>-4% total</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressBarFill, { width: '72%', backgroundColor: '#60A5FA' }]} />
            </View>
          </View>
        </View>

        {/* AI Insight */}
        <AITipCard
          title={t('progress.progressInsight')}
          text={t('progress.progressInsightText')}
        />

        {/* Weight Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('progress.weightTrend')}</Text>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>-9 lbs</Text>
            </View>
          </View>
          <LineChart
            data={{
              labels: weightData.map(d => d.date.split(' ')[0]),
              datasets: [{
                data: weightData.map(d => d.weight)
              }]
            }}
            width={screenWidth - 72}
            height={180}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(13, 125, 109, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '0',
                fill: '#0D7D6D'
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#f3f4f6'
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Body Fat Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('progress.bodyFatPercent')}</Text>
            <View style={[styles.chartBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={[styles.chartBadgeText, { color: '#2563EB' }]}>-4%</Text>
            </View>
          </View>
          <BarChart
            data={{
              labels: bodyFatData.map(d => d.date),
              datasets: [{
                data: bodyFatData.map(d => d.bodyFat)
              }]
            }}
            width={screenWidth - 72}
            height={160}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(13, 125, 109, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              barPercentage: 0.7,
              style: {
                borderRadius: 16
              }
            }}
            style={styles.chart}
          />
        </View>

        {/* Body Measurements */}
        <View style={styles.card}>
          <View style={[styles.measurementsHeader, isRtl && styles.rowReverse]}>
            <Text style={[styles.cardTitle, isRtl && styles.textRight]}>
              {t('progress.bodyMeasurements')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddMeasurement(!showAddMeasurement)}
              style={[
                styles.addButton,
                showAddMeasurement && styles.addButtonActive
              ]}
              activeOpacity={0.7}
            >
              {showAddMeasurement ? (
                <X color="#6B7280" size={16} />
              ) : (
                <Plus color="#FFFFFF" size={16} />
              )}
            </TouchableOpacity>
          </View>

          {showAddMeasurement && (
            <View style={styles.addMeasurementForm}>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                    {t('progress.weightLbs')}
                  </Text>
                  <TextInput
                    placeholder="176"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                    {t('progress.bodyFatInput')}
                  </Text>
                  <TextInput
                    placeholder="18"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                    {t('progress.chestIn')}
                  </Text>
                  <TextInput
                    placeholder="42"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                    {t('progress.armsIn')}
                  </Text>
                  <TextInput
                    placeholder="15.5"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>{t('progress.saveMeasurements')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.measurementsList}>
            {measurementsData.map((measurement, index) => (
              <View
                key={index}
                style={[styles.measurementItem, isRtl && styles.rowReverse]}
              >
                <View style={[styles.measurementLeft, isRtl && styles.rowReverse]}>
                  <View style={styles.measurementIcon}>
                    <Target color="#0D7D6D" size={16} />
                  </View>
                  <View>
                    <Text style={styles.measurementName}>{measurement.part}</Text>
                    <Text style={styles.measurementValue}>
                      {measurement.value} {t('progress.inches')}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.measurementChange,
                  measurement.change > 0 ? styles.measurementChangePositive : styles.measurementChangeNegative
                ]}>
                  {measurement.change > 0 ? (
                    <TrendingUp color="#2563EB" size={12} />
                  ) : (
                    <TrendingDown color="#10B981" size={12} />
                  )}
                  <Text style={[
                    styles.measurementChangeText,
                    measurement.change > 0 ? { color: '#2563EB' } : { color: '#10B981' }
                  ]}>
                    {measurement.change > 0 ? '+' : ''}{measurement.change}"
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
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
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statChangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chartBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chartBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
  measurementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonActive: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  addMeasurementForm: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#0D7D6D',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  measurementsList: {
    gap: 8,
  },
  measurementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  measurementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  measurementIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  measurementValue: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  measurementChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  measurementChangePositive: {
    backgroundColor: '#EFF6FF',
  },
  measurementChangeNegative: {
    backgroundColor: '#ECFDF5',
  },
  measurementChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
