import Constants from 'expo-constants';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SoftButton } from './Buttons';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const APP_NAME = 'MoneyWise';
const DEVELOPER = 'sololeveldevph';
const RIGHTS = 'All rights reserved 08/2026';

function appVersion(): string {
  return Constants.expoConfig?.version || Constants.nativeAppVersion || '1.0.0';
}

export function AboutModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.content}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.version}>Version {appVersion()}</Text>
            <Text style={styles.developer}>Developer: {DEVELOPER}</Text>
            <Text style={styles.rights}>{RIGHTS}</Text>
          </View>
          <View style={styles.actions}>
            <SoftButton title="Close" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 22,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginBottom: 18,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 16,
  },
  developer: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  rights: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  actions: {
    marginTop: 22,
    alignItems: 'center',
  },
});
