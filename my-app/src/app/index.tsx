import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function HomeScreen() {
  const appUrl = 'http://192.168.1.37:3000';
  const [downloading, setDownloading] = useState(false);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'DOWNLOAD_PDF') {
        const { filename, base64 } = data;
        const cleanName = filename || `Receipt_${Date.now()}.pdf`;
        const base64Data = base64.includes('base64,') ? base64.split('base64,')[1] : base64;

        setDownloading(true);

        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        const fileUri = `${cacheDir}${cleanName}`;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const isShareAvailable = await Sharing.isAvailableAsync();
        if (isShareAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Download / Save Receipt',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Download Complete', `Receipt saved: ${fileUri}`);
        }
      }
    } catch (err: any) {
      console.error('PDF Download Error:', err);
      Alert.alert('Download Error', err?.message || 'Could not download receipt PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <WebView
        source={{ uri: appUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        originWhitelist={['*']}
        onMessage={handleMessage}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3E7BFA" />
            <Text style={styles.loadingText}>Connecting to NEST Property Management...</Text>
          </View>
        )}
        renderError={(errorDomain, errorCode, errorDesc) => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Cannot Connect to NEST Server</Text>
            <Text style={styles.errorSubtitle}>
              Please verify that your phone is on the same Wi-Fi network as this PC ({appUrl}).
            </Text>
            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 10 }}>{errorDesc}</Text>
          </View>
        )}
      />

      {downloading && (
        <View style={styles.downloadOverlay}>
          <ActivityIndicator size="large" color="#3E7BFA" />
          <Text style={styles.downloadText}>Saving and opening PDF receipt...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1B3C',
  },
  webview: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0E1B3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#EAF3FF',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  downloadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 27, 60, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  downloadText: {
    color: '#EAF3FF',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0E1B3C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
