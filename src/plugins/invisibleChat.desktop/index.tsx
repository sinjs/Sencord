/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 *
 * FIXME FIXME
 *
 * This entire file is a mess.
 *  - sin
 *
 */

import "./style.css";

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { updateMessage } from "@api/MessageUpdater";
import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { getStegCloak } from "@utils/dependencies";
import definePlugin, { OptionType, ReporterTestable } from "@utils/types";
import { Message } from "@vencord/discord-types";
import {
    ChannelStore,
    Constants,
    FluxDispatcher,
    RestAPI,
    Tooltip,
    UserStore,
} from "@webpack/common";

import { buildDecModal } from "./components/DecryptionModal";
import { buildEncModal } from "./components/EncryptionModal";

let steggo: any;

function PopOverIcon() {
    return (
        <svg
            fill="var(--header-secondary)"
            width={24}
            height={24}
            viewBox={"0 0 64 64"}
        >
            <path d="M 32 9 C 24.832 9 19 14.832 19 22 L 19 27.347656 C 16.670659 28.171862 15 30.388126 15 33 L 15 49 C 15 52.314 17.686 55 21 55 L 43 55 C 46.314 55 49 52.314 49 49 L 49 33 C 49 30.388126 47.329341 28.171862 45 27.347656 L 45 22 C 45 14.832 39.168 9 32 9 z M 32 13 C 36.963 13 41 17.038 41 22 L 41 27 L 23 27 L 23 22 C 23 17.038 27.037 13 32 13 z" />
        </svg>
    );
}

function Indicator() {
    return (
        <Tooltip text="This message has a hidden message! (EnhancedEncryption)">
            {({ onMouseEnter, onMouseLeave }) => (
                <img
                    aria-label="Hidden Message Indicator (EnhancedEncryption)"
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    src="https://github.com/SammCheese/invisible-chat/raw/NewReplugged/src/assets/lock.png"
                    width={20}
                    height={20}
                    style={{ transform: "translateY(4p)", paddingInline: 4 }}
                />
            )}
        </Tooltip>
    );
}


const ChatBarIcon: ChatBarButtonFactory = ({ isMainChat }) => {
    if (!isMainChat) return null;

    return (
        <ChatBarButton
            tooltip="Encrypt Message"
            onClick={() => buildEncModal()}
            buttonProps={{
                "aria-haspopup": "dialog",
            }}
        >
            <svg
                aria-hidden
                role="img"
                width="20"
                height="20"
                viewBox={"0 0 64 64"}
                style={{ scale: "1.39", translate: "0 -1px" }}
            >
                <path fill="currentColor" d="M 32 9 C 24.832 9 19 14.832 19 22 L 19 27.347656 C 16.670659 28.171862 15 30.388126 15 33 L 15 49 C 15 52.314 17.686 55 21 55 L 43 55 C 46.314 55 49 52.314 49 49 L 49 33 C 49 30.388126 47.329341 28.171862 45 27.347656 L 45 22 C 45 14.832 39.168 9 32 9 z M 32 13 C 36.963 13 41 17.038 41 22 L 41 27 L 23 27 L 23 22 C 23 17.038 27.037 13 32 13 z" />
            </svg>
        </ChatBarButton>
    );
};

export const settings = definePluginSettings({
    savedPasswords: {
        type: OptionType.STRING,
        default: "password",
        description: "Encryption key",
    },
    cover: {
        type: OptionType.STRING,
        default: "cat cat",
        description: "Cover",
    },
    autoEncrypt: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Automatically encrypt messages",
    },
    autoDecrypt: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Automatically decrypt messages",
    },
});


const INV_REGEX = new RegExp(/( \u200c|\u200d |[\u2060-\u2064])[^\u200b]/);
const URL_REGEX = new RegExp(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/
);

const popOverIcon = () => <PopOverIcon />;

async function buildEmbed(message: any, revealed: string): Promise<void> {
    const urlCheck = revealed.match(URL_REGEX);

    message.embeds[0] = {
        type: "rich",
        color: "0xffad01",
        rawDescription: revealed,
    };

    if (urlCheck?.length) {
        const embed = await (Vencord.Plugins.plugins.EnhancedEncryption as any).getEmbed(new URL(urlCheck[0]));
        if (embed) message.embeds.push(embed);
    }

    updateMessage(message.channel_id, message.id, { embeds: message.embeds });
}

