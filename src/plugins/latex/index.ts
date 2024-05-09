/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { findByProps } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

const MATHJAX_SCRIPT_CLASS = "MathJaxDiscord";
const MATHJAX_CONFIG = `MathJax = {
    tex: {
      inlineMath: [['mthjxinline', 'mthjxinlineend']],
      displayMath: [['mthjxblock', 'mthjxblockend']]
    }
  };`;

const logger = new Logger("Latex");

interface Classes {
    CLASS_SCROLLER_INNER: string;
    CLASS_MESSAGE_LIST_ITEM: string;
    CLASS_MESSAGE_CONTENT: string;
}

declare namespace MathJax {
    function typeset(): void;
}

export default definePlugin({
    name: "Latex",
    description: "This plugin adds latex to discord",
    authors: [
        Devs.sin
    ],
    patches: [],

    async loadMathJax() {
        logger.info("Loading MathJax");
        window.MathJax = {
            tex: {
                inlineMath: [["mthjxinline", "mthjxinlineend"]],
                displayMath: [["mthjxblock", "mthjxblockend"]]
            }
        };
        await import("./mathjax.js");
        /*
        const scriptElements = document.getElementsByClassName(MATHJAX_SCRIPT_CLASS);
        logger.info(scriptElements, !scriptElements, scriptElements.length);

        if (!scriptElements || scriptElements.length === 0) {
            const mathJaxConfig = document.createElement("script");
            mathJaxConfig.innerHTML = MATHJAX_CONFIG;
            mathJaxConfig.defer = true;
            mathJaxConfig.classList.add(MATHJAX_SCRIPT_CLASS);
            document.head.appendChild(mathJaxConfig);

            const mathJaxScript = document.createElement("script");
            mathJaxScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
            mathJaxScript.defer = true;
            mathJaxScript.classList.add(MATHJAX_SCRIPT_CLASS);
            document.head.appendChild(mathJaxScript);
        }
        */
    },

    unloadMathJax() {
        const scriptElements = document.getElementsByClassName(MATHJAX_SCRIPT_CLASS);
        if (scriptElements)
            for (const element of scriptElements) document.head.removeChild(element);
    },

    observer: null as MutationObserver | null,
    classes: null as Classes | null,

    getClasses() {
        return {
            CLASS_SCROLLER_INNER: findByProps("navigationDescription", "scrollerInner").scrollerInner,
            CLASS_MESSAGE_CONTENT: findByProps("messageEditorCompact", "messageContent").messageContent,
            CLASS_MESSAGE_LIST_ITEM: findByProps("messageListItem").messageListItem
        };
    },

    setClasses() {
        this.classes = this.getClasses();
    },

    async start() {
        this.setClasses();
        logger.info(this.classes);

        FluxDispatcher.subscribe("CHANNEL_SELECT", () => setTimeout(() => this.onSwitch(), 300));

        await this.loadMathJax();
        await this.onSwitch();
    },

    stop() {
        this.observer?.disconnect();
        this.unloadMathJax();
    },

    async onSwitch() {
        logger.info("On switch");
        this.observer?.disconnect();
        this.observer = new MutationObserver(mutations => this.handleMutations(mutations));

        if (!this.classes) this.setClasses();

        // Format all existing messages and new ones
        const channels = await this.waitForElement("." + this.classes!.CLASS_SCROLLER_INNER);

        logger.info(channels);

        // If there are channels
        if (channels) {
            // Existing messages
            channels.querySelectorAll("." + this.classes!.CLASS_MESSAGE_CONTENT).forEach(this.parseMessage);
            try {
                MathJax.typeset();
            } catch (error) {
                logger.warn(error);
                if (!(error instanceof TypeError)) throw error;
            }

            // Observe for mutations in the DOM
            this.observer.observe(channels, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }
    },

    handleMutations(mutationsList: MutationRecord[]) {
        if (!this.classes) this.setClasses();

        logger.log("Mutation", mutationsList);
        let timeoutId: null | NodeJS.Timeout | number = null; // Prevents formatting before edition

        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                for (const node of mutation.addedNodes as NodeListOf<Element>) {
                    if (node.classList && node.classList.contains(this.classes!.CLASS_MESSAGE_CONTENT)) {
                        timeoutId = setTimeout(() => {
                            // unedited message
                            this.formatMessage(node);
                            timeoutId = null;
                        }, 500);
                    } else if (node.classList && node.classList.contains(this.classes!.CLASS_MESSAGE_LIST_ITEM)) {
                        // new message
                        this.formatMessage(node.querySelector("." + this.classes!.CLASS_MESSAGE_CONTENT)!);
                    }
                }
            } else if (mutation.type === "characterData") {
                const parentNode = mutation.target.parentNode as Element;
                const messageContent = parentNode.closest("." + this.classes!.CLASS_MESSAGE_CONTENT);
                if (messageContent) {
                    // edited message
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    this.formatMessage(messageContent);
                }
            }
        }
    },

    waitForElement(selector: string): Promise<Element> {
        return new Promise(resolve => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector)!);

            const observer = new MutationObserver(_mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect(); resolve(document.querySelector(selector)!);
                }
            });

            observer.observe(document.documentElement, {
                childList: true, subtree: true
            });
        });
    },

    waitForElementAll(selector: string): Promise<NodeListOf<Element>> {
        return new Promise(resolve => {
            if (document.querySelectorAll(selector).length) return resolve(document.querySelectorAll(selector));

            const observer = new MutationObserver(_mutations => {
                if (document.querySelectorAll(selector).length) {
                    observer.disconnect(); resolve(document.querySelectorAll(selector));
                }
            });

            observer.observe(document.documentElement, {
                childList: true, subtree: true
            });
        });
    },


    formatMessage(messageContent: Element) {
        if (this.parseMessage(messageContent)) MathJax.typeset();
    },


    parseMessage(messageContent: Element): boolean {
        let containsTex = false;

        console.log(messageContent);

        // strips code blocks and change brackets
        messageContent.querySelectorAll("code.inline").forEach(codeElement => {
            const codeText = codeElement.innerHTML;

            if (codeText.startsWith("$$") && codeText.endsWith("$$")) {
                codeElement.outerHTML = "<span>mthjxblock" + codeText.slice(2, -2) + "mthjxblockend</span>";
                containsTex = true;
            } else if (codeText.startsWith("$") && codeText.endsWith("$")) {
                codeElement.outerHTML = "<span>mthjxinline" + codeText.slice(1, -1) + "mthjxinlineend</span>";
                containsTex = true;
            }
        });


        return containsTex;
    }
});
