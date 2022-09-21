import { polyfillWebCrypto } from 'expo-standard-web-crypto'
import PolyfillCrypto from 'react-native-webview-crypto'

polyfillWebCrypto()

export { PolyfillCrypto }
