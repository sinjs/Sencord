/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    maxAccounts: {
        description: "Number of accounts that can be added, or 0 for no limit",
        default: 0,
        type: OptionType.NUMBER,
        restartNeeded: true,
    },
});

export default definePlugin({
    name: "UnlimitedAccounts",
    description: "Increases the amount of accounts you can add.",
    authors: [Devs.sin],
    settings,
    patches: [
        {
            find: "multiaccount_cta_tooltip_seen",
            replacement: {
                match: /(let \i=)\d+(,\i="switch-accounts-modal",\i="multiaccount_cta_tooltip_seen")/,
                replace: "$1$self.getMaxAccounts()$2",
            },
        },
    ],
    getMaxAccounts() {
        return settings.store.maxAccounts === 0 ? Infinity : settings.store.maxAccounts;
    },
});
