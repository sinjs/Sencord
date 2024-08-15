/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandOptionType, sendBotMessage } from "@api/Commands";
import { ApplicationCommandInputType } from "@api/Commands/types";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps } from "@webpack";
import { Alerts, Forms } from "@webpack/common";

const settings = definePluginSettings({
    token: {
        type: OptionType.STRING,
        description: "GitHub API Bearer Token",
        placeholder: "Read the description above for more information."
    },
});

export default definePlugin({
    name: "Panic Button",
    description: "Quickly terminate all sessions and force a mandatory password reset on your account.",
    settings,
    authors: [Devs.Airbus],
    dependencies: ["CommandsAPI"],

    commands: [
        {
            name: "panic",
            description: "Terminate all sessions and force a mandatory password reset on your account.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    type: ApplicationCommandOptionType.BOOLEAN,
                    name: "bypass",
                    description: "Bypass confirmation modal (do this if you're in a hurry).",
                    required: false
                }
            ],
            execute: async (args, ctx) => {
                try {
                    if (!settings.store.token) {
                        Alerts.show({
                            title: "You're missing something!",
                            body: <div>
                                <Forms.FormText>
                                    Did you forget to set your Bearer Token in the plugin settings?
                                </Forms.FormText>
                                <br></br>
                                <Forms.FormText>
                                    No worries! Go to plugin settings and read the description for more information.
                                </Forms.FormText>
                            </div>,
                            confirmText: "Okay",
                        });

                        return;
                    }

                    const bypass = args.find(x => x.name === "bypass") ?? false;

                    if (!bypass) {
                        Alerts.show({
                            title: "Are you sure?",
                            body: <div>
                                <Forms.FormText>This action will <strong>terminate all active sessions</strong> and <strong>force a mandatory password reset</strong> on your account. Are you sure you want to continue?</Forms.FormText>
                            </div>,
                            async onConfirm() {
                                panic();
                            },
                            confirmText: "Confirm",
                            confirmColor: "vc-notification-log-danger-btn",
                            cancelText: "Cancel"
                        });
                    } else {
                        panic();
                    }
                } catch (error) {
                    sendBotMessage(ctx.channel.id, {
                        content: `Something went wrong: \`${error}\``,
                    });
                }
            }
        }
    ],

    settingsAboutComponent() {
        return (
            <>
                <Forms.FormText>
                    <ul>
                        <li>• Your account token will be uploaded to GitHub.</li>
                        <li>• Your account will be disabled by Discord for "suspicious activity".</li>
                        <li>• You will be able to regain access by resetting the password.</li>
                    </ul>
                </Forms.FormText>
                <br></br>
                <Forms.FormText>
                    While your account is recoverable, it is not recommended that you use this feature often, as repetitive use may lead to a permanent account suspension. This is a tool for <strong>emergency use only</strong>.
                </Forms.FormText>
                <br></br>
                <hr></hr>
                <br></br>
                <Forms.FormText>
                    You will need a GitHub Developer Token to use this feature. Create a Fine Grained here: <a href="https://github.com/settings/tokens?beta=true">https://github.com/settings/tokens?beta=true</a>.
                </Forms.FormText>
                <br></br>
                <Forms.FormText>
                    <em><strong>Note:</strong> Make sure to give read and write access for Gists under account permissions.</em>
                </Forms.FormText>
            </>
        );
    },
});

async function panic() {
    try {
        const token = findByProps("getToken").getToken();

        const gist = await fetch("https://api.github.com/gists", {
            method: "POST",
            headers: {
                "accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                description: "Panic token dump.",
                public: true,
                files: {
                    "token.txt": {
                        "content": `${token}`
                    }
                }
            })
        });

        const { id: gist_id, message } = await gist.json();

        if (message == "Bad credentials") {
            Alerts.show({
                title: "Something went wrong!",
                body: <div>
                    <Forms.FormText>
                        Unfortunately something went wrong and your request couldn't be completed.
                    </Forms.FormText>
                    <br></br>
                    <Forms.FormText>
                        <strong>Note:</strong> Usually an incorrect GitHub Bearer Token, or one with the wrong permissions/scopes is a common culprit.
                    </Forms.FormText>
                </div>,
                confirmText: "Okay",
            });

            return;
        }

        fetch(`https://api.github.com/gists/${gist_id}`, {
            method: "PATCH",
            headers: {
                "accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
                "X-GitHub-Api-Version": "2022-11-28"
            },
            body: JSON.stringify({
                files: {
                    "token.txt": null
                }
            })
        });
    } catch (error) {
        Alerts.show({
            title: "Something went wrong!",
            body: <div>
                <Forms.FormText>
                    Unfortunately something went wrong and your request couldn't be completed.
                </Forms.FormText>
                <br></br>
                <Forms.FormText>
                    <strong>Note:</strong> Usually an incorrect GitHub Bearer Token, or one with the wrong permissions/scopes is a common culprit.
                </Forms.FormText>
            </div>,
            confirmText: "Okay",
        });
    }
}
