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

  /**
   * Gets the trust ratings of all users this user has rated. 
   * No calculated trust levels are included, only the ratings the user has set. 
   * Returns a hashmap of all users with the set integer rating of each. 
   */
  getTrustRatings() {
    const trustRatings = {};
    Object.entries(this.trustedUsers).forEach(([id, trust]) => {
      trustRatings[id] = trust.rating;
    });

    return trustRatings;
  }

  /**
   * Calculates the trust levels from this user to all other users. 
   * Returns a hashmap of all users with calculated trust ratings for each. 
   */

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

    return this.getTrustLevels();
  }

  /**
   * Gets all calculated trust levels from this user to other users.
   * These are the calculated trust levels, and will be to other users that this
   * user may have never rated becuase the trust was calculated from friends of friends. 
   */
  getTrustLevels() {
    const trustLevels = {};
    Object.entries(this.calculatedTrust).forEach(([id, trust]) => {
      trustLevels[id] = trust.rating;
    });

    return trustLevels;
  }


}

module.exports = {Trust, User};