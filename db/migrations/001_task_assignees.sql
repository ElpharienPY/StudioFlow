-- Passe une base EXISTANTE de « un seul assigné par tâche » (tasks.assignee_id)
-- à « plusieurs assignés par tâche » (table task_assignees), sans perdre de données.
-- (Alternative : `npm run db:reset` dans backend/, qui recrée tout mais efface les données.)
--
--   mysql -u studioflow -p studioflow < db/migrations/001_task_assignees.sql

CREATE TABLE IF NOT EXISTS `task_assignees` (
  `task_id`     INT      NOT NULL,
  `user_id`     INT      NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`, `user_id`),
  KEY `idx_task_assignees_user` (`user_id`),
  CONSTRAINT `fk_task_assignees_task`
    FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_task_assignees_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `task_assignees` (`task_id`, `user_id`)
  SELECT `id`, `assignee_id` FROM `tasks` WHERE `assignee_id` IS NOT NULL;

ALTER TABLE `tasks` DROP FOREIGN KEY `fk_tasks_assignee`;
ALTER TABLE `tasks` DROP INDEX `idx_tasks_assignee`, DROP COLUMN `assignee_id`;
