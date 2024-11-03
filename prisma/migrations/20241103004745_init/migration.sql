-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(36) NOT NULL,
    `number` VARCHAR(16) NOT NULL,
    `password` VARCHAR(72) NOT NULL,
    `remindHour` TINYINT NOT NULL,
    `remindWhen` TINYINT NOT NULL,

    UNIQUE INDEX `Account_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountSession` (
    `id` VARCHAR(36) NOT NULL,
    `accountId` VARCHAR(36) NOT NULL,
    `expireAt` DATETIME(3) NOT NULL,

    INDEX `AccountSession_expireAt_idx`(`expireAt`),
    INDEX `AccountSession_accountId_idx`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Schedule` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(36) NOT NULL,
    `ownerId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleSubscriber` (
    `accountId` VARCHAR(36) NOT NULL,
    `scheduleId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`scheduleId`, `accountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleEditor` (
    `accountId` VARCHAR(36) NOT NULL,
    `scheduleId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`scheduleId`, `accountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleMapel` (
    `name` VARCHAR(36) NOT NULL,
    `scheduleId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`scheduleId`, `name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reminder` (
    `id` VARCHAR(36) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `done` BOOLEAN NOT NULL,
    `lastRemind` DATETIME(3) NULL,
    `mapel` VARCHAR(36) NOT NULL,
    `scheduleId` VARCHAR(36) NOT NULL,

    INDEX `Reminder_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleSubscriber` ADD CONSTRAINT `ScheduleSubscriber_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleSubscriber` ADD CONSTRAINT `ScheduleSubscriber_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleEditor` ADD CONSTRAINT `ScheduleEditor_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleEditor` ADD CONSTRAINT `ScheduleEditor_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleMapel` ADD CONSTRAINT `ScheduleMapel_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_scheduleId_mapel_fkey` FOREIGN KEY (`scheduleId`, `mapel`) REFERENCES `ScheduleMapel`(`scheduleId`, `name`) ON DELETE RESTRICT ON UPDATE CASCADE;
