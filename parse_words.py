import json


def parse_words():
    # read the .a file
    with open("./original/wordclock.data.a", encoding="utf-8") as font_file:
        lines = font_file.readlines()

    # these will store the data that is read from the .a file
    word_order: list[str] = []
    word_ranges: dict[str, tuple[int, int]] = {}
    word_string = ""

    # grab each important section of the .a file using its line numbers

    # this section just gives the way the words are ordered in the following
    # sections:
    word_order_lines = lines[14:64]
    for line in word_order_lines:
        word_order.append(line.split("=")[0].strip())

    # these two sections store the position and length of each word in the
    # clock:
    word_position_lines = lines[66 : 66 + len(word_order)]
    word_length_lines = lines[118 : 118 + len(word_order)]
    byte_prefix = "!byte "
    for word, pos_line, len_line in zip(
        word_order, word_position_lines, word_length_lines
    ):
        pos_line_pos = pos_line.index(byte_prefix) + len(byte_prefix)
        len_line_pos = len_line.index(byte_prefix) + len(byte_prefix)
        pos_line_contents = pos_line[pos_line_pos : pos_line.index(";")].strip()
        len_line_contents = len_line[len_line_pos : len_line.index(";")].strip()
        word_ranges[word] = (
            int(pos_line_contents),
            int(pos_line_contents) + int(len_line_contents),
        )

    # this section stores strings for the actual words that the clock should display:
    words_lines = lines[190:203]
    for word_line in words_lines:
        word_line_data = word_line.split('"')[1]
        word_string += word_line_data
        line_length = len(word_line_data)

    # print the word ranges just because
    for word, range in word_ranges.items():
        print(word, word_string[range[0] : range[1]], (range[0], range[1]))

    with open("./dist/word_data.json", mode="w+", encoding="utf-8") as outfile:
        json.dump(
            {
                # the words that the word clock should display, formatted as one
                # unbroken string:
                "word_string": word_string,
                # the line length that `word_string` should be wrapped at:
                "line_length": line_length,
                # the start and end position of each word within word_string:
                "word_ranges": word_ranges,
            },
            outfile,
            indent=2,
        )
        print("\nwrote to", outfile)


if __name__ == "__main__":
    parse_words()
