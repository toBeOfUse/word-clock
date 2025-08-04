import json
from collections import defaultdict


def parse_font():
    # read the .a file
    with open("./original/ui.font.curious.fred.data.a", encoding="utf-8") as font_file:
        lines = font_file.readlines()

    # this will store the data that is read from the .a file
    section_letters: defaultdict[str, defaultdict[str, list]] = defaultdict(
        lambda: defaultdict(list)
    )

    # parse the .a file, making tons of assumptions about its structure
    current_section = ""
    for line in (l.strip() for l in lines):

        # deal with labels:
        if line.startswith("LeftFontRow"):
            current_section = "LeftFontRow"
            continue
        elif line.startswith("RightFontRow"):
            current_section = "RightFontRow"
            continue
        elif current_section == "":
            # haven't reached the data yet
            continue

        # deal with actual data:
        letter = line[-1]
        dollar_pos = line.index("$")
        byte_value = line[dollar_pos + 1 : dollar_pos + 3]
        section_letters[current_section][letter].append(byte_value)

    # output a file that contains the pixels of each letter in the .a file
    with open("./dist/curious.fred.json", mode="w+", encoding="utf-8") as outfile:
        out_dict = defaultdict(str)
        # note that the source file leaves out "Z", i guess bc it isn't used
        for letter in "ABCDEFGHIJKLMNOPQRSTUVWXY":
            # there appear to be 14 rows for each letter
            row_count = 14
            for j in range(row_count):
                byte_value_l = int(section_letters["LeftFontRow"][letter][j], 16)
                byte_value_r = int(section_letters["RightFontRow"][letter][j], 16)
                bits = (
                    # not sure why the first bit has to be discarded and then the
                    # bitstring has to be reversed, but that was experimentally
                    # determined to produce actual letters
                    f"{byte_value_l:b}".zfill(8)[1:][::-1]
                    + f"{byte_value_r:b}".zfill(8)[1:][::-1]
                )
                # the dumbest possible output format
                for char in bits:
                    out_dict[letter] += "X" if char == "1" else " "
                if j != row_count - 1:
                    out_dict[letter] += "\n"

        print("\n\n".join(list(out_dict.values())[:3]) + "\n")
        json.dump(out_dict, outfile, indent=2)
        print("wrote to", outfile, "\n")


if __name__ == "__main__":
    parse_font()
