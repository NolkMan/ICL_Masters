INPUT = "../netcraft-data/1mil_csp_cspro.tsv"
OUTPUT_BOTH = "../netcraft-data/both_csps.txt"

if __name__ == "__main__":
    with open(OUTPUT_BOTH, 'wb') as output:
        with open(INPUT, "rb") as csp_input:
            for line in csp_input:
                data = line.strip(b'\n').split(b'\t')
                if data[2] != b'' and data[3] != b'':
                    output.write(data[2])
                    output.write(b'\n')
                    output.write(data[3])
                    output.write(b'\n\n')
