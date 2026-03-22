
import random
import argparse
random.seed(6421235361)


def generate_codes(codes_count=320, code_len=10):
    d = list(map(str, range(10))) + [chr(ord("a")+i) for i in range(26)]
    return ["".join([d[random.randint(0, len(d)-1)]  for i in range(code_len)]) for i in range(codes_count)]
    
def generate_csv_format(codes):
    liens = ["No user name needed,{}".format(c) for c in codes]
    print("\n".join(liens))

# prapare for PostgreSQL
def generate_postgresql_format(codes, expid):
    print ("INSERT INTO tri_ca_codes (code, expid) VALUES")
    print(",\n".join([f'(\'{c}\',\'{expid}\')' for c in codes]))
    print (";")

if __name__ == "__main__":
    # read arguments for the program
    # how to read arguments: https://www.tutorialspoint.com/python/python_command_line_arguments.htm
    
    # Create an ArgumentParser object
    parser = argparse.ArgumentParser(description='This program generates codes for TRI-CA.')

    # Add arguments
    parser.add_argument('--codes-count', type=int, help='number of codes to generate', default=320)
    parser.add_argument('--code-len', type=int, help='length of each code', default=10)
    parser.add_argument('--expid', type=str, help='a unique exp_id for each experiment',  required=True)
    # Parse the arguments
    args = parser.parse_args()

    codes = generate_codes(args.codes_count, args.code_len)
    print("================")
    generate_csv_format(codes)
    print("================")
    generate_postgresql_format(codes, args.expid)   
    print("================")
