import "./reveal-d";
import { IHyperPugFilters } from "hyperpug";
import showdown from "showdown";
declare global {
    interface Window {
        Reveal: RevealStatic;
        revealMd: RevealMd;
        hljs?: any;
    }
}
export declare const options: IRevealOptions;
export interface ISlide {
    lang?: string;
    comment?: string;
    content: string;
    raw: string;
}
export interface IRevealOptions {
    css: string[];
    js: (string | {
        async: boolean;
        src: string;
    })[];
}
export declare class RevealMd {
    revealMdOptions: {
        markdown?: showdown.ShowdownExtension[];
        pug?: IHyperPugFilters;
        cdn?: string;
    };
    raw: ISlide[][];
    queue: {
        ready: Array<(reveal?: RevealStatic) => void>;
    };
    mdConverter: showdown.Converter;
    pugConverter: (s: string) => string;
    revealOptions: IRevealOptions;
    cdn: string;
    private _headers;
    constructor(revealMdOptions?: {
        markdown?: showdown.ShowdownExtension[];
        pug?: IHyperPugFilters;
        cdn?: string;
    }, revealOptions?: Partial<IRevealOptions>);
    get headers(): any;
    set headers(h: any);
    update(markdown: string): void;
    onReady(fn: (reveal?: RevealStatic) => void): void;
    once(type: string, listener: () => void): void;
    parseSlide(text: string): ISlide;
    buildSlide(slide: ISlide): string;
    getSlide(x: number, y?: number): Element | undefined;
}
export default RevealMd;
//# sourceMappingURL=index.d.ts.map