const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Utilisation : node scripts/setAdminPassword.js "VotreMotDePasseTresSolide"');
  process.exit(1);
}
if (password.length < 12) {
  console.warn('⚠️  Attention : utilisez un mot de passe admin d\'au moins 12 caractères, avec majuscules, chiffres et symboles.');
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nAjoutez cette ligne dans votre fichier .env :\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
});
