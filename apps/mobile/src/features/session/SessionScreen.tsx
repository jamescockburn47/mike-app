import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import Card from '../../components/Card';
import { theme } from '../../theme/theme';
import { runMorningSession } from '../../audio/sessionOrchestrator';
import { useSessionStore } from '../../state/useSessionStore';
import { triggerSkip, useVoiceCommands } from '../../voice/voiceControl';
import { getRitualFlow } from '../../content/dailyRituals';
import { loadAgenda, type AgendaItem } from '../../services/agenda';
import { fetchSpotifyMorningMix, type SpotifyBrief } from '../../services/spotify';
import { saveToken } from '../../services/tokens';
import { signInWithGoogle, signInWithMicrosoft } from '../../services/oauth';
import { signInWithSpotify } from '../../services/spotifyAuth';

const statusLabels: Record<'idle' | 'running' | 'completed' | 'stopped', string> = {
  idle: 'Ready',
  running: 'In progress',
  completed: 'Complete',
  stopped: 'Paused',
};

const energyLabels = ['Low key', 'Gentle build', 'Steady', 'Charged', 'On fire'];

const agendaSourceLabels: Record<'placeholder' | 'google' | 'microsoft', string> = {
  placeholder: 'Sample set',
  google: 'Google Calendar',
  microsoft: 'Microsoft 365',
};

const playlistSourceLabels: Record<'placeholder' | 'spotify', string> = {
  placeholder: 'Preview mix',
  spotify: 'Spotify live',
};

