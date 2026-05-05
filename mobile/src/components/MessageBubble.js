import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const MessageBubble = ({ message, isOwn }) => {
  const { colors } = useTheme();

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.ownBubble, { backgroundColor: '#E040FB' }]
            : [styles.otherBubble, { backgroundColor: colors.surfaceLight }],
        ]}
      >
        {message.media?.url ? (
          <Image source={{ uri: message.media.url }} style={styles.mediaImage} resizeMode="cover" />
        ) : null}

        {message.text ? (
          <Text style={[styles.messageText, { color: isOwn ? '#FFF' : colors.text }]}>
            {message.text}
          </Text>
        ) : null}

        <Text style={[styles.time, { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 3, paddingHorizontal: 4 },
  ownContainer: { alignItems: 'flex-end' },
  otherContainer: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  time: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  mediaImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 6 },
});

export default React.memo(MessageBubble);
