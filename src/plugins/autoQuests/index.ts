/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { popNotice, showNotice } from "@api/Notices";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher, RestAPI } from "@webpack/common";

interface Quest {
    id: string;
    config: {
        configVersion: number;
        expiresAt: string;
        application: {
            id: string;
            name: string;
        };
        messages: {
            questName: string;
        };
        taskConfig?: {
            tasks: Record<string, { target: number; }>;
        };
        taskConfigV2?: {
            tasks: Record<string, { target: number; }>;
        };
    };
    userStatus?: {
        visibleAt?: string;
        enrolledAt?: string;
        completedAt?: string;
        progress?: Record<string, { value: number; }>;
        streamProgressSeconds?: number;
    };
}

interface QuestsStore {
    quests: Map<string, Quest>;
}

interface ApplicationStreamingStore {
    getStreamerActiveStreamMetadata: () => { id: string; pid: number; sourceName: string | null; } | null;
}

interface RunningGameStore {
    getRunningGames: () => any[];
    getGameForPID: (pid: number) => any;
}

interface ChannelStoreType {
    getSortedPrivateChannels: () => { id: string; }[];
}

interface GuildChannelStoreType {
    getAllGuilds: () => Record<string, { VOCAL: { channel: { id: string; }; }[]; } | null>;
}

const QuestsStore = findByPropsLazy("getQuest", "quests") as QuestsStore;
const ApplicationStreamingStore = findByPropsLazy("getStreamerActiveStreamMetadata") as ApplicationStreamingStore;
const RunningGameStore = findByPropsLazy("getRunningGames", "getGameForPID") as RunningGameStore;
const PrivateChannelSortStore = findByPropsLazy("getSortedPrivateChannels") as ChannelStoreType;
const GuildChannelStore = findByPropsLazy("getAllGuilds", "getSFWDefaultChannel") as GuildChannelStoreType;

const logger = new Logger("AutoQuests");

const EXCLUDED_QUEST_ID = "1412491570820812933";

let completionAbortController: AbortController | null = null;
let isRunning = false;

async function enrollInQuest(questId: string): Promise<boolean> {
    try {
        await RestAPI.post({
            url: `/quests/${questId}/enroll`,
            body: {
                platform: 1
            }
        });
        logger.info(`Enrolled in quest ${questId}`);
        return true;
    } catch (e) {
        logger.error(`Failed to enroll in quest ${questId}:`, e);
        return false;
    }
}

function getUncompletedQuests(): Quest[] {
    if (!QuestsStore?.quests) return [];

    const now = Date.now();
    return [...QuestsStore.quests.values()].filter(quest =>
        quest.id !== EXCLUDED_QUEST_ID &&
        new Date(quest.config.expiresAt).getTime() > now &&
        !quest.userStatus?.completedAt
    );
}

async function completeVideoQuest(quest: Quest, signal: AbortSignal): Promise<void> {
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    const taskName = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig?.tasks[x] != null);
    if (!taskName || !taskConfig) return;

    const secondsNeeded = taskConfig.tasks[taskName].target;
    let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
    const enrolledAt = new Date(quest.userStatus!.enrolledAt!).getTime();

    const maxFuture = 10;
    const speed = 7;
    const interval = 1;

    logger.info(`Completing video quest "${quest.config.messages.questName}" (${secondsDone}/${secondsNeeded}s)`);

    let completed = false;
    while (!signal.aborted) {
        const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
        const diff = maxAllowed - secondsDone;
        const timestamp = secondsDone + speed;

        if (diff >= speed) {
            try {
                const res = await RestAPI.post({
                    url: `/quests/${quest.id}/video-progress`,
                    body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) }
                });
                completed = (res.body as any).completed_at != null;
                secondsDone = Math.min(secondsNeeded, timestamp);
            } catch (e) {
                logger.error("Failed to update video progress:", e);
            }
        }

        if (timestamp >= secondsNeeded) break;
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }

    if (!completed && !signal.aborted) {
        try {
            await RestAPI.post({
                url: `/quests/${quest.id}/video-progress`,
                body: { timestamp: secondsNeeded }
            });
        } catch (e) {
            logger.error("Failed to complete video quest:", e);
        }
    }

    logger.info(`Quest "${quest.config.messages.questName}" completed!`);
}

