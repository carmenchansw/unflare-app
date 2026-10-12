import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
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

// A fixed sentence only. We never add pain scores, timestamps, or notes,
// so health logs stay on this phone and are not sent to any cloud.
const QUIET_SUPPORT_MESSAGE =
  "Hi, I'm experiencing a severe endo flare and need some support right now. Can you prepare hot pack and water?";

// The two tabs in our app shell. A union type means activeTab can only be these values.
type TabName = 'log' | 'relief';

type PainEntry = {
  id: string;
  level: number;
  // ISO timestamp so it survives app restarts as a string.
  timestamp: string;
};

const formatTime = (iso: string) => {
  return new Date(iso).toLocaleString();
};

type LogScreenProps = {
  entries: PainEntry[];
  isFlareActive: boolean;
  onLogPain: (level: number) => void;
};

// Screen 1: local pain logger. Data never leaves this phone.
function LogScreen({ entries, isFlareActive, onLogPain }: LogScreenProps) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Log</Text>
      <Text style={styles.subtitle}>How strong is the pain right now?</Text>

      <View
        style={[
          styles.loggerSection,
          isFlareActive && styles.loggerSectionActive,
        ]}
      >
        <Text style={styles.loggerLabel}>Pain logger</Text>
        <View style={styles.levelRow}>
          {PAIN_LEVELS.map((level) => (
            <Pressable
              key={level}
              onPress={() => onLogPain(level)}
              style={({ pressed }) => [
                styles.levelButton,
                isFlareActive && styles.levelButtonFlare,
                pressed && styles.levelButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Log pain level ${level}`}
            >
              <Text style={styles.levelText}>{level}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Past entries</Text>
      <Text style={styles.privacyNote}>
        Saved only on this device. Uninstalling the app deletes these logs.
      </Text>

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

type ReliefScreenProps = {
  isFlareActive: boolean;
  onToggleFlare: () => void;
  onSendWhatsApp: () => void;
};

// Screen 2: simulated wake word + WhatsApp draft (no health data in the URL).
function ReliefScreen({
  isFlareActive,
  onToggleFlare,
  onSendWhatsApp,
}: ReliefScreenProps) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Relief</Text>
      <Text style={styles.subtitle}>
        Simulate a wake word, then send a quiet support message if you need
        someone nearby.
      </Text>

      <Pressable
        onPress={onToggleFlare}
        style={({ pressed }) => [
          styles.wakeButton,
          isFlareActive && styles.wakeButtonActive,
          pressed && styles.wakeButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isFlareActive }}
        accessibilityLabel="Simulate wake word Very pain"
      >
        <Text style={styles.wakeButtonText}>
          🎙️ Simulate Wake Word ('Very pain!')
        </Text>
        <Text style={styles.wakeButtonHint}>
          {isFlareActive ? 'Tap again to turn off' : 'Hands-free simulation'}
        </Text>
      </Pressable>

      {isFlareActive ? (
        <Pressable
          onPress={onSendWhatsApp}
          style={({ pressed }) => [
            styles.whatsAppButton,
            pressed && styles.whatsAppButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send quiet support message via WhatsApp"
        >
          <Text style={styles.whatsAppButtonText}>
            Send Quiet Support Message via WhatsApp
          </Text>
          <Text style={styles.whatsAppButtonHint}>
            Opens a draft only. You choose who to send it to. Pain logs stay on
            this phone.
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type TabButtonProps = {
  label: string;
  tab: TabName;
  activeTab: TabName;
  onPress: (tab: TabName) => void;
};

// One item in the bottom tab bar. White = selected, gray = not selected.
function TabButton({ label, tab, activeTab, onPress }: TabButtonProps) {
  const isSelected = activeTab === tab;

  return (
    <Pressable
      onPress={() => onPress(tab)}
      style={[styles.tabButton, isSelected && styles.tabButtonSelected]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  // Which screen is showing. Changing this string swaps the middle of the shell.
  const [activeTab, setActiveTab] = useState<TabName>('log');
  // Entries live in React state for the UI, and in AsyncStorage for permanence.
  const [entries, setEntries] = useState<PainEntry[]>([]);
  // Step 2 simulation: tapping the wake-word button flips this on/off.
  const [isFlareActive, setIsFlareActive] = useState(false);

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

  const toggleFlareMode = () => {
    setIsFlareActive((currentlyActive) => !currentlyActive);
  };

  // Linking hands a URL to the phone's OS so WhatsApp can open a draft.
  // Unflare does not upload this text or any log to a server.
  const sendQuietSupportMessage = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(QUIET_SUPPORT_MESSAGE)}`;

    const openWhatsApp = async () => {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          Alert.alert(
            'WhatsApp not available',
            'This phone could not open WhatsApp. Install WhatsApp, then try again.',
          );
          return;
        }
        await Linking.openURL(url);
      } catch {
        Alert.alert(
          'Could not open WhatsApp',
          'Install WhatsApp or pick a contact yourself. Nothing from your pain log was shared.',
        );
      }
    };

    void openWhatsApp();
  };

  return (
    <View style={styles.shell}>
      <StatusBar style="light" />

      {isFlareActive ? (
        <View
          style={styles.banner}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.bannerText}>Flare mode active - stay calm</Text>
        </View>
      ) : null}

      {/* Only one screen is shown at a time. The tab bar stays put at the bottom. */}
      {activeTab === 'log' ? (
        <LogScreen
          entries={entries}
          isFlareActive={isFlareActive}
          onLogPain={logPain}
        />
      ) : (
        <ReliefScreen
          isFlareActive={isFlareActive}
          onToggleFlare={toggleFlareMode}
          onSendWhatsApp={sendQuietSupportMessage}
        />
      )}

      <View style={styles.tabBar} accessibilityRole="tablist">
        <TabButton
          label="Log"
          tab="log"
          activeTab={activeTab}
          onPress={setActiveTab}
        />
        <TabButton
          label="Relief"
          tab="relief"
          activeTab={activeTab}
          onPress={setActiveTab}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 56,
  },
  screen: {
    flex: 1,
    backgroundColor: '#000000',
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
    marginBottom: 20,
    lineHeight: 22,
  },
  banner: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  wakeButton: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#444444',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  wakeButtonActive: {
    borderColor: '#FFFFFF',
  },
  wakeButtonPressed: {
    backgroundColor: '#111111',
  },
  wakeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  wakeButtonHint: {
    color: '#A0A0A0',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  whatsAppButton: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  whatsAppButtonPressed: {
    backgroundColor: '#111111',
  },
  whatsAppButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  whatsAppButtonHint: {
    color: '#C8C8C8',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  loggerSection: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    padding: 16,
    marginBottom: 24,
  },
  loggerSectionActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loggerLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  levelButtonFlare: {
    borderWidth: 2,
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
    marginBottom: 8,
  },
  privacyNote: {
    color: '#8A8A8A',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 24,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingBottom: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  tabButtonSelected: {
    borderTopColor: '#FFFFFF',
  },
  tabLabel: {
    color: '#8A8A8A',
    fontSize: 16,
    fontWeight: '600',
  },
  tabLabelSelected: {
    color: '#FFFFFF',
  },
});
