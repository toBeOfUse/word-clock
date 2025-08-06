import wordData from "./word_data.json" with {type: 'json'};
import curiousFred from "./curious.fred.json" with {type: 'json'};

/**
 * @type {Record<string, [number, number]>}
 */
const wordRanges = wordData.word_ranges;

function currentTimeToWords(time = new Date()) {
    // https://github.com/a2-4am/word-clock/blob/main/src/ui.display.a

    const hour = time.getHours();
    const minute = time.getMinutes();
    // console.log(hour, minute);
    const hourAsPrefix = `kPre${(hour > 12 ? hour - 12 : hour) || 12}`;
    const hourAsSuffix = `kPost${(hour > 12 ? hour - 12 : hour) || 12}`;
    const nextHourAsSuffix = `kPost${((hour + 1) > 12 ? hour - 11 : hour + 1)}`;
    const minuteAsNeutral = `k${minute}`;
    const minuteAsPrefix = `kPre${minute}`
    const minuteAsSuffix = `kPost${minute}`;

    let result = [];
    if (hour === 12 && minute === 0) {
        result = ["kNoon"];
    } else if (hour === 0 && minute === 0) {
        result = ["kMidnight"];
    } else if (minute === 0) {
        result = [hourAsPrefix, "kOclock"];
    } else if (minute === 1) {
        result = ["kPre1", "kMinute", "kPast", hourAsSuffix]
    } else if (minute >= 2 && minute <= 12) {
        result = [minuteAsPrefix, "kMinutes", "kPast", hourAsSuffix];
    } else if (minute >= 13 && minute <= 19 && minute != 15) {
        result = [
            hourAsPrefix,
            minuteAsSuffix in wordRanges ? minuteAsSuffix : minuteAsNeutral
        ];
    } else if (minute === 15) {
        result = ["kQuarter", "kPast", hourAsSuffix]
    } else if (minute === 20) {
        result = ["k20", "kPast", hourAsSuffix];
    } else if (minute === 30) {
        result = ["kHalf", "kPast", hourAsSuffix];
    } else if (minute === 40) {
        result = ["k20", "kTo", nextHourAsSuffix];
    } else if (minute === 45) {
        result = ["kQuarter", "kTo", nextHourAsSuffix];
    } else if (minute === 50) {
        result = ["kPre10", "kTo", nextHourAsSuffix];
    } else if (minute === 55) {
        result = ["kPre5", "kTo", nextHourAsSuffix];
    } else {
        const minuteTens = Math.floor(minute / 10) * 10;
        const minuteOnes = minute % 10;
        result = [hourAsPrefix, `k${minuteTens}min`, `kPost${minuteOnes}`];
    }

    if (result[0] !== 'kNoon' && result[0] !== 'kMidnight') {
        result.push((hour >= 12) ? 'kPM' : 'kAM');
    }

    return result;
}

function testCurrentTimeToWords() {
    for (let hour = 0; hour < 24; ++hour) {
        for (let minute = 0; minute < 60; ++minute) {
            const results = currentTimeToWords(new Date(2025, 7, 5, hour, minute, 0, 0));
            console.assert(results.every(r => (r in wordRanges)), results);
        }
    }
}

testCurrentTimeToWords();

/**
 * @param activeWords {string[]}
*/
function drawWords(activeWords) {
    /**
      * @type {HTMLCanvasElement}
      */
    const clock = document.getElementById("clock");
    /**
     * @type {string}
     */
    const words = wordData.word_string;
    /**
     * @type {number}
     */
    const cols = wordData.line_length;
    const rows = words.length / cols;
    const letterSize = 14;
    clock.width = cols * letterSize;
    clock.height = rows * letterSize + (rows - 1);

    // console.log('drawing', activeWords, clock.width, clock.height);
    const ctx = clock.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, clock.width, clock.height);

    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            const letterPos = row * cols + col;
            const inActiveWords = activeWords.some(word => {
                const ranges = wordRanges[word];
                return letterPos >= ranges[0] && letterPos < ranges[1];
            });
            ctx.fillStyle = inActiveWords ? 'white' : '#1990ff';
            const letter = words[letterPos];
            /**
             * @type {string}
             */
            const letterPixels = curiousFred[letter.toUpperCase()];
            const baseX = col * letterSize;
            const baseY = row * (letterSize + 1);
            let x = baseX;
            let y = baseY;
            for (const px of letterPixels) {
                if (px === '\n') {
                    x = baseX;
                    ++y;
                } else {
                    if (px !== ' ' && (inActiveWords || y % 2 === (baseY % 2))) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                    ++x;
                }
            }
        }
    }
}

let date = new Date();
let dateSet = false;

window.up = () => {
    dateSet = true;
    date.setMinutes(date.getMinutes() + 1);
}

window.down = () => {
    dateSet = true;
    date.setMinutes(date.getMinutes() - 1);
}

window.set = (input) => {
    dateSet = true;
    date = new Date(input);
}

// for some reason this doesn't seem to have an effect
window.addEventListener('load', () => {
    drawWords(currentTimeToWords(dateSet ? date : new Date()));
});

setInterval(() => {
    drawWords(currentTimeToWords(dateSet ? date : new Date()));
}, 1000);
