import { Image, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

export function Header() {
  const { user, signInWithGoogle, signOut, isSyncing } = useApp();

  return (
    <View style={styles.wrap}>
      <View style={styles.brand}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <View>
          <Text style={styles.title}>MoneyWise</Text>
          <Text style={styles.sub}>Multi-income financial helper</Text>
        </View>
      </View>

      {user ? (
        <Pressable
          style={styles.profile}
          onPress={() =>
            Alert.alert('Google account', user.email || user.name, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
            ])
          }
        >
          {user.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.trim().charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {isSyncing ? 'Syncing to Drive…' : user.email || 'Tap to sign out'}
            </Text>
          </View>
        </Pressable>
      ) : (
        <Pressable style={styles.googleBtn} onPress={() => void signInWithGoogle()}>
          <View style={styles.gMark}>
            <Text style={styles.gText}>G</Text>
          </View>
          <Text style={styles.googleLabel}>Google</Text>
        </Pressable>
      )}
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
    flexShrink: 1,
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
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    maxWidth: 180,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarText: {
    color: colors.primaryDark,
    fontWeight: '900',
  },
  profileText: {
    flex: 1,
  },
  userName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  userEmail: {
    fontSize: 9,
    color: colors.muted,
  },
});
