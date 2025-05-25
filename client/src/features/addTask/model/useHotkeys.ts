import { RefObject, useEffect } from "react"

type HotKeyParams = {
    ref: RefObject<HTMLElement>;
    key: string;
    callback: (e: KeyboardEvent) => void;
};

export const useHotkey = ({ ref, key, callback }: HotKeyParams) => {
    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === key) {
                e.preventDefault();
                callback(e);
            }
        };

        element.addEventListener("keydown", handler);
        return () => element.removeEventListener("keydown", handler);
    }, [key, callback, ref]);
};
