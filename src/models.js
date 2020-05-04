const MIN_TRUST = -100;
const MAX_TRUST = 100;

function generateRandomString(length) {
  return Math.random().toString(36).substring(2, length)
}

class Trust {
  constructor(user, rating) {
    this.user = user;
    this.rating = Math.min(Math.max(rating, MIN_TRUST), MAX_TRUST);
  }
}

class CalculatedTrust {
  constructor(rating) {
    this.rating = rating || 0;
    this.fixed = !!rating;
    this.totalRatings = 0;
  }

  addRating(rating) {
    if (this.fixed) return;

    if (this.totalRatings === 0) {
      this.rating = rating;
      this.totalRatings = 1;
      return;
    }

    this.rating = (this.rating * this.totalRatings) + rating;
    this.totalRatings++;
    this.rating /= this.totalRatings;
  }
}

class User {
  constructor(id) {
    this.id = id || generateRandomString();
    this.trustedUsers = {}; // Hashmap of userId -> Trust for each trusted user
    this.calculatedTrust = {};
  }

  serialize() {
    const serializedTrust = Object.entries(this.trustedUsers).map(([id, trust]) => {
      return { id, rating: trust.rating }
    });
    const serialized = {
      id: this.id,
      trustedUsers: serializedTrust
    }
    return serialized;
  }

  trustUser(user, rating) {
    this.trustedUsers[user.id] = new Trust(user, rating);
  }

  // Returns a hashmap of all users with calculated trust ratings for each. 
  recalculateTrust() {
    this.calculatedTrust = {}; // Hashmap of userId -> CalculatedTrust
    Object.entries(this.trustedUsers).forEach(([userId, trust]) => {
      this.calculatedTrust[userId] = new CalculatedTrust(trust.rating);
    });
    Object.entries(this.trustedUsers).forEach(([userId, trust]) => {
      Object.entries(trust.user.trustedUsers).forEach(([otherId, otherTrust]) => {
        this.calculatedTrust[otherId] = this.calculatedTrust[otherId] || new CalculatedTrust();
        const otherRating = Math.sqrt(Math.abs(trust.rating * otherTrust.rating))
        this.calculatedTrust[otherId].addRating(otherRating);
      });
    });

    return this.getTrustValues();
  }

  getTrustValues() {
    const trustValues = {};
    Object.entries(this.calculatedTrust).forEach(([id, trust]) => {
      trustValues[id] = trust.rating;
    });

    return trustValues;
  }


}

module.exports = {Trust, User};