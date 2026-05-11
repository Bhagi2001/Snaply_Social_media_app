import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';
import { userApi } from '../../services/api/userApi';

const TITLES = {
  blocked: 'Blocked Accounts',
  muted: 'Muted Accounts',
  restricted: 'Restricted Accounts',
};

const EMPTY_TEXT = {
  blocked: 'No blocked accounts.',
  muted: 'No muted accounts.',
  restricted: 'No restricted accounts.',
};

const removeVerb = {
  blocked: 'Unblock',
  muted: 'Unmute',
  restricted: 'Unrestrict',
};

const InteractionListScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const type = route.params?.type || 'blocked';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      const response = await userApi.getInteractionUsers(type);
      setUsers(response.data.data.users || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const removeUser = async (targetId) => {
    setUpdatingId(targetId);
    try {
      await userApi.updateInteractionUser(type, targetId, 'remove');
      setUsers((prev) => prev.filter((u) => u._id !== targetId));
    } catch (error) {
      Alert.alert('Error', 'Failed to update list.');
    } finally {
      setUpdatingId('');
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}> 
      <View style={styles.left}>
        {item.avatar?.url ? (
          <Image source={{ uri: item.avatar.url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={16} color={colors.textTertiary} />
          </View>
        )}
        <View>
          <Text style={[styles.name, { color: colors.text }]}>{item.fullName}</Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>@{item.username}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => removeUser(item._id)}
        style={[styles.actionBtn, { borderColor: colors.border }]}
        disabled={updatingId === item._id}
      >
        {updatingId === item._id ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <Text style={[styles.actionText, { color: colors.text }]}>{removeVerb[type] || 'Remove'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <GradientHeader title={TITLES[type] || 'Accounts'} onBack={() => navigation.goBack()} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <GradientHeader title={TITLES[type] || 'Accounts'} onBack={() => navigation.goBack()} />
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{EMPTY_TEXT[type] || 'No users found.'}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    minHeight: 72,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  actionBtn: {
    minWidth: 88,
    height: 34,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyWrap: {
    paddingTop: 64,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

export default InteractionListScreen;
