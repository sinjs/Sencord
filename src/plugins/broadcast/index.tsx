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

import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { showToast, Toasts, FluxDispatcher, ChannelStore, Channel } from "@webpack/common";
import { authorize, getAuth } from "./auth";
import { getSocketIO } from "@utils/dependencies";

export const settings = definePluginSettings({
    broadcastChannels: {
        type: OptionType.STRING,
        description: "JSON in the format {channelId: [...allowedUsers]} to broadcast",
        default: "",
        hidden: false
    },
    listenChannels: {
        type: OptionType.STRING,
        description: "Comma-separated values of channel IDs to listen to",
        default: "",
        hidden: false
    }
});

const allowedEvents = ["MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE", "CHANNEL_CREATE"];
let socket;
let broadcastChannels: Object = {};
let listenChannels: Object = {};

const handleConnection = (message) => {
    Object.entries(broadcastChannels).forEach(([channelId, allowedUsers]) => {
        socket.emit("create_virtual_channel", {
            channel: ChannelStore.getChannel(channelId),
            allowedUsers: allowedUsers
        });
    });

    Object.entries(listenChannels).forEach(([channelId, trustedUsers]) => {
        socket.emit("listen_to_channel", {
            channelId: channelId,
            trusted: trustedUsers
        });
    });
};

const handleIncoming = (payload) => {
    if (!(payload.channelId in listenChannels)) return;
    
    if (!allowedEvents.includes(payload.event.type)) return;

    if (payload.event.type === "CHANNEL_CREATE") {
        return FluxDispatcher.dispatch(new Channel(payload.event))
    }

    FluxDispatcher.dispatch(payload.event);
}

const onEvent = (payload) => {
    const channelId = payload.channelId ?? payload.message?.channel_id
    if (!(channelId in broadcastChannels)) return;

    socket.emit("broadcast_event", {
        channelId: channelId,
        event: payload
    });
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
                match: /\"loadMore\", function\(\) \{/,
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

        const auth = await getAuth();
        if (!auth?.token || (auth?.expires && (auth.expires < Date.now() / 1000))) {
            return console.error("No auth token found or token expired.");
        }

        socket = socketio.io("https://broadcast.techfun.me/", {
            auth: { token: auth.token },
            autoConnect: false,
        });

        FluxDispatcher.subscribe("MESSAGE_CREATE", onEvent);
        FluxDispatcher.subscribe("MESSAGE_UPDATE", onEvent);
        FluxDispatcher.subscribe("MESSAGE_DELETE", onEvent);
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", onEvent);
        FluxDispatcher.subscribe("MESSAGE_REACTION_REMOVE", onEvent);

        socket.on("connect", handleConnection);
        socket.on("broadcast_event", handleIncoming);

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

        socket.disconnect();
    }
});
