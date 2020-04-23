import sys
import imp

if __name__ == "__main__":
    klippy_path = "/home/fredizzimo/klipper/klippy" 
    sys.path.append(klippy_path)
    from extras.serial_parser import main
    main()