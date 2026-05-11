
import random
import argparse
import json
import time


def generate_codes(codes_count=100, code_len=10):
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

def generate_local_json_format(codes, expid=None):
    records = []
    for c in codes:
        record = {"code": c, "completed": None}
        if expid:
            record["expid"] = expid
        records.append(record)
    print(json.dumps(records, indent=2))

if __name__ == "__main__":
    # read arguments for the program
    # how to read arguments: https://www.tutorialspoint.com/python/python_command_line_arguments.htm
    
    # Create an ArgumentParser object
    parser = argparse.ArgumentParser(description='This program generates codes for TRI-CA.')

    # Add arguments
    parser.add_argument('--codes-count', type=int, help='number of codes to generate', default=100)
    parser.add_argument('--code-len', type=int, help='length of each code', default=10)
    parser.add_argument('--expid', type=str, help='a unique exp_id for each experiment')
    parser.add_argument(
        '--seed',
        type=int,
        help='random seed for deterministic code generation; defaults to the current Unix timestamp'
    )
    parser.add_argument(
        '--format',
        type=str,
        choices=['all', 'csv', 'postgresql', 'local-json'],
        default='all',
        help='output format to print'
    )
    # Parse the arguments
    args = parser.parse_args()

    if args.format in ['all', 'postgresql'] and not args.expid:
        parser.error('--expid is required for all or postgresql output')

    random.seed(args.seed if args.seed is not None else int(time.time()))
    codes = generate_codes(args.codes_count, args.code_len)
    if args.format == 'all':
        print("============== csv ==================")
        generate_csv_format(codes)
        print("============== postgresql ==================")
        generate_postgresql_format(codes, args.expid)
        print("============== local json ==================")
        generate_local_json_format(codes, args.expid)
        print("===========================================")
    elif args.format == 'csv':
        generate_csv_format(codes)
    elif args.format == 'postgresql':
        generate_postgresql_format(codes, args.expid)
    elif args.format == 'local-json':
        generate_local_json_format(codes, args.expid)
