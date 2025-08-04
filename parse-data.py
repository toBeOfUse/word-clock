import json
from collections import defaultdict

# read the .a file
with open("./original/wordclock.data.a", encoding="utf-8") as font_file:
    lines = font_file.readlines()

# this will store the data that is read from the .a file
word_order: list[str] = []
word_ranges: dict[str, tuple[int, int]] = {}

word_order_lines = lines[14:64]
for line in word_order_lines:
    word_order.append(line.split("=")[0].strip())

word_position_lines = lines[66 : 66 + len(word_order)]
word_length_lines = lines[118 : 118 + len(word_order)]
byte_prefix = "!byte "
for word, pos_line, len_line in zip(word_order, word_position_lines, word_length_lines):
    pos_line_pos = pos_line.index(byte_prefix) + len(byte_prefix)
    len_line_pos = len_line.index(byte_prefix) + len(byte_prefix)
    pos_line_contents = pos_line[pos_line_pos : pos_line.index(";")].strip()
    len_line_contents = len_line[len_line_pos : len_line.index(";")].strip()
    word_ranges[word] = (
        int(pos_line_contents),
        int(pos_line_contents) + int(len_line_contents),
    )

words_lines = lines[190:203]
word_string = ""
for word_line in words_lines:
    word_line_data = word_line.split('"')[1]
    word_string += word_line_data
    line_length = len(word_line_data)

for word, range in word_ranges.items():
    print(word, word_string[range[0] : range[1]], (range[0], range[1]))

with open("./generated/word_data.json", mode="w+", encoding="utf-8") as outfile:
    json.dump(
        {
            "word_string": word_string,
            "line_length": line_length,
            "word_ranges": word_ranges,
        },
        outfile,
        indent=2,
    )
