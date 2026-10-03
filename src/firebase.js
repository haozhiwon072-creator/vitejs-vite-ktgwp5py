import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

export const emulatorMode = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true';
export const appId = import.meta.env.VITE_APP_ID || globalThis.__app_id || 'ming-jii-default';

let previewConfig;
try {
  if (globalThis.__firebase_config) previewConfig = JSON.parse(globalThis.__firebase_config);
} catch {
  // A malformed preview configuration must not hide a valid environment configuration.
}

const publicConfig = emulatorMode ? {
  apiKey: 'demo-emulator-only',
  authDomain: 'demo-ming-jii-cloud.firebaseapp.com',
  projectId: 'demo-ming-jii-cloud',
  appId: 'demo-ming-jii-cloud',
} : previewConfig || {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? { storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET } : {}),
  ...(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? { messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID } : {}),
};

let auth = null;
let db = null;
let configurationError = '';
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
if (requiredFields.some(field => !publicConfig[field] || publicConfig[field].includes('YOUR_'))) {
  configurationError = '云端服务尚未配置。请由管理员按照项目里的免费上线说明连接 Firebase。';
} else {
  try {
    const app = initializeApp(publicConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    if (emulatorMode) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
  } catch {
    configurationError = '云端服务配置无法使用。请联系管理员检查 Firebase 配置。';
  }
}

let initialSession;
export function initializeSession() {
  if (!auth) return Promise.resolve();
  if (!initialSession) {
    initialSession = auth.authStateReady().then(async () => {
      if (globalThis.__initial_auth_token) {
        await signInWithCustomToken(auth, globalThis.__initial_auth_token);
      } else if (emulatorMode && import.meta.env.VITE_ANONYMOUS_DEMO !== 'false' && !auth.currentUser) {
        await signInAnonymously(auth);
      }
    }).catch(error => {
      initialSession = undefined;
      throw error;
    });
  }
  return initialSession;
}

export function describeServiceError(error) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return '邮箱或密码不正确，请重新输入。';
    case 'auth/too-many-requests':
      return '尝试次数过多，请稍后再登录。';
    case 'auth/operation-not-allowed':
      return '登录服务尚未启用，请联系管理员。';
    case 'auth/network-request-failed':
    case 'unavailable':
      return '暂时无法连接云端，请检查网络后重试。';
    case 'permission-denied':
      return '当前账号没有资料访问权限，请联系管理员。';
    case 'resource-exhausted':
      return '免费服务额度暂时已用完，请稍后重试或联系管理员。';
    default:
      return '操作未完成，请稍后重试。';
  }
}

export { auth, db, configurationError };
