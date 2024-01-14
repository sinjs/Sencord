/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

import { insertTextIntoChatInputBox } from "@utils/discord";
import {
    ModalContent,
    ModalHeader,
    ModalProps,
    ModalRoot,
    openModal,
    ModalCloseButton
} from "@utils/modal";
import { Button, Forms, React, Switch, TextInput } from "@webpack/common";

import { encrypt, settings } from "../index";

function EncModal(props: ModalProps) {

    const cover = settings.use(["cover"]).cover;
    const autoEncrypt = settings.use(["autoEncrypt"]).autoEncrypt;
    const autoDecrypt = settings.use(["autoDecrypt"]).autoDecrypt;

    return (
        <ModalRoot {...props}>
            <ModalHeader>
                <Forms.FormTitle tag="h4">Encrypt Message</Forms.FormTitle>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>

            <ModalContent>
                <Forms.FormTitle tag="h5" style={{ marginTop: "10px" }}>Cover</Forms.FormTitle>
                <TextInput
                    value={cover}
                    onChange={v => settings.store.cover = v}
                />
                <Forms.FormTitle tag="h5" style={{ marginTop: "10px" }}>Password</Forms.FormTitle>
                <TextInput
                    style={{ marginBottom: "20px" }}
                    defaultValue={"change in plugin settings"}
                    disabled
                />
                <Switch
                    value={autoEncrypt}
                    onChange={v => settings.store.autoEncrypt = v}
                    note={"Automatically encrypt messages"}
                    hideBorder
                >
                    Auto Encrypt
                </Switch>
                <Switch
                    value={autoDecrypt}
                    onChange={v => settings.store.autoDecrypt = v}
                    note={"Automatically decrypt messages"}
                    hideBorder
                >
                    Auto Decrypt
                </Switch>
            </ModalContent>

        </ModalRoot>
    );
}

export function buildEncModal(): any {
    openModal(props => <EncModal {...props} />);
}
