const assert = require("assert");
const {Trust, User} = require("../src/models");

it("Should calculate trust for a single friend of friend correctly", () => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 50);
  friend.trustUser(stranger, 30);

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id], Math.sqrt(50 * 30));
});

it("Should calculate trust for multiple friends trusting a stranger correctly", () => {

});

it("Should use fixed trust when available", () => {
  const user = new User();
  const friend = new User();
  const stranger = new User();

  user.trustUser(friend, 50);
  friend.trustUser(stranger, 30);
  user.trustUser(stranger, 20)

  const trustLevels = user.calculateTrust();
  assert.equal(trustLevels[stranger.id], 20);
});


it("Should not break if the person we trust trusts us", () => {

});

it("Should not have a trust level for itself", () => {

});