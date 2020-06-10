const rn = require("node-random-name");
const models = require("./models");
const User = models.User;

class World {

  async generate(totalUsers, totalEdges) {
    const users = [];
    for (let i = 0; i < totalUsers; i++) {
      let user = new User(rn({seed: Math.random()}));
      users[i] = user;
    }

    for (let j = 0; j < totalEdges; j++) {
      let userFromNum = Math.floor(Math.random() * totalUsers);
      let userToNum = Math.floor(Math.random() * totalUsers);
      if (userFromNum == userToNum) {
        j--;
        continue;
      }
      let rating = Math.floor(Math.random() * 200) - 100;
      users[userFromNum].trustUser(users[userToNum], rating);
    }

    return users;
  }
}

module.exports = World;