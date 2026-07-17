// AsyncStorage has no native module under Jest; use its bundled mock so modules
// that import it (e.g. lib/progress) can be required in tests.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
