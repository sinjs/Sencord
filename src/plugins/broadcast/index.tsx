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
import { showToast, Toasts, FluxDispatcher, ChannelStore, Channel } from "@webpack/common";

import { authorize, getAuth } from "./auth";
import { channel } from "diagnostics_channel";

export const settings = definePluginSettings({
    broadcastChannels: {
        type: OptionType.STRING,
        description: "JSON in the format {channelId: [...allowedUsers]} to broadcast",
        default: "",
        hidden: false
    },
    listenChannels: {
        type: OptionType.STRING,
        description: "JSON in the format {channelId: [...trustedBroadcasters]} to listen",
        default: "",
        hidden: false
    },
    proxyChannels: {
        type: OptionType.STRING,
        description: "proxy channel id",
        default: "",
        hidden: false
    }
});

const allowedEvents = ["MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"];
let socket;
let broadcastChannels: Object = {};
let listenChannels: Object = {};
let proxyChannels: Object = {};

const handleConnection = message => {
    Object.entries(broadcastChannels).forEach(([channelId, allowedUsers]) => {
        socket.emit("broadcast_channel", {
            channel: ChannelStore.getChannel(channelId),
            allowedUsers: allowedUsers
        });
    });

    Object.entries(listenChannels).forEach(([channelId, trustedUsers]) => {
        socket.emit("listen_channel", {
            channelId: channelId,
            trusted: trustedUsers
        });
    });
};

const handleIncoming = payload => {
    if (!(payload.channelId in listenChannels)) return;

    if (!allowedEvents.includes(payload.event.type)) return;

    payload.event.channelId = proxyChannels[payload.channelId];
    if (payload.event.message) payload.event.message.channel_id = proxyChannels[payload.channelId];
    FluxDispatcher.dispatch(payload.event);
};

const handleListen = payload => {
    if (!(payload.channelId in broadcastChannels)) return;

    if (!allowedEvents.includes(payload.event.type)) return;

    FluxDispatcher.dispatch(payload.event);
};

const onEvent = payload => {
    const userId = payload.userId ?? payload.message?.author?.id;
    const channelId = payload.channelId ?? payload.message?.channel_id;

    if ((broadcastChannels[channelId] || []).includes(userId)) return;

    if (channelId in broadcastChannels) {
        return socket.emit("broadcast_event", {
            channelId: channelId,
            event: payload
        });
    }

    if (Object.values(proxyChannels).includes(channelId)) {
        const newId = Object.keys(proxyChannels).find(k => proxyChannels[k] === channelId);
        payload.channelId = newId;
        if (payload.message) payload.message.channel_id = newId;
        socket.emit("listen_event", {
            channelId: newId,
            event: payload
        });
    }
};

export default definePlugin({
    name: "Broadcast",
    description: "Emit and listen to message and reaction events",
    authors: [Devs.TechFun, Devs.sin],
    toolboxActions: {
        async "Authenticate"() {

            const callback = () => {};
            const auth = await getAuth();

            if (!auth?.token || (auth?.expires && (auth.expires < Date.now() / 1000)))
                return authorize();

            showToast("You are already logged in!", Toasts.Type.SUCCESS);
        },
    },
    settings,
    patches: [
        {
            find: "v(this, \"handleMouseUp\", () => {",
            replacement: {
                match: /"loadMore", function\(\) \{/,
                replace: "\"loadMore\", function() {console.log('intercepted');"
            }
        },
    ],
    start: async () => {

        const { default: socketio } = await getSocketIO();

        try {
            broadcastChannels = JSON.parse(settings.store.broadcastChannels);
        } catch (e) {
            broadcastChannels = {};
        }

        try {
            listenChannels = JSON.parse(settings.store.listenChannels);
        } catch (e) {
            listenChannels = {};
        }

        try {
            proxyChannels = JSON.parse(settings.store.proxyChannels);
        } catch (e) {
            proxyChannels = {};
        }

        const auth = await getAuth();
        if (!auth?.token || (auth?.expires && (auth.expires < Date.now() / 1000))) {
            return console.error("No auth token found or token expired.");
        }

        socket = socketio.io("https://broadcast.techfun.me/", {
            auth: { token: auth.token },
            autoConnect: false,
        });

        FluxDispatcher.subscribe("MESSAGE_CREATE", (payload) => {console.log(payload)});
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", (payload) => {console.log(payload)});

        FluxDispatcher.subscribe("MESSAGE_CREATE", onEvent);
        FluxDispatcher.subscribe("MESSAGE_UPDATE", onEvent);
        FluxDispatcher.subscribe("MESSAGE_DELETE", onEvent);
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", onEvent);
        FluxDispatcher.subscribe("MESSAGE_REACTION_REMOVE", onEvent);

        socket.on("connect", handleConnection);
        socket.on("broadcast_event", handleIncoming);
        socket.on("listen_event", handleListen);

        socket.connect();
    },
    stop: async () => {
        socket.disconnect();

        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onEvent);
        FluxDispatcher.unsubscribe("MESSAGE_UPDATE", onEvent);
        FluxDispatcher.unsubscribe("MESSAGE_DELETE", onEvent);
        FluxDispatcher.unsubscribe("MESSAGE_REACTION_ADD", onEvent);
        FluxDispatcher.unsubscribe("MESSAGE_REACTION_REMOVE", onEvent);

        socket.off("broadcast_event", handleIncoming);
        socket.off("listen_event", handleListen);

        socket.disconnect();
    }
});
