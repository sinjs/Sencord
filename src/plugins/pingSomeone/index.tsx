/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addMessagePreSendListener, removeMessagePreSendListener } from "@api/MessageEvents";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore, GuildMemberStore, SelectedChannelStore, SelectedGuildStore } from "@webpack/common";

function randomUser() {
    const guildId = SelectedGuildStore.getGuildId();
    if (!guildId) {
        const users = ChannelStore.getChannel(SelectedChannelStore.getChannelId()).recipients;
        return users[Math.floor(Math.random() * users.length)];
    }
    const members = GuildMemberStore.getMembers(guildId);
    return members[Math.floor(Math.random() * members.length)].userId;
}

export default definePlugin({
    name: "PingSomeone",
    authors: [Devs.sin],
    description: "Mention a random user using @someone",
    patches: [
        {
            find: ".LAUNCHABLE_APPLICATIONS;",
            replacement: [
                {
                    match: /&(\i)\(\)\((\i),\i\(\)\.test\)&&(\i)\.push\(\i\(\)\)/g,
                    replace: "$&,$1()($2,/someone/.test)&&$3.push({text:'@someone',description:'Mention someone randomly'})"
                },
            ],
        },
        {
            find: "inQuote:",
            replacement: {
                match: /\|Clyde/,
                replace: "$&|someone"
            }
        }
    ],
    start() {
        this.preSend = addMessagePreSendListener((_, msg) => {
            msg.content = msg.content.replace(/@someone/g, () => `<@${randomUser()}>`);
        });
    },

    stop() {
        removeMessagePreSendListener(this.preSend);
    }
});

