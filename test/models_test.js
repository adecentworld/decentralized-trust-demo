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
  user.trustUser(friend2, 20);
  friend2.trustUser(stranger, 80);

  const trustLevels = user.calculateTrust();
  const expectedTrustFriend1 = Math.sqrt(50 * 30);
  const expectedTrustFriend2 = Math.sqrt(20 * 80);
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

t.test("Should not be possible to trust yourself", (t) => {
  const user = new User();
  const friend = new User();

  try {
    user.trustUser(user, 15);
  } catch (e) {
    assert(e instanceof TypeError);
  }
  user.trustUser(friend, 45);

  const trustLevels = user.calculateTrust();
  assert.equal(Object.keys(trustLevels).length, 1);
  t.end();
});