let mockFocus: () => () => void;
let mockAppStateListener: (state: string) => void;
const mockRemove = jest.fn();
jest.mock('react', () => ({
  useRef: (value: unknown) => ({current: value}),
  useCallback: (callback: unknown) => callback,
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => () => void) => { mockFocus = callback; },
}));
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: (_event: string, listener: (state: string) => void) => {
      mockAppStateListener = listener;
      return {remove: mockRemove};
    },
  },
}));
import {AppState} from 'react-native';
import {useAutomaticRefresh} from '../src/utils/useAutomaticRefresh';

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  AppState.currentState = 'active';
});
afterEach(() => { jest.useRealTimers(); });

test('refreshes on focus and every thirty seconds, then cleans up on blur', async () => {
  const refresh = jest.fn().mockResolvedValue(undefined);
  useAutomaticRefresh(refresh, 'city:category');
  const cleanup = mockFocus();
  expect(refresh).toHaveBeenCalledTimes(1);
  await Promise.resolve();
  jest.advanceTimersByTime(29999);
  expect(refresh).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1);
  expect(refresh).toHaveBeenCalledTimes(2);
  cleanup();
  expect(refresh.mock.calls[0][0]()).toBe(true);
  jest.advanceTimersByTime(60000);
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(mockRemove).toHaveBeenCalledTimes(1);
});

test('skips background polling and refreshes on foreground', async () => {
  const refresh = jest.fn().mockResolvedValue(undefined);
  useAutomaticRefresh(refresh, 'city');
  const cleanup = mockFocus();
  await Promise.resolve();
  AppState.currentState = 'background';
  jest.advanceTimersByTime(60000);
  expect(refresh).toHaveBeenCalledTimes(1);
  AppState.currentState = 'active';
  mockAppStateListener('active');
  expect(refresh).toHaveBeenCalledTimes(2);
  cleanup();
});

test('refreshes while native app state is still initializing', () => {
  AppState.currentState = null as unknown as typeof AppState.currentState;
  const refresh = jest.fn().mockResolvedValue(undefined);
  useAutomaticRefresh(refresh, 'city');
  const cleanup = mockFocus();
  expect(refresh).toHaveBeenCalledTimes(1);
  cleanup();
});

test('prevents overlapping requests and recovers after a failed refresh', async () => {
  let rejectRequest!: (error: Error) => void;
  const refresh = jest.fn().mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectRequest = reject; }))
    .mockResolvedValue(undefined);
  useAutomaticRefresh(refresh, 'city');
  const cleanup = mockFocus();
  jest.advanceTimersByTime(90000);
  expect(refresh).toHaveBeenCalledTimes(1);
  rejectRequest(new Error('Network unavailable'));
  await Promise.resolve();
  jest.advanceTimersByTime(30000);
  expect(refresh).toHaveBeenCalledTimes(2);
  cleanup();
});
