const MIN_TRUST = -100;
const MAX_TRUST = 100;
const DEFAULT_DEPTH = 3;

function generateRandomString(length) {
  return Math.random().toString(36).substring(2, length + 2)
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
    this.id = id || generateRandomString(4);
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
    if (user.id == this.id) throw new TypeError("Cannot trust self");
    if (rating > MAX_TRUST) throw new TypeError(`Cannot set trust rating greater than ${MAX_TRUST}`)
    if (rating < MIN_TRUST) throw new TypeError(`Cannot set trust rating less than ${MIN_TRUST}`)

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
   * Returns a hashmap of userId -> CalculatedTrust for each user. 
   */

  calculateTrust(depth) {
    if (depth == null) {
      depth = DEFAULT_DEPTH;
    }
    this.calculatedTrust = {}; // Hashmap of userId -> CalculatedTrust

    // Set fixed trust ratings for all users in this.trustedUsers
    Object.entries(this.trustedUsers).forEach(([userId, trust]) => {
      this.calculatedTrust[userId] = new CalculatedTrust(trust.rating);
    });
    // We've gone as deep as we'd like to calculate, just return this users trust ratings of others. 
    if (depth <= 1) {
      return this.calculatedTrust;
    }
    Object.entries(this.trustedUsers).forEach(([userId, trust]) => {
      // Ignore futher trust ratings from people we distrust
      if (trust.rating < 0) return;
      const trustLevels = trust.user.calculateTrust(depth-1);
      Object.entries(trustLevels).forEach(([otherId, otherTrust]) => {
        // Ignore trust from this user to us. 
        if (otherId == this.id) return; 
        this.calculatedTrust[otherId] = this.calculatedTrust[otherId] || new CalculatedTrust();
        
        const otherRating = this.calculateStrangerRating(trust.rating, otherTrust.rating);
        this.calculatedTrust[otherId].addRating(otherRating);
      });
    });

    return this.calculatedTrust;
  }

  /**
   * Does the math to calculate the trust of a stranger given our mutual
   * friends rating and the strangers rating.  
   */
  calculateStrangerRating(friendRating, friendToStrangerRating) {
    /* Strangers cannot be trusted more than the mutual friend. 
    Becuase sqrt(A*B) when B>A is always greater than A we can
    skip that math calculation and just return our trust of our friend. */
    if (friendToStrangerRating > friendRating) {
      return friendRating;
    }
    
    let rating = Math.sqrt(Math.abs(friendRating * friendToStrangerRating)); 
    if (friendToStrangerRating < 0) rating = -rating;
    return rating;
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