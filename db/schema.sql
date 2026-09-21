CREATE DATABASE IF NOT EXISTS `studioflow`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `studioflow`;

DROP TABLE IF EXISTS `assets`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `deliverables`;
DROP TABLE IF EXISTS `project_members`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `users`;


CREATE TABLE `users` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `full_name`     VARCHAR(100)  NOT NULL,
  `email`         VARCHAR(255)  NOT NULL,
  -- bcrypt hash, never send this back in the API
  `password_hash` VARCHAR(255)  NOT NULL,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `refresh_tokens` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  -- sha-256 of the token, we never store the raw token
  `token_hash` CHAR(64)     NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  -- null = session still active
  `revoked_at` DATETIME     NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refresh_tokens_hash` (`token_hash`),
  KEY `idx_refresh_tokens_user` (`user_id`),
  CONSTRAINT `fk_refresh_tokens_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `projects` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `description` TEXT         NULL,
  -- null = still active, this is our soft delete
  `archived_at` DATETIME     NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_projects_archived` (`archived_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `project_members` (
  `project_id` INT NOT NULL,
  `user_id`    INT NOT NULL,
  `role`       ENUM('owner','editor','viewer') NOT NULL DEFAULT 'editor',
  `joined_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`project_id`, `user_id`),
  KEY `idx_project_members_user` (`user_id`),
  CONSTRAINT `fk_project_members_project`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_project_members_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `deliverables` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `project_id`     INT          NOT NULL,
  `title`          VARCHAR(150) NOT NULL,
  `platform`       ENUM('youtube','tiktok','instagram','client','other')
                   NOT NULL DEFAULT 'youtube',
  `publish_date`   DATE         NULL,
  -- just a counter, how many revision rounds so far
  `revision_round` INT          NOT NULL DEFAULT 0,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_deliverables_project_date` (`project_id`, `publish_date`),
  CONSTRAINT `fk_deliverables_project`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- status = kanban column (todo/doing/done), stage = production step, they're independent
-- careful: "stage != 'editing'" skips NULL rows in SQL, use "stage IS NULL OR stage != 'editing'"
CREATE TABLE `tasks` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `deliverable_id` INT          NOT NULL,
  -- null = nobody assigned yet
  `assignee_id`    INT          NULL,
  `title`          VARCHAR(150) NOT NULL,
  `description`    TEXT         NULL,
  `status`         ENUM('todo','doing','done') NOT NULL DEFAULT 'todo',
  `stage`          ENUM('concept','script','shooting','editing','thumbnail','publishing')
                   NULL,
  `due_date`       DATE         NULL,
  `position`       INT          NOT NULL DEFAULT 0,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_board` (`deliverable_id`, `status`, `position`),
  KEY `idx_tasks_assignee` (`assignee_id`),
  KEY `idx_tasks_due_date` (`due_date`),
  CONSTRAINT `fk_tasks_deliverable`
    FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_assignee`
    FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `comments` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `task_id`    INT      NOT NULL,
  `author_id`  INT      NOT NULL,
  `body`       TEXT     NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_task` (`task_id`, `created_at`),
  KEY `idx_comments_author` (`author_id`),
  CONSTRAINT `fk_comments_task`
    FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_comments_author`
    FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- no file upload here, we just keep a link + version number
CREATE TABLE `assets` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `deliverable_id` INT          NOT NULL,
  `label`          VARCHAR(150) NOT NULL,
  `url`            VARCHAR(500) NOT NULL,
  `kind`           ENUM('script','raw_footage','edit','thumbnail','export') NOT NULL,
  `version`        INT          NOT NULL DEFAULT 1,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assets_deliverable` (`deliverable_id`, `kind`),
  CONSTRAINT `fk_assets_deliverable`
    FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
