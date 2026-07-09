-- =========================================================
-- Schéma MySQL — Soirée Gala INSPEI
-- Exécute ce fichier une fois sur ta base avant de démarrer le serveur :
--   mysql -u ton_utilisateur -p ton_nom_de_base < schema.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(100)  NOT NULL,
  email                 VARCHAR(150)  NOT NULL UNIQUE,
  phone                 VARCHAR(30)   NOT NULL,
  password_hash         VARCHAR(255)  NOT NULL,
  failed_login_attempts INT           NOT NULL DEFAULT 0,
  locked_until          DATETIME      NULL,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS submissions (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL UNIQUE,
  title               VARCHAR(150)  NOT NULL,
  team                VARCHAR(300)  NULL,
  description         TEXT          NOT NULL,
  project_link        VARCHAR(500)  NULL,
  file_stored_name    VARCHAR(255)  NULL,
  file_original_name  VARCHAR(255)  NULL,
  file_size           INT           NULL,
  file_mime_type      VARCHAR(100)  NULL,
  status              ENUM('submitted','reviewed','selected') NOT NULL DEFAULT 'submitted',
  admin_note          VARCHAR(1000) NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_submissions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
