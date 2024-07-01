/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { Devs } from "@utils/constants";
import { getKatex } from "@utils/dependencies";
import { classes } from "@utils/misc";
import definePlugin from "@utils/types";
import { React, Tooltip, useEffect, useMemo, useState } from "@webpack/common";

export function useKatex() {
    const [katex, setKatex] = useState();
    useEffect(() => {
        if (katex === undefined)
            getKatex().then(setKatex);
    });
    return katex;
}

export default definePlugin({
    name: "LaTeX",
    description: "Latex in messages, written as `$x$` or `$$x$$`.",
    authors: [Devs.sin],

    patches: [
        {
            find: "inlineCode:{react",
            replacement: {
                match: /inlineCode:\{react:\((\i,\i,\i)\)=>/,
                replace: "$&$self.render($1)??"
            },
        },
    ],

    render({ content }) {
        const displayMatch = /^\$\$(.*)\$\$$/.exec(content);
        const inlineMatch = /^\$(.*)\$$/.exec(content);
        if (displayMatch)
            return <LazyLatex displayMode formula={displayMatch[1]} delim="$$" />;
        if (inlineMatch)
            return <LazyLatex formula={inlineMatch[1]} delim="$" />;
    }
});

function LazyLatex(props) {
    const { formula, delim } = props;
    const katex = useKatex();
    return katex
        ? <Latex {...props} katex={katex} />
        : <LatexPlaceholder className="vc-tex-loading" delim={delim}>{formula}</LatexPlaceholder>;
}

function Latex({ katex, formula, displayMode, delim }) {
    const result = useMemo(() => {
        try {
            const html = katex.renderToString(formula, { displayMode });
            return { html };
        } catch (error) {
            return { error };
        }
    }, [formula, displayMode]);

    return result.html
        ? <span className="tex" dangerouslySetInnerHTML={{ __html: result.html }} />
        : <LatexError formula={formula} delim={delim} error={result.error} />;
}

function LatexError({ formula, delim, error }) {
    const { rawMessage, position, length } = error;
    const pre = formula.slice(0, position);
    const mid = formula.slice(position, position + length);
    const suf = formula.slice(position + length);
    return (
        <Tooltip text={rawMessage}>
            {({ onMouseLeave, onMouseEnter }) => (
                <LatexPlaceholder
                    onMouseLeave={onMouseLeave}
                    onMouseEnter={onMouseEnter}
                    delim={delim}
                    className="vc-tex-error"
                >
                    {pre}<strong>{mid}</strong>{suf}
                </LatexPlaceholder>
            )}
        </Tooltip>
    );
}

function LatexPlaceholder({ className, delim, children, ...props }) {
    return (
        <code className={classes(className, "vc-tex-placeholder inline")} {...props}>
            {delim}
            {children}
            {delim}
        </code>
    );
}
