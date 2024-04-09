/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addPreSendListener, removePreSendListener } from "@api/MessageEvents";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const possible = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

const change = async (_, message) => {
    if (!message.content) return;
    message.content = message.content
        .replace(/(\wigger)/gi, function (match) {
            return match.replace(/./g, function (char, index) {
                if (index == 0) {
                    if (match[0] === "n") {
                        return possible[Math.floor(Math.random() * possible.length)];
                    }
                    if (match[0] === "N") {
                        return possible[Math.floor(Math.random() * possible.length)].toUpperCase();
                    }
                    if (match[0] == match[0].toLowerCase()) {
                        return "n";
                    }
                    return "N"
                }

                return match[index];
            });
        })
        .replace(/(\wigga)/gi, function (match) {
            return match.replace(/./g, function (char, index) {
                if (index == 0) {
                    if (match[0] === "n") {
                        return possible[Math.floor(Math.random() * possible.length)];
                    }
                    if (match[0] === "N") {
                        return possible[Math.floor(Math.random() * possible.length)].toUpperCase();
                    }
                    if (match[0] == match[0].toLowerCase()) {
                        return "n";
                    }
                    return "N"
                }

                return match[index];
            });
        });
};

export default definePlugin({
    name: "NoMoreRacism",
    description: "Helps you no longer be a racist",
    authors: [Devs.TechFun],
    dependencies: ["MessageEventsAPI"],
    start: () => {
        addPreSendListener(change);
    },
    stop: () => {
        removePreSendListener(change);
    }
});
