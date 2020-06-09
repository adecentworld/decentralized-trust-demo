const t = require("tap");
const assert = require("assert");
const {Trust, User} = require("../src/models");

t.test("Should calculate trust for a single friend of friend correctly", (t) => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 50);
  friend.trustUser(stranger, 30);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, Math.sqrt(50 * 30));
  t.end();
});

t.test("Should calculate trust for multiple friends trusting a stranger correctly", (t) => {
  const user = new User();
  const friend1 = new User();
  const friend2 = new User();
  const stranger = new User();

  user.trustUser(friend1, 50);
  friend1.trustUser(stranger, 30);
  user.trustUser(friend2, 90);
  friend2.trustUser(stranger, 80);

  const trustLevels = user.calculateTrust();
  const expectedTrustFriend1 = Math.sqrt(50 * 30);
  const expectedTrustFriend2 = Math.sqrt(90 * 80);
  assert.equal(trustLevels[stranger.id].rating, (expectedTrustFriend1 + expectedTrustFriend2) / 2);
  t.end();
});

t.test("Should calculate trust 3 levels deep correctly", (t) => {
  const user = new User();
  const friend = new User();
  const stranger = new User();
  const stranger2 = new User();

  user.trustUser(friend, 50);
  friend.trustUser(stranger, 30);
  stranger.trustUser(stranger2, 20);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger2.id].rating, Math.sqrt(50 * Math.sqrt(30 * 20)));
  t.end();
});

t.test("Should give negative ratings to strangers that friends distrust", (t) => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 70);
  friend.trustUser(stranger, -35);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, -Math.sqrt(70 * 35));
  t.end();
});

t.test("Should never give a stranger more trust than the mutual friend", (t) => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 10);
  friend.trustUser(stranger, 100);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, 10);
  t.end();
});

t.test("Should ignore all ratings from untrusted people", (t) => {
  const user = new User();
  const friend = new User();
  const enemy = new User();
  const stranger = new User();

  user.trustUser(friend, 70);
  friend.trustUser(stranger, -10);
  user.trustUser(enemy, -30);
  enemy.trustUser(stranger, 30);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, -Math.sqrt(70 * 10));
  t.end();
});

t.test("Should use fixed trust when available", (t) => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(stranger, 20)
  user.trustUser(friend, 50);
  friend.trustUser(stranger, 30);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, 20);
  t.end();
});

t.test("Should not cause a loop if the person we trust trusts us", (t) => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 50);
  friend.trustUser(user, 32);
  friend.trustUser(stranger, 30);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, Math.sqrt(50 * 30));
  t.end();
});

t.test("Should not cause a loop if the friend and stranger trust each other", (t) => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 45);
  friend.trustUser(stranger, 35);
  stranger.trustUser(friend, 20);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, Math.sqrt(45 * 35));
  t.end();
});

t.test("Should not cause a loop if two strangers trust each other", (t) => {
  const user = new User();
  const friend = new User();
  const stranger = new User();
  const stranger2 = new User();

  user.trustUser(friend, 45);
  friend.trustUser(stranger, 35);
  stranger.trustUser(stranger2, 15);
  stranger2.trustUser(stranger, 75);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, Math.sqrt(45 * 35));
  assert.equal(trustLevels[stranger2.id].rating, Math.sqrt(45 * Math.sqrt(35 * 15)));
  t.end();
});

t.test("Trust loops should not cause different overall trust ratings", (t) => {
  const user0 = new User();
  const user1 = new User();
  const user2 = new User();
  const user3 = new User();

  const user4 = new User();
  const user5 = new User();
  const user6 = new User();
  const user7 = new User();

  user0.trustUser(user1, 50);
  user1.trustUser(user2, 40);
  user2.trustUser(user3, 30);
  user3.trustUser(user1, 20);

  user4.trustUser(user5, 50);
  user5.trustUser(user6, 40);
  user6.trustUser(user7, 30);

  const user0TrustLevels = user0.calculateTrust(5);
  const user0TrustLevelsArray = Object.values(user0TrustLevels).map((trust) => trust.rating);
  const user4TrustLevels = user4.calculateTrust(5);
  const user4TrustLevelsArray = Object.values(user4TrustLevels).map((trust) => trust.rating);

  assert.deepEqual(user0TrustLevelsArray, user4TrustLevelsArray);
  t.end();
});


t.test("Should not be possible to trust yourself", (t) => {
  const user = new User();
  const friend = new User();

  assert.throws(user.trustUser.bind(user, user, 15));
  user.trustUser(friend, 45);

  const trustLevels = user.calculateTrust();
  assert.equal(Object.keys(trustLevels).length, 1);
  t.end();
});

t.test("Should not be possible to trust > 100 or < -100", (t) => {
  const user = new User();
  const friend = new User();

  assert.throws(user.trustUser.bind(user, friend, 101), TypeError);
  assert.throws(user.trustUser.bind(user, friend, -101), TypeError);

  const trustLevels = user.calculateTrust();
  assert.equal(Object.keys(trustLevels).length, 0);
  t.end();
});