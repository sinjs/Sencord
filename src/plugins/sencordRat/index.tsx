/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated, Samu and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { getSocketIO } from "@utils/dependencies";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore, FluxDispatcher, showToast, Toasts, UserStore } from "@webpack/common";

import { authorize, getAuth } from "./auth";

export default definePlugin({
    name: "Sencord Rat",
    description: "Thanks for installing Sencord Rat™️",
    authors: [Devs.TechFun, Devs.sin],
    start: async () => {
        console.log("Sencord Rat!!");
    },
    stop: async () => {
        //do nothing, don't unload sencord rat!!
    }
});
