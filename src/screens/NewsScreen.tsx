import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Calendar, ArrowRight, Tag, X, User, Clock3 } from 'lucide-react-native';
import { AITipCard } from '../components/AITipCard';
import { getPublicNews, type PublicNewsItem } from '../services/news';

export default function NewsScreen() {
  const [newsItems, setNewsItems] = useState<PublicNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  const [selectedNews, setSelectedNews] = useState<PublicNewsItem | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const loadNews = useCallback(async (page = 1, refreshing = false) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setGeneralError('');

      const response = await getPublicNews(page, 10);
      const pagination = response.data;

      setNewsItems(pagination.data ?? []);
      setCurrentPage(pagination.current_page ?? 1);
      setLastPage(pagination.last_page ?? 1);
      setFrom(pagination.from ?? null);
      setTo(pagination.to ?? null);
      setTotal(pagination.total ?? 0);
    } catch (error: any) {
      const message =
        error?.message || 'Failed to load news. Please try again.';
      setGeneralError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews(1);
  }, [loadNews]);

  const featuredNews = useMemo(() => {
    return newsItems.length > 0 ? newsItems[0] : null;
  }, [newsItems]);

  const latestNews = useMemo(() => {
    if (newsItems.length <= 1) return [];
    return newsItems.slice(1);
  }, [newsItems]);

  function getExcerpt(text: string, maxLength = 120): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
  }

  function getRemainingDaysText(days: number | null): string | null {
    if (days === null) return null;

    if (days <= 0) return 'Expired';

    const totalMinutes = Math.ceil(days * 24 * 60);

    if (totalMinutes < 60) {
      return totalMinutes === 1
        ? '1 minute left'
        : `${totalMinutes} minutes left`;
    }

    const totalHours = Math.ceil(days * 24);

    if (totalHours < 24) {
      return totalHours === 1
        ? '1 hour left'
        : `${totalHours} hours left`;
    }

    const totalDays = Math.ceil(days);

    return totalDays === 1
      ? '1 day left'
      : `${totalDays} days left`;
  }

  function formatDateTime(value: string | null): string {
    if (!value) return 'No date';

    const date = new Date(value.replace(' ', 'T'));

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
  }

  function openDetails(item: PublicNewsItem) {
    setSelectedNews(item);
    setDetailsVisible(true);
  }

  function closeDetails() {
    setDetailsVisible(false);
    setSelectedNews(null);
  }

  function handleRefresh() {
    loadNews(currentPage, true);
  }

  function handlePreviousPage() {
    if (currentPage > 1) {
      loadNews(currentPage - 1);
    }
  }

  function handleNextPage() {
    if (currentPage < lastPage) {
      loadNews(currentPage + 1);
    }
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>News & Offers</Text>
            <Text style={styles.headerSubtitle}>Stay updated with the latest</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0D7D6D" />
              <Text style={styles.loadingText}>Loading news...</Text>
            </View>
          ) : generalError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{generalError}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.8}
                onPress={() => loadNews(1)}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {featuredNews && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openDetails(featuredNews)}
                  style={styles.featuredCard}
                >
                  <View style={styles.featuredTag}>
                    <Tag color="#FBBF24" size={14} />
                    <Text style={styles.featuredTagText}>FEATURED OFFER</Text>
                  </View>

                  <Text style={styles.featuredEmoji}>💪</Text>
                  <Text style={styles.featuredTitle}>{featuredNews.title}</Text>
                  <Text style={styles.featuredText}>{featuredNews.content}</Text>

                  <View style={styles.featuredMetaRow}>
                    <Text style={styles.featuredMetaText}>
                      {featuredNews.author_name || 'FitMind'}
                    </Text>
                    <Text style={styles.featuredMetaDot}>•</Text>
                    <Text style={styles.featuredMetaText}>
                      {featuredNews.formatted_date || 'No date'}
                    </Text>
                  </View>

                  {featuredNews.remaining_days !== null && (
                    <View style={styles.expiryBadge}>
                      <Text style={styles.expiryBadgeText}>
                        {getRemainingDaysText(featuredNews.remaining_days)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.featuredButton}>
                    <Text style={styles.featuredButtonText}>Learn More</Text>
                    <ArrowRight color="#0D7D6D" size={16} />
                  </View>
                </TouchableOpacity>
              )}

              <AITipCard
                title="Quick Tip"
                text="Staying hydrated is crucial for performance. Aim for at least 8 glasses of water daily!"
              />

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Latest Updates</Text>
                <Text style={styles.sectionSubtitle}>
                  {from !== null && to !== null
                    ? `Showing ${from}-${to} of ${total}`
                    : `${total} items`}
                </Text>
              </View>

              <View style={styles.newsList}>
                {latestNews.length > 0 ? (
                  latestNews.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.newsCard}
                      activeOpacity={0.7}
                      onPress={() => openDetails(item)}
                    >
                      <View style={styles.newsEmoji}>
                        <Text style={styles.newsEmojiText}>📰</Text>
                      </View>

                      <View style={styles.newsContent}>
                        <View style={styles.newsBadges}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                              {item.status}
                            </Text>
                          </View>

                          {item.remaining_days !== null && (
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountBadgeText}>
                                {getRemainingDaysText(item.remaining_days)}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.newsTitle} numberOfLines={2}>
                          {item.title}
                        </Text>

                        <Text style={styles.newsExcerpt} numberOfLines={2}>
                          {getExcerpt(item.content, 140)}
                        </Text>

                        <View style={styles.newsFooter}>
                          <View style={styles.newsDate}>
                            <Calendar color="#D1D5DB" size={11} />
                            <Text style={styles.newsDateText}>
                              {item.formatted_date || 'No date'}
                            </Text>
                          </View>

                          <View style={styles.readMore}>
                            <Text style={styles.readMoreText}>
                              {item.author_name || 'FitMind'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>No additional news</Text>
                    <Text style={styles.emptyText}>
                      There are no more public news items to display right now.
                    </Text>
                  </View>
                )}
              </View>

              {lastPage > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === 1 && styles.paginationButtonDisabled,
                    ]}
                    onPress={handlePreviousPage}
                    disabled={currentPage === 1}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.paginationButtonText,
                        currentPage === 1 && styles.paginationButtonTextDisabled,
                      ]}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.paginationText}>
                    {currentPage} / {lastPage}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === lastPage && styles.paginationButtonDisabled,
                    ]}
                    onPress={handleNextPage}
                    disabled={currentPage === lastPage}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.paginationButtonText,
                        currentPage === lastPage && styles.paginationButtonTextDisabled,
                      ]}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={detailsVisible}
        animationType="fade"
        transparent
        onRequestClose={closeDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeButton} onPress={closeDetails}>
              <X size={18} color="#0D7D6D" />
            </TouchableOpacity>

            {selectedNews && (
              <>
                <Text style={styles.modalTitle}>{selectedNews.title}</Text>
                <Text style={styles.modalSubtitle}>Full news details</Text>

                <View style={styles.modalStatusBadge}>
                  <Text style={styles.modalStatusBadgeText}>{selectedNews.status}</Text>
                </View>

                <View style={styles.modalMetaRow}>
                  <View style={styles.modalMetaItem}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.modalMetaText}>
                      {selectedNews.formatted_date || 'No date'}
                    </Text>
                  </View>

                  <View style={styles.modalMetaItem}>
                    <User size={14} color="#6B7280" />
                    <Text style={styles.modalMetaText}>
                      {selectedNews.author_name || 'FitMind'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Published At</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(selectedNews.published_at)}
                    </Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Expiry Date</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(selectedNews.expires_at)}
                    </Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Remaining</Text>
                    <Text style={styles.detailValue}>
                      {getRemainingDaysText(selectedNews.remaining_days) || 'No expiry'}
                    </Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Current Status</Text>
                    <Text style={styles.detailValue}>{selectedNews.status}</Text>
                  </View>
                </View>

                <View style={styles.fullContentBox}>
                  <Text style={styles.fullContentText}>{selectedNews.content}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#0D7D6D',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 14,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  featuredMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  featuredMetaDot: {
    marginHorizontal: 6,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  expiryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251,191,36,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  expiryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 12,
  },
  featuredButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7D6D',
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
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
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'capitalize',
  },
  discountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
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
  emptyBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  pagination: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paginationButton: {
    minWidth: 96,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  paginationButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    paddingRight: 36,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  modalStatusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'capitalize',
  },
  modalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 16,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalMetaText: {
    fontSize: 13,
    color: '#4B5563',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  detailBox: {
    width: '47%',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  fullContentBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 14,
  },
  fullContentText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});