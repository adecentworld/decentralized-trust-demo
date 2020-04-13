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

