/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    image: {
        description: "The URL to the image to use for the cat",
        type: OptionType.STRING,
        default: "https://git.nigga.church/sencord/oneko/raw/branch/main/oneko.gif",
        onChange: () => reloadPlugin()
    }
});

const plugin = definePlugin({
    name: "oneko",
    description: "cat follow mouse (real)",
    // Listing adryd here because this literally just evals her script
    authors: [Devs.sin, Devs.Ven, Devs.adryd],
    settings,

    start() {
        fetch("https://git.nigga.church/sencord/oneko/raw/branch/main/oneko.js")
            .then(r => r.text())
            .then(s => s.replace("$$nekofile$$", settings.store.image))
            .then(eval);
    },

    stop() {
        document.getElementById("oneko")?.remove();
    }
});

function reloadPlugin() {
    plugin.stop();
    plugin.start();
}

export default plugin;