export default definePlugin({

    name: "EnhancedEncryption",
    description:
        "Encrypt your Messages in a non-suspicious way!\nEnhanced by TechFun",
    authors: [Devs.SammCheese, Devs.TechFun],
    dependencies: ["MessagePopoverAPI", "ChatInputButtonAPI", "MessageUpdaterAPI"],
    reporterTestable: ReporterTestable.Patches,

    patches: [
        {
            // Indicator
            find: ".SEND_FAILED,",
            replacement: {
                match: /let\{className:\i,message:\i[^}]*\}=(\i)/,
                replace:
                    "try {if($1 && $self.INV_REGEX.test($1.message.content))$1.content.push($self.indicator())} catch {};$&",
            },
        },
        {
            find: "ChannelTextAreaButtons",
            replacement: {
                match: /(\i)\.push.{1,30}disabled:(\i),.{1,20}\},"gift"\)\)/,
                replace:
                    "$&,(()=>{try{$2||$1.push($self.chatBarIcon(arguments[0]))}catch{}})()",
            },
        },
    ],

    EMBED_API_URL: "https://embed.sammcheese.net",

    tryMasterPassword: tryMasterPassword,
    steggo: steggo,
    settings,
    async processMessage(msg) {
        const { message } = msg;
        if (
            message.author.id === UserStore.getCurrentUser().id &&
            msg?.sendMessageOptions
        )
            return;
        if (!INV_REGEX.test(message.content)) return;
        const res = await tryMasterPassword(message);
        if (res) return void buildEmbed(message, res);
    },

    // FIXME: start/stop maybe
    async start() {
        const { default: StegCloak } = await getStegCloak();
        steggo = new StegCloak(true, false);
        const outerThis = this;
        this.processMessageFunction = message =>
            outerThis.processMessage.apply(outerThis, [message]);
        FluxDispatcher.subscribe("MESSAGE_CREATE", this.processMessageFunction);
    },

    stop() {
        FluxDispatcher.unsubscribe(
            "MESSAGE_CREATE",
            this.processMessageFunction
        );
    },

    messagePopoverButton: {
        icon: PopOverIcon,
        render(message) {
            return INV_REGEX.test(message?.content)
                ? {
                    label: "Decrypt Message",
                    icon: popOverIcon,
                    message: message,
                    channel: ChannelStore.getChannel(message.channel_id),
                    onClick: async () => {
                        const res = await iteratePasswords(message);

                        if (res)
                            buildEmbed(message, res);
                        else
                            buildDecModal({ message });
                    }
                }
                : null;
        }
    },

    chatBarButton: {
        icon: () => (
            <svg
                aria-hidden
                role="img"
                width="20"
                height="20"
                viewBox={"0 0 64 64"}
                style={{ scale: "1.39", translate: "0 -1px" }}
            >
                <path fill="currentColor" d="M 32 9 C 24.832 9 19 14.832 19 22 L 19 27.347656 C 16.670659 28.171862 15 30.388126 15 33 L 15 49 C 15 52.314 17.686 55 21 55 L 43 55 C 46.314 55 49 52.314 49 49 L 49 33 C 49 30.388126 47.329341 28.171862 45 27.347656 L 45 22 C 45 14.832 39.168 9 32 9 z M 32 13 C 36.963 13 41 17.038 41 22 L 41 27 L 23 27 L 23 22 C 23 17.038 27.037 13 32 13 z" />
            </svg>
        ),
        render: ChatBarIcon
    },
    chatBarIcon: ChatBarIcon,

    colorCodeFromNumber(color: number): string {
        return `#${[color >> 16, color >> 8, color]
            .map(x => (x & 0xFF).toString(16))
            .join("")}`;
    },

    // Gets the Embed of a Link
    async getEmbed(url: URL): Promise<Object | {}> {
        const { body } = await RestAPI.post({
            url: Constants.Endpoints.UNFURL_EMBED_URLS,
            body: {
                urls: [url],
            },
        });
        // The endpoint returns the color as a number, but Discord expects a string
        body.embeds[0].color = this.colorCodeFromNumber(body.embeds[0].color);
        return await body.embeds[0];
    },



    // FIXME? go fix this whoever wrote this
    // chatBarIcon: () => <ChatBarIcon isMainChat={true} />,
    // FIXME 2: ??? - sin

    indicator: ErrorBoundary.wrap(Indicator, { noop: true }),
});


export function encrypt(
    secret: string,
    password: string,
    cover: string
): string {
    return steggo.hide(secret + "\u200b", password, cover);
}

export function decrypt(
    encrypted: string,
    password: string,
    removeIndicator: boolean
): string {
    const decrypted = steggo.reveal(encrypted, password);
    return removeIndicator ? decrypted.replace("\u200b", "") : decrypted;
}

export function isCorrectPassword(result: string): boolean {
    return result.endsWith("\u200b");
}

export async function tryMasterPassword(message) {
    const password = settings.store.savedPasswords;
    const { autoDecrypt } = settings.store;

    if (!autoDecrypt) return false;

    if (message.embeds.length || !message?.content || !password) return false;

    let { content } = message;

    // we use an extra variable so we dont have to edit the message content directly
    if (/^\W/.test(message.content)) content = `d ${message.content}d`;

    const result = decrypt(content, password, false);
    console.log(message.id);
    return result;
}

export async function iteratePasswords(
    message: Message
): Promise<string | false> {
    return false;
}
