import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { DangerButton, SoftButton } from './Buttons';
import { colors } from '../theme';

function formatLastSync(iso: string | null, isSyncing: boolean): string {
  if (isSyncing) return 'Syncing now…';
  if (!iso) return 'Not synced yet';
  return new Date(iso).toLocaleString();
}

export function Header() {
  const { user, signInWithGoogle, signOut, isSyncing, lastSyncedAt } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.brand}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <View style={styles.brandText}>
          <Text style={styles.title}>MoneyWise</Text>
          <Text style={styles.sub}>Multi-income financial helper</Text>
        </View>
      </View>

      {user ? (
        <Pressable style={styles.avatarWrap} onPress={() => setProfileOpen(true)}>
          {user.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.trim().charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </Pressable>
      ) : (
        <Pressable style={styles.googleBtn} onPress={() => void signInWithGoogle()}>
          <View style={styles.gMark}>
            <Text style={styles.gText}>G</Text>
          </View>
          <Text style={styles.googleLabel}>Google</Text>
        </Pressable>
      )}

      <Modal visible={profileOpen} transparent animationType="fade" onRequestClose={() => setProfileOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setProfileOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHead}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.sheetAvatar} />
              ) : (
                <View style={[styles.avatar, styles.sheetAvatar]}>
                  <Text style={styles.avatarText}>{user?.name.trim().charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetName}>{user?.name}</Text>
                <Text style={styles.sheetEmail}>{user?.email || 'No email'}</Text>
              </View>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Last sync</Text>
              <Text style={styles.metaValue}>{formatLastSync(lastSyncedAt, isSyncing)}</Text>
            </View>
            <View style={styles.sheetActions}>
              <SoftButton title="Close" onPress={() => setProfileOpen(false)} />
              <DangerButton
                title="Log out"
                onPress={() => {
                  setProfileOpen(false);
                  void signOut();
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  brandText: {
    flex: 1,
    minWidth: 0,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  sub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  gMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gText: {
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 12,
  },
  googleLabel: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 13,
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: {
    color: colors.primaryDark,
    fontWeight: '900',
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sheetAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  sheetName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sheetEmail: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 3,
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
