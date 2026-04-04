import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, ArrowRight, Tag } from 'lucide-react-native';
import { newsItems } from '../data/newsData';
import { AITipCard } from '../components/AITipCard';

export default function NewsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>News & Offers</Text>
          <Text style={styles.headerSubtitle}>Stay updated with the latest</Text>
        </View>

        {/* Featured Offer */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredTag}>
            <Tag color="#FBBF24" size={14} />
            <Text style={styles.featuredTagText}>FEATURED OFFER</Text>
          </View>
          <Text style={styles.featuredEmoji}>💪</Text>
          <Text style={styles.featuredTitle}>20% Off Personal Training</Text>
          <Text style={styles.featuredText}>
            Limited time: Book 10+ sessions and get 20% off. Transform your fitness journey with expert guidance!
          </Text>
          <TouchableOpacity style={styles.featuredButton} activeOpacity={0.8}>
            <Text style={styles.featuredButtonText}>Learn More</Text>
            <ArrowRight color="#0D7D6D" size={16} />
          </TouchableOpacity>
        </View>

        {/* AI Tip */}
        <AITipCard
          title="Quick Tip"
          text="Staying hydrated is crucial for performance. Aim for at least 8 glasses of water daily!"
        />

        {/* Latest Updates */}
        <Text style={styles.sectionTitle}>Latest Updates</Text>

        <View style={styles.newsList}>
          {newsItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.newsCard} activeOpacity={0.7}>
              <View style={styles.newsEmoji}>
                <Text style={styles.newsEmojiText}>{item.emoji}</Text>
              </View>
              <View style={styles.newsContent}>
                <View style={styles.newsBadges}>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: item.categoryBg, borderColor: item.categoryBorder }
                  ]}>
                    <Text style={[styles.categoryBadgeText, { color: item.categoryText }]}>
                      {item.category}
                    </Text>
                  </View>
                  {item.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>{item.discount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.newsExcerpt} numberOfLines={2}>{item.excerpt}</Text>
                <View style={styles.newsFooter}>
                  <View style={styles.newsDate}>
                    <Calendar color="#D1D5DB" size={11} />
                    <Text style={styles.newsDateText}>{item.date}</Text>
                  </View>
                  <View style={styles.readMore}>
                    <Text style={styles.readMoreText}>Read more</Text>
                    <ArrowRight color="#0D7D6D" size={12} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  featuredCard: {
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 24,
    overflow: 'hidden',
    marginTop: 16,
  },
  featuredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  featuredTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
    letterSpacing: 1,
  },
  featuredEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featuredText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 20,
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  featuredButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7D6D',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  newsList: {
    gap: 12,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  newsEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsEmojiText: {
    fontSize: 28,
  },
  newsContent: {
    flex: 1,
  },
  newsBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 6,
  },
  newsExcerpt: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newsDateText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D7D6D',
  },
});
