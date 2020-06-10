const {User} = require("./models");
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

function calculateTrust(depth) {
  const testUserNum = Math.floor(Math.random() * totalUsers);
  const user = users[testUserNum];
  user.calculateTrust(depth);
} 

const benchmarks = [];
for (var depth = 1; depth <= 5; depth++) {
  benchmarks.push(new Benchmark(`Calculate Trust (depth=${depth})`, calculateTrust.bind(null, depth)));
}

console.log("Running benchmark...");
console.log();

Benchmark.invoke(benchmarks, {
  'name': 'run',
  'onComplete': function() {
    console.log(`Benchmark of ${totalUsers} users with ${totalEdges} ratings:`);
    for (var depth = 1; depth <= 5; depth++) {
      let stats = benchmarks[depth-1].stats
      console.log(`Average time to recalculate trust (depth=${depth}):`, '\x1b[32m', `${Math.round(stats.mean * 100000) / 100}ms`, '\x1b[0m')
    }
  }
});
