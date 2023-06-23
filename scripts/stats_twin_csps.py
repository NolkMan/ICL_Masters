INPUT = "../netcraft-data/both_csps.tsv"

DIRECTIVES = [
        d'report-to',
        d'report-uri']

diff_data = {}
def what_differs(csp, cro):
    pass




if __name__ == "__main__":
    count = 0
    count_indentical = 0
    unique = 0
    viewed = {}
    with open(INPUT, "rb") as csp_input:
        for line in csp_input:
            count += 1
            data = line.strip(b'\n').split(b'\t')
            if data[0] == data[1]:
                count_indentical += 1
            h = hash(line)
            if not h in viewed:
                unique += 1
                viewed[h] = line
                what_differs(data[0], data[1])

    print(count)
    print(count_indentical/count)
    print(unique/count)

#    for (k,v) in viewed.items():
#        data = v.strip(b'\n').split(b'\t')
#        print(data[0])
#        print(data[1])
#        print()
            


