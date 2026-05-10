import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';
import supportApi from '../../services/api/supportApi';

const TITLES = {
  support: 'Contact Support',
  report: 'Report a Problem',
};

const SupportRequestScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const type = route.params?.type || 'support';
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await supportApi.getMyTickets();
      setTickets(response.data.data.tickets || []);
    } catch (error) {
      // ignore for now
    } finally {
      setLoadingTickets(false);
    }
  };

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Validation', 'Subject and message are required.');
      return;
    }

    setSubmitting(true);
    try {
      await supportApi.createTicket({
        type,
        category: type === 'report' ? 'Bug Report' : 'General Support',
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject('');
      setMessage('');
      Alert.alert('Submitted', 'Your request has been submitted.');
      loadTickets();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <GradientHeader title={TITLES[type] || 'Support'} onBack={() => navigation.goBack()} />

      <View style={styles.formWrap}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Subject</Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Enter subject"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue"
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        />

        <TouchableOpacity onPress={submit} style={[styles.button, { backgroundColor: colors.primary }]} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Submit</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.listWrap}>
        <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Requests</Text>
        {loadingTickets ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : (
          <FlatList
            data={tickets.slice(0, 5)}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={[styles.ticketRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}> 
                <Text style={[styles.ticketSubject, { color: colors.text }]} numberOfLines={1}>{item.subject}</Text>
                <Text style={[styles.ticketMeta, { color: colors.textSecondary }]}>{item.type} • {item.status}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No requests yet.</Text>}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  formWrap: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 6 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 96,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 14,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  listWrap: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  historyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  ticketRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  ticketSubject: { fontSize: 14, fontWeight: '600' },
  ticketMeta: { marginTop: 3, fontSize: 12 },
  emptyText: { fontSize: 13, marginTop: 12 },
});

export default SupportRequestScreen;
