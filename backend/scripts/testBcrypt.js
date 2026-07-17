const bcrypt = require('bcryptjs');

const password = 'adminINSPEIGala2026!';
const hash1 = '$2a$12$6NlXJm.Qd2XJgRUX7q6BHe3BfZK.6kF1G5Gk.b2GqI3G/bH7W1x22';
const hash2 = '$2a$12$kWi6Fo6Guk89cGIUTf7G6eya2q1K6PvaXt99AAvsvkhEQFHTCfM4e';

async function test() {
  const m1 = await bcrypt.compare(password, hash1);
  const m2 = await bcrypt.compare(password, hash2);
  console.log('Hash1 matches:', m1);
  console.log('Hash2 matches:', m2);
  
  // Let's generate a brand new hash to be absolutely sure
  const freshHash = await bcrypt.hash(password, 12);
  console.log('Fresh hash:', freshHash);
  const mFresh = await bcrypt.compare(password, freshHash);
  console.log('Fresh matches:', mFresh);
}

test();
