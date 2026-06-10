import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useTranslation } from '../i18n';

interface AITipCardProps {
  title?: string;
  text: string;
}

export function AITipCard({ title, text }: AITipCardProps) {
  const { t, isRtl } = useTranslation();

  return (
    <View style={[styles.aiTip, isRtl && styles.rowReverse]}>
      <View style={styles.aiTipIcon}>
        <Zap color="#FFFFFF" size={16} />
      </View>
      <View style={styles.aiTipContent}>
        <Text style={[styles.aiTipTitle, isRtl && styles.textRight]}>
          {title ?? t('common.aiTip')}
        </Text>
        <Text style={[styles.aiTipText, isRtl && styles.textRight]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aiTip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 125, 109, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 125, 109, 0.15)',
    gap: 12,
    marginTop: 16,
  },
  aiTipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTipContent: {
    flex: 1,
  },
  aiTipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7D6D',
    marginBottom: 4,
  },
  aiTipText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