export function SessionScreen() {
  const { setSlots, start, stop, status, currentIndex, slots } = useSessionStore();
  const [listening, setListening] = useState(false);
  const voice = useVoiceCommands(listening);

  const flow = useMemo(() => getRitualFlow(), []);
  const { preset } = flow;

  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [agendaSource, setAgendaSource] = useState<'placeholder' | 'google' | 'microsoft'>('placeholder');
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [agendaError, setAgendaError] = useState<string | undefined>();

  const [playlist, setPlaylist] = useState<SpotifyBrief['playlist'] | null>(null);
  const [playlistSource, setPlaylistSource] = useState<'placeholder' | 'spotify'>('placeholder');
  const [playlistLoading, setPlaylistLoading] = useState(true);
  const [playlistError, setPlaylistError] = useState<string | undefined>();

  const [googleToken, setGoogleToken] = useState<string | undefined>();
  const [microsoftToken, setMicrosoftToken] = useState<string | undefined>();
  const [spotifyToken, setSpotifyToken] = useState<string | undefined>();

  const [connecting, setConnecting] = useState<null | 'google' | 'microsoft' | 'spotify'>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setSlots(flow.slots);
  }, [setSlots, flow.slots]);

  useEffect(() => {
    if (status !== 'running') {
      Speech.stop();
    }
  }, [status]);

  const refreshIntegrations = useCallback(
    async (override?: { google?: string; microsoft?: string; spotify?: string }) => {
      setAgendaLoading(true);
      setPlaylistLoading(true);

      const effectiveGoogle = override?.google ?? googleToken;
      const effectiveMicrosoft = override?.microsoft ?? microsoftToken;
      const effectiveSpotify = override?.spotify ?? spotifyToken;

      const preferredProvider: 'google' | 'microsoft' = effectiveGoogle ? 'google' : 'microsoft';
      const tokenForAgenda = preferredProvider === 'google' ? effectiveGoogle : effectiveMicrosoft;

      try {
        const [agendaRes, spotifyRes] = await Promise.all([
          loadAgenda({ provider: preferredProvider, accessToken: tokenForAgenda }),
          fetchSpotifyMorningMix(effectiveSpotify),
        ]);

        if (!mountedRef.current) return;

        setAgenda(agendaRes.items);
        setAgendaSource(agendaRes.source);
        setAgendaError(agendaRes.error);

        setPlaylist(spotifyRes.playlist);
        setPlaylistSource(spotifyRes.source);
        setPlaylistError(spotifyRes.error);
      } catch (error) {
        if (!mountedRef.current) return;
        const message = error instanceof Error ? error.message : 'unknown';
        setAgendaError(message);
        setPlaylistError(message);
      } finally {
        if (!mountedRef.current) return;
        setAgendaLoading(false);
        setPlaylistLoading(false);
      }
    },
    [googleToken, microsoftToken, spotifyToken],
  );

  useEffect(() => {
    refreshIntegrations();
  }, [refreshIntegrations]);

  const completedSteps = status === 'completed' ? slots.length : Math.min(currentIndex, slots.length);
  const progressRatio = slots.length ? completedSteps / slots.length : 0;
  const stepDisplay = slots.length === 0 ? 0 : status === 'running' ? Math.min(currentIndex + 1, slots.length) : completedSteps;
  const energyLabel = energyLabels[Math.min(Math.max(preset.energy - 1, 0), energyLabels.length - 1)];

  const handleStart = async () => {
    if (status === 'running') return;
    start();
    await runMorningSession();
  };

  const handleStop = () => {
    if (status !== 'running') return;
    stop();
    Speech.stop();
  };

  const toggleListening = () => {
    if (!voice.supported) return;
    setListening((value) => !value);
  };

  const handleGoogleConnect = async () => {
    try {
      setConnecting('google');
      const { accessToken } = await signInWithGoogle();
      setGoogleToken(accessToken);
      await saveToken({ provider: 'google', userId: 'demo', accessToken }).catch(() => undefined);
      await refreshIntegrations({ google: accessToken });
    } catch (error) {
      setAgendaError(error instanceof Error ? error.message : 'Google connect failed');
    } finally {
      setConnecting(null);
    }
  };

  const handleMicrosoftConnect = async () => {
    try {
      setConnecting('microsoft');
      const { accessToken } = await signInWithMicrosoft();
      setMicrosoftToken(accessToken);
      await saveToken({ provider: 'microsoft', userId: 'demo', accessToken }).catch(() => undefined);
      await refreshIntegrations({ microsoft: accessToken });
    } catch (error) {
      setAgendaError(error instanceof Error ? error.message : 'Microsoft connect failed');
    } finally {
      setConnecting(null);
    }
  };

  const handleSpotifyConnect = async () => {
    try {
      setConnecting('spotify');
      const { accessToken } = await signInWithSpotify();
      setSpotifyToken(accessToken);
      await saveToken({ provider: 'spotify', userId: 'demo', accessToken }).catch(() => undefined);
      await refreshIntegrations({ spotify: accessToken });
    } catch (error) {
      setPlaylistError(error instanceof Error ? error.message : 'Spotify connect failed');
    } finally {
      setConnecting(null);
    }
  };

  const openSpotify = () => {
    if (!playlist) return;
    const target = playlist.externalUrl || 'https://open.spotify.com/';
    Linking.openURL(target).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[preset.vibe.from, preset.vibe.to]} style={styles.hero}>
          <Text style={styles.badge}>Mike Rituals</Text>
          <Text style={styles.heroTitle}>{preset.heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{preset.heroSubtitle}</Text>
          <View style={styles.heroStats}>
            <View style={styles.statPanel}>
              <Text style={styles.statLabel}>Focus Move</Text>
              <Text style={styles.statValue}>{preset.highlight}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPanel}>
              <Text style={styles.statLabel}>Energy Dial</Text>
              <Text style={styles.statValue}>{energyLabel}</Text>
              <View style={styles.energyDots}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <View
                    key={`energy-${index}`}
                    style={[styles.energyDot, index < preset.energy ? styles.energyDotActive : null]}
                  />
                ))}
              </View>
            </View>
          </View>
          <View style={styles.tagRow}>
            {preset.tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </View>
        </LinearGradient>

        <Card style={styles.controlCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Session</Text>
            <Text style={styles.statusValue}>{statusLabels[status]}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%` }]} />
          </View>
          <Text style={styles.progressCopy}>
            Step {stepDisplay} / {slots.length || 0}
          </Text>
          <View style={styles.actionsRow}>
            <ActionButton
              label={
                status === 'running'
                  ? 'Session in motion'
                  : status === 'completed'
                  ? 'Run it back'
                  : 'Launch ritual'
              }
              icon={status === 'running' ? 'pulse-outline' : 'rocket-outline'}
              onPress={handleStart}
              disabled={status === 'running'}
            />
            <ActionButton
              label="Skip step"
              icon="play-skip-forward-outline"
              onPress={triggerSkip}
              variant="secondary"
              disabled={status !== 'running'}
            />
            <ActionButton
              label={voice.supported ? (listening ? 'Listening for commands' : 'Enable voice control') : 'Voice not available'}
              icon={voice.supported && listening ? 'mic' : 'mic-outline'}
              onPress={toggleListening}
              variant="secondary"
              disabled={!voice.supported}
            />
            {status === 'running' ? (
              <ActionButton
                label="Stop session"
                icon="pause-circle-outline"
                onPress={handleStop}
                variant="secondary"
              />
            ) : null}
          </View>
        </Card>

        <Card style={styles.integrationsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>Integrations</Text>
            <Pill
              label={agendaSource !== 'placeholder' || playlistSource !== 'placeholder' ? 'Live ready' : 'Preview mode'}
              tone={agendaSource !== 'placeholder' || playlistSource !== 'placeholder' ? 'live' : 'default'}
            />
          </View>
          <Text style={styles.sectionBody}>
            Plug calendars and Spotify in to replace the curated samples with your live data.
          </Text>
          <View style={styles.actionsRow}>
            <ActionButton
              label="Refresh data"
              icon="refresh"
              onPress={() => refreshIntegrations()}
              variant="ghost"
            />
            <ActionButton
              label={connecting === 'google' ? 'Connecting...' : 'Connect Google Calendar'}
              icon="logo-google"
              onPress={handleGoogleConnect}
              variant="secondary"
              disabled={connecting === 'google'}
            />
            <ActionButton
              label={connecting === 'microsoft' ? 'Connecting...' : 'Connect Microsoft 365'}
              icon="logo-microsoft"
              onPress={handleMicrosoftConnect}
              variant="secondary"
              disabled={connecting === 'microsoft'}
            />
            <ActionButton
              label={connecting === 'spotify' ? 'Connecting...' : 'Connect Spotify'}
              icon="musical-notes-outline"
              onPress={handleSpotifyConnect}
              variant="secondary"
              disabled={connecting === 'spotify'}
            />
          </View>
        </Card>

        <Card style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>Today at a glance</Text>
            <Pill
              label={agendaSourceLabels[agendaSource]}
              tone={agendaSource === 'placeholder' ? 'default' : 'live'}
            />
          </View>
          {agendaLoading ? (
            <Text style={styles.loadingText}>Loading agenda...</Text>
          ) : (
            <View>
              {agenda.map((item) => (
                <AgendaRow key={item.id} item={item} />
              ))}
              {agendaError ? <Text style={styles.hintText}>Hint: {agendaError}</Text> : null}
            </View>
          )}
        </Card>

        <Card style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>Soundtrack</Text>
            <Pill
              label={playlistSourceLabels[playlistSource]}
              tone={playlistSource === 'placeholder' ? 'default' : 'live'}
            />
          </View>
          {playlistLoading ? (
            <Text style={styles.loadingText}>Lining up tracks...</Text>
          ) : playlist ? (
            <View>
              <Text style={styles.playlistTitle}>{playlist.title}</Text>
              <Text style={styles.playlistCopy}>{playlist.description}</Text>
              <Text style={styles.playlistMeta}>{playlist.vibe}</Text>
              <View style={styles.trackList}>
                {playlist.tracks.slice(0, 4).map((track) => (
                  <TrackRow key={track.id} track={track} />
                ))}
              </View>
              <ActionButton
                label="Open in Spotify"
                icon="logo-spotify"
                onPress={openSpotify}
                variant="ghost"
              />
              {playlistError ? <Text style={styles.hintText}>Hint: {playlistError}</Text> : null}
            </View>
          ) : (
            <Text style={styles.loadingText}>No playlist available.</Text>
          )}
        </Card>

        <Card style={styles.contentCard}>
          <Text style={styles.sectionLabel}>Affirmation</Text>
          <Text style={styles.sectionBody}>{preset.affirmation}</Text>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Anchors</Text>
          {preset.anchors.map((item) => (
            <Bullet key={item} text={item} />
          ))}
        </Card>

        <Card style={styles.contentCard}>
          <Text style={styles.sectionLabel}>Momentum Stack</Text>
          {preset.microWins.map((item) => (
            <Bullet key={item} text={item} />
          ))}
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Body Primers</Text>
          {preset.bodyPrimers.map((item) => (
            <Bullet key={item} text={item} />
          ))}
        </Card>

        <Card style={styles.contentCard}>
          <Text style={styles.sectionLabel}>Reflection Sparks</Text>
          {preset.prompts.map((item) => (
            <Bullet key={item} text={item} />
          ))}
        </Card>

        <Card style={styles.flowCard}>
          <Text style={styles.sectionLabel}>Today's Flow</Text>
          {slots.map((slot, index) => {
            const slotStatus = resolveSlotState(status, index, currentIndex, slots.length);
            return <SlotRow key={slot.id} slot={slot} index={index} status={slotStatus} />;
          })}
          {slots.length === 0 ? (
            <Text style={styles.emptyState}>Flow will unlock once presets load.</Text>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

type SlotState = 'pending' | 'active' | 'done';

function resolveSlotState(
  status: 'idle' | 'running' | 'completed' | 'stopped',
  index: number,
  currentIndex: number,
  total: number,
): SlotState {
  if (status === 'completed') return 'done';
  if (status === 'running') {
    if (index < currentIndex) return 'done';
    if (index === currentIndex) return 'active';
    return 'pending';
  }
  if (status === 'stopped' && index < Math.min(currentIndex, total)) {
    return 'done';
  }
  return 'pending';
}

type SlotRowProps = {
  slot: { title: string; minSec: number; maxSec: number; script: string };
  index: number;
  status: SlotState;
};

function SlotRow({ slot, index, status }: SlotRowProps) {
  const iconName = status === 'done' ? 'checkmark-circle' : status === 'active' ? 'play-circle' : 'ellipse-outline';
  const iconColor = status === 'done' ? theme.colors.success : status === 'active' ? theme.colors.primary : theme.colors.subtle;
  return (
    <View style={styles.slotRow}>
      <Ionicons name={iconName} size={22} color={iconColor} style={styles.slotIcon} />
      <View style={styles.slotContent}>
        <View style={styles.slotHeader}>
          <Text style={styles.slotTitle}>
            {index + 1}. {slot.title}
          </Text>
          <Text style={styles.slotDuration}>~{slot.minSec}-{slot.maxSec}s</Text>
        </View>
        <Text style={styles.slotScript}>{slot.script}</Text>
      </View>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function Pill({ label, tone = 'default' }: { label: string; tone?: 'default' | 'live' }) {
  return (
    <View style={[styles.pill, tone === 'live' ? styles.pillLive : null]}>
      <Text style={[styles.pillText, tone === 'live' ? styles.pillTextLive : null]}>{label}</Text>
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
};

function ActionButton({ label, icon, onPress, variant = 'primary', disabled = false }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBase,
        variant === 'primary' ? styles.actionPrimary : null,
        variant === 'secondary' ? styles.actionSecondary : null,
        variant === 'ghost' ? styles.actionGhost : null,
        disabled ? styles.actionDisabled : null,
        pressed && !disabled ? styles.actionPressed : null,
      ]}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={
          variant === 'primary'
            ? theme.colors.onPrimary
            : variant === 'ghost'
            ? theme.colors.primary
            : theme.colors.text
        }
        style={styles.actionIcon}
      />
      <Text
        style={[styles.actionLabel, variant === 'primary' ? styles.actionLabelPrimary : null, variant === 'ghost' ? styles.actionLabelGhost : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  const icon = item.type === 'focus' ? 'flash-outline' : item.type === 'personal' ? 'sparkles-outline' : 'calendar-outline';
  return (
    <View style={styles.agendaRow}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} style={styles.agendaIcon} />
      <View style={styles.agendaContent}>
        <Text style={styles.agendaTime}>{formatTimeRange(item.startISO, item.endISO)}</Text>
        <Text style={styles.agendaTitle}>{item.title}</Text>
        {item.location ? <Text style={styles.agendaMeta}>{item.location}</Text> : null}
      </View>
    </View>
  );
}

function TrackRow({ track }: { track: SpotifyBrief['playlist']['tracks'][number] }) {
  return (
    <View style={styles.trackRow}>
      <View style={styles.trackBullet} />
      <View style={styles.trackContent}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.trackMeta}>
          {track.artist} · {formatDuration(track.duration)}
        </Text>
      </View>
    </View>
  );
}

function formatTimeRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return `${formatTime(start)} — ${formatTime(end)}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(seconds: number) {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 56,
    paddingTop: 8,
  },
  hero: {
    borderRadius: theme.radius.xl,
    padding: 24,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: 13,
    marginBottom: 12,
    fontFamily: theme.fonts.medium,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    color: theme.colors.text,
    marginBottom: 6,
    fontFamily: theme.fonts.bold,
  },
  heroSubtitle: {
    color: theme.colors.subtle,
    fontSize: 16,
    marginBottom: 18,
    lineHeight: 22,
    fontFamily: theme.fonts.regular,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statPanel: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 14,
  },
  statLabel: {
    color: theme.colors.subtle,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: theme.fonts.medium,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fonts.semibold,
  },
  energyDots: {
    marginTop: 8,
    flexDirection: 'row',
  },
  energyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 6,
  },
  energyDotActive: {
    backgroundColor: theme.colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tag: {
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fonts.regular,
  },
  controlCard: {
    marginBottom: 20,
  },
  integrationsCard: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    color: theme.colors.subtext,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: theme.fonts.medium,
  },
  statusValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fonts.semibold,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  progressCopy: {
    color: theme.colors.subtext,
    fontSize: 13,
    marginTop: 8,
    fontFamily: theme.fonts.medium,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  actionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    marginTop: 10,
    backgroundColor: theme.colors.surface,
  },
  actionPrimary: {
    backgroundColor: theme.colors.primary,
  },
  actionSecondary: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  actionGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  actionDisabled: {
    opacity: 0.55,
  },
  actionPressed: {
    transform: [{ scale: 0.97 }],
  },
  actionIcon: {
    marginRight: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
  },
  actionLabelPrimary: {
    color: theme.colors.onPrimary,
  },
  actionLabelGhost: {
    color: theme.colors.primary,
  },
  contentCard: {
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
  },
  sectionBody: {
    color: theme.colors.subtext,
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
    fontFamily: theme.fonts.regular,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    color: theme.colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.fonts.medium,
  },
  flowCard: {
    marginBottom: 40,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  slotIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  slotContent: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fonts.semibold,
  },
  slotDuration: {
    color: theme.colors.subtle,
    fontSize: 12,
    fontFamily: theme.fonts.medium,
  },
  slotScript: {
    color: theme.colors.subtext,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: theme.fonts.regular,
  },
  emptyState: {
    color: theme.colors.subtext,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
  },
  pillLive: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.6)',
  },
  pillText: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: theme.colors.subtle,
    fontFamily: theme.fonts.medium,
  },
  pillTextLive: {
    color: theme.colors.success,
  },
  agendaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  agendaIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  agendaContent: {
    flex: 1,
  },
  agendaTime: {
    color: theme.colors.subtle,
    fontSize: 13,
    fontFamily: theme.fonts.medium,
  },
  agendaTitle: {
    color: theme.colors.text,
    fontSize: 15,
    marginTop: 2,
    marginBottom: 4,
    lineHeight: 21,
    fontFamily: theme.fonts.semibold,
  },
  agendaMeta: {
    color: theme.colors.subtext,
    fontSize: 13,
    fontFamily: theme.fonts.regular,
  },
  loadingText: {
    color: theme.colors.subtext,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
  hintText: {
    color: theme.colors.subtle,
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    marginTop: 8,
  },
  playlistTitle: {
    fontSize: 17,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
    marginBottom: 6,
  },
  playlistCopy: {
    color: theme.colors.subtext,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: theme.fonts.regular,
    marginBottom: 6,
  },
  playlistMeta: {
    color: theme.colors.subtle,
    fontSize: 13,
    fontFamily: theme.fonts.medium,
    marginBottom: 12,
  },
  trackList: {
    marginBottom: 12,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(96,165,250,0.8)',
    marginRight: 10,
  },
  trackContent: {
    flex: 1,
  },
  trackTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  trackMeta: {
    color: theme.colors.subtle,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
});

export default SessionScreen;






