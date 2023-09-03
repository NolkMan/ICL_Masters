import matplotlib.pyplot as plt
from matplotlib.ticker import ScalarFormatter
import numpy as np

INPUT_DIR = '../../node/run_logs'
OUTPUT_DIR = '../imgs'
OUTPUT_FILE = '/netword_usage_3_plot.png'

files = {
    'caixabank': 'www.caixabank.es',
    'professormesser': 'www.professormesser.com',
    'quran': 'quran.com',
}

fig, ax = plt.subplots()

for f in files:
    with open(INPUT_DIR+'/'+f, 'r') as file:
        data = []
        for line in file:
            if line[0:6] == 'Total:':
                splits = line.strip().split('\t')
                try :
                    dpoint = float(splits[2][splits[2].index(':')+2:splits[2].index('%')])
                    if not np.isnan(dpoint):
                        data.append(dpoint/(1.0-dpoint)*100.0)
                except :
                    pass
        x = np.linspace(0, 0.2*len(data), len(data))
        plt.plot(x, data, label=files[f]) 

plt.xlabel('Seconds')
plt.ylabel('Percentage of additional traffic generated by the system')

ax.yaxis.set_major_formatter(ScalarFormatter())

plt.legend(loc='center right')

plt.xlim(0, 25)
plt.ylim(0, 100)

plt.savefig(OUTPUT_DIR + OUTPUT_FILE, dpi=200)


