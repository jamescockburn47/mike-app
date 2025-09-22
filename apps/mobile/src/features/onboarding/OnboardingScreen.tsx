import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { theme } from '../../theme/theme';
import Card from '../../components/Card';
import { savePreferences } from '../../services/preferences';

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [topics, setTopics] = useState('world,tech');
  const [minutes, setMinutes] = useState('30');

  const handleSave = async () => {
    const prefs = {
      topics: topics.split(',').map((t) => t.trim()).filter(Boolean),
      routineMinutes: Math.max(10, Math.min(60, parseInt(minutes || '30', 10))),
      onboardingComplete: true,
    };
    await savePreferences(prefs);
    onDone();
  };

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.label}>Interests (comma-separated)</Text>
        <TextInput
          value={topics}
          onChangeText={setTopics}
          placeholder="world, tech, business"
          placeholderTextColor={theme.colors.subtext}
          style={styles.input}
        />
        <Text style={styles.label}>Routine length (minutes)</Text>
        <TextInput
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="numeric"
          style={styles.input}
        />
        <Button title="Continue" onPress={handleSave} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.bg },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  label: { color: theme.colors.subtext, marginTop: 8 },
  input: {
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: theme.radius.md,
    padding: 10,
    marginTop: 6,
    marginBottom: 12,
  },
});


