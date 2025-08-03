/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Channel, Message } from "@vencord/discord-types";
import { MessageActions, MessageStore, UserStore } from "@webpack/common";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

/**
 * Deletes an amount of messages in a specified channel with a delay
 * @returns The amount of messages actually deleted
 */
async function deleteMessages(amount: number, channel: Channel, delay: number = 1500): Promise<number> {
    let deleted = 0;
    const userId = UserStore.getCurrentUser().id;

    // Have to reserialize to remove object methods and make it at least semi-compliant with the `Message` type
    const messages: Message[] = JSON.parse(JSON.stringify(MessageStore.getMessages(channel.id)._array.filter((m: Message) => m.author.id === userId).reverse()));

    for (const message of messages) {
        MessageActions.deleteMessage(channel.id, message.id);
        amount--;
        deleted++;
        if (amount === 0) break;
        await sleep(delay);
    }

    return deleted;
}

export default definePlugin({
    name: "MassDelete",
    authors: [Devs.sin],
    description: "Mass deletes / Purges an amount of messages from a channel.",

    commands: [{
        name: "purge",
        description: "Purges an amount of messages from a channel",
        options: [
            {
                name: "amount",
                description: "How many messages you want to purge",
                type: ApplicationCommandOptionType.INTEGER,
                required: true
            },
            {
                name: "channel",
                description: "Channel ID you want to purge from",
                type: ApplicationCommandOptionType.CHANNEL,
                required: false
            },
            {
                name: "delay",
                description: "Delay inbetween deleting messages",
                type: ApplicationCommandOptionType.INTEGER,
                required: false
            }
        ],
        inputType: ApplicationCommandInputType.BUILT_IN,
        async execute(args, ctx) {
            const amount: number = findOption(args, "amount", 0);
            const channel: Channel = findOption(args, "channel", ctx.channel);
            const delay: number = findOption(args, "delay", 1500);

            sendBotMessage(ctx.channel.id, { content: `> Deleting ${amount} messages in <#${channel.id}>` });

            const deleted = await deleteMessages(amount, channel, delay);

            sendBotMessage(ctx.channel.id, { content: `> Deleted ${deleted} messages` });
        },
    }]
});
