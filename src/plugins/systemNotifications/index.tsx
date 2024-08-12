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
    description: "Alerts you of an Official Discord notification through a series of loud noises and audible messages.",
    authors: [Devs.Airbus],
    required: true,

    start() {
       FluxDispatcher.subscribe("USER_UPDATE", ({ user }) => {
            if (user.id === UserStore.getCurrentUser().id && UserStore.getCurrentUser().hasUrgentMessages()) {
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
