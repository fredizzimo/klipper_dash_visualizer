import sys
import argparse
import os


def main():
    parser = argparse.ArgumentParser(description=
        "Utility to graph the movement parsed from a serial dump file")
    parser.add_argument("--dict", type=argparse.FileType(mode="rb"),
        required=True,
        help="Path to the dictionary file")
    parser.add_argument("--config", type=argparse.FileType(mode="r"),
        required=True,
        help="Path to the printer config file")
    parser.add_argument("--klipper", default=".", required=False,
        help="Path to to Klipper, defaults to current directory")
    parser.add_argument("input", type=argparse.FileType(mode="rb"),
        help="Path to the input serial port dump file")
    args = parser.parse_args()

    klippy_path = os.path.join(args.klipper, "klippy")
    if not os.path.exists(klippy_path):
        print("Klipper not found at %s" % (args.klipper))
        return -1
    sys.path.append(klippy_path)
    from extras.serial_parser import read_printer_config, parse, run_app

    printer = read_printer_config(args.config)
    steppers = parse(args.input, args.dict, printer)

    run_app(steppers, printer)


if __name__ == "__main__":
    main()