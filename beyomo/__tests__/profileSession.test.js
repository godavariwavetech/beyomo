/** @jest-environment node */
import reducer, {fetchProfile} from '../src/redux/reducers/user';

jest.mock('../src/utils/api', () => ({__esModule: true, default: {get: jest.fn()}}));

const oldProfile = {name: 'Previous user', phone: '1111111111'};
const newProfile = {name: 'Current user', phone: '2222222222'};

function loadProfile(state, profile, requestId) {
  state = reducer(state, fetchProfile.pending(requestId));
  return reducer(state, fetchProfile.fulfilled(profile, requestId));
}

test.each([
  'auth/actionLogout',
  'auth/logoutUser/fulfilled',
  'auth/deleteAccount/fulfilled',
  'auth/actionLogin',
  'auth/verifyLoginOtp/fulfilled',
])('%s clears the cached account', type => {
  const state = {...loadProfile(undefined, oldProfile, 'old'), wallet: {balance: 500}};
  expect(reducer(state, {type})).toEqual(reducer(undefined, {type: 'init'}));
});

test('logout and login with another number loads the new profile without restarting', () => {
  let state = loadProfile(undefined, oldProfile, 'old');
  state = reducer(state, {type: 'auth/logoutUser/fulfilled'});
  state = reducer(state, {type: 'auth/verifyLoginOtp/fulfilled'});
  expect(state.profile).toBeNull();
  state = loadProfile(state, newProfile, 'new');
  expect(state.profile).toEqual(newProfile);
});

test('a previous session request cannot overwrite the new profile', () => {
  let state = reducer(undefined, fetchProfile.pending('old'));
  state = reducer(state, {type: 'auth/actionLogout'});
  state = reducer(state, {type: 'auth/verifyLoginOtp/fulfilled'});
  state = loadProfile(state, newProfile, 'new');
  expect(reducer(state, fetchProfile.fulfilled(oldProfile, 'old'))).toEqual(state);
  expect(reducer(state, fetchProfile.rejected(new Error('Old request'), 'old'))).toEqual(state);
});
