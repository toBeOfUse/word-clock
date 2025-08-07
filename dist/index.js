import wordData from "./word_data.json" with {type: 'json'};
import curiousFred from "./curious.fred.json" with {type: 'json'};

/**
 * @type {Record<string, [number, number]>}
 */
const wordRanges = wordData.word_ranges;

export function currentTimeToWords(time = new Date()) {
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
const widthPx = cols * letterSize;
// adding (rows - 1) to account for a blank line between each row of letters
const heightPx = rows * letterSize + (rows - 1);

/**
 * random two-dimensional array of numbers between 0 and 1; one for each pixel
 * in the canvas. this is used to figure out how far into each fizzle transition
 * each pixel should switch to its new state
 * @type {number[][]}
 */
const pixelFizzleThresholds = [];
for (let y = 0; y < heightPx; ++y) {
    const rowThresholds = [];
    for (let x = 0; x < widthPx; ++x) {
        rowThresholds.push(Math.random());
    }
    pixelFizzleThresholds.push(rowThresholds);
}

let drawingFirstFrame = true;
let drawingFirstFizzle = true;
/**
 * @param activeWords {string[]}
 * @param prevWords {string[]}
 * @param clock {HTMLCanvasElement}
*/
export function drawFrame(
    activeWords,
    prevWords = [],
    msSincePrevWords = 0,
    clock = document.getElementById("clock"),
    drawAll = drawingFirstFrame
) {
    const fizzleLengthMs = 3000;
    const fizzleProgress = msSincePrevWords / fizzleLengthMs;

    if (fizzleProgress > 1.1) {
        drawingFirstFizzle = false;
        return;
    }

    if (drawAll) {
        // upsettingly, setting the width and height appears to clear the
        // canvas, so it can only be done if one is redrawing everything
        clock.width = widthPx;
        clock.height = heightPx;
    }

    // console.log('drawing', activeWords, clock.width, clock.height);
    const ctx = clock.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            const letterPos = row * cols + col;
            const inWord = (word) => {
                const ranges = wordRanges[word];
                return letterPos >= ranges[0] && letterPos < ranges[1];
            };
            const inActiveWords = activeWords.some(inWord);
            const inPrevWords = prevWords.some(inWord);

            // not changing this letter if this isn't the first frame and it
            // isn't either transitioning to active or transitioning to inactive
            if (!drawAll && !(inActiveWords || inPrevWords || drawingFirstFizzle)) {
                continue;
            }

            const baseX = col * letterSize;
            // +1 to account for the one blank row above each letter
            const baseY = row * (letterSize + 1);
            if (!drawAll) {
                // clear the space with the letter in it so that it can be
                // redrawn
                ctx.clearRect(baseX, baseY, letterSize, letterSize);
            }

            const letter = words[letterPos];

            /**
             * @type {string}
             */
            const letterPixels = curiousFred[letter.toUpperCase()];
            let x = baseX;
            let y = baseY;
            for (const px of letterPixels) {
                const fizzleThreshold = pixelFizzleThresholds[y][x];
                const drawAtAll = !drawingFirstFizzle || (fizzleThreshold < fizzleProgress);
                const treatAsActive = (
                    (inActiveWords || inPrevWords) &&
                    ((inActiveWords && inPrevWords) || (
                        inActiveWords && (fizzleThreshold < fizzleProgress) ||
                        inPrevWords && (fizzleThreshold > fizzleProgress)
                    ))
                );
                ctx.fillStyle = treatAsActive ? 'white' : '#1990ff';
                if (px === '\n') {
                    x = baseX;
                    ++y;
                } else {
                    if (px !== ' ' && drawAtAll && (treatAsActive || y % 2 === (baseY % 2))) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                    ++x;
                }
            }
        }
    }
    drawingFirstFrame = false;
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

let prevWords = [];
let currentWords = [];
let timeOfLastChange = 0;
let startTime = Date.now();
function drawLoop() {
    const msSinceStart = Date.now() - startTime;
    const newCurrentWords = msSinceStart < 4000 ?
        ["kWord", "kClock", "kBy", "kPost4", "kAM"] :
        currentTimeToWords(dateSet ? date : new Date());
    const justChanged = newCurrentWords.some(word => !currentWords.includes(word));
    if (justChanged) {
        timeOfLastChange = Date.now();
        prevWords = currentWords;
        currentWords = newCurrentWords;
    }
    drawFrame(currentWords, prevWords, Date.now() - timeOfLastChange);
}

export function startLoop() {
    setInterval(() => {
        drawLoop();
    }, 1000 / 15);
}
