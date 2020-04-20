import {User, Trust} from './src/models';
import assert from 'assert';

const a = new User('a');
const b = new User('b');
const c = new User('c');
const d = new User('d');

a.trustUser(b, 50);
b.trustUser(c, 25);

let trustLevels = a.recalculateTrust();
console.log("Trust Levels: ", trustLevels);
assert.equal(trustLevels[c.id], Math.sqrt(50 * 25));

console.log("---------");

a.trustUser(b, 50);
b.trustUser(d, 30);
a.trustUser(c, 10);
c.trustUser(d, 25);

trustLevels = a.recalculateTrust();
console.log("Trust Levels: ", trustLevels);

const ABxBD = Math.sqrt(50 * 30);
const ACxCD = Math.sqrt(10 * 25);
assert.equal(trustLevels[d.id], (ABxBD + ACxCD) / 2);


// Doing some speed tests
const totalUsers = 100000;
const edgesPerUser = 100;
const totalEdges = totalUsers * edgesPerUser;
const totalTests = 10;

console.log("Creating users...");

const users = {};
for (let i = 0; i < totalUsers; i++) {
  let user = new User();
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

console.log(`Done generating ${totalEdges} edges`);
console.log("Running speed tests on random users");

for (let k = 0; k < totalTests; k++) {
  let testUserNum = Math.floor(Math.random() * totalUsers);
  let user = users[testUserNum];
  let startTime = Date.now();
  let trustLevels = user.recalculateTrust();
  let totalTime = Date.now() - startTime;
  console.log(`Calculated trust levels for user: ${user.id} in ${totalTime} ms.`)
  console.log(`Total calculated trusted users: ${Object.keys(trustLevels).length}`)
  // console.log("Trust levels are: ", trustLevels);
}



