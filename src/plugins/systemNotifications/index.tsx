/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

export default definePlugin({
    name: "System Notifications",
    description: "Ensure you are always up to date with the latest system notifications from Discord.",
    authors: [Devs.Airbus],
    required: true,

    start() {
       FluxDispatcher.subscribe("USER_UPDATE", ({ user }) => {
            if (user.id === UserStore.getCurrentUser().id) {
                this.notify();
            }
       });
    },

    stop() {
        FluxDispatcher.unsubscribe("USER_UPDATE", () => {});
    },

    notify() {
        const audio = new Audio("https://github.com/Airbus-A330/Airbus-A330/raw/master/Private/system_message.mp3?raw=true");
        audio.play();
    }
});