const assert = require("assert");
const {Trust, User} = require("../src/models");

it("Should calculate trust for a single friend of friend correctly", () => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 50);
  friend.trustUser(stranger, 30);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, Math.sqrt(50 * 30));
});

it("Should calculate trust for multiple friends trusting a stranger correctly", () => {
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
});

it("Should calculate trust 3 levels deep correctly", () => {
  const user = new User();
  const friend = new User();
  const stranger = new User();
  const stranger2 = new User();

  user.trustUser(friend, 50);
  friend.trustUser(stranger, 30);
  stranger.trustUser(stranger2, 20);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger2.id].rating, Math.sqrt(50 * Math.sqrt(30 * 20)));
});

it("Should give negative ratings to strangers that friends distrust", () => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 70);
  friend.trustUser(stranger, -35);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, -Math.sqrt(70 * 35));
});

it("Should ignore all ratings from untrusted people", () => {
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
});

it("Should use fixed trust when available", () => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(stranger, 20)
  user.trustUser(friend, 50);
  friend.trustUser(stranger, 30);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, 20);
});

it("Should not cause a loop if the person we trust trusts us", () => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 50);
  friend.trustUser(user, 32);
  friend.trustUser(stranger, 30);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, Math.sqrt(50 * 30));
});

it("Should not cause a loop if the friend and stranger trust each other", () => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 45);
  friend.trustUser(stranger, 35);
  stranger.trustUser(friend, 20);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id].rating, Math.sqrt(45 * 35));
});

it("Should not cause a loop if two strangers trust each other", () => {
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
});

it("Should not be possible to trust yourself", () => {
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
});