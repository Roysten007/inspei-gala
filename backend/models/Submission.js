const { getPool } = require('../config/db');

async function findByUserId(userId) {
  const [rows] = await getPool().query('SELECT * FROM submissions WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await getPool().query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function createSubmission({ userId, title, team, description, projectLink, file }) {
  const [result] = await getPool().query(
    `INSERT INTO submissions
      (user_id, title, team, description, project_link, file_stored_name, file_original_name, file_size, file_mime_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, title, team || '', description, projectLink || null,
      file ? file.storedName : null,
      file ? file.originalName : null,
      file ? file.size : null,
      file ? file.mimeType : null,
    ]
  );
  return findById(result.insertId);
}

async function updateSubmission(id, { title, team, description, projectLink, file }) {
  const fields = ['title = ?', 'team = ?', 'description = ?', 'project_link = ?'];
  const values = [title, team || '', description, projectLink || null];

  if (file) {
    fields.push('file_stored_name = ?', 'file_original_name = ?', 'file_size = ?', 'file_mime_type = ?');
    values.push(file.storedName, file.originalName, file.size, file.mimeType);
  }

  values.push(id);
  await getPool().query(`UPDATE submissions SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function updateStatusAndNote(id, { status, adminNote }) {
  const fields = [];
  const values = [];
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (adminNote !== undefined) { fields.push('admin_note = ?'); values.push(adminNote); }
  if (!fields.length) return findById(id);

  values.push(id);
  await getPool().query(`UPDATE submissions SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function findAllWithUser() {
  const [rows] = await getPool().query(
    `SELECT s.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM submissions s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.created_at DESC`
  );
  return rows;
}

module.exports = {
  findByUserId, findById, createSubmission, updateSubmission, updateStatusAndNote, findAllWithUser,
};
