import 'react-native-gesture-handler';

// Polyfills for TextEncoder and TextDecoder in React Native (needed for StompJS/WebSockets)
if (typeof (global as any).TextEncoder === 'undefined') {
  (global as any).TextEncoder = class {
    encode(str: string) {
      const utf8Str = unescape(encodeURIComponent(str));
      const buf = new Uint8Array(utf8Str.length);
      for (let i = 0; i < utf8Str.length; i++) {
        buf[i] = utf8Str.charCodeAt(i);
      }
      return buf;
    }
  };
}
if (typeof (global as any).TextDecoder === 'undefined') {
  (global as any).TextDecoder = class {
    decode(buf: any) {
      let view: Uint8Array;
      if (buf instanceof Uint8Array) {
        view = buf;
      } else if (buf instanceof ArrayBuffer) {
        view = new Uint8Array(buf);
      } else if (buf && buf.buffer instanceof ArrayBuffer) {
        view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      } else {
        view = new Uint8Array(buf || []);
      }
      
      let str = "";
      for (let i = 0; i < view.length; i++) {
        str += String.fromCharCode(view[i]);
      }
      
      try {
        return decodeURIComponent(escape(str));
      } catch (e) {
        return str;
      }
    }
  };
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
