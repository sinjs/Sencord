/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * @sencord Theme Library
 */

import { UserThemeHeader } from "@main/themes";

import amoledCord from "./amoledCord.css?managed";
import compactPlusPlus from "./compactPlusPlus.css?managed";
import hideAppButton from "./hideAppButton.css?managed";
import hideConfettiButton from "./hideConfettiButton.css?managed";
import hideGifButton from "./hideGifButton.css?managed";
import hideGiftButton from "./hideGiftButton.css?managed";
import hidePlayAgain from "./hidePlayAgain.css?managed";
import hideShop from "./hideShop.css?managed";
import hideStickerButton from "./hideStickerButton.css?managed";
import system24 from "./system24.css?managed";
import washingMachineGamingWithExtraSpin from "./washingmachine.theme.css?managed";


export const themes: UserThemeHeader[] = [
    {
        name: "Washing Machine Simulator",
        author: "cedric",
        description: "discord rotat e",
        fileName: washingMachineGamingWithExtraSpin
    },
    {
        name: "AmoledCord",
        author: "LuckFire",
        description: "A basically pitch black theme for Discord. Lights out, baby!",
        version: "4.1.10",
        source: "https://github.com/LuckFire/amoled-cord",
        invite: "vYdXbEzqDs",
        fileName: amoledCord
    },
    {
        name: "Compact++",
        author: "Grzesiek11",
        description: "Makes Discord's Compact mode more like IRC (and thus better)",
        version: "1.5.6",
        source: "https://gitlab.com/Grzesiek11/compactplusplus-discord-theme",
        fileName: compactPlusPlus,
    },
    {
        name: "System24",
        author: "refact0r",
        description: "A tui-style discord theme.",
        version: "1.0.0",
        source: "https://github.com/refact0r/system24/blob/master/system24.theme.css",
        website: "https://www.refact0r.dev",
        invite: "nz87hXyvcy",
        fileName: system24,
    },
    {
        name: "HidePlayAgain",
        author: "sin",
        description: "Hide the Play Again buttons above the direct messages",
        fileName: hidePlayAgain
    },
    {
        name: "HideGiftButton",
        author: "sin",
        description: "Hide the gift button in the chat bar",
        fileName: hideGiftButton
    },
    {
        name: "HideConfettiButton",
        author: "sin",
        description: "Hide the confetti button in the chat bar",
        fileName: hideConfettiButton
    },
    {
        name: "HideShop",
        author: "sin",
        description: "Hide the Shop and Nitro Store",
        fileName: hideShop
    },
    {
        name: "HideStickerButton",
        author: "sin",
        description: "Hide the sticker picker button in the chat bar",
        fileName: hideStickerButton
    },
    {
        name: "HideGifButton",
        author: "sin",
        description: "Hide the GIF picker button in the chat bar",
        fileName: hideGifButton
    },
    {
        name: "HideAppButton",
        author: "sin",
        description: "Hide the app launcher button in the chat bar",
        fileName: hideAppButton
    }
];
