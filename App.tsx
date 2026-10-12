import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// One key for the whole pain log. AsyncStorage only stores strings,
// so we JSON.stringify the array when saving and JSON.parse when loading.
const STORAGE_KEY = 'unflare.painEntries';

// Pain levels the user can tap (1 = mild, 5 = severe).
const PAIN_LEVELS = [1, 2, 3, 4, 5] as const;

type PainEntry = {
  id: string;
  level: number;
  // ISO timestamp so it survives app restarts as a string.
  timestamp: string;
};

export default function App() {
  // Entries live in React state for the UI, and in AsyncStorage for permanence.
  const [entries, setEntries] = useState<PainEntry[]>([]);

  // On first launch, read whatever was saved last time the app was open.
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === null) {
          return;
        }
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEntries(parsed as PainEntry[]);
        }
      } catch {
        // If storage is corrupt, keep an empty list rather than crashing.
      }
    };

    void loadEntries();
  }, []);

  const saveEntries = async (next: PainEntry[]) => {
    setEntries(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Saving failed (rare). The list still shows this session.
    }
  };

  const logPain = (level: number) => {
    const entry: PainEntry = {
      id: Date.now().toString(),
      level,
      timestamp: new Date().toISOString(),
    };
    // Newest first so today's flare is at the top.
    void saveEntries([entry, ...entries]);
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>Unflare</Text>
      <Text style={styles.subtitle}>How strong is the pain right now?</Text>

      <View style={styles.levelRow}>
        {PAIN_LEVELS.map((level) => (
          <Pressable
            key={level}
            onPress={() => logPain(level)}
            style={({ pressed }) => [
              styles.levelButton,
              pressed && styles.levelButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Log pain level ${level}`}
          >
            <Text style={styles.levelText}>{level}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Past entries</Text>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No logs yet. Tap a number to save one on this phone.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryLevel}>Level {item.level}</Text>
            <Text style={styles.entryTime}>{formatTime(item.timestamp)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#C8C8C8',
    fontSize: 16,
    marginBottom: 24,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  levelButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  levelButtonPressed: {
    backgroundColor: '#222222',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  empty: {
    color: '#8A8A8A',
    fontSize: 15,
    lineHeight: 22,
  },
  entryRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
    paddingVertical: 14,
  },
  entryLevel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryTime: {
    color: '#A0A0A0',
    fontSize: 13,
  },
});
