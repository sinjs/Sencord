/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin, { PluginNative } from "@utils/types";


const Native = VencordNative.pluginHelpers.NativeModuleTest as PluginNative<typeof import("./native")>;

export default definePlugin({
    name: "NativeModuleTest",
    description: "Native C/C++/Rust Module Test",
    authors: [Devs.sin],

    async start() {
        console.log(await Native.executeNativeCode());
    }
});
