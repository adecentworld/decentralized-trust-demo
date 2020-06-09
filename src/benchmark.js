const {User, Trust} = require("./models");
const Benchmark = require("benchmark");


const totalUsers = 100000;
const edgesPerUser = 10;
const totalEdges = totalUsers * edgesPerUser;

console.log("Creating users...");

const users = {};
for (let i = 0; i < totalUsers; i++) {
  let user = new User(i);
  users[i] = user;
}

console.log(`Done generating ${totalUsers} users`);
console.log("Creating edges");

for (let j = 0; j < totalEdges; j++) {
  let userFromNum = Math.floor(Math.random() * totalUsers);
  let userToNum = Math.floor(Math.random() * totalUsers);
  if (userFromNum == userToNum) {
    continue;
  }
  let rating = Math.floor(Math.random() * 200) - 100;
  users[userFromNum].trustUser(users[userToNum], rating);
}

console.log(`Done generating ${totalEdges} ratings`);

const bench = new Benchmark('Calculate Trust',
  function() {
    const testUserNum = Math.floor(Math.random() * totalUsers);
    const user = users[testUserNum];
    user.calculateTrust();
  } 
);

console.log("Running benchmark...");
console.log();

Benchmark.invoke([bench], {
  'name': 'run',
  'onComplete': function() {
    const stats = bench.stats;
    console.log("Benchmark complete");
    console.log('Average time to recalculate trust:', '\x1b[32m', `${Math.round(stats.mean * 100000) / 100}ms`, '\x1b[0m')
    console.log("All stats (in seconds): ", stats);
  }
});