async function completePlayOnDesktopQuest(quest: Quest, signal: AbortSignal): Promise<void> {
    const isApp = typeof DiscordNative !== "undefined";
    if (!isApp) {
        logger.warn(`Quest "${quest.config.messages.questName}" requires the desktop app`);
        return;
    }

    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    if (!taskConfig?.tasks.PLAY_ON_DESKTOP) return;

    const applicationId = quest.config.application.id;
    const secondsNeeded = taskConfig.tasks.PLAY_ON_DESKTOP.target;
    const secondsDone = quest.userStatus?.progress?.PLAY_ON_DESKTOP?.value ?? 0;

    logger.info(`Completing play quest "${quest.config.messages.questName}" (${Math.floor(secondsDone)}/${secondsNeeded}s)`);

    try {
        const res = await RestAPI.get({
            url: `/applications/public?application_ids=${applicationId}`
        });
        const appData = (res.body as any[])[0];
        const exeName = appData.executables.find((x: any) => x.os === "win32")?.name.replace(">", "") ?? "game.exe";

        const pid = Math.floor(Math.random() * 30000) + 1000;
        const fakeGame = {
            cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
            exeName,
            exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
            hidden: false,
            isLauncher: false,
            id: applicationId,
            name: appData.name,
            pid,
            pidPath: [pid],
            processName: appData.name,
            start: Date.now(),
        };

        const realGames = RunningGameStore.getRunningGames();
        const fakeGames = [fakeGame];
        const realGetRunningGames = RunningGameStore.getRunningGames;
        const realGetGameForPID = RunningGameStore.getGameForPID;

        RunningGameStore.getRunningGames = () => fakeGames;
        RunningGameStore.getGameForPID = (pid: number) => fakeGames.find(x => x.pid === pid);
        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames });

        await new Promise<void>(resolve => {
            const fn = (data: any) => {
                if (signal.aborted) {
                    cleanup();
                    resolve();
                    return;
                }

                const progress = quest.config.configVersion === 1
                    ? data.userStatus.streamProgressSeconds
                    : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                logger.info(`Quest progress: ${progress}/${secondsNeeded}`);

                if (progress >= secondsNeeded) {
                    logger.info(`Quest "${quest.config.messages.questName}" completed!`);
                    cleanup();
                    resolve();
                }
            };

            const cleanup = () => {
                RunningGameStore.getRunningGames = realGetRunningGames;
                RunningGameStore.getGameForPID = realGetGameForPID;
                FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
            };

            signal.addEventListener("abort", () => {
                cleanup();
                resolve();
            });

            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
        });
    } catch (e) {
        logger.error("Failed to complete play quest:", e);
    }
}

async function completeStreamOnDesktopQuest(quest: Quest, signal: AbortSignal): Promise<void> {
    const isApp = typeof DiscordNative !== "undefined";
    if (!isApp) {
        logger.warn(`Quest "${quest.config.messages.questName}" requires the desktop app`);
        return;
    }

    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    if (!taskConfig?.tasks.STREAM_ON_DESKTOP) return;

    const applicationId = quest.config.application.id;
    const secondsNeeded = taskConfig.tasks.STREAM_ON_DESKTOP.target;
    const secondsDone = quest.userStatus?.progress?.STREAM_ON_DESKTOP?.value ?? 0;
    const pid = Math.floor(Math.random() * 30000) + 1000;

    logger.info(`Completing stream quest "${quest.config.messages.questName}" (${Math.floor(secondsDone)}/${secondsNeeded}s)`);
    logger.info("Stream any window in a VC with at least 1 other person to complete this quest.");

    const realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
        id: applicationId,
        pid,
        sourceName: null
    });

    await new Promise<void>(resolve => {
        const fn = (data: any) => {
            if (signal.aborted) {
                cleanup();
                resolve();
                return;
            }

            const progress = quest.config.configVersion === 1
                ? data.userStatus.streamProgressSeconds
                : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
            logger.info(`Quest progress: ${progress}/${secondsNeeded}`);

            if (progress >= secondsNeeded) {
                logger.info(`Quest "${quest.config.messages.questName}" completed!`);
                cleanup();
                resolve();
            }
        };

        const cleanup = () => {
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
        };

        signal.addEventListener("abort", () => {
            cleanup();
            resolve();
        });

        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
    });
}

