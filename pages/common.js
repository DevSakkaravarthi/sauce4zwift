/* global sauce */

(function () {
    'use strict';

    self.sauce = (self.sauce || {});
    const L = (sauce.locale = {});


    L.thinSpace = '\u202f';

    L.humanDuration = function(elapsed, options={}) {
        const min = 60;
        const hour = min * 60;
        const day = hour * 24;
        const week = day * 7;
        const year = day * 365;
        const units = [
            ['year', year],
            ['week', week],
            ['day', day],
            ['hour', hour],
            ['min', min],
            ['sec', 1]
        ].filter(([, period]) =>
            (options.maxPeriod ? period <= options.maxPeriod : true) &&
            (options.minPeriod ? period >= options.minPeriod : true));
        const stack = [];
        const precision = options.precision || 1;
        elapsed = Math.round(elapsed / precision) * precision;
        let i = 0;
        const short = options.short;
        for (let [key, period] of units) {
            i++;
            if (precision > period) {
                break;
            }
            if (elapsed >= period || (!stack.length && i === units.length)) {
                if (!short && (elapsed >= 2 * period || elapsed < period)) {
                    key += 's';
                }
                if (short) {
                    key = key[0];
                }
                const suffix = options.html ? `<abbr class="unit">${key}</abbr>` : key;
                let val;
                if (options.digits && units[units.length - 1][1] === period) {
                    val = L.humanNumber(elapsed / period, options.digits);
                } else {
                    val = L.humanNumber(Math.floor(elapsed / period));
                }
                stack.push(`${val}${L.thinSpace}${suffix}`);
                elapsed %= period;
            }
        }
        return stack.slice(0, 2).join(options.seperator || ', ');
    };

    L.humanNumber = function(value, precision=0) {
        if (value == null || value === '') {
            return '-';
        }
        const n = Number(value);
        if (isNaN(n)) {
            console.warn("Value is not a number:", value);
            return '-';
        }
        if (precision === null) {
            return n.toLocaleString();
        } else if (precision === 0) {
            return Math.round(n).toLocaleString();
        } else {
            return Number(n.toFixed(precision)).toLocaleString();
        }
    };


    L.humanDistance = function(value, precision) {
        if (value > 1000) {
            if (precision == null) {
                precision = value > 50000 ? 0 : 1;
            }
            return `${L.humanNumber(value / 1000, precision)}${L.thinSpace}km`;
        } else {
            return `${L.humanNumber(value, precision)}${L.thinSpace}m`;
        }
    };

    sauce.closeWindow = function() {
        sauce.electronTrigger('close');
    };

    sauce.electronTrigger = function(name, data) {
        document.dispatchEvent(new CustomEvent('electron-message', {detail: {name, data}}));
    };

    let subId = 1;
    sauce.subscribe = function(event, callback) {
        const domEvent = `sauce-${event}-${subId++}`;
        document.addEventListener(domEvent, ev => void callback(ev.detail));
        sauce.electronTrigger('subscribe', {event, domEvent});
    };

    addEventListener('DOMContentLoaded', () => {
        const html = document.documentElement;
        if (!html.classList.contains('options')) {
            window.addEventListener('dblclick', () =>
                void document.documentElement.classList.toggle('active'));
            window.addEventListener('blur', () =>
                void document.documentElement.classList.remove('active'));
        }
        const close = document.querySelector('#titlebar .button.close');
        if (close) {
            close.addEventListener('click', ev => (void sauce.closeWindow()));
        }
        for (const el of document.querySelectorAll('.button[data-url]')) {
            el.addEventListener('click', ev => location.assign(el.dataset.url));
        }
    });
})();