async function completePlayActivityQuest(quest: Quest, signal: AbortSignal): Promise<void> {
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    if (!taskConfig?.tasks.PLAY_ACTIVITY) return;

    const secondsNeeded = taskConfig.tasks.PLAY_ACTIVITY.target;

    let channelId: string | undefined;

    try {
        const privateChannels = PrivateChannelSortStore?.getSortedPrivateChannels?.();
        channelId = privateChannels?.[0]?.id;
    } catch { }

    if (!channelId) {
        try {
            const guilds = GuildChannelStore?.getAllGuilds?.();
            if (guilds) {
                const guildWithVocal = Object.values(guilds).find(x => x != null && x.VOCAL?.length > 0);
                channelId = guildWithVocal?.VOCAL[0]?.channel?.id;
            }
        } catch { }
    }

    if (!channelId) {
        logger.error("Could not find a channel for PLAY_ACTIVITY quest");
        return;
    }

    const streamKey = `call:${channelId}:1`;

    logger.info(`Completing activity quest "${quest.config.messages.questName}"`);

    while (!signal.aborted) {
        try {
            const res = await RestAPI.post({
                url: `/quests/${quest.id}/heartbeat`,
                body: { stream_key: streamKey, terminal: false }
            });
            const progress = (res.body as any).progress.PLAY_ACTIVITY.value;
            logger.info(`Quest progress: ${progress}/${secondsNeeded}`);

            if (progress >= secondsNeeded) {
                await RestAPI.post({
                    url: `/quests/${quest.id}/heartbeat`,
                    body: { stream_key: streamKey, terminal: true }
                });
                break;
            }
        } catch (e) {
            logger.error("Failed to send heartbeat:", e);
        }

        await new Promise(resolve => setTimeout(resolve, 20 * 1000));
    }

    logger.info(`Quest "${quest.config.messages.questName}" completed!`);
}

async function completeQuest(quest: Quest, signal: AbortSignal): Promise<void> {
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    if (!taskConfig) {
        logger.warn(`Quest "${quest.config.messages.questName}" has no task config`);
        return;
    }

    const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
        .find(x => taskConfig.tasks[x] != null);

    if (!taskName) {
        logger.warn(`Quest "${quest.config.messages.questName}" has unknown task type`);
        return;
    }

    switch (taskName) {
        case "WATCH_VIDEO":
        case "WATCH_VIDEO_ON_MOBILE":
            await completeVideoQuest(quest, signal);
            break;
        case "PLAY_ON_DESKTOP":
            await completePlayOnDesktopQuest(quest, signal);
            break;
        case "STREAM_ON_DESKTOP":
            await completeStreamOnDesktopQuest(quest, signal);
            break;
        case "PLAY_ACTIVITY":
            await completePlayActivityQuest(quest, signal);
            break;
    }
}

async function processQuests(): Promise<void> {
    if (isRunning) return;
    isRunning = true;

    completionAbortController = new AbortController();
    const { signal } = completionAbortController;

    let completedCount = 0;

    try {
        const uncompletedQuests = getUncompletedQuests();

        if (uncompletedQuests.length === 0) {
            logger.info("No uncompleted quests found");
        } else {
            logger.info(`Found ${uncompletedQuests.length} uncompleted quest(s)`);

            for (const quest of uncompletedQuests) {
                if (signal.aborted) break;

                if (!quest.userStatus?.enrolledAt) {
                    const enrolled = await enrollInQuest(quest.id);
                    if (!enrolled) continue;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                await completeQuest(quest, signal);
                completedCount++;
            }
        }

        if (completedCount > 0 && !signal.aborted) {
            showNotice(
                `AutoQuests: Completed ${completedCount} quest(s)! Remember to redeem your rewards manually (captcha required).`,
                "Dismiss",
                popNotice
            );
        }
    } catch (e) {
        logger.error("Error processing quests:", e);
    } finally {
        isRunning = false;
    }
}

export default definePlugin({
    name: "AutoQuests",
    description: "Enrolls in available quests and completes them automatically on startup",
    authors: [Devs.TechFun],

    start() {
        setTimeout(() => {
            processQuests();
        }, 5000);
    },

    stop() {
        if (completionAbortController) {
            completionAbortController.abort();
            completionAbortController = null;
        }
        isRunning = false;
    }
});
